"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type MeetingDetail, type MeetingMember } from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { formatDday, MEETING_STATUS_LABEL } from "../../../lib/meetings";
import { ReadingModeBadge, MeetingCover } from "../../../components/community";

/** 참여자 한 명 (프로필 이미지 또는 색상 + 닉네임 이니셜 폴백) */
function MemberRow({ member }: { member: MeetingMember }) {
  const initial = member.nickname.trim().charAt(0) || "?";
  return (
    <li className="flex items-center gap-3 py-2">
      {member.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.profileImageUrl}
          alt={member.nickname}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: member.profileColor ?? "#8B5E3C" }}
        >
          {initial}
        </div>
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
        {member.nickname}
      </span>
    </li>
  );
}

export default function MeetingDetailPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const meetingId = Number(params.id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!Number.isFinite(meetingId)) {
      setError("잘못된 모임이에요.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .getMeeting(meetingId)
      .then((m) => { if (!cancelled) setMeeting(m); })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "모임을 불러오지 못했어요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ready, meetingId]);

  if (!ready) return null;

  // 액션 실행 후 상세를 다시 불러온다. leave=true면 목록으로 돌아간다.
  async function run(
    key: string,
    fn: () => Promise<unknown>,
    { confirmMessage, backOnDone = false }: { confirmMessage?: string; backOnDone?: boolean } = {},
  ) {
    if (action) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setAction(key);
    setActionError(null);
    try {
      await fn();
      if (backOnDone) {
        router.push("/community");
        return;
      }
      const refreshed = await apiClient.getMeeting(meetingId);
      setMeeting(refreshed);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "처리에 실패했어요.");
    } finally {
      setAction(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f6f8fb] px-6 pb-28 pt-8">
      <header className="flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-2xl font-bold text-gray-900"
          aria-label="뒤로"
        >
          <span aria-hidden>‹</span>
          모임
        </button>
      </header>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">{error}</p>
      ) : meeting ? (
        <>
          {/* 모임 요약 */}
          <section className="mt-6 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <MeetingCover
              title={meeting.book.title}
              coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
              primaryColor={meeting.book.primaryColor}
              className="h-24 w-16"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ReadingModeBadge mode={meeting.readingMode} />
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                  {MEETING_STATUS_LABEL[meeting.status]}
                </span>
              </div>
              <h1 className="mt-2 text-lg font-bold text-gray-900">{meeting.name}</h1>
              <p className="mt-0.5 truncate text-sm text-gray-400">
                {meeting.book.title}
                {meeting.book.author ? ` • ${meeting.book.author}` : ""}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {meeting.currentMemberCount}/{meeting.capacity}명 참여 중
                {meeting.dday != null && meeting.status === "RECRUITING"
                  ? ` · 모집 ${formatDday(meeting.dday)}`
                  : ""}
              </p>
            </div>
          </section>

          {/* 참여자 */}
          <section className="mt-6">
            <h2 className="text-base font-bold text-gray-900">
              참여자 <span className="text-gray-400">{meeting.members.length}</span>
            </h2>
            <ul className="mt-2 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4 py-1 shadow-sm">
              {meeting.members.map((m) => (
                <MemberRow key={m.userId} member={m} />
              ))}
            </ul>
          </section>

          {/* 하단 고정 액션 */}
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-6 pb-6 pt-3">
            {actionError && (
              <p className="mb-2 text-center text-sm text-red-600">{actionError}</p>
            )}

            {meeting.status === "CLOSED" ? (
              <p className="py-2 text-center text-sm text-gray-400">종료된 모임이에요.</p>
            ) : meeting.isHost ? (
              <div className="flex flex-col gap-2">
                {meeting.status === "RECRUITING" && (
                  <button
                    onClick={() => run("start", () => apiClient.startMeeting(meeting.id))}
                    disabled={action !== null}
                    className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
                  >
                    {action === "start" ? "처리 중..." : "모임 시작하기"}
                  </button>
                )}
                <button
                  onClick={() =>
                    run("close", () => apiClient.closeMeeting(meeting.id), {
                      confirmMessage: "모임을 종료할까요? 종료하면 되돌릴 수 없어요.",
                    })
                  }
                  disabled={action !== null}
                  className="w-full rounded-full border border-red-300 bg-white py-4 text-base font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                >
                  {action === "close" ? "종료 중..." : "모임 종료"}
                </button>
              </div>
            ) : meeting.joined ? (
              <button
                onClick={() =>
                  run("leave", () => apiClient.leaveMeeting(meeting.id), {
                    confirmMessage: "모임에서 나갈까요?",
                    backOnDone: true,
                  })
                }
                disabled={action !== null}
                className="w-full rounded-full border border-gray-300 bg-white py-4 text-base font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                {action === "leave" ? "처리 중..." : "모임 나가기"}
              </button>
            ) : meeting.currentMemberCount < meeting.capacity ? (
              <button
                onClick={() => run("join", () => apiClient.joinMeeting(meeting.id))}
                disabled={action !== null}
                className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
              >
                {action === "join" ? "참여 중..." : "모임 참여하기"}
              </button>
            ) : (
              <p className="py-2 text-center text-sm text-gray-400">정원이 가득 찼어요.</p>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
