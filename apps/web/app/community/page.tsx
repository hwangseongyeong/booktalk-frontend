"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BottomNav } from "../../components/bottom-nav";
import { BellIcon, PlusIcon } from "../../components/icons";
import { ReadingModeBadge, MeetingCover } from "../../components/community";
import {
  MOCK_JOINED,
  MOCK_MEETINGS,
  type Meeting,
  type MeetingStatus,
} from "../../lib/meetings";

type FilterKey = "RECRUITING" | "ONGOING" | "ALL";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "RECRUITING", label: "모집 중" },
  { key: "ONGOING", label: "진행 중" },
  { key: "ALL", label: "전체" },
];

function matchesFilter(meeting: Meeting, filter: FilterKey): boolean {
  if (filter === "ALL") return true;
  return meeting.status === (filter as MeetingStatus);
}

/** 상단 '참여 중인 모임' 가로 스크롤 카드 */
function JoinedCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="w-40 shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <ReadingModeBadge mode={meeting.mode} />
      <MeetingCover
        title={meeting.bookTitle}
        coverImageUrl={meeting.coverImageUrl}
        primaryColor={meeting.primaryColor}
        className="mt-3 h-20 w-14"
      />
      <p className="mt-3 truncate text-sm font-bold text-gray-900">{meeting.title}</p>
    </div>
  );
}

/** 목록 카드 */
function MeetingListCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <MeetingCover
        title={meeting.bookTitle}
        coverImageUrl={meeting.coverImageUrl}
        primaryColor={meeting.primaryColor}
        className="h-20 w-14"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <ReadingModeBadge mode={meeting.mode} />
          <span className="shrink-0 text-sm font-bold text-gray-900">
            {meeting.dday > 0 ? `D-${meeting.dday}` : "D-DAY"}
          </span>
        </div>
        <p className="mt-1.5 truncate text-base font-bold text-gray-900">{meeting.title}</p>
        <p className="mt-0.5 truncate text-sm text-gray-400">
          {meeting.bookTitle}
          {meeting.bookAuthor ? ` • ${meeting.bookAuthor}` : ""}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {meeting.current}/{meeting.capacity}명 참여 중
        </p>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("RECRUITING");

  const meetings = useMemo(
    () => MOCK_MEETINGS.filter((m) => matchesFilter(m, filter)),
    [filter],
  );

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
        {MOCK_JOINED.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">아직 참여 중인 모임이 없어요.</p>
        ) : (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {MOCK_JOINED.map((m) => (
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
        {meetings.length === 0 ? (
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
