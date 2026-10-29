"use client";

import { useEffect, useState } from "react";
import { apiClient, type AdminMetrics } from "@booktalk/api-client";

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [m, setM] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    apiClient.getAdminMetrics().then(setM).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">대시보드</h1>
      {!m ? (
        <p className="mt-6 text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <section className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="전체 회원" value={m.totalUsers} sub={`오늘 +${m.newUsersToday} · 최근 7일 +${m.newUsers7d}`} />
          <Stat label="등록 도서" value={m.totalBooks} />
          <Stat
            label="모임"
            value={m.totalMeetings}
            sub={`진행 ${m.ongoingMeetings} · 모집 ${m.recruitingMeetings} · 종료 ${m.closedMeetings}`}
          />
          <Stat label="혼자 북톡" value={m.totalBookNotes} />
          <Stat label="독서중" value={m.readingRecords} />
          <Stat label="완독" value={m.completedRecords} />
          <Stat label="읽고 싶어요" value={m.wishlistRecords} />
          <Stat label="채팅 메시지" value={m.totalChatMessages} />
        </section>
      )}
    </div>
  );
}
