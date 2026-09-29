"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookShelf } from "@booktalk/ui";
import { apiClient, type AuthUser, type MonthlyShelf } from "@booktalk/api-client";
import { useRequireAuth } from "../lib/useRequireAuth";
import { BottomNav } from "../components/bottom-nav";
import { Avatar } from "../components/ui";

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

export default function HomePage() {
  const ready = useRequireAuth();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [shelf, setShelf] = useState<MonthlyShelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // 프로필은 헤더 아바타 용도라 실패해도 화면 진행에 영향 없다.
    apiClient.getMyProfile().then(
      (me) => { if (!cancelled) setProfile(me); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [ready]);

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
    <main className="mx-auto max-w-md p-6 pb-24">
      {/* 상단: 인사 + 프로필 아바타 */}
      <header className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {profile ? (
            <>
              <span className="font-medium text-gray-900">{profile.nickname}</span>님의 서재
            </>
          ) : (
            "내 서재"
          )}
        </p>
        <Link href="/my" aria-label="마이 페이지">
          <Avatar
            nickname={profile?.nickname}
            src={profile?.profileImageUrl}
            color={profile?.profileColor ?? undefined}
            size={34}
          />
        </Link>
      </header>

      <div className="mt-4 flex items-center justify-between">
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

      <BottomNav />
    </main>
  );
}
