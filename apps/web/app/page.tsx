"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authStorage, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";
import { BellIcon, ShareIcon, BooksStackIcon } from "../components/icons";
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
type ShelfTab = "읽은 책" | "읽는 중" | "읽고 싶은책";

/** 책장에 올릴 한 권. 독서 기록(ReadingRecord)에서 화면에 필요한 값만 뽑은 형태. */
type ShelfEntry = {
  key: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  spineImageUrl: string | null;
  primaryColor: string | null;
};

function toShelfEntry(record: ReadingRecord): ShelfEntry {
  return {
    key: String(record.id),
    title: record.book.title,
    author: record.book.author,
    coverImageUrl: record.book.coverImageUrl,
    spineImageUrl: record.book.spineImageUrl,
    primaryColor: record.book.primaryColor,
  };
}

// ---------- 탭별 빈 상태 ----------
const EMPTY_CONFIG: Record<
  ShelfTab,
  { title: string; subtitle: [string, string]; buttonLabel: string }
> = {
  "읽은 책": {
    title: "아직 읽은 책이 없어요",
    subtitle: ["완독한 책을 등록하면", "나만의 독서 기록이 쌓여요"],
    buttonLabel: "+ 책 등록",
  },
  "읽는 중": {
    title: "지금 읽고 있는 책이 없어요",
    subtitle: ["요즘 펼친 책을 등록하고", "오늘의 독서를 기록해보세요"],
    buttonLabel: "+ 책 추가",
  },
  "읽고 싶은책": {
    title: "아직 담아둔 책이 없어요",
    subtitle: ["읽고 싶은 책을 미리 담아두면", "다음에 뭘 읽을지 고민이 줄어들어요"],
    buttonLabel: "+ 책 등록",
  },
};

function ShelfEmptyState({ tab }: { tab: ShelfTab }) {
  const { title, subtitle } = EMPTY_CONFIG[tab];
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <BooksStackIcon size={52} className="text-gray-300" />
      <p className="text-xl font-bold text-gray-900">{title}</p>
      <p className="text-sm leading-relaxed text-gray-400">
        {subtitle[0]}
        <br />
        {subtitle[1]}
      </p>
    </div>
  );
}

function BookCard({ book }: { book: ShelfEntry }) {
  const image = book.coverImageUrl ?? book.spineImageUrl;
  return (
    <div
      title={book.title}
      className="flex aspect-[3/4] flex-col overflow-hidden rounded-md border-2 border-gray-900 bg-white"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={book.title} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center"
          style={{ backgroundColor: book.primaryColor ?? fallbackColor(book.title) }}
        >
          <span className="line-clamp-3 text-[11px] font-bold leading-tight text-white">{book.title}</span>
          {book.author && (
            <span className="line-clamp-1 text-[9px] text-white/70">{book.author}</span>
          )}
        </div>
      )}
    </div>
  );
}

function BookGrid({ books }: { books: ShelfEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {books.map((book) => (
        <BookCard key={book.key} book={book} />
      ))}
    </div>
  );
}

// ---------- 메인 페이지 ----------
export default function HomePage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [completed, setCompleted] = useState<ShelfEntry[]>([]);
  const [reading, setReading] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<ShelfTab>("읽는 중");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoadError(null);
      try {
        const [completedRecords, readingRecords] = await Promise.all([
          apiClient.getMyReadingRecords("COMPLETED"),
          apiClient.getMyReadingRecords("READING"),
        ]);
        if (!cancelled) {
          setCompleted(completedRecords.map(toShelfEntry));
          setReading(readingRecords.map(toShelfEntry));
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "";
        // 토큰 만료/무효 → 조용히 빈 화면 대신 로그인으로
        if (msg.includes("로그인")) {
          authStorage.clearTokens();
          router.replace("/login");
          return;
        }
        setLoadError("책장을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ready, router]);

  if (!ready) return null;

  // 읽고 싶은책은 아직 API 상태값이 없어 항상 빈 목록으로 둔다.
  const wantToRead: ShelfEntry[] = [];
  const activeBooks =
    tab === "읽은 책" ? completed : tab === "읽는 중" ? reading : wantToRead;
  const hasBooks = activeBooks.length > 0;
  // 통계는 책이 있을 때만 노출한다(빈 상태 시안 기준).
  const showStats = !loading && !loadError && tab === "읽은 책" && hasBooks;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-24">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">내 책장</h1>
        <div className="flex items-center gap-3 text-gray-800">
          <button aria-label="공유">
            <ShareIcon />
          </button>
          <button aria-label="알림">
            <BellIcon />
          </button>
        </div>
      </header>

      {/* 탭 */}
      <div className="mt-5 flex gap-6 border-b border-gray-200 px-5">
        {(["읽는 중", "읽은 책", "읽고 싶은책"] as ShelfTab[]).map((t) => (
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

      {/* 통계 (읽은 책, 책이 있을 때만) */}
      {showStats && (
        <div className="mt-6 px-5">
          <p className="text-center text-base font-semibold text-gray-800">
            총 <span className="text-2xl font-bold">{completed.length}</span>권의 책을 읽었어요
          </p>
        </div>
      )}

      {/* 책장 */}
      <div className="mt-5 px-5">
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
        ) : !hasBooks ? (
          <ShelfEmptyState tab={tab} />
        ) : (
          <BookGrid books={activeBooks} />
        )}

        {/* 하단 책 추가 진입점.
            빈 상태: 전체 너비 버튼(탭별 라벨). 책 있음: 기본 등록 버튼. */}
        {!loading && !loadError && !hasBooks && (
          <Link
            href="/books"
            className="mt-4 flex justify-center rounded-full bg-gray-900 px-6 py-3.5 text-sm font-medium text-white"
          >
            {EMPTY_CONFIG[tab].buttonLabel}
          </Link>
        )}
        {!loading && !loadError && hasBooks && (
          <Link
            href="/books"
            className="mt-4 flex justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            + 책 등록
          </Link>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
