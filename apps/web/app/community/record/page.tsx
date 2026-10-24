"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiClient,
  resolveAssetUrl,
  type ReadingRecord,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";

export default function RecordWritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RecordWriteInner />
    </Suspense>
  );
}

function RecordWriteInner() {
  const ready = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("image"); // 업로드 API가 내려준 상대경로
  const imageSrc = resolveAssetUrl(imageUrl);

  const [content, setContent] = useState("");
  const [bookId, setBookId] = useState<number | "">("");
  const [books, setBooks] = useState<ReadingRecord[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기록에 연결할 수 있는 책 후보 — 내가 읽고 있는/읽은 책
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    apiClient
      .getMyReadingRecords()
      .then((list) => {
        if (cancelled) return;
        setBooks(list.filter((r) => r.status !== "WISHLIST"));
      })
      .catch(() => {
        /* 책 목록은 선택 사항이라 실패해도 작성은 가능 */
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;

  const canSubmit = (content.trim().length > 0 || !!imageUrl) && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.createBookNote({
        content: content.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        bookId: bookId === "" ? undefined : bookId,
      });
      router.replace("/community?tab=solo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "기록을 저장하지 못했어요.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <button onClick={() => router.back()} aria-label="뒤로" className="text-2xl text-gray-900">
          ‹
        </button>
        <h1 className="text-base font-bold text-gray-900">기록 남기기</h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-[15px] font-bold text-gray-900 disabled:text-gray-300"
        >
          {submitting ? "저장 중..." : "완료"}
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        {/* 사진 미리보기 */}
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="촬영한 사진"
            className="w-full rounded-2xl object-cover"
          />
        )}

        {/* 책 연결(선택) */}
        {books.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-700">책 연결 (선택)</span>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
            >
              <option value="">책 없이 기록</option>
              {books.map((r) => (
                <option key={r.id} value={r.book.id}>
                  {r.book.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* 글 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="읽다가 멈춘 문장, 떠오른 생각을 가볍게 남겨 보세요"
          rows={8}
          className="w-full flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3.5 text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center justify-center rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-colors hover:brightness-95 disabled:opacity-40"
        >
          {submitting ? "저장 중..." : "기록 남기기"}
        </button>
      </div>
    </main>
  );
}
