"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiClient,
  resolveAssetUrl,
  type AdminBookNoteItem,
  type AdminChatMessageItem,
} from "@booktalk/api-client";

export default function AdminModerationPage() {
  // ----- 혼자 북톡 -----
  const [notes, setNotes] = useState<AdminBookNoteItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const loadNotes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminBookNotes(p, 20);
      setNotes(res.content);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes(0);
  }, [loadNotes]);

  async function deleteNote(id: number) {
    if (!window.confirm("이 기록을 삭제할까요? (숨김 처리 — 복구 가능)")) return;
    setBusy(id);
    try {
      await apiClient.deleteAdminBookNote(id);
      await loadNotes(page);
    } finally {
      setBusy(null);
    }
  }

  // ----- 모임 채팅 -----
  const [meetingId, setMeetingId] = useState("");
  const [messages, setMessages] = useState<AdminChatMessageItem[] | null>(null);
  const [msgBusy, setMsgBusy] = useState<number | null>(null);

  async function loadMessages() {
    const id = Number(meetingId);
    if (!Number.isFinite(id) || id <= 0) return;
    try {
      setMessages(await apiClient.getAdminMeetingMessages(id));
    } catch {
      setMessages([]);
    }
  }

  async function deleteMessage(id: number) {
    if (!window.confirm("이 메시지를 삭제할까요?")) return;
    setMsgBusy(id);
    try {
      await apiClient.deleteAdminChatMessage(id);
      await loadMessages();
    } finally {
      setMsgBusy(null);
    }
  }

  const delBtn =
    "shrink-0 rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40";

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl font-bold">콘텐츠 모더레이션</h1>
        <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-gray-500">혼자 북톡 (기록)</h2>
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400">기록이 없어요.</p>
          ) : (
            notes.map((n) => {
              const img = resolveAssetUrl(n.imageUrl);
              return (
                <div key={n.id} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-400">
                      {n.userNickname} · {new Date(n.createdAt).toLocaleString()}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                      {n.content ?? <span className="text-gray-400">(사진만)</span>}
                    </p>
                  </div>
                  <button disabled={busy === n.id} onClick={() => deleteNote(n.id)} className={delBtn}>
                    삭제
                  </button>
                </div>
              );
            })
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <button disabled={page <= 0} onClick={() => loadNotes(page - 1)} className="text-gray-500 disabled:opacity-30">
              ← 이전
            </button>
            <span className="text-gray-500">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => loadNotes(page + 1)} className="text-gray-500 disabled:opacity-30">
              다음 →
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">모임 채팅 (모임 ID로 조회)</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="모임 ID"
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <button onClick={loadMessages} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            조회
          </button>
        </div>
        {messages && (
          <div className="mt-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400">메시지가 없어요.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 rounded-lg border border-gray-200 p-3 ${m.deleted ? "bg-gray-50 opacity-60" : "bg-white"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-400">
                      {m.userNickname} · {new Date(m.createdAt).toLocaleString()}{" "}
                      {m.deleted && <span className="text-red-500">(삭제됨)</span>}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  </div>
                  {!m.deleted && (
                    <button disabled={msgBusy === m.id} onClick={() => deleteMessage(m.id)} className={delBtn}>
                      삭제
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
