"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authStorage, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BellIcon, ShareIcon } from "../../components/icons";
import { BottomNav } from "../../components/bottom-nav";

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

// ---------- 날짜 유틸 ----------
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

// ---------- 타입 ----------
type ViewMode = "펼치기" | "가로" | "세로";

type ShelfEntry = {
  key: string;
  title: string;
  author: string | null;
  publisher: string | null;
  coverImageUrl: string | null;
  spineImageUrl: string | null;
  primaryColor: string | null;
  myWords: string[];
  oneLineNote: string | null;
  endDate: string | null;
};

function toShelfEntry(record: ReadingRecord): ShelfEntry {
  return {
    key: String(record.id),
    title: record.book.title,
    author: record.book.author,
    publisher: record.book.publisher,
    coverImageUrl: record.book.coverImageUrl,
    spineImageUrl: record.book.spineImageUrl,
    primaryColor: record.book.primaryColor,
    myWords: record.myWords,
    oneLineNote: record.oneLineNote,
    endDate: record.endDate,
  };
}

// ---------- 세워둔 책등 ----------
function BookSpine({ book, height }: { book: ShelfEntry; height: number }) {
  if (book.spineImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.spineImageUrl}
        alt={book.title}
        title={book.title}
        style={{ height, width: "auto" }}
        className="shrink-0 rounded-t-sm shadow-sm"
      />
    );
  }

  const color = book.primaryColor ?? fallbackColor(book.title);
  const maxChars = Math.max(2, Math.floor((height - 24) / 14));
  const shortTitle = book.title.length > maxChars ? `${book.title.slice(0, maxChars - 1)}…` : book.title;

  return (
    <div
      title={book.title}
      className="flex w-9 shrink-0 flex-col items-center justify-between rounded-t-sm py-2"
      style={{ height, backgroundColor: color }}
    >
      <span className="flex flex-col items-center leading-tight">
        {Array.from(shortTitle).map((char, i) => (
          <span key={i} className="text-[11px] font-bold text-white/90">{char}</span>
        ))}
      </span>
      {book.author && (
        <span className="flex flex-col items-center leading-tight">
          {Array.from(book.author.slice(0, 3)).map((char, i) => (
            <span key={i} className="text-[9px] text-white/60">{char}</span>
          ))}
        </span>
      )}
    </div>
  );
}

// ---------- 펼치기(책등 세우기) 뷰 ----------
function SpreadView({ books }: { books: ShelfEntry[] }) {
  return (
    <div>
      <div className="flex items-end gap-1.5 overflow-x-auto px-1 pb-1">
        {books.map((book) => (
          <BookSpine key={book.key} book={book} height={140} />
        ))}
      </div>
      {/* 선반 */}
      <div className="h-3 w-full rounded-sm bg-gray-300" />
    </div>
  );
}

// ---------- 가로 쌓기 뷰 ----------
function HorizontalView({ books }: { books: ShelfEntry[] }) {
  return (
    <div>
      <div className="flex flex-col items-center gap-2">
        {books.map((book) => (
          <div
            key={book.key}
            className="flex w-[85%] items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-4 py-3"
            style={{ borderLeft: `6px solid ${book.primaryColor ?? fallbackColor(book.title)}` }}
          >
            <span className="truncate text-sm font-bold text-gray-900">{book.title}</span>
            <span className="ml-auto flex shrink-0 items-center gap-2 text-[11px] text-gray-400">
              {book.author && <span className="truncate">{book.author}</span>}
              {book.publisher && <span className="truncate">{book.publisher}</span>}
            </span>
          </div>
        ))}
      </div>
      {/* 선반 */}
      <div className="mt-1 h-3 w-full rounded-sm bg-gray-300" />
    </div>
  );
}

