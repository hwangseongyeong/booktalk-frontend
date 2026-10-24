"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authStorage, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BellIcon, ShareIcon } from "../../components/icons";
import { BottomNav } from "../../components/bottom-nav";

// ---------- 파스텔 책등 팔레트 (디자인 색상) ----------
const SPINE_PASTELS = ["#F7CF87", "#FFFEAC", "#FFFDE8", "#D8EAF6", "#E0F3C7"];
const SPINE_INK = "#1E1E1E"; // 책등 글자·테두리

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

// ---------- 타입 ----------
type Granularity = "월별" | "연간";
type ViewMode = "가로" | "세로";

type ShelfEntry = {
  key: string;
  title: string;
  author: string | null;
  publisher: string | null;
  coverImageUrl: string | null;
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
    primaryColor: record.book.primaryColor,
    myWords: record.myWords,
    oneLineNote: record.oneLineNote,
    endDate: record.endDate,
  };
}

// 책등 기울기 후보(대부분 반듯하게, 일부만 좌우로 기움) — 책별 고정 시드로 선택
const TILT_ANGLES = [0, 0, 0, 0, -5, 5, -7, 6, -4, 0, 0, 7];

// ---------- 세워둔 책등 (파스텔 + 세로 제목 + 출판사) ----------
function BookSpine({ book, index }: { book: ShelfEntry; index: number }) {
  const color = SPINE_PASTELS[index % SPINE_PASTELS.length];
  const height = 150 + (hashSeed(book.title) % 4) * 12; // 150~186, 책마다 살짝 다른 키
  const tiltDeg = TILT_ANGLES[hashSeed(`${book.key}-tilt`) % TILT_ANGLES.length];
  const maxChars = Math.max(2, Math.floor((height - 48) / 15));
  const shortTitle =
    book.title.length > maxChars ? `${book.title.slice(0, maxChars - 1)}…` : book.title;

  return (
    <div
      title={book.title}
      className="flex w-[38px] shrink-0 origin-bottom flex-col items-center justify-between rounded-md border py-3"
      style={{
        height,
        backgroundColor: color,
        borderColor: SPINE_INK,
        color: SPINE_INK,
        transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
      }}
    >
      <span className="flex flex-col items-center leading-[1.15]">
        {Array.from(shortTitle).map((char, i) => (
          <span key={i} className="text-[11px] font-bold">
            {char}
          </span>
        ))}
      </span>
      {book.publisher && (
        <span className="flex flex-col items-center leading-tight opacity-80">
          {Array.from(book.publisher.slice(0, 2)).map((char, i) => (
            <span key={i} className="text-[9px] font-bold">
              {char}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

// ---------- 북엔드 ----------
function Bookend() {
  return <span aria-hidden className="h-[110px] w-2 shrink-0 self-end rounded-full bg-[#AFAFAF]" />;
}

// ---------- 책꽂이(가로) 뷰 ----------
function ShelfView({ books }: { books: ShelfEntry[] }) {
  return (
    <div className="relative">
      <div className="flex items-end justify-center gap-1.5 overflow-x-auto px-2">
        <Bookend />
        {books.map((book, i) => (
          <BookSpine key={book.key} book={book} index={i} />
        ))}
        <Bookend />
      </div>
      {/* 선반 */}
      <div className="relative z-10 -mt-0.5 h-3 w-full rounded-sm bg-[#D9D9D9]" />
    </div>
  );
}

// 세로쌓기 좌우 어긋남 후보(대부분 가지런히, 일부만 살짝 어긋나게) — 책별 고정 시드로 선택
const STACK_OFFSETS = [0, 0, 0, -8, 8, -5, 5, 0, 10, -10, 0];

// ---------- 눕힌 책 한 권(세로쌓기용) ----------
function FlatBook({ book, index }: { book: ShelfEntry; index: number }) {
  const color = SPINE_PASTELS[index % SPINE_PASTELS.length];
  const width = 150 + (hashSeed(book.title) % 5) * 16; // 150~214, 책마다 폭이 조금씩 다름
  const offset = STACK_OFFSETS[hashSeed(`${book.key}-off`) % STACK_OFFSETS.length];

  return (
    <div
      title={book.title}
      className="flex h-9 items-center justify-between rounded-md border px-3"
      style={{
        width,
        backgroundColor: color,
        borderColor: SPINE_INK,
        color: SPINE_INK,
        transform: offset ? `translateX(${offset}px)` : undefined,
      }}
    >
      <span className="truncate text-[12px] font-bold">{book.title}</span>
      {book.publisher && (
        <span className="ml-2 shrink-0 text-[9px] font-bold opacity-80">{book.publisher}</span>
      )}
    </div>
  );
}

// ---------- 세로쌓기 뷰 (책을 눕혀 위로 쌓기) ----------
function StackView({ books }: { books: ShelfEntry[] }) {
  return (
    <div>
      <div className="flex flex-col items-center gap-1.5 px-2">
        {books.map((book, i) => (
          <FlatBook key={book.key} book={book} index={i} />
        ))}
      </div>
      {/* 바닥 */}
      <div className="relative z-10 mt-0.5 h-3 w-full rounded-sm bg-[#D9D9D9]" />
    </div>
  );
}

// ---------- 드롭다운 필 ----------
function PillDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: string;
  options: T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-gray-900 px-4 py-2 text-sm font-bold text-gray-900"
      >
        {value} <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-32 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm ${
                  o === value ? "font-bold text-gray-900" : "text-gray-500"
                } hover:bg-gray-50`}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
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

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [granularity, setGranularity] = useState<Granularity>("월별");
  const [viewMode, setViewMode] = useState<ViewMode>("가로");
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
    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  // 완독일(endDate) 기준으로 기간(연/월)에 해당하는 책만 추린다.
  const books = useMemo(() => {
    if (granularity === "연간") {
      return completed.filter((b) => b.endDate?.slice(0, 4) === String(year));
    }
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return completed.filter((b) => b.endDate?.startsWith(prefix));
  }, [completed, granularity, year, month]);

  if (!ready) return null;

  const stats = {
    books: books.length,
    words: books.reduce((sum, b) => sum + b.myWords.length, 0),
    reviews: books.filter((b) => b.oneLineNote && b.oneLineNote.trim()).length,
  };

  const periodLabel = granularity === "연간" ? `${year}년` : `${year}년 ${month}월`;
  const navUnit = granularity === "연간" ? "연도" : "달";

  function shiftPeriod(delta: number) {
    if (granularity === "연간") {
      setYear((y) => y + delta);
      return;
    }
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${periodLabel}의 내 북박스`;
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

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white px-5 pb-24 pt-8">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">북박스</h1>
        <button aria-label="알림" className="text-gray-900">
          <BellIcon />
        </button>
      </header>
      <div className="mt-3 border-b border-gray-900" />

      {/* 컨트롤 바: 기간 모드 · 보기 방식 · 공유 */}
      <div className="mt-4 flex items-center gap-2">
        <PillDropdown
          value={granularity === "연간" ? "연간 보기" : "월별 보기"}
          options={["월별 보기", "연간 보기"]}
          onChange={(v) => setGranularity(v === "연간 보기" ? "연간" : "월별")}
        />
        <PillDropdown value={viewMode} options={["가로", "세로"]} onChange={setViewMode} />
        <button
          onClick={handleShare}
          aria-label="공유"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-800 hover:bg-gray-50"
        >
          <ShareIcon size={18} />
        </button>
      </div>

      {shareMsg && <p className="mt-2 text-right text-xs font-medium text-emerald-600">{shareMsg}</p>}

      {/* 기간 이동 */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => shiftPeriod(-1)}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          ← 이전 {navUnit}
        </button>
        <span className="text-xl font-bold text-gray-900">{periodLabel}</span>
        <button
          onClick={() => shiftPeriod(1)}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          다음 {navUnit} →
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="mt-4 grid grid-cols-3 rounded-2xl border border-gray-200 py-6">
        {(
          [
            [stats.books, "Books"],
            [stats.words, "Words"],
            [stats.reviews, "Reviews"],
          ] as [number, string][]
        ).map(([value, label]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* 책 시각화 */}
      <div className="mt-10">
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
            <p className="text-sm text-gray-400">
              이 {navUnit}에 완독한 책이 없어요.
            </p>
          </div>
        ) : viewMode === "가로" ? (
          <ShelfView books={books} />
        ) : (
          <StackView books={books} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
