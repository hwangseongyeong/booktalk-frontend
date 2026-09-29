"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type AuthUser, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";
import { BottomNav } from "../components/bottom-nav";
import { Avatar } from "../components/ui";

// 완독 기록의 한줄평에는 완독 처리 시 선택한 키워드가 #태그 줄로 함께 저장된다.
// '나의 한줄' 섹션에서는 태그 줄을 걸러 실제 한줄평만 보여준다.
function reviewText(note: string | null): string {
  if (!note) return "";
  return note
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join(" ")
    .trim();
}

function stars(rating: number | null): string {
  if (!rating || rating <= 0) return "";
  return "★".repeat(Math.round(rating));
}

/** 진행 중 카드의 도서 표지(표지 없으면 책등 → 색상 폴백). */
function BookCover({ book }: { book: ReadingRecord["book"] }) {
  const image = book.coverImageUrl ?? book.spineImageUrl;
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={book.title}
        className="h-28 w-20 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md p-2 text-center"
      style={{ backgroundColor: book.primaryColor ?? "#8B5E3C" }}
    >
      <span className="line-clamp-4 text-[11px] font-bold leading-tight text-white">{book.title}</span>
    </div>
  );
}

export default function HomePage() {
  const ready = useRequireAuth();
  const [reading, setReading] = useState<ReadingRecord[]>([]);
  const [completed, setCompleted] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // 프로필은 헤더 아바타 용도라 실패해도 화면 진행에 영향 없다.
    apiClient.getMyProfile().then(
      (me) => { if (!cancelled) setProfile(me); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.getMyReadingRecords("READING"),
      apiClient.getMyReadingRecords("COMPLETED"),
    ])
      .then(([readingRecords, completedRecords]) => {
        if (cancelled) return;
        setReading(readingRecords);
        setCompleted(completedRecords);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "홈을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ready]);

  if (!ready) return null;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f6f8fb] px-6 pb-24 pt-8">
      {/* 상단 우측: 프로필 아바타 */}
      <div className="flex justify-end">
        <Link href="/my" aria-label="마이 페이지">
          <Avatar
            nickname={profile?.nickname}
            src={profile?.profileImageUrl}
            color={profile?.profileColor ?? undefined}
            size={34}
          />
        </Link>
      </div>

      <h1 className="mt-1 text-3xl font-bold leading-snug text-gray-900">
        지금은 어떤 책과
        <br />
        놀고 있나요?
      </h1>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {/* 지금 읽고 있어요 */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">지금 읽고 있어요</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-400">불러오는 중...</p>
        ) : reading.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white py-10 text-center shadow-sm">
            <p className="text-sm text-gray-400">지금 읽고 있는 책이 없어요.</p>
            <Link
              href="/books"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white"
            >
              + 책 등록
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {reading.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <BookCover book={record.book} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-gray-900">{record.book.title}</p>
                  {record.book.author && (
                    <p className="mt-0.5 truncate text-sm text-gray-400">{record.book.author}</p>
                  )}
                  <Link
                    href={`/records/${record.id}/complete`}
                    className="mt-3 inline-block rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white"
                  >
                    완독하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 나의 한줄 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-900">나의 한줄</h2>

        {!loading && completed.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">아직 완독한 책이 없어요.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {completed.map((record) => {
              const review = reviewText(record.oneLineNote);
              return (
                <div
                  key={record.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-base font-bold text-gray-900">{record.book.title}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    완독일 {record.endDate}
                    {record.rating != null && (
                      <span className="ml-2 text-gray-900">{stars(record.rating)}</span>
                    )}
                  </p>
                  {review && <p className="mt-3 text-sm text-gray-700">&quot;{review}&quot;</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
