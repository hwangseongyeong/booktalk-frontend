"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, resolveAssetUrl, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { BellIcon } from "../../../../components/icons";

const READ_AMOUNT_LABEL: Record<string, string> = {
  ALL: "전체 읽었어요",
  PARTIAL: "일부 읽었어요",
};

/** 읽기 전용 감상 태그 칩. */
function TagChips({ words }: { words: string[] }) {
  if (words.length === 0) {
    return <p className="mt-3 text-sm text-gray-400">선택한 감상 태그가 없어요.</p>;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {words.map((word) => (
        <span
          key={word}
          className="rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const recordId = Number(params.id);

  const [record, setRecord] = useState<ReadingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .getMyReadingRecords("COMPLETED")
      .then((records) => {
        if (cancelled) return;
        const found = records.find((r) => r.id === recordId) ?? null;
        setRecord(found);
        if (!found) setError("리뷰를 찾지 못했어요. 완독한 책만 리뷰를 볼 수 있어요.");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "리뷰를 불러오지 못했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ready, recordId]);

  if (!ready) return null;

  const book = record?.book;
  const cover = book ? book.coverImageUrl ?? resolveAssetUrl(book.spineImageUrl) : null;
  // 감상 태그 = 감정 + 분위기(저장된 값). 과거 장르 데이터가 있으면 함께 보여준다.
  const tags = record ? [...record.emotions, ...record.moods, ...record.genres] : [];
  const rating = record?.rating ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-16 pt-6">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="-ml-1 p-1 text-gray-900"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button aria-label="알림" className="p-1 text-gray-800">
          <BellIcon />
        </button>
      </header>
      <h1 className="mt-1 text-3xl font-extrabold text-gray-900">나의 리뷰</h1>
      <div className="mt-4 border-t border-gray-200" />

      {loading && <p className="mt-8 text-sm text-gray-400">불러오는 중...</p>}

      {!loading && error && !record && (
        <div className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => router.push("/shelf")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            북로그로
          </button>
        </div>
      )}

      {!loading && record && book && (
        <>
          {/* 도서 카드 */}
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={book.title} className="h-20 w-14 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="h-20 w-14 shrink-0 rounded-md bg-gray-200" />
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-900">{book.title}</p>
              <p className="truncate text-sm text-gray-400">{book.author ?? "저자 미상"}</p>
            </div>
          </div>

          {/* 완독 일 */}
          <div className="mt-6 flex items-center">
            <span className="w-20 text-base font-bold text-gray-900">완독 일</span>
            <span className="text-sm text-gray-800">{record.endDate ?? "-"}</span>
          </div>

          {/* 완독량 */}
          {record.readAmount && (
            <div className="mt-5 flex items-center">
              <span className="w-20 text-base font-bold text-gray-900">완독량</span>
              <span className="rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                {READ_AMOUNT_LABEL[record.readAmount] ?? record.readAmount}
              </span>
            </div>
          )}

          {/* 별점 */}
          <div className="mt-5 flex items-center">
            <span className="w-20 text-base font-bold text-gray-900">별점</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-2xl leading-none ${n <= rating ? "text-gray-900" : "text-gray-300"}`}
                >
                  {n <= rating ? "★" : "☆"}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200" />

          {/* 나의 감상 태그 */}
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">나의 감상 태그</h2>
          <TagChips words={tags} />

          {/* 나의 한줄평 */}
          <h2 className="mt-7 text-xl font-extrabold text-gray-900">나의 한줄평</h2>
          <p className="mt-3 whitespace-pre-line rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800">
            {record.oneLineNote?.trim() || "작성한 한줄평이 없어요."}
          </p>
        </>
      )}
    </main>
  );
}
