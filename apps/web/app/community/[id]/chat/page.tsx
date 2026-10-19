"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  apiClient,
  type MeetingChatMessage,
  type MeetingChatMessageReactions,
  type MeetingChatReaction,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { Avatar } from "../../../../components/ui";
import { BubbleIcon, PaperPlaneIcon } from "../../../../components/icons";

const POLL_MS = 4000;

// 간단한 이모지 팔레트 (별도 라이브러리 없이 기본 유니코드 이모지 사용)
const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
  "🤗", "🤔", "😴", "😭", "😡", "👍", "👎", "👏",
  "🙏", "🎉", "❤️", "🔥", "✨", "💯", "📚", "☕",
];

// 메시지 리액션용 고정 이모지 (백엔드 ALLOWED_REACTIONS와 동일하게 유지)
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// 두 리액션 배열이 동일한지(폴링 시 불필요한 리렌더/스크롤 방지용)
function sameReactions(a: MeetingChatReaction[], b: MeetingChatReaction[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].emoji !== b[i].emoji || a[i].count !== b[i].count || a[i].mine !== b[i].mine) {
      return false;
    }
  }
  return true;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** createdAt(ISO) → HH:MM */
function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 날짜 구분선 라벨: 오늘 / 어제 / YYYY년 M월 D일 */
function dateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "오늘";
  if (sameDay(d, yesterday)) return "어제";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function MeetingChatPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const meetingId = Number(params.id);

  const [title, setTitle] = useState("대화방");
  const [messages, setMessages] = useState<MeetingChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  // 리액션 피커가 열려 있는 메시지 id (없으면 null)
  const [reactingTo, setReactingTo] = useState<number | null>(null);

  // 폴링에서 마지막으로 받은 메시지 id (afterId). stale closure 방지로 ref 사용.
  const lastIdRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 커서 위치에 이모지를 삽입한다.
  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    // 삽입 후 커서를 이모지 뒤로 이동시키고 포커스 유지
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function appendMessages(incoming: MeetingChatMessage[]) {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      const last = merged[merged.length - 1];
      if (last) lastIdRef.current = last.id;
      return merged;
    });
  }

  // 리액션 등으로 갱신된 단일 메시지를 목록에 반영한다.
  function updateMessage(updated: MeetingChatMessage) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  // 폴링으로 받은 모임 전체 리액션을 기존 메시지에 병합한다.
  // 응답 목록에 없는 메시지는 리액션이 모두 취소된 것으로 보고 비운다.
  // 실제 변경이 없으면 같은 배열 참조를 유지해 리렌더/스크롤을 막는다.
  function applyReactions(list: MeetingChatMessageReactions[]) {
    const byId = new Map(list.map((r) => [r.messageId, r.reactions]));
    setMessages((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        const incoming = byId.get(m.id) ?? [];
        if (sameReactions(m.reactions, incoming)) return m;
        changed = true;
        return { ...m, reactions: incoming };
      });
      return changed ? next : prev;
    });
  }

  // 메시지에 이모지 리액션 토글. 응답으로 온 집계 결과로 해당 메시지를 갱신한다.
  async function handleReact(messageId: number, emoji: string) {
    setReactingTo(null);
    try {
      const updated = await apiClient.reactToMeetingMessage(meetingId, messageId, emoji);
      updateMessage(updated);
    } catch {
      // 리액션 실패는 조용히 무시(대화 흐름을 막지 않음)
    }
  }

  // 모임 이름(헤더용) — 실패해도 채팅엔 영향 없다.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    apiClient.getMeeting(meetingId).then(
      (m) => { if (!cancelled) setTitle(m.name); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [ready, meetingId]);

  // 최초 로드
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .getMeetingMessages(meetingId)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
        const last = list[list.length - 1];
        if (last) lastIdRef.current = last.id;
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "대화를 불러오지 못했어요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ready, meetingId]);

  // 폴링: 새 메시지(afterId 이후)와 기존 메시지의 리액션 변경분을 함께 가져온다.
  useEffect(() => {
    if (!ready || error) return;
    const timer = setInterval(() => {
      apiClient
        .getMeetingMessages(meetingId, lastIdRef.current || undefined)
        .then((list) => appendMessages(list))
        .catch(() => {});
      apiClient
        .getMeetingMessageReactions(meetingId)
        .then((list) => applyReactions(list))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [ready, error, meetingId]);

  // 새 메시지가 오면 맨 아래로 스크롤. 리액션만 바뀐 경우(길이 동일)는 스크롤하지 않는다.
  const messageCount = messages.length;
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount, lastMessageId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const saved = await apiClient.sendMeetingMessage(meetingId, content);
      appendMessages([saved]);
      setInput("");
      setShowEmoji(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메시지 전송에 실패했어요.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto flex h-screen max-w-md flex-col bg-[#eef1f6]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-gray-200/80 bg-white/90 px-3 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-gray-100"
        >
          <span aria-hidden className="text-2xl font-bold leading-none">‹</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-gray-900">{title}</h1>
          <p className="text-[11px] text-gray-400">참여자 대화방</p>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <BubbleIcon size={56} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-400">
              아직 대화가 없어요.
              <br />
              첫 메시지를 남겨보세요.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const d = new Date(m.createdAt);
            const showDate = !prev || !sameDay(new Date(prev.createdAt), d);
            const startOfGroup = showDate || !prev || prev.senderId !== m.senderId;
            const endOfGroup =
              !next ||
              !sameDay(new Date(next.createdAt), d) ||
              next.senderId !== m.senderId;

            // 리액션 집계 칩(양쪽 메시지 공통). 내가 누른 이모지는 강조.
            const chips = m.reactions.length > 0 && (
              <div className={`mt-1 flex flex-wrap gap-1 ${m.mine ? "justify-end" : ""}`}>
                {m.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => handleReact(m.id, r.emoji)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                      r.mine
                        ? "border-gray-900/70 bg-gray-900/[0.06] text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span aria-hidden>{r.emoji}</span>
                    <span className="tabular-nums">{r.count}</span>
                  </button>
                ))}
              </div>
            );

            return (
              <div key={m.id}>
                {showDate && (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full bg-gray-900/5 px-3 py-1 text-[11px] font-medium text-gray-500">
                      {dateLabel(m.createdAt)}
                    </span>
                  </div>
                )}

                {m.mine ? (
                  <div className={startOfGroup ? "mt-3" : "mt-0.5"}>
                    <div className="flex items-end justify-end gap-1.5">
                      {endOfGroup && (
                        <span className="mb-0.5 shrink-0 text-[10px] text-gray-400">{formatTime(m.createdAt)}</span>
                      )}
                      <p
                        className={`max-w-[74%] whitespace-pre-wrap break-words bg-gray-900 px-3.5 py-2 text-sm leading-relaxed text-white ${
                          startOfGroup ? "rounded-2xl rounded-tr-md" : "rounded-2xl"
                        }`}
                      >
                        {m.content}
                      </p>
                    </div>
                    {chips}
                  </div>
                ) : (
                  <div className={`flex items-end gap-2 ${startOfGroup ? "mt-3" : "mt-0.5"}`}>
                    <div className="w-8 shrink-0">
                      {startOfGroup && (
                        <Avatar
                          nickname={m.senderNickname}
                          src={m.senderProfileImageUrl}
                          color={m.senderProfileColor ?? undefined}
                          size={32}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      {startOfGroup && (
                        <p className="mb-1 ml-1 text-xs font-medium text-gray-500">{m.senderNickname}</p>
                      )}
                      <div className="relative flex items-end gap-1.5">
                        <p
                          className={`max-w-[74%] whitespace-pre-wrap break-words bg-white px-3.5 py-2 text-sm leading-relaxed text-gray-900 shadow-sm ${
                            startOfGroup ? "rounded-2xl rounded-tl-md" : "rounded-2xl"
                          }`}
                        >
                          {m.content}
                        </p>
                        {/* 리액션 추가 버튼 */}
                        <button
                          type="button"
                          aria-label="반응 추가"
                          onClick={() => setReactingTo((id) => (id === m.id ? null : m.id))}
                          className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                        >
                          <span aria-hidden className="text-sm">🙂</span>
                        </button>
                        {endOfGroup && (
                          <span className="mb-0.5 shrink-0 text-[10px] text-gray-400">{formatTime(m.createdAt)}</span>
                        )}
                        {/* 리액션 이모지 피커 */}
                        {reactingTo === m.id && (
                          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg">
                            {REACTION_EMOJIS.map((emoji) => {
                              const picked = m.reactions.some((r) => r.emoji === emoji && r.mine);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReact(m.id, emoji)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-gray-100 ${
                                    picked ? "bg-gray-100" : ""
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {chips}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 바 */}
      {!error && (
        <div className="sticky bottom-0 border-t border-gray-200/80 bg-white/95 backdrop-blur">
          {/* 이모지 패널 */}
          {showEmoji && (
            <div className="grid grid-cols-8 gap-1 border-b border-gray-100 px-3 py-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="flex h-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-gray-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3">
            <button
              type="button"
              aria-label="이모지"
              aria-pressed={showEmoji}
              onClick={() => setShowEmoji((v) => !v)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition-colors hover:bg-gray-100 ${
                showEmoji ? "bg-gray-100" : ""
              }`}
            >
              <span aria-hidden>😊</span>
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:bg-gray-50 focus:ring-2 focus:ring-gray-900/10"
            />
            <button
              type="submit"
              aria-label="전송"
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-black disabled:opacity-30"
            >
              <PaperPlaneIcon size={18} />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
