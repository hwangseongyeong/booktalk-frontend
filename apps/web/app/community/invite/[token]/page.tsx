"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type MeetingDetail } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { formatDday, MEETING_STATUS_LABEL } from "../../../../lib/meetings";
import { ReadingModeBadge, MeetingCover } from "../../../../components/community";

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

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f6f8fb] px-6 pb-28 pt-8">
      <header className="flex items-center">
        <button
          onClick={() => router.push("/community")}
          className="flex items-center gap-2 text-2xl font-bold text-gray-900"
          aria-label="소통으로"
        >
          <span aria-hidden>‹</span>
          초대
        </button>
      </header>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">{error}</p>
      ) : meeting ? (
        <>
          <p className="mt-8 text-center text-base font-medium text-gray-500">
            📚 독서 모임에 초대받았어요
          </p>
          <p className="mt-1 text-center text-sm text-gray-400">
            <span className="font-bold text-gray-700">{meeting.hostNickname}</span>님의 모임이에요
          </p>

          <section className="mt-5 flex flex-col items-center rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <MeetingCover
              title={meeting.book.title}
              coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
              primaryColor={meeting.book.primaryColor}
              className="h-32 w-[5.5rem]"
            />
            <div className="mt-4 flex items-center gap-2">
              <ReadingModeBadge mode={meeting.readingMode} />
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {MEETING_STATUS_LABEL[meeting.status]}
              </span>
            </div>
            <h1 className="mt-3 text-center text-xl font-bold text-gray-900">{meeting.name}</h1>
            <p className="mt-1 text-center text-sm text-gray-400">
              {meeting.book.title}
              {meeting.book.author ? ` • ${meeting.book.author}` : ""}
            </p>
            <p className="mt-3 text-xs text-gray-400">
              {meeting.currentMemberCount}/{meeting.capacity}명 참여 중
              {meeting.dday != null && meeting.status === "RECRUITING"
                ? ` · 모집 ${formatDday(meeting.dday)}`
                : ""}
            </p>
          </section>

          {/* 하단 고정 액션 */}
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-6 pb-6 pt-3">
            {joinError && <p className="mb-2 text-center text-sm text-red-600">{joinError}</p>}

            {meeting.joined ? (
              <button
                onClick={() => router.replace(`/community/${meeting.id}`)}
                className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black"
              >
                이미 참여 중 · 모임으로 이동
              </button>
            ) : meeting.status === "CLOSED" ? (
              <p className="py-2 text-center text-sm text-gray-400">이미 종료된 모임이에요.</p>
            ) : full ? (
              <p className="py-2 text-center text-sm text-gray-400">정원이 가득 찼어요.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
                >
                  {joining ? "참여하는 중..." : "참여하기"}
                </button>
                <button
                  onClick={() => router.push("/")}
                  disabled={joining}
                  className="w-full rounded-full py-3 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
                >
                  다음에 할게요
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
