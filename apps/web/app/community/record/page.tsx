"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiClient,
  resolveAssetUrl,
  type ReadingRecord,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";

// 카메라로 다녀오는 동안 작성 중이던 글을 유지하기 위한 임시 저장 키
const DRAFT_KEY = "booktalk:recordDraft";

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
  const imageFromQuery = searchParams.get("image"); // 카메라에서 업로드 후 돌아올 때 전달됨

  const [content, setContent] = useState("");
  const [bookId, setBookId] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [books, setBooks] = useState<ReadingRecord[]>([]);

  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageSrc = resolveAssetUrl(imageUrl);

  // 작성 중이던 임시 글 복원 + 카메라에서 돌아온 사진 반영
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { content?: string; bookId?: number | ""; imageUrl?: string | null };
        if (d.content) setContent(d.content);
        if (d.bookId !== undefined && d.bookId !== "") setBookId(d.bookId);
        if (d.imageUrl && !imageFromQuery) setImageUrl(d.imageUrl);
      }
    } catch {
      /* 손상된 임시 저장은 무시 */
    }
    if (imageFromQuery) setImageUrl(imageFromQuery);
    setHydrated(true);
    // 마운트 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 변경 사항을 임시 저장(카메라 왕복 중 유실 방지)
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ content, bookId, imageUrl }));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [hydrated, content, bookId, imageUrl]);

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

  // 사진 추가/변경 — 현재 작성 내용을 저장하고 카메라로 이동
  function goToCamera() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ content, bookId, imageUrl }));
    } catch {
      /* 저장 실패는 무시 */
    }
    router.push("/community/camera");
  }

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* 무시 */
    }
  }

  // 작성 취소 — 임시 글 버리고 목록으로
  function handleClose() {
    clearDraft();
    router.push("/community?tab=solo");
  }

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
      clearDraft();
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
        <button onClick={handleClose} aria-label="닫기" className="text-2xl text-gray-900">
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
        {/* 사진 (선택) */}
        {imageSrc ? (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="첨부한 사진" className="w-full rounded-2xl object-cover" />
            <div className="flex items-center gap-3">
              <button
                onClick={goToCamera}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                사진 변경
              </button>
              <button
                onClick={() => setImageUrl(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-400 hover:bg-gray-50"
              >
                사진 삭제
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={goToCamera}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-10 text-gray-400 hover:bg-gray-50"
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span className="text-sm font-bold">사진 추가 (선택)</span>
          </button>
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
