"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type AuthUser, type MonthlyShelf, type ShelfBookItem } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";
import { BellIcon } from "../components/icons";
import { BottomNav } from "../components/bottom-nav";

// ---------- 색상 폴백 ----------
const FALLBACK_COLORS = ["#8B5E3C", "#4A6C6F", "#7A6C5D", "#5B6B8C", "#8C5B6B", "#6B8C5B", "#8C7A5B", "#5B7A8C"];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function fallbackColor(seed: string) {
  return FALLBACK_COLORS[hashSeed(seed) % FALLBACK_COLORS.length];
}

// ---------- 타입 ----------
type ViewMode = "세로" | "가로" | "펼치기";
type ShelfTab = "읽은 책" | "읽는 중" | "읽고 싶은책";

// ---------- 책등 ----------
function BookSpine({ book, height }: { book: ShelfBookItem; height: number }) {
  const color = book.primaryColor ?? fallbackColor(book.title);
  const maxChars = Math.max(2, Math.floor((height - 16) / 14));
  const shortTitle = book.title.length > maxChars ? `${book.title.slice(0, maxChars - 1)}…` : book.title;

  return (
    <div
      title={book.title}
      className="flex w-7 shrink-0 flex-col items-center justify-center overflow-hidden rounded-t-sm"
      style={{ height, backgroundColor: book.spineImageUrl ? undefined : color }}
    >
      {book.spineImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.spineImageUrl} alt={book.title} className="h-full w-full object-cover" />
      ) : (
        Array.from(shortTitle).map((char, i) => (
          <span key={i} className="text-[10px] leading-tight text-white/85">{char}</span>
        ))
      )}
    </div>
  );
}

// ---------- 책장 프레임 ----------
const SHELF_COUNT = 5;
const SECTION_HEIGHT = 100;
const BOOK_HEIGHT = 88;

function BookshelfFrame({ books, user }: { books: ShelfBookItem[]; user: AuthUser | null }) {
  return (
    <div className="relative w-full border-2 border-gray-900">
      {Array.from({ length: SHELF_COUNT }).map((_, i) => (
        <div
          key={i}
          className="relative border-b-2 border-gray-900"
          style={{ height: SECTION_HEIGHT }}
        >
          {/* 첫 번째 칸에만 책등 표시 */}
          {i === 0 && books.length > 0 && (
            <div className="absolute bottom-0 left-2 flex items-end gap-1 overflow-x-auto pr-2">
              {books.map((book) => (
                <BookSpine key={book.readingRecordId} book={book} height={BOOK_HEIGHT} />
              ))}
            </div>
          )}
          {i === 0 && books.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-gray-300">이달의 첫 번째 책을 추가해보세요</p>
            </div>
          )}
        </div>
      ))}

      {/* + 책 등록 버튼 */}
      <Link
        href="/books"
        className="absolute bottom-4 left-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        + 책 등록
      </Link>
    </div>
  );
}

// ---------- 메인 페이지 ----------
export default function HomePage() {
  const ready = useRequireAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shelf, setShelf] = useState<MonthlyShelf | null>(null);
  const [totalBooks, setTotalBooks] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ShelfTab>("읽은 책");
  const [viewMode, setViewMode] = useState<ViewMode>("가로");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      try {
        const [me, currentShelf, completed] = await Promise.all([
          apiClient.getMe(),
          apiClient.getMonthlyShelf(),
          apiClient.getMyReadingRecords("COMPLETED"),
        ]);
        if (!cancelled) {
          setUser(me);
          setShelf(currentShelf);
          setTotalBooks(completed.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ready]);

  if (!ready) return null;

  const VIEW_LABELS: { key: ViewMode; label: string }[] = [
    { key: "세로", label: "세로 쌓기" },
    { key: "가로", label: "가로 쌓기" },
    { key: "펼치기", label: "펼치기" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-24">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">책장</h1>
        <button className="text-gray-800">
          <BellIcon />
        </button>
      </header>

      {/* 탭 */}
      <div className="mt-5 flex gap-6 border-b border-gray-200 px-5">
        {(["읽은 책", "읽는 중", "읽고 싶은책"] as ShelfTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 뷰 모드 토글 */}
      <div className="mt-4 flex gap-2 px-5">
        {VIEW_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 통계 */}
      <div className="mt-6 px-5">
        {totalBooks !== null ? (
          <p className="text-center text-base font-semibold text-gray-800">
            총 <span className="text-2xl font-bold">{totalBooks}</span>권의 책을 읽었어요
          </p>
        ) : (
          <p className="text-center text-base font-semibold text-gray-300">불러오는 중...</p>
        )}
      </div>

      {/* 책장 */}
      <div className="mt-5 px-5">
        {loading ? (
          <p className="text-center text-sm text-gray-300">불러오는 중...</p>
        ) : tab === "읽은 책" ? (
          <BookshelfFrame books={shelf?.books ?? []} user={user} />
        ) : (
          <div
            className="flex items-center justify-center border-2 border-dashed border-gray-200"
            style={{ height: SECTION_HEIGHT * SHELF_COUNT }}
          >
            <p className="text-sm text-gray-400">준비 중</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
