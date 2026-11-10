"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { apiClient, resolveAssetUrl, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";
import { BottomNav } from "../components/bottom-nav";
import {
  ArticleIcon,
  BellIcon,
  ChevronRightIcon,
  LibraryIcon,
  MegaphoneIcon,
  PencilIcon,
  ReaderIllustration,
} from "../components/icons";

// 완독 기록의 한줄평에는 완독 처리 시 선택한 키워드가 #태그 줄로 함께 저장된다.
// '나의 리뷰' 섹션에서는 태그 줄을 걸러 실제 한줄평만 보여준다.
function reviewText(note: string | null): string {
  if (!note) return "";
  return note
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join(" ")
    .trim();
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

/** 진행 중 카드의 도서 표지(표지 없으면 책등 → 색상 폴백). */
function BookCover({ book }: { book: ReadingRecord["book"] }) {
  const image = book.coverImageUrl ?? resolveAssetUrl(book.spineImageUrl);
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

/** 헤더 우상단 아이콘 버튼 (아이콘 + 작은 라벨). href 없으면 준비 중 처리. */
function HeaderAction({
  label,
  href,
  children,
}: {
  label: string;
  href?: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      {children}
      <span className="text-[10px] font-bold leading-none">{label}</span>
    </>
  );
  const cls = "flex flex-col items-center gap-1 text-ink";
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} className={`${cls} opacity-40`} disabled>
      {inner}
    </button>
  );
}

/** 둘러보기 타일. href 없으면 준비 중(흐리게, 비활성). */
function ExploreTile({
  label,
  icon,
  href,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <span className="text-ink">{icon}</span>
      <span className="whitespace-pre-line text-sm font-bold leading-tight text-ink">{label}</span>
    </>
  );
  const cls =
    "flex h-24 flex-col justify-between rounded-card bg-fill p-4 text-left transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-fill-strong`}>
      {inner}
    </Link>
  ) : (
    <div className={`${cls} opacity-60`} aria-disabled title="준비 중">
      {inner}
    </div>
  );
}

export default function HomePage() {
  const ready = useRequireAuth();
  const [reading, setReading] = useState<ReadingRecord[]>([]);
  const [completed, setCompleted] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // 나의 리뷰: 최종완독일(endDate) 최신순. 완독일이 같으면 최근 기록(id) 우선.
        setCompleted(
          [...completedRecords].sort((a, b) => {
            const byDate = (b.endDate ?? "").localeCompare(a.endDate ?? "");
            return byDate !== 0 ? byDate : b.id - a.id;
          })
        );
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
    <main className="app-shell px-6 pb-28 pt-8">
      {/* 헤더: 좌측 로고 + 우측 알림·책등록 */}
      <header className="flex items-start justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="text42" width={132} style={{ width: 132 }} className="mt-1 h-auto" />
        <div className="flex items-center gap-5">
          {/* 알림 화면은 준비 중 — 디자인상 자리만 둔다 */}
          <HeaderAction label="알림">
            <BellIcon size={24} />
          </HeaderAction>
          <HeaderAction label="책등록" href="/books">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/book-add.png" alt="" className="h-6 w-auto" />
          </HeaderAction>
        </div>
      </header>

      {/* 히어로 타이틀 */}
      <h1 className="mt-6 text-[26px] font-bold leading-snug text-ink">
        지금은 어떤 책과
        <br />
        놀고 있나요?!
      </h1>
      <p className="mt-2 text-sm font-medium text-muted">책과 나를 이어주는 텍스트사이</p>

      {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

      {/* 지금 읽고 있어요 */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">지금 읽고 있어요</h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted">불러오는 중...</p>
        ) : reading.length === 0 ? (
          <div className="mt-4 flex items-center justify-between gap-2 overflow-hidden rounded-card bg-fill p-5">
            <div>
              <p className="text-sm font-bold leading-relaxed text-ink">
                지금 읽고 있는 책이 없어요
                <br />
                첫 책을 등록하고 기록을 시작해요
              </p>
              <Link
                href="/books"
                className="mt-4 inline-block rounded-full border-bold border-line bg-paper px-5 py-2.5 text-sm font-bold text-ink"
              >
                + 책 등록하기
              </Link>
            </div>
            <ReaderIllustration size={104} className="shrink-0 text-ink [--illust-paper:#F1F0EB]" />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {reading.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 rounded-card bg-fill p-5"
              >
                <BookCover book={record.book} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-ink">{record.book.title}</p>
                  {record.book.author && (
                    <p className="mt-0.5 truncate text-sm text-muted">{record.book.author}</p>
                  )}
                  <Link
                    href={`/records/${record.id}/complete`}
                    className="mt-3 inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper-pure"
                  >
                    완독하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 혼자 북톡 유도 배너 (추후 광고 영역) */}
      <Link
        href="/community/record"
        className="mt-6 flex items-center gap-4 rounded-card bg-[#FCEF9C] p-5"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-bold border-line bg-paper text-ink">
          <PencilIcon size={24} />
        </span>
        <p className="flex-1 text-sm font-bold leading-snug text-ink">
          감동받은 문장, 혼자 북톡에
          <br />
          필사해보는 건 어때요?!
        </p>
        <ChevronRightIcon size={22} className="shrink-0 text-ink" />
      </Link>

      {/* 둘러보기 — 우선 숨김(연결할 페이지 준비 후 노출) */}
      {false && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink">둘러보기</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ExploreTile label="주변 도서관" icon={<LibraryIcon size={26} />} />
            <ExploreTile label={"?????\n?????"} icon={<span className="block h-[26px]" />} />
            <ExploreTile label="읽을거리" icon={<ArticleIcon size={26} />} />
            <ExploreTile label="공지사항" icon={<MegaphoneIcon size={26} />} />
          </div>
        </section>
      )}

      {/* 나의 리뷰 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-ink">나의 리뷰</h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted">불러오는 중...</p>
        ) : completed.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-card border-bold border-dashed border-muted-light bg-paper px-6 py-10 text-center">
            <p className="text-base font-bold text-ink">아직 남긴 리뷰가 없어요</p>
            <p className="text-sm font-medium text-muted">완독한 책의 짧은 한 줄 리뷰를 남겨보세요</p>
            <Link
              href="/shelf"
              className="mt-4 inline-block rounded-full border-bold border-line bg-paper px-5 py-2.5 text-sm font-bold text-ink"
            >
              리뷰 쓰기
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {completed.map((record) => {
              const review = reviewText(record.oneLineNote);
              return (
                <div key={record.id} className="rounded-card bg-fill p-5">
                  <p className="text-base font-bold text-ink">{record.book.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    완독일 {record.endDate}
                    {record.rating != null && <Stars rating={record.rating} />}
                  </p>
                  {review && <p className="mt-3 text-sm text-ink-soft">&quot;{review}&quot;</p>}
                  {record.myWords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.myWords.map((word) => (
                        <span
                          key={word}
                          className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-soft"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
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
