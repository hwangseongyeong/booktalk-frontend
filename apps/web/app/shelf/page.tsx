"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authStorage, resolveAssetUrl, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import {
  BellIcon,
  ClosedBookIcon,
  KebabIcon,
  OpenBookIcon,
  ShareIcon,
  StackedBooksIcon,
  TrashIcon,
} from "../../components/icons";
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

// ---------- 타입 ----------
type ShelfTab = "완독책" | "독서중" | "담아둔책";

/** 탭 키 → 화면에 보이는 라벨 */
const TAB_LABEL: Record<ShelfTab, string> = {
  "독서중": "독서중",
  "완독책": "완독",
  "담아둔책": "담아둔 책",
};

/** 북로그에 올릴 한 권. 독서 기록(ReadingRecord)에서 화면에 필요한 값만 뽑은 형태. */
type ShelfEntry = {
  key: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  spineImageUrl: string | null;
  primaryColor: string | null;
  /** 완독책 전용: 완독일/별점/한줄평/감상 태그 (리스트 뷰·정렬에 사용) */
  endDate: string | null;
  rating: number | null;
  oneLineNote: string | null;
  myWords: string[];
};

function toShelfEntry(record: ReadingRecord): ShelfEntry {
  return {
    key: String(record.id),
    title: record.book.title,
    author: record.book.author,
    coverImageUrl: record.book.coverImageUrl,
    spineImageUrl: resolveAssetUrl(record.book.spineImageUrl),
    primaryColor: record.book.primaryColor,
    endDate: record.endDate,
    rating: record.rating,
    oneLineNote: record.oneLineNote,
    myWords: record.myWords,
  };
}

// 완독 기록의 한줄평에는 완독 시 선택한 #태그 줄이 함께 저장된다. 실제 한줄평만 남긴다.
function reviewText(note: string | null): string {
  if (!note) return "";
  return note
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join(" ")
    .trim();
}

// 완독일(endDate) 최신순 정렬. 날짜 없으면 뒤로.
function byRecentlyCompleted(a: ShelfEntry, b: ShelfEntry) {
  return (b.endDate ?? "").localeCompare(a.endDate ?? "");
}

