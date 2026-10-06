"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Meeting, type MeetingStatus } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { formatDday } from "../../lib/meetings";
import { BottomNav } from "../../components/bottom-nav";
import { BellIcon, PlusIcon } from "../../components/icons";
import { ReadingModeBadge, MeetingCover } from "../../components/community";

type FilterKey = "RECRUITING" | "ONGOING" | "ALL";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "RECRUITING", label: "모집 중" },
  { key: "ONGOING", label: "진행 중" },
  { key: "ALL", label: "전체" },
];

/** 상단 '참여 중인 모임' 가로 스크롤 카드 */
function JoinedCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link
      href={`/community/${meeting.id}`}
      className="block w-40 shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <ReadingModeBadge mode={meeting.readingMode} />
      <MeetingCover
        title={meeting.book.title}
        coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
        primaryColor={meeting.book.primaryColor}
        className="mt-3 h-20 w-14"
      />
      <p className="mt-3 truncate text-sm font-bold text-gray-900">{meeting.name}</p>
    </Link>
  );
}

/** 목록 카드 */
function MeetingListCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link
      href={`/community/${meeting.id}`}
      className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <MeetingCover
        title={meeting.book.title}
        coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
        primaryColor={meeting.book.primaryColor}
        className="h-20 w-14"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <ReadingModeBadge mode={meeting.readingMode} />
          <span className="shrink-0 text-sm font-bold text-gray-900">{formatDday(meeting.dday)}</span>
        </div>
        <p className="mt-1.5 truncate text-base font-bold text-gray-900">{meeting.name}</p>
        <p className="mt-0.5 truncate text-sm text-gray-400">
          {meeting.book.title}
          {meeting.book.author ? ` • ${meeting.book.author}` : ""}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {meeting.currentMemberCount}/{meeting.capacity}명 참여 중
        </p>
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("RECRUITING");
  const [joined, setJoined] = useState<Meeting[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 참여 중인 모임은 필터와 무관하므로 최초 1회만 불러온다.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    apiClient.getJoinedMeetings().then(
      (list) => { if (!cancelled) setJoined(list); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [ready]);

  // 목록은 필터가 바뀔 때마다 다시 불러온다.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const status: MeetingStatus | undefined = filter === "ALL" ? undefined : filter;
    apiClient
      .getMeetings(status)
      .then((list) => { if (!cancelled) setMeetings(list); })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "모임을 불러오지 못했어요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ready, filter]);

  if (!ready) return null;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f6f8fb] px-6 pb-24 pt-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-2xl font-bold text-gray-900"
          aria-label="뒤로"
        >
          <span aria-hidden>‹</span>
          소통
        </button>
        <button aria-label="알림" className="text-gray-800">
          <BellIcon />
        </button>
      </header>

      {/* 참여 중인 모임 */}
      <section className="mt-7">
        <h2 className="text-lg font-bold text-gray-900">참여 중인 모임</h2>
        {joined.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">아직 참여 중인 모임이 없어요.</p>
        ) : (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {joined.map((m) => (
              <JoinedCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </section>

      {/* 필터 탭 */}
      <div className="mt-7 flex gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 모임 목록 */}
      <section className="mt-5 flex flex-col gap-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : meetings.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">해당하는 모임이 없어요.</p>
        ) : (
          meetings.map((m) => <MeetingListCard key={m.id} meeting={m} />)
        )}
      </section>

      {/* 모임 만들기 FAB */}
      <Link
        href="/community/new"
        aria-label="모임 만들기"
        style={{ transform: "translateX(calc(min(50vw, 13rem) - 1.5rem - 3.5rem))" }}
        className="fixed bottom-24 left-1/2 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-colors hover:bg-black"
      >
        <PlusIcon size={26} />
      </Link>

      <BottomNav />
    </main>
  );
}
