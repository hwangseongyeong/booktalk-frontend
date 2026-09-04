"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type AuthUser, type MonthlyShelf, type ShelfBookItem } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";

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

// ---------- 아이콘 ----------
function BellIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 4 C9.1 4 6 7.1 6 11 L6 17 L4 19 L22 19 L20 17 L20 11 C20 7.1 16.9 4 13 4 Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 19 C10.5 20.4 11.6 21.5 13 21.5 C14.4 21.5 15.5 20.4 15.5 19"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="5" x2="22" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="8" x2="24" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 10 L12 3 L21 10 L21 21 L15 21 L15 15 L9 15 L9 21 L3 21 Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookshelfNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="7" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="5" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="2" />
      <line x1="2" y1="21" x2="20" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PencilNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17 3 L21 7 L8 20 L3 21 L4 16 Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15 C21 16.1 20.1 17 19 17 L7 17 L3 21 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5 Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12" cy="10" r="1.2" fill="currentColor" />
      <circle cx="16" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PersonNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21 C4 17.1 7.6 14 12 14 C16.4 14 20 17.1 20 21"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ---------- 유저 아바타 ----------
function UserAvatar({ nickname, size = 36 }: { nickname: string; size?: number }) {
  const initial = nickname ? nickname[0].toUpperCase() : "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#7C5CBF] font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
    >
      {initial}
    </div>
  );
}

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
          {/* 아바타 */}
          {i === 1 && user && (
            <div className="absolute bottom-3 right-10">
              <UserAvatar nickname={user.nickname} size={38} />
            </div>
          )}
          {i === 2 && user && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <UserAvatar nickname={user.nickname} size={38} />
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

// ---------- 하단 내비게이션 ----------
const NAV_ITEMS = [
  { label: "홈", icon: <HomeIcon />, href: "/" },
  { label: "책장", icon: <BookshelfNavIcon />, href: "/" },
  { label: "기록", icon: <PencilNavIcon />, href: "/records" },
  { label: "소통", icon: <ChatNavIcon />, href: "#" },
  { label: "마이", icon: <PersonNavIcon />, href: "#" },
] as const;

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-gray-900">
      {NAV_ITEMS.map(({ label, icon, href }) => (
        <Link
          key={label}
          href={href}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            label === active ? "text-white" : "text-gray-500"
          }`}
        >
          {icon}
          <span className="text-[10px]">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

// ---------- 메인 페이지 ----------
export default function HomePage() {
  const ready = useRequireAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shelf, setShelf] = useState<MonthlyShelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ShelfTab>("읽은 책");
  const [viewMode, setViewMode] = useState<ViewMode>("가로");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      try {
        const [me, currentShelf] = await Promise.all([
          apiClient.getMe(),
          apiClient.getMonthlyShelf(),
        ]);
        if (!cancelled) {
          setUser(me);
          setShelf(currentShelf);
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
    <div className="mx-auto min-h-screen max-w-md bg-white pb-20">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">책장</h1>
        <div className="flex items-center gap-3">
          <button className="text-gray-800">
            <BellIcon />
          </button>
          {user && <UserAvatar nickname={user.nickname} size={34} />}
        </div>
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
        <p className="text-center text-base font-semibold text-gray-800">통계 넣기</p>
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

      <BottomNav active="책장" />
    </div>
  );
}
