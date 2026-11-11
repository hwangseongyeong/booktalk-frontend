"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authStorage, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BellIcon, ChevronRightIcon, ShareIcon } from "../../components/icons";
import { BottomNav } from "../../components/bottom-nav";

// ---------- 책등 색상 테마 ----------
type ColorTheme = "모노톤" | "파스텔" | "컬러";

const PALETTES: Record<ColorTheme, string[]> = {
  "모노톤": ["#EDECE8", "#DEDCD6", "#C9C7C1", "#F4F3EF", "#E3E1DB"],
  "파스텔": ["#F6D28A", "#FBE8A6", "#F3C9DD", "#D9C9EE", "#CDE8B0", "#BFDDF2", "#F2C7A0"],
  "컬러": ["#F6B44B", "#F4D63E", "#EF8FB7", "#B98FE0", "#8FD168", "#5FB8E8", "#F08A5D"],
};
const SPINE_INK = "#1E1E1E"; // 책등 글자
const SPINE_BORDER = "#D1D5DB"; // 책등·책 테두리(옅은 회색)

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

// ---------- 타입 ----------
type BoxTab = "디자인" | "통계";
type Granularity = "연간" | "월간";
type ViewMode = "가로" | "세로" | "펼치기";

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

// ---------- 세워둔 책등 (색상 테마 + 세로 제목 + 출판사) ----------
function BookSpine({ book, color, tilt }: { book: ShelfEntry; color: string; tilt: boolean }) {
  // 제목을 10~15자까지 보여줄 수 있도록 책등을 더 높게. (어린이책 등 긴 제목 대응)
  const height = 220 + (hashSeed(book.title) % 4) * 16; // 220~268
  const tiltDeg = -7; // 기울임 방향(윗부분이 왼쪽으로)
  // 기운 책의 윗부분이 옆 책을 침범하지 않도록, 기운 쪽(왼쪽)에만 여백을 준다.
  const leanPx = tilt ? Math.ceil(height * Math.abs(Math.sin((tiltDeg * Math.PI) / 180))) : 0;
  // 상/하 여백 + 가로 출판사 영역을 제외한 높이로 제목 글자 수 산정. 10~15자 범위로 클램프.
  const maxChars = Math.min(15, Math.max(10, Math.floor((height - 88) / 12)));
  const shortTitle =
    book.title.length > maxChars ? `${book.title.slice(0, maxChars - 1)}…` : book.title;

  return (
    <div
      title={book.title}
      className="flex w-[38px] shrink-0 origin-bottom flex-col items-center justify-between overflow-hidden rounded-md border py-3"
      style={{
        height,
        backgroundColor: color,
        borderColor: SPINE_BORDER,
        color: SPINE_INK,
        transform: tilt ? `rotate(${tiltDeg}deg)` : undefined,
        marginLeft: leanPx || undefined,
      }}
    >
      {/* 제목: 세로(글자 쌓기) */}
      <span className="flex flex-col items-center leading-[1.05]">
        {Array.from(shortTitle).map((char, i) => (
          <span key={i} className="text-[11px] font-bold">
            {char}
          </span>
        ))}
      </span>
      {/* 출판사: 가로 글자를 책등 길이에 맞춰 90° 회전해 7~8자 보이게 */}
      {book.publisher && (
        <span className="flex h-[64px] items-center justify-center">
          <span
            className="whitespace-nowrap text-[8px] font-bold opacity-80"
            style={{ transform: "rotate(-90deg)" }}
          >
            {book.publisher.slice(0, 8)}
          </span>
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
function ShelfView({ books, palette }: { books: ShelfEntry[]; palette: string[] }) {
  return (
    <div className="relative">
      <div className="flex items-end justify-center gap-1.5 overflow-x-auto px-2">
        <Bookend />
        {books.map((book, i) => (
          <BookSpine
            key={book.key}
            book={book}
            color={palette[i % palette.length]}
            tilt={books.length > 1 && i === Math.floor(books.length / 2)}
          />
        ))}
        <Bookend />
      </div>
      {/* 선반 */}
      <div className="relative z-10 -mt-0.5 h-3 w-full rounded-sm bg-[#C9C7C1]" />
    </div>
  );
}

// 세로쌓기 좌우 어긋남 후보(대부분 가지런히, 일부만 살짝 어긋나게) — 책별 고정 시드로 선택
const STACK_OFFSETS = [0, 0, 0, -8, 8, -5, 5, 0, 10, -10, 0];

// ---------- 눕힌 책 한 권(세로쌓기용) ----------
function FlatBook({ book, color }: { book: ShelfEntry; color: string }) {
  const width = 190 + (hashSeed(book.title) % 5) * 16; // 190~254, 책마다 폭이 조금씩 다름
  const offset = STACK_OFFSETS[hashSeed(`${book.key}-off`) % STACK_OFFSETS.length];

  return (
    <div
      title={book.title}
      className="flex h-9 items-center rounded-md border px-3"
      style={{
        width,
        backgroundColor: color,
        borderColor: SPINE_BORDER,
        color: SPINE_INK,
        transform: offset ? `translateX(${offset}px)` : undefined,
      }}
    >
      <span className="truncate text-[12px] font-bold">{book.title}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {book.author && <span className="text-[9px] opacity-60">{book.author}</span>}
        {book.publisher && <span className="text-[9px] font-bold opacity-80">{book.publisher}</span>}
      </span>
    </div>
  );
}

// ---------- 세로쌓기 뷰 (책을 눕혀 위로 쌓기) ----------
function StackView({ books, palette }: { books: ShelfEntry[]; palette: string[] }) {
  return (
    <div>
      <div className="flex flex-col items-center gap-1.5 px-2">
        {books.map((book, i) => (
          <FlatBook key={book.key} book={book} color={palette[i % palette.length]} />
        ))}
      </div>
      {/* 바닥 */}
      <div className="relative z-10 mt-0.5 h-3 w-full rounded-sm bg-[#C9C7C1]" />
    </div>
  );
}

// 펼치기(표지) — 삐뚤빼뚤한 느낌을 주는 회전값
const GRID_TILTS = [-4, 3, -2, 5, -3, 2, 4, -5, 1, -1];

// ---------- 표지 그리드(펼치기) 뷰 ----------
function GridView({ books, palette }: { books: ShelfEntry[]; palette: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-y-5 gap-x-3 py-2">
      {books.map((book, i) => {
        const image = book.coverImageUrl;
        const tilt = GRID_TILTS[i % GRID_TILTS.length];
        return (
          <div key={book.key} style={{ transform: `rotate(${tilt}deg)` }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={book.title}
                title={book.title}
                className="aspect-[3/4] w-full rounded-md border border-gray-200 object-cover shadow-sm"
              />
            ) : (
              <div
                title={book.title}
                className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-md border p-2 text-center shadow-sm"
                style={{
                  backgroundColor: palette[i % palette.length],
                  borderColor: SPINE_BORDER,
                  color: SPINE_INK,
                }}
              >
                <span className="line-clamp-4 text-[11px] font-bold leading-tight">{book.title}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- 세그먼트 토글 ----------
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-fill p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              active ? "bg-paper-pure text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 헤더 우상단 아이콘 버튼 ----------
function HeaderAction({
  label,
  href,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const inner = (
    <>
      {children}
      <span className="text-[10px] font-bold leading-none">{label}</span>
    </>
  );
  const cls = "flex flex-col items-center gap-1 text-ink";
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={!onClick} className={`${cls} ${onClick ? "" : "opacity-40"}`}>
      {inner}
    </button>
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
  const [tab, setTab] = useState<BoxTab>("디자인");
  const [granularity, setGranularity] = useState<Granularity>("연간");
  const [viewMode, setViewMode] = useState<ViewMode>("가로");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("파스텔");
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

  // 완독일(endDate) 기준으로 기간(연/월)에 해당하는 책만 추리고, 과거→최근 순으로 정렬한다.
  const books = useMemo(() => {
    const inPeriod =
      granularity === "연간"
        ? completed.filter((b) => b.endDate?.slice(0, 4) === String(year))
        : completed.filter((b) =>
            b.endDate?.startsWith(`${year}-${String(month).padStart(2, "0")}`),
          );
    return [...inPeriod].sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""));
  }, [completed, granularity, year, month]);

  if (!ready) return null;

  const palette = PALETTES[colorTheme];
  const stats = {
    books: books.length,
    words: books.reduce((sum, b) => sum + b.myWords.length, 0),
    reviews: books.filter((b) => b.oneLineNote && b.oneLineNote.trim()).length,
  };

  const periodLabel = granularity === "연간" ? `${year}년` : `${year}년 ${month}월`;

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

  // 책 시각화(최대 10권) — 뷰 모드별
  function renderShelf() {
    if (loading) return <p className="py-16 text-center text-sm text-muted-light">불러오는 중...</p>;
    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-3 py-14">
          <p className="text-sm text-muted">{loadError}</p>
          <button
            onClick={() => location.reload()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper-pure"
          >
            다시 시도
          </button>
        </div>
      );
    }
    if (books.length === 0) {
      return (
        <p className="py-16 text-center text-sm text-muted">
          이 {granularity === "연간" ? "해" : "달"}에 완독한 책이 없어요.
        </p>
      );
    }
    const shown = books.slice(0, 10);
    return (
      <>
        {viewMode === "가로" ? (
          <ShelfView books={shown} palette={palette} />
        ) : viewMode === "세로" ? (
          <StackView books={shown} palette={palette} />
        ) : (
          <GridView books={shown} palette={palette} />
        )}
        {books.length > 10 && (
          <p className="mt-4 text-center text-xs text-muted">책장에는 최근에 읽은 책 10권이 보여져요</p>
        )}
      </>
    );
  }

  return (
    <div className="app-shell px-5 pb-24 pt-8">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-ink">북박스</h1>
        <div className="flex items-center gap-4">
          {/* 알림 화면은 준비 중 — 디자인상 자리만 둔다 */}
          <HeaderAction label="알림">
            <BellIcon size={24} />
          </HeaderAction>
          <HeaderAction label="책등록" href="/books">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/book-add.png" alt="" className="h-8 w-auto" />
          </HeaderAction>
        </div>
      </header>

      {/* 소개 문구 */}
      <p className="mt-2 text-sm font-medium text-muted">
        나만의 책장을 디자인하고, 친구들과 공유해 보세요.
      </p>

      {/* 탭 */}
      <div className="mt-5 flex gap-6 border-b border-fill-strong">
        {(["디자인", "통계"] as BoxTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-lg font-bold transition-colors ${
              tab === t ? "border-b-2 border-ink text-ink" : "text-muted"
            }`}
          >
            {t === "디자인" ? "내 책장 꾸미기" : "리딩 데이터"}
          </button>
        ))}
      </div>

      {/* 기간 이동 + 연간/월간 토글 (양쪽 탭 공통) */}
      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => shiftPeriod(-1)} aria-label="이전" className="text-ink">
          <ChevronRightIcon size={22} className="rotate-180" />
        </button>
        <span className="text-xl font-bold text-ink">{periodLabel}</span>
        <button onClick={() => shiftPeriod(1)} aria-label="다음" className="text-ink">
          <ChevronRightIcon size={22} />
        </button>
        <div className="ml-auto">
          <Segmented
            value={granularity}
            options={[
              { value: "연간", label: "연간" },
              { value: "월간", label: "월간" },
            ]}
            onChange={setGranularity}
          />
        </div>
      </div>

      {tab === "디자인" ? (
        <>
          {/* 보기/색감 토글 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Segmented
              value={viewMode}
              options={[
                { value: "가로", label: "가로쌓기" },
                { value: "세로", label: "세로쌓기" },
                { value: "펼치기", label: "펼치기" },
              ]}
              onChange={setViewMode}
            />
            <Segmented
              value={colorTheme}
              options={[
                { value: "모노톤", label: "모노톤" },
                { value: "파스텔", label: "파스텔" },
                { value: "컬러", label: "컬러" },
              ]}
              onChange={setColorTheme}
            />
          </div>

          {/* 책장 카드 */}
          <div className="mt-6 flex min-h-[320px] flex-col justify-end rounded-card bg-[#FBF9ED] p-5">
            {renderShelf()}
          </div>

          {shareMsg && <p className="mt-2 text-center text-xs font-medium text-emerald-600">{shareMsg}</p>}

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#FCEF9C] py-4 text-base font-bold text-ink"
          >
            <ShareIcon size={20} />이 책장 공유하기
          </button>
        </>
      ) : (
        /* 리딩 데이터(통계) 탭 */
        <div className="mt-6">
          <div className="grid grid-cols-3 rounded-card border-bold border-fill-strong py-6">
            {(
              [
                [stats.books, "Books"],
                [stats.words, "Words"],
                [stats.reviews, "Reviews"],
              ] as [number, string][]
            ).map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-ink">{value}</span>
                <span className="text-sm text-muted">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-medium text-muted">
            {periodLabel}에 완독한 책 {stats.books}권, 담은 단어 {stats.words}개예요.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
