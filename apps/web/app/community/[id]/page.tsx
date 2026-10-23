"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type MeetingDetail, type MeetingMember } from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { MeetingCover } from "../../../components/community";
import { PencilIcon } from "../../../components/icons";
import { shareMeetingToKakao } from "../../../lib/kakao";

/** 멤버 아바타 + 닉네임 (세로) */
function MemberAvatar({ member }: { member: MeetingMember }) {
  const initial = member.nickname.trim().charAt(0) || "?";
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
      {member.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.profileImageUrl}
          alt={member.nickname}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white"
          style={{ backgroundColor: member.profileColor ?? "#8B5E3C" }}
        >
          {initial}
        </div>
      )}
      <span className="w-full truncate text-center text-xs text-gray-600">{member.nickname}</span>
    </div>
  );
}

/** 사람+ (초대하기) 아이콘 */
function PersonAddIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.5 9v6M15.5 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
  const [showAllMembers, setShowAllMembers] = useState(false);

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

  // 액션 실행 후 상세를 다시 불러온다. backOnDone=true면 목록으로 돌아간다.
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

  // 카카오톡으로 비공개 초대 링크를 공유한다(토큰 링크로만 참여 가능).
  async function handleInvite() {
    if (!meeting || action) return;
    if (!meeting.inviteToken) {
      setActionError("초대 링크를 불러오지 못했어요.");
      return;
    }
    setAction("invite");
    setActionError(null);
    try {
      await shareMeetingToKakao({
        url: `${window.location.origin}/community/invite/${meeting.inviteToken}`,
        meetingName: meeting.name,
        bookTitle: meeting.book.title,
        coverImageUrl: meeting.book.coverImageUrl,
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "초대 공유에 실패했어요.");
    } finally {
      setAction(null);
    }
  }

  const isMember = !!meeting && (meeting.isHost || meeting.joined);
  const members = meeting?.members ?? [];
  const visibleMembers = showAllMembers ? members : members.slice(0, 4);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-28">
      {/* 헤더 */}
      <header className="relative flex items-center justify-center px-5 pt-8 pb-4">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="absolute left-5 text-2xl text-gray-900"
        >
          ←
        </button>
        <h1 className="text-base font-bold text-gray-900">책모임 정보</h1>
      </header>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-600">{error}</p>
      ) : meeting ? (
        <>
          {actionError && (
            <p className="px-5 pb-2 text-center text-sm text-red-600">{actionError}</p>
          )}

          {/* 책/모임 요약 */}
          <section className="flex items-center gap-4 px-5 pb-5">
            <MeetingCover
              title={meeting.book.title}
              coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
              primaryColor={meeting.book.primaryColor}
              className="h-20 w-14"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-gray-900">{meeting.name}</p>
              <p className="mt-0.5 truncate text-sm text-gray-700">{meeting.book.title}</p>
              <p className="mt-1 text-xs text-gray-400">{meeting.currentMemberCount}명 참여중</p>
            </div>
          </section>

          <div className="h-px bg-gray-100" />

          {/* 모임 소개 (편집은 백엔드 미지원으로 안내만) */}
          <section className="px-5 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">모임 소개</h2>
              {meeting.isHost && (
                <button
                  aria-label="모임 소개 편집"
                  onClick={() => window.alert("준비 중이에요.")}
                  className="text-gray-400"
                >
                  <PencilIcon size={18} />
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">{meeting.name}</p>
          </section>

          <div className="h-px bg-gray-100" />

          {/* 멤버 */}
          <section className="px-5 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                멤버 <span className="text-gray-400">{members.length}</span>
              </h2>
              {isMember && meeting.status !== "CLOSED" && (
                <button
                  onClick={handleInvite}
                  disabled={action !== null}
                  className="flex items-center gap-1.5 text-sm font-bold text-gray-900 disabled:opacity-40"
                >
                  <PersonAddIcon />
                  {action === "invite" ? "여는 중" : "초대하기"}
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {visibleMembers.map((m) => (
                <MemberAvatar key={m.userId} member={m} />
              ))}
            </div>
            {members.length > 4 && (
              <button
                onClick={() => setShowAllMembers((v) => !v)}
                className="mt-4 text-sm text-gray-400"
              >
                {showAllMembers ? "접기" : `멤버 ${members.length - 4}명 더 보기 >`}
              </button>
            )}
          </section>

          <div className="h-px bg-gray-100" />

          {/* 함께 읽은 책 (백엔드는 모임당 1권 → 해당 책 노출) */}
          <section className="px-5 py-5">
            <h2 className="text-base font-bold text-gray-900">함께 읽은 책</h2>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              <div className="flex w-20 shrink-0 flex-col gap-1.5">
                <MeetingCover
                  title={meeting.book.title}
                  coverImageUrl={meeting.book.coverImageUrl ?? meeting.book.spineImageUrl}
                  primaryColor={meeting.book.primaryColor}
                  className="h-28 w-20"
                />
                <span className="truncate text-center text-xs text-gray-600">{meeting.book.title}</span>
              </div>
            </div>
          </section>

          {/* 대화방 입장 (멤버 전용) */}
          {isMember && (
            <div className="px-5">
              <Link
                href={`/community/${meeting.id}/chat`}
                className="flex items-center justify-center gap-2 rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-[filter] hover:brightness-95"
              >
                대화방 입장
              </Link>
            </div>
          )}

          {/* 하단 고정 액션 */}
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-5 pb-6 pt-3">
            {meeting.status === "CLOSED" ? (
              <p className="py-2 text-center text-sm text-gray-400">종료된 모임이에요.</p>
            ) : meeting.isHost ? (
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500">
                <button
                  onClick={() => window.alert("준비 중이에요.")}
                  className="transition-colors hover:text-gray-900"
                >
                  모임장 넘기기
                </button>
                <span className="text-gray-300" aria-hidden>|</span>
                <button
                  onClick={() =>
                    run("close", () => apiClient.closeMeeting(meeting.id), {
                      confirmMessage: "모임을 끝낼까요? 끝내면 되돌릴 수 없어요.",
                    })
                  }
                  disabled={action !== null}
                  className="transition-colors hover:text-gray-900 disabled:opacity-40"
                >
                  {action === "close" ? "종료 중..." : "모임 끝내기"}
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
                className="w-full rounded-full border border-gray-300 py-3.5 text-[15px] font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                {action === "leave" ? "처리 중..." : "모임 나가기"}
              </button>
            ) : meeting.visibility === "PRIVATE" ? (
              <p className="py-2 text-center text-sm text-gray-400">초대 링크로만 참여할 수 있어요.</p>
            ) : meeting.currentMemberCount < meeting.capacity ? (
              <button
                onClick={() => run("join", () => apiClient.joinMeeting(meeting.id))}
                disabled={action !== null}
                className="w-full rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-[filter] hover:brightness-95 disabled:opacity-40"
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
