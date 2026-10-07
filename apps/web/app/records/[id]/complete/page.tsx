"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type ReadingRecord, type ReadAmount } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { BellIcon } from "../../../../components/icons";

// 나의 단어 — 감정 / 분위기 / 장르에서 각각 하나씩 선택한다.
const EMOTIONS = [
  "감동적인", "따뜻한", "위로가 되는", "여운이 깊은",
  "설레는", "벅찬", "쓸쓸한", "슬픈",
  "먹먹한", "아련한", "묵직한", "통쾌한",
  "분노하는", "당혹스러운", "묘한", "용기를 얻는",
];
const MOODS = [
  "매혹적인", "황홀한", "사랑스러운", "신비로운",
  "유쾌한", "잔잔한", "포근한", "담담한",
  "치밀한", "긴박한",
];
const GENRES = [
  "일반 소설", "SF·판타지", "추리", "스릴러",
  "로맨스", "시", "에세이", "인문",
  "철학", "사회", "역사", "과학",
  "경제", "경영", "자기계발", "예술", "만화",
];

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 한 카테고리의 단어 칩(단일 선택). */
function WordSection({
  title,
  hint,
  options,
  selected,
  onSelect,
}: {
  title: string;
  hint: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-gray-900">
        {title}
        <span className="text-gray-900">*</span>
        <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((word) => {
          const active = selected === word;
          return (
            <button
              key={word}
              type="button"
              onClick={() => onSelect(active ? null : word)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </section>
  );
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
  const [emotion, setEmotion] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
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

  const canSubmit =
    !!emotion && !!mood && !!genre && oneLineNote.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!record || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.completeReadingRecord(record.id, {
        endDate,
        rating: rating > 0 ? rating : undefined,
        oneLineNote: oneLineNote.trim(),
        emotion: emotion ?? undefined,
        mood: mood ?? undefined,
        genre: genre ?? undefined,
        readAmount,
      });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "완독 처리에 실패했어요.");
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  const book = record?.book;
  const cover = book ? book.coverImageUrl ?? book.spineImageUrl : null;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-28 pt-6">
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
            onClick={() => router.push("/bookbox")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            북박스로
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
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          {/* 완독량 */}
          <div className="mt-5 flex items-center">
            <span className="w-20 text-base font-bold text-gray-900">완독량</span>
            <div className="flex gap-2">
              {([
                ["ALL", "전체 읽었어요"],
                ["PARTIAL", "일부 읽었어요"],
              ] as [ReadAmount, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setReadAmount(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
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
            <span className="w-20 text-base font-bold text-gray-900">별점</span>
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

          <div className="mt-6 border-t border-gray-200" />

          {/* 나의 단어 */}
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
            나의 단어<span>*</span>
          </h2>
          <WordSection title="감정" hint="어떤 감정이 남았나요?" options={EMOTIONS} selected={emotion} onSelect={setEmotion} />
          <WordSection title="분위기" hint="책의 분위기는 어땠나요?" options={MOODS} selected={mood} onSelect={setMood} />
          <WordSection title="장르" hint="어떤 책이었나요?" options={GENRES} selected={genre} onSelect={setGenre} />

          {/* 나의 한줄평 */}
          <h2 className="mt-7 text-xl font-extrabold text-gray-900">
            나의 한줄평<span>*</span>
          </h2>
          <textarea
            value={oneLineNote}
            onChange={(e) => setOneLineNote(e.target.value)}
            placeholder="이 책을 한 줄로 남긴다면?"
            rows={3}
            className="mt-3 w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:border-gray-900"
          />

          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

          {/* 하단 고정 버튼 */}
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-6 pb-6 pt-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              {submitting ? "저장 중..." : "완독 남기기"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