/** 별점을 항상 5개로 보여주고, 점수만큼 진하게 칠한다. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="ml-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? "text-yellow-400" : "text-fill-strong"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** 표지 썸네일 (이미지 없으면 색상 폴백). */
function Cover({ book }: { book: ShelfEntry }) {
  const image = book.coverImageUrl ?? book.spineImageUrl;
  return (
    <div
      title={book.title}
      className="flex aspect-[3/4] flex-col overflow-hidden rounded-card bg-fill"
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

/** 리스트 뷰: 홈 '나의 리뷰'과 동일한 카드 형태. */
function ReviewList({ books }: { books: ShelfEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {books.map((book) => {
        const review = reviewText(book.oneLineNote);
        return (
          <div key={book.key} className="rounded-card bg-fill p-5">
            <p className="text-base font-bold text-ink">{book.title}</p>
            <p className="mt-1 text-sm text-muted">
              완독일 {book.endDate ?? "-"}
              {book.rating != null && <Stars rating={book.rating} />}
            </p>
            {review && <p className="mt-3 text-sm text-ink-soft">&quot;{review}&quot;</p>}
            {book.myWords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {book.myWords.map((word) => (
                  <span key={word} className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft">
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- 탭별 빈 상태 ----------
const EMPTY_CONFIG: Record<
  ShelfTab,
  { icon: ReactNode; title: string; subtitle: [string, string] }
> = {
  "독서중": {
    icon: <OpenBookIcon size={56} className="text-ink" />,
    title: "아직 독서중인 책이 없어요",
    subtitle: ["요즘 펼친 책을 등록하고", "오늘의 독서를 기록해보세요"],
  },
  "완독책": {
    icon: <ClosedBookIcon size={56} className="text-ink" />,
    title: "아직 완독한 책이 없어요",
    subtitle: ["요즘 펼친 책을 등록하고", "오늘의 독서를 기록해보세요"],
  },
  "담아둔책": {
    icon: <StackedBooksIcon size={56} className="text-ink" />,
    title: "아직 담아둔 책이 없어요",
    subtitle: ["요즘 펼친 책을 등록하고", "오늘의 독서를 기록해보세요"],
  },
};

function ShelfEmptyState({ tab }: { tab: ShelfTab }) {
  const { icon, title, subtitle } = EMPTY_CONFIG[tab];
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      {icon}
      <p className="text-xl font-bold text-ink">{title}</p>
      <p className="text-sm font-medium leading-relaxed text-muted">
        {subtitle[0]}
        <br />
        {subtitle[1]}
      </p>
    </div>
  );
}

/** 독서중 카드: 표지 + 더보기(삭제) 메뉴 + 제목/저자 + '다 읽었어요'. */
function ReadingBookCard({
  book,
  menuOpen,
  onToggleMenu,
  onDelete,
  deleting,
}: {
  book: ShelfEntry;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const completeHref = `/records/${book.key}/complete`;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Link href={completeHref} aria-label={book.title}>
          <Cover book={book} />
        </Link>
        {/* 더보기(삭제) */}
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="더보기"
          aria-expanded={menuOpen}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-paper-pure text-ink shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
        >
          <KebabIcon size={18} />
        </button>
        {menuOpen && (
          <div className="absolute right-2 top-11 z-20 overflow-hidden rounded-xl border-bold border-line bg-paper-pure shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-50"
            >
              <TrashIcon size={16} />
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">{book.title}</p>
        {book.author && <p className="mt-0.5 truncate text-xs text-muted">{book.author}</p>}
      </div>
      <Link
        href={completeHref}
        className="rounded-full bg-fill px-3 py-2 text-center text-xs font-bold text-ink transition-colors hover:bg-fill-strong"
      >
        다 읽었어요
      </Link>
    </div>
  );
}

/** 완독책 표지 그리드 — 표지만 보여주고 클릭하면 상세(리뷰). */
function CoverGrid({ books, buildHref }: { books: ShelfEntry[]; buildHref?: (key: string) => string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {books.map((book) => {
        const href = buildHref?.(book.key);
        const cover = <Cover book={book} />;
        return (
          <div key={book.key}>
            {href ? <Link href={href}>{cover}</Link> : cover}
          </div>
        );
      })}
    </div>
  );
}

/** 담아둔 책 카드 — 표지 + '읽기 시작' / 삭제. */
function WishlistCard({
  book,
  onStart,
  starting,
  onCancel,
  canceling,
}: {
  book: ShelfEntry;
  onStart: () => void;
  starting: boolean;
  onCancel: () => void;
  canceling: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Cover book={book} />
      <div className="flex gap-1">
        <button
          onClick={onStart}
          disabled={starting}
          className="flex flex-[7] justify-center rounded-full bg-ink px-2 py-1.5 text-[11px] font-bold text-paper-pure disabled:opacity-50"
        >
          {starting ? "시작 중..." : "읽기 시작"}
        </button>
        <button
          onClick={onCancel}
          disabled={canceling}
          aria-label="삭제"
          title="삭제"
          className="flex flex-[3] items-center justify-center rounded-full border-bold border-line bg-paper px-2 py-1.5 text-[11px] font-bold text-ink disabled:opacity-50"
        >
          {canceling ? "…" : "✕"}
        </button>
      </div>
    </div>
  );
}

/** 헤더 우상단 아이콘 버튼 (아이콘 + 작은 라벨). href/onClick 없으면 준비 중. */
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
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={!onClick}
      className={`${cls} ${onClick ? "" : "opacity-40"}`}
    >
      {inner}
    </button>
  );
}

// ---------- 메인 페이지 ----------
export default function ShelfPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [completed, setCompleted] = useState<ShelfEntry[]>([]);
  const [reading, setReading] = useState<ShelfEntry[]>([]);
  const [wishlist, setWishlist] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [cancelingKey, setCancelingKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [tab, setTab] = useState<ShelfTab>("독서중");
  // 완독책 보기 모드: 표지(그리드) / 리스트(나의 리뷰)
  const [completedView, setCompletedView] = useState<"표지" | "리스트">("표지");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoadError(null);
      try {
        const [completedRecords, readingRecords, wishlistRecords] = await Promise.all([
          apiClient.getMyReadingRecords("COMPLETED"),
          apiClient.getMyReadingRecords("READING"),
          apiClient.getMyReadingRecords("WISHLIST"),
        ]);
        if (!cancelled) {
          // 완독책은 완독일 최신순으로 정렬해서 보여준다.
          setCompleted(completedRecords.map(toShelfEntry).sort(byRecentlyCompleted));
          setReading(readingRecords.map(toShelfEntry));
          setWishlist(wishlistRecords.map(toShelfEntry));
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
        setLoadError("북로그를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ready, router]);

  // 읽고 싶은 책 → 읽기 시작. 성공하면 위시리스트에서 '독서중'으로 옮기고 해당 탭으로 전환한다.
  async function handleStartReading(key: string) {
    setStartingKey(key);
    setActionError(null);
    try {
      await apiClient.startReadingFromWishlist(Number(key));
      const moved = wishlist.find((b) => b.key === key);
      setWishlist((prev) => prev.filter((b) => b.key !== key));
      if (moved) setReading((prev) => [moved, ...prev]);
      setTab("독서중");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "읽기 시작 처리에 실패했어요.");
    } finally {
      setStartingKey(null);
    }
  }

  // 독서중 삭제 → 기록 삭제. 더보기 메뉴에서 실행하므로 별도 확인창 없이 바로 처리한다.
  async function handleDeleteReading(key: string) {
    setCancelingKey(key);
    setActionError(null);
    try {
      await apiClient.cancelReadingRecord(Number(key));
      setReading((prev) => prev.filter((b) => b.key !== key));
      setMenuKey(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setCancelingKey(null);
    }
  }

  // 담아둔책 삭제 → 위시리스트 기록 삭제. 성공하면 담아둔책 목록에서 제거한다.
  async function handleCancelWishlist(key: string) {
    if (!window.confirm("이 책을 삭제할까요?")) return;
    setCancelingKey(key);
    setActionError(null);
    try {
      await apiClient.cancelReadingRecord(Number(key));
      setWishlist((prev) => prev.filter((b) => b.key !== key));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setCancelingKey(null);
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "text42 북로그", url });
      } else {
        await navigator.clipboard.writeText(url);
        setActionError("링크를 복사했어요");
      }
    } catch {
      /* 사용자가 공유를 취소한 경우 — 무시 */
    }
  }

  if (!ready) return null;

  const activeBooks =
    tab === "완독책" ? completed : tab === "독서중" ? reading : wishlist;
  const hasBooks = activeBooks.length > 0;
  // 통계는 책이 있을 때만 노출한다(빈 상태 시안 기준).
  const showStats = !loading && !loadError && tab === "완독책" && hasBooks;

  return (
    <div className="app-shell pb-24">
      {/* 헤더 */}
      <header className="flex items-start justify-between px-5 pt-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink">북로그</h1>
        <div className="flex items-center gap-4">
          <HeaderAction label="공유하기" onClick={handleShare}>
            <ShareIcon size={24} />
          </HeaderAction>
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
      <p className="mt-2 px-5 text-sm font-medium text-muted">
        읽은 책을 기록하고, 나만의 독서 로그를 쌓아보세요
      </p>

      {/* 탭 */}
      <div className="mt-5 flex gap-6 border-b border-fill-strong px-5">
        {(["독서중", "완독책", "담아둔책"] as ShelfTab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setMenuKey(null);
            }}
            className={`pb-2.5 text-lg font-bold transition-colors ${
              tab === t ? "border-b-2 border-ink text-ink" : "text-muted"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 통계 (완독책, 책이 있을 때만) */}
      {showStats && (
        <div className="mt-6 px-5">
          <p className="text-center text-base font-semibold text-ink-soft">
            총 <span className="text-2xl font-bold text-ink">{completed.length}</span>권의 책을 읽었어요
          </p>
        </div>
      )}

      {/* 북로그 */}
      <div className="mt-5 px-5">
        {loading ? (
          <p className="text-center text-sm text-muted-light">불러오는 중...</p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 rounded-card border-bold border-dashed border-muted-light py-14">
            <p className="text-sm text-muted">{loadError}</p>
            <button
              onClick={() => location.reload()}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper-pure"
            >
              다시 시도
            </button>
          </div>
        ) : !hasBooks ? (
          <ShelfEmptyState tab={tab} />
        ) : (
          <>
            {actionError && (
              <p className="mb-3 text-center text-sm text-red-600">{actionError}</p>
            )}

            {tab === "독서중" && (
              <div className="grid grid-cols-2 gap-4">
                {reading.map((book) => (
                  <ReadingBookCard
                    key={book.key}
                    book={book}
                    menuOpen={menuKey === book.key}
                    onToggleMenu={() => setMenuKey((k) => (k === book.key ? null : book.key))}
                    onDelete={() => handleDeleteReading(book.key)}
                    deleting={cancelingKey === book.key}
                  />
                ))}
              </div>
            )}

            {tab === "완독책" && (
              <>
                <div className="mb-4 flex justify-end gap-1">
                  {(["표지", "리스트"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCompletedView(v)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        completedView === v ? "bg-ink text-paper-pure" : "border border-muted-light text-muted"
                      }`}
                    >
                      {v}로 보기
                    </button>
                  ))}
                </div>
                {completedView === "리스트" ? (
                  <ReviewList books={completed} />
                ) : (
                  <CoverGrid books={completed} buildHref={(key) => `/records/${key}/review`} />
                )}
              </>
            )}

            {tab === "담아둔책" && (
              <div className="grid grid-cols-3 gap-3">
                {wishlist.map((book) => (
                  <WishlistCard
                    key={book.key}
                    book={book}
                    onStart={() => handleStartReading(book.key)}
                    starting={startingKey === book.key}
                    onCancel={() => handleCancelWishlist(book.key)}
                    canceling={cancelingKey === book.key}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 더보기 메뉴 바깥 클릭 시 닫기 */}
      {menuKey && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setMenuKey(null)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}

      <BottomNav />
    </div>
  );
}
