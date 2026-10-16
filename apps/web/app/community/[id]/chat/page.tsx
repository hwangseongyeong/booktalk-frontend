"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type MeetingChatMessage } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { Avatar } from "../../../../components/ui";

const POLL_MS = 4000;

/** createdAt(ISO) → HH:MM */
function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

  // 폴링에서 마지막으로 받은 메시지 id (afterId). stale closure 방지로 ref 사용.
  const lastIdRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // 폴링: afterId 이후의 새 메시지만 가져온다.
  useEffect(() => {
    if (!ready || error) return;
    const timer = setInterval(() => {
      apiClient
        .getMeetingMessages(meetingId, lastIdRef.current || undefined)
        .then((list) => appendMessages(list))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [ready, error, meetingId]);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const saved = await apiClient.sendMeetingMessage(meetingId, content);
      appendMessages([saved]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "메시지 전송에 실패했어요.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-[#f6f8fb]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-5 py-3">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="-ml-1 p-1 text-gray-900"
        >
          <span aria-hidden className="text-2xl font-bold">‹</span>
        </button>
        <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
      </header>

      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            아직 대화가 없어요. 첫 메시지를 남겨보세요.
          </p>
        ) : (
          messages.map((m) =>
            m.mine ? (
              <div key={m.id} className="flex items-end justify-end gap-1.5">
                <span className="mb-0.5 text-[10px] text-gray-400">{formatTime(m.createdAt)}</span>
                <p className="max-w-[72%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-gray-900 px-3.5 py-2 text-sm text-white">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <Avatar
                  nickname={m.senderNickname}
                  src={m.senderProfileImageUrl}
                  color={m.senderProfileColor ?? undefined}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="mb-0.5 text-xs font-medium text-gray-500">{m.senderNickname}</p>
                  <div className="flex items-end gap-1.5">
                    <p className="max-w-[72%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-gray-900 shadow-sm">
                      {m.content}
                    </p>
                    <span className="mb-0.5 text-[10px] text-gray-400">{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 바 */}
      {!error && (
        <form
          onSubmit={handleSend}
          className="sticky bottom-0 flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
          >
            전송
          </button>
        </form>
      )}
    </main>
  );
}
