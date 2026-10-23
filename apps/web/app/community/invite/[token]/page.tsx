"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type MeetingDetail } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { MeetingCover } from "../../../../components/community";

export default function MeetingInvitePage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      setError("유효하지 않은 초대 링크예요.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .getMeetingByInvite(token)
      .then((m) => { if (!cancelled) setMeeting(m); })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "초대 링크를 확인하지 못했어요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ready, token]);

  if (!ready) return null;

  async function handleJoin() {
    if (!meeting || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      await apiClient.joinByInvite(token);
      router.replace(`/community/${meeting.id}`);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "참여에 실패했어요.");
      setJoining(false);
    }
  }

  const full = meeting ? meeting.currentMemberCount >= meeting.capacity : false;
  const canJoin = meeting && !meeting.joined && meeting.status !== "CLOSED" && !full;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-6 pb-8 pt-8">
      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">{error}</p>
      ) : meeting ? (
        <>
          {/* 상단: 말풍선+얼굴 일러스트 + 초대 문구 */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/bookmate-invite-face.png" alt="" className="h-32 w-auto" />

            <p className="mt-5 text-lg font-bold text-gray-900">
              {meeting.hostNickname ?? "친구"}님이
            </p>
            <p className="mt-0.5 text-sm text-gray-400">책모임에 초대했어요</p>

            <h1 className="mt-5 text-xl font-bold text-gray-900">{meeting.name}</h1>

            <div className="mt-6">
              <MeetingCover
                title={meeting.book.title}
                coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
                primaryColor={meeting.book.primaryColor}
                className="h-40 w-28"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              {meeting.book.author ?? "저자 미상"}
              {meeting.book.publisher ? ` · ${meeting.book.publisher}` : ""} · 읽고 있는 책
            </p>
          </div>

          {/* 하단 액션 */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {joinError && <p className="text-center text-sm text-red-600">{joinError}</p>}

            {meeting.joined ? (
              <button
                onClick={() => router.replace(`/community/${meeting.id}`)}
                className="w-full rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-[filter] hover:brightness-95"
              >
                이미 참여 중 · 모임으로 이동
              </button>
            ) : meeting.status === "CLOSED" ? (
              <p className="py-2 text-center text-sm text-gray-400">이미 종료된 모임이에요.</p>
            ) : full ? (
              <p className="py-2 text-center text-sm text-gray-400">정원이 가득 찼어요.</p>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining || !canJoin}
                className="w-full rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-[filter] hover:brightness-95 disabled:opacity-40"
              >
                {joining ? "참여하는 중..." : "참여하기"}
              </button>
            )}

            <button
              onClick={() => router.push("/community")}
              disabled={joining}
              className="text-sm font-bold text-gray-900 transition-colors hover:text-gray-600 disabled:opacity-40"
            >
              다음에 할게요
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