// ---------- 세로(표지 그리드) 뷰 ----------
function GridView({ books }: { books: ShelfEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {books.map((book) => {
        // 세로(표지) 뷰는 표지만 사용한다. 책등으로 폴백하면 펼치기 뷰처럼 보이므로 폴백하지 않는다.
        const image = book.coverImageUrl;
        return image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={book.key}
            src={image}
            alt={book.title}
            title={book.title}
            className="aspect-[3/4] w-full rounded-md border border-gray-300 object-cover"
          />
        ) : (
          <div
            key={book.key}
            title={book.title}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-md border border-gray-300 p-2 text-center"
            style={{ backgroundColor: book.primaryColor ?? fallbackColor(book.title) }}
          >
            <span className="line-clamp-4 text-[11px] font-bold leading-tight text-white">{book.title}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- 메인 페이지 ----------
export default function BookBoxPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [completed, setCompleted] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("가로");
  const [viewOpen, setViewOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoadError(null);
      try {
        const records = await apiClient.getMyReadingRecords("COMPLETED");
        if (!cancelled) setCompleted(records.map(toShelfEntry));
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("로그인")) {
          authStorage.clearTokens();
          router.replace("/login");
          return;
        }
        setLoadError("북박스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ready, router]);

  // 완독일(endDate) 기준으로 선택한 달의 책만 추린다.
  const books = useMemo(
    () => completed.filter((b) => b.endDate?.startsWith(yearMonth)),
    [completed, yearMonth],
  );

  if (!ready) return null;

  const stats = {
    books: books.length,
    words: books.reduce((sum, b) => sum + b.myWords.length, 0),
    reviews: books.filter((b) => b.oneLineNote && b.oneLineNote.trim()).length,
  };

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${formatLabel(yearMonth)}의 내 북박스`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "북박스", text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMsg("링크를 복사했어요.");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      // 사용자가 공유를 취소한 경우 등은 무시
    }
  }

  const VIEW_OPTIONS: ViewMode[] = ["가로", "펼치기", "세로"];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white px-5 pb-24 pt-8">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">북박스</h1>
        <button aria-label="알림" className="text-gray-800">
          <BellIcon />
        </button>
      </header>
      <div className="mt-3 border-b border-gray-900" />

      {/* 컨트롤 바: 월 · 뷰 모드 · 공유 */}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
          {formatLabel(yearMonth)} ▼
        </span>

        <div className="relative">
          <button
            onClick={() => setViewOpen((v) => !v)}
            className="rounded-full border-2 border-gray-900 px-4 py-2 text-sm font-bold text-gray-900"
          >
            {viewMode} ▼
          </button>
          {viewOpen && (
            <div className="absolute z-10 mt-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {VIEW_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => { setViewMode(v); setViewOpen(false); }}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    v === viewMode ? "font-bold text-gray-900" : "text-gray-500"
                  } hover:bg-gray-50`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleShare}
          aria-label="공유"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-800"
        >
          <ShareIcon size={20} />
        </button>
      </div>

      {shareMsg && <p className="mt-2 text-right text-xs font-medium text-emerald-600">{shareMsg}</p>}

      {/* 월 이동 */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setYearMonth((v) => shiftYearMonth(v, -1))}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          ← 이전 달
        </button>
        <span className="text-xl font-bold text-gray-900">{formatLabel(yearMonth)} ▼</span>
        <button
          onClick={() => setYearMonth((v) => shiftYearMonth(v, 1))}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          다음 달 →
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="mt-4 grid grid-cols-3 rounded-2xl bg-gray-100 py-6">
        {([
          [stats.books, "Books"],
          [stats.words, "Words"],
          [stats.reviews, "Reviews"],
        ] as [number, string][]).map(([value, label]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* 책 시각화 */}
      <div className="mt-8">
        {loading ? (
          <p className="text-center text-sm text-gray-300">불러오는 중...</p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-gray-200 py-14">
            <p className="text-sm text-gray-400">{loadError}</p>
            <button
              onClick={() => location.reload()}
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-400">이 달에 완독한 책이 없어요.</p>
            <Link
              href="/books"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              + 책 검색
            </Link>
          </div>
        ) : viewMode === "가로" ? (
          <SpreadView books={books} />
        ) : viewMode === "세로" ? (
          <HorizontalView books={books} />
        ) : (
          <GridView books={books} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
