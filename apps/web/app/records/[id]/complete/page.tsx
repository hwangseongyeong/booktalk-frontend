"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";

// My Words 키워드. 백엔드에 별도 필드가 없어 선택값은 한줄평(oneLineNote)에 #태그로 합쳐 저장한다.
const KEYWORDS = [
  "매혹적인", "몰입되는", "따뜻한",
  "생각하게 하는", "감동적인", "여운이 깊은",
  "재치 있는", "강렬한", "흥미로운", "불편한",
];
const MORE_KEYWORDS = [
  "잔잔한", "위로가 되는", "통찰력 있는", "현실적인",
  "긴장감 있는", "먹먹한", "유쾌한", "아련한",
];

// 완독량 토글(전체/일부). 저장 필드가 없어 화면 상태로만 사용한다.
type ReadAmount = "ALL" | "PARTIAL";

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 라벨 앞의 작은 사각 불릿(시안의 ■ 마커). */
function Bullet() {
  return <span className="mr-2 inline-block h-3.5 w-2.5 shrink-0 rounded-[1px] bg-gray-900 align-middle" />;
}

export default function CompleteReadingPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const recordId = Number(params.id);

  const [record, setRecord] = useState<ReadingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [endDate, setEndDate] = useState(todayString());
  const [readAmount, setReadAmount] = useState<ReadAmount>("ALL");
  const [rating, setRating] = useState(0);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [oneLineNote, setOneLineNote] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .getMyReadingRecords("READING")
      .then((records) => {
        if (cancelled) return;
        const found = records.find((r) => r.id === recordId) ?? null;
        setRecord(found);
        if (!found) setError("완독 처리할 책을 찾지 못했어요. 이미 완독했거나 삭제된 기록일 수 있어요.");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "기록을 불러오지 못했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ready, recordId]);

  const keywords = useMemo(() => (showMore ? [...KEYWORDS, ...MORE_KEYWORDS] : KEYWORDS), [showMore]);

  function toggleKeyword(word: string) {
    setSelectedKeywords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }

  async function handleSubmit() {
    if (!record) return;
    setSubmitting(true);
    setError(null);
    try {
      // 선택 키워드는 #태그로, 한줄평 앞에 합쳐 저장한다.
      const tags = selectedKeywords.map((w) => `#${w.replace(/\s+/g, "")}`).join(" ");
      const note = [tags, oneLineNote.trim()].filter(Boolean).join("\n");
      await apiClient.completeReadingRecord(record.id, {
        endDate,
        rating: rating > 0 ? rating : undefined,
        oneLineNote: note || undefined,
      });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "완독 처리에 실패했어요.");
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  const book = record?.book;
  const bookLine = book
    ? [book.title, book.author].filter(Boolean).join(" | ")
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-12 pt-6">
      {/* 상단 우측: 닫기 */}
      <div className="flex justify-end">
        <button
          aria-label="닫기"
          onClick={() => router.back()}
          className="p-1 text-gray-400 hover:text-gray-700"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <h1 className="mt-1 text-2xl font-bold text-gray-900">나의 리뷰 :: 완독했어요!</h1>

      {loading && <p className="mt-8 text-sm text-gray-400">불러오는 중...</p>}

      {!loading && error && !record && (
        <div className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => router.push("/records")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            독서 기록으로
          </button>
        </div>
      )}

      {!loading && record && (
        <>
          {/* 도서 정보 */}
          <div className="mt-5 rounded-sm border border-gray-300 px-4 py-3">
            <p className="text-sm font-bold text-gray-800">{bookLine}</p>
          </div>

          {/* 완독일 */}
          <div className="mt-6 flex items-center">
            <Bullet />
            <span className="w-20 text-sm font-medium text-gray-900">완독일</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
            />
          </div>

          {/* 완독량 */}
          <div className="mt-5 flex items-center">
            <Bullet />
            <span className="w-20 text-sm font-medium text-gray-900">완독량</span>
            <div className="flex gap-2">
              {([
                ["ALL", "전체 읽었어요"],
                ["PARTIAL", "일부 읽었어요"],
              ] as [ReadAmount, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setReadAmount(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    readAmount === value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 별점 */}
          <div className="mt-5 flex items-center">
            <Bullet />
            <span className="w-20 text-sm font-medium text-gray-900">별점</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`별점 ${n}점`}
                  onClick={() => setRating((prev) => (prev === n ? 0 : n))}
                  className={`text-2xl leading-none transition-colors ${
                    n <= rating ? "text-gray-900" : "text-gray-300"
                  }`}
                >
                  {n <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          {/* My Words */}
          <div className="mt-6 flex items-center">
            <Bullet />
            <span className="text-sm font-medium text-gray-900">My Words</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
            {keywords.map((word) => {
              const active = selectedKeywords.includes(word);
              return (
                <button
                  key={word}
                  onClick={() => toggleKeyword(word)}
                  className={`text-sm transition-colors ${
                    active ? "font-bold text-emerald-700" : "text-emerald-600/80 hover:text-emerald-700"
                  }`}
                >
                  {word}
                </button>
              );
            })}
            {!showMore && (
              <button
                onClick={() => setShowMore(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                … (more)
              </button>
            )}
          </div>

          {/* 나의 한줄평 */}
          <div className="mt-7 flex items-center">
            <Bullet />
            <span className="text-sm font-medium text-gray-900">나의 한줄평</span>
          </div>
          <textarea
            value={oneLineNote}
            onChange={(e) => setOneLineNote(e.target.value)}
            placeholder="이 책을 한 줄로 남긴다면?"
            rows={2}
            className="mt-3 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <div className="my-7 border-t border-dashed border-gray-300" />

          {error && <p className="mb-3 text-center text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mx-auto flex w-44 justify-center rounded-md border-2 border-gray-900 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "완독 남기기"}
          </button>
        </>
      )}
    </main>
  );
}
