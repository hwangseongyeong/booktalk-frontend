"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookShelf } from "@booktalk/ui";
import { apiClient, type MonthlyShelf } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftYearMonth(yearMonth: string, delta: number) {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatLabel(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${y}년 ${m}월`;
}

export default function ShelfPage() {
  const ready = useRequireAuth();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [shelf, setShelf] = useState<MonthlyShelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .getMonthlyShelf(yearMonth)
      .then((result) => {
        if (!cancelled) setShelf(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "서재를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, yearMonth]);

  const shelfBooks =
    shelf?.books.map((item) => ({
      id: item.bookId,
      title: item.title,
      spineImageUrl: item.spineImageUrl,
      primaryColor: item.primaryColor,
    })) ?? [];

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md p-6">
      <Link href="/" className="text-sm text-gray-400 hover:underline">
        ← 홈
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setYearMonth((v) => shiftYearMonth(v, -1))}
          className="rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-gray-100"
        >
          ← 이전 달
        </button>
        <h1 className="text-lg font-medium">{formatLabel(yearMonth)}</h1>
        <button
          onClick={() => setYearMonth((v) => shiftYearMonth(v, 1))}
          className="rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-gray-100"
        >
          다음 달 →
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-gray-400">불러오는 중...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && shelf && (
        <>
          <p className="mt-4 text-sm text-gray-500">
            이번 달 읽은 책 <span className="font-medium text-gray-900">{shelf.bookCount}권</span>
          </p>

          {shelfBooks.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-400">
              이 달에 완독한 책이 아직 없어요.{" "}
              <Link href="/records" className="underline">
                독서 기록에서 완독 처리하기
              </Link>
            </p>
          ) : (
            <div className="mt-4">
              <BookShelf books={shelfBooks} />
            </div>
          )}

          <ul className="mt-6 flex flex-col gap-2">
            {shelf.books.map((item) => (
              <li key={item.readingRecordId} className="rounded-md border border-gray-200 p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.endDate} {item.rating != null && `· ★${item.rating}`}
                </p>
                {item.oneLineNote && <p className="mt-1 text-xs text-gray-600">"{item.oneLineNote}"</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
