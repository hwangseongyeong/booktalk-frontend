"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type MonthlyShelf, type ShelfBookItem } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";

const LOOKBACK_MONTHS = 5; // 이번 달 제외하고 몇 달치까지 "지난 기록"으로 조회할지

const FALLBACK_COLORS = ["#8B5E3C", "#4A6C6F", "#7A6C5D", "#5B6B8C", "#8C5B6B", "#6B8C5B", "#8C7A5B", "#5B7A8C"];

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

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

// 책마다 높이를 살짝 다르게 줘서 실제 책장처럼 보이게 한다
function spineHeight(seed: string, min: number, max: number) {
  return min + (hashSeed(seed) % (max - min));
}

function fallbackColor(seed: string) {
  return FALLBACK_COLORS[hashSeed(seed) % FALLBACK_COLORS.length];
}

function BookSpineBar({ book, height }: { book: ShelfBookItem; height: number }) {
  const color = book.primaryColor ?? fallbackColor(book.title);
  const shortTitle = book.title.length > 10 ? `${book.title.slice(0, 10)}…` : book.title;

  return (
    <div
      title={book.title}
      className="flex w-6 shrink-0 items-end justify-center overflow-hidden rounded-t-sm"
      style={{ height, backgroundColor: book.spineImageUrl ? undefined : color }}
    >
      {book.spineImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.spineImageUrl} alt={book.title} className="h-full w-full object-cover" />
      ) : (
        <span
          className="mb-2 whitespace-nowrap text-[10px] text-white/85"
          style={{ writingMode: "vertical-rl" }}
        >
          {shortTitle}
        </span>
      )}
    </div>
  );
}

export default function HomePage() {
  const ready = useRequireAuth();
  const [currentShelf, setCurrentShelf] = useState<MonthlyShelf | null>(null);
  const [pastShelves, setPastShelves] = useState<MonthlyShelf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const thisMonth = currentYearMonth();
      const lookbackMonths = Array.from({ length: LOOKBACK_MONTHS }, (_, i) => shiftYearMonth(thisMonth, -(i + 1)));

      try {
        const [current, ...past] = await Promise.all([
          apiClient.getMonthlyShelf(thisMonth),
          ...lookbackMonths.map((ym) => apiClient.getMonthlyShelf(ym)),
        ]);

        if (cancelled) return;
        setCurrentShelf(current);
        setPastShelves(past.filter((shelf) => shelf.bookCount > 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-16">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 pt-8">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-gray-900">BookTalk</h1>
          <p className="mt-0.5 text-xs text-gray-400">읽은 책이 하나의 서재가 되다</p>
        </div>
        <Link href="/books" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          + 등록
        </Link>
      </header>

      {/* 검색바 (누르면 검색 화면으로 이동) */}
      <div className="mt-5 px-6">
        <Link
          href="/books"
          className="flex items-center rounded-full bg-gray-900 px-4 py-2.5 text-sm text-gray-300"
        >
          책 제목이나 저자를 검색해보세요
        </Link>
      </div>

      {/* 탭: 기록(구현됨) / 소통·공유(준비 중) */}
      <nav className="mt-6 grid grid-cols-3 border-b border-gray-100 px-6">
        <div className="flex flex-col items-center gap-1 border-b-2 border-gray-900 pb-3">
          <span className="text-xs text-gray-400">기록</span>
          <span className="text-sm font-medium text-gray-900">Book Box</span>
        </div>
        <div className="flex flex-col items-center gap-1 pb-3 text-gray-300">
          <span className="text-xs">소통</span>
          <span className="text-sm font-medium">Book Buddy</span>
        </div>
        <div className="flex flex-col items-center gap-1 pb-3 text-gray-300">
          <span className="text-xs">공유</span>
          <span className="text-sm font-medium">Book Share</span>
        </div>
      </nav>

      {/* 이달의 북박스 */}
      <section className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">이달의 북박스</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatLabel(currentShelf?.yearMonth ?? currentYearMonth())} · {currentShelf?.bookCount ?? 0}권
            </p>
          </div>
          <Link
            href="/books"
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            + 책 추가
          </Link>
        </div>

        <div className="mt-8 flex min-h-[220px] flex-col justify-end">
          {loading ? (
            <p className="pb-10 text-center text-sm text-gray-300">불러오는 중...</p>
          ) : currentShelf && currentShelf.books.length > 0 ? (
            <div className="flex items-end gap-2 overflow-x-auto pb-1">
              {currentShelf.books.map((book) => (
                <BookSpineBar key={book.readingRecordId} book={book} height={spineHeight(book.title, 90, 160)} />
              ))}
            </div>
          ) : (
            <p className="pb-10 text-center text-sm text-gray-300">이달의 첫 번째 책을 추가해보세요</p>
          )}
          <div className="mt-3 h-[3px] w-full bg-gray-900" />
        </div>
      </section>

      {/* 지난 기록 */}
      {pastShelves.length > 0 && (
        <section className="mt-10 px-6">
          <p className="text-sm font-medium text-gray-900">지난 기록</p>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8">
            {pastShelves.map((shelf) => (
              <div key={shelf.yearMonth} className="flex flex-col">
                <div className="flex min-h-[110px] items-end gap-1.5">
                  {shelf.books.map((book) => (
                    <BookSpineBar key={book.readingRecordId} book={book} height={spineHeight(book.title, 60, 110)} />
                  ))}
                </div>
                <div className="mt-2 h-[2px] w-full bg-gray-900" />
                <p className="mt-2 text-center text-xs text-gray-400">
                  {formatLabel(shelf.yearMonth)} · {shelf.bookCount}권
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 flex justify-center gap-4 px-6 text-xs text-gray-300">
        <Link href="/records" className="hover:underline">
          독서 기록 전체보기
        </Link>
        <span>·</span>
        <LogoutLink />
      </footer>
    </main>
  );
}

function LogoutLink() {
  function handleLogout() {
    apiClient.logout();
    window.location.href = "/login";
  }

  return (
    <button onClick={handleLogout} className="hover:underline">
      로그아웃
    </button>
  );
}
