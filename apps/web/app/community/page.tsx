"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiClient,
  resolveAssetUrl,
  type BookNote,
  type Meeting,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { formatDday } from "../../lib/meetings";
import { BottomNav } from "../../components/bottom-nav";
import { BellIcon, PlusIcon } from "../../components/icons";
import { ReadingModeBadge, MeetingCover } from "../../components/community";

type BookmateTab = "함께 북톡" | "혼자 기록";

/** 혼자 기록 작성일 표기(예: 2026.10.24) */
function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 혼자 기록 카드 */
function BookNoteCard({ note, onDelete }: { note: BookNote; onDelete: (id: number) => void }) {
  const imageSrc = resolveAssetUrl(note.imageUrl);
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-gray-400">{formatNoteDate(note.createdAt)}</span>
          <button
            onClick={() => onDelete(note.id)}
            aria-label="삭제"
            className="shrink-0 text-xs text-gray-300 hover:text-gray-500"
          >
            삭제
          </button>
        </div>
        {note.book && (
          <p className="mt-0.5 truncate text-xs font-bold text-gray-500">{note.book.title}</p>
        )}
        {note.content && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
            {note.content}
          </p>
        )}
      </div>
    </div>
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

/** 빈 상태(일러스트 + 문구) */
function EmptyState({
  image,
  title,
  lines,
}: {
  image: string;
  title: string;
  lines: [string, string];
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="h-36 w-auto" />
      <p className="mt-6 text-lg font-bold text-gray-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">
        {lines[0]}
        <br />
        {lines[1]}
      </p>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <CommunityPageInner />
    </Suspense>
  );
}

function CommunityPageInner() {
  const ready = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<BookmateTab>(
    searchParams.get("tab") === "solo" ? "혼자 기록" : "함께 북톡",
  );
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<BookNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  // 함께 북톡 = 참여 중인 모임 목록
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .getJoinedMeetings()
      .then((list) => { if (!cancelled) setMeetings(list); })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "모임을 불러오지 못했어요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ready]);

  // 혼자 기록 목록
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setNotesLoading(true);
    setNotesError(null);

    apiClient
      .getMyBookNotes()
      .then((list) => { if (!cancelled) setNotes(list); })
      .catch((e) => {
        if (!cancelled) setNotesError(e instanceof Error ? e.message : "기록을 불러오지 못했어요.");
      })
      .finally(() => { if (!cancelled) setNotesLoading(false); });

    return () => { cancelled = true; };
  }, [ready]);

  // 혼자 기록 삭제
  async function handleDeleteNote(id: number) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    const prev = notes;
    setNotes((list) => list.filter((n) => n.id !== id)); // 낙관적 제거
    try {
      await apiClient.deleteBookNote(id);
    } catch {
      setNotes(prev); // 실패 시 복구
      window.alert("삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  // 초대 코드로 참여하기 — 코드 입력 후 초대 화면으로 이동
  function handleJoinByCode() {
    const code = window.prompt("초대 코드를 입력해주세요.")?.trim();
    if (code) router.push(`/community/invite/${encodeURIComponent(code)}`);
  }

  if (!ready) return null;

  const hasMeetings = meetings.length > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-24 pt-8">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">북메이트</h1>
        <button aria-label="알림" className="mt-1 text-gray-900">
          <BellIcon />
        </button>
      </header>

      {/* 올리기(스토리) */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => window.alert("준비 중이에요.")}
          className="flex flex-col items-center gap-1.5"
          aria-label="올리기"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400">
            <PlusIcon size={20} />
          </span>
          <span className="text-xs font-bold text-gray-700">올리기</span>
        </button>
      </div>

      {/* 탭 */}
      <div className="mt-5 flex border-b border-gray-200">
        {(["함께 북톡", "혼자 기록"] as BookmateTab[]).map((t) => {
          const active = tab === t;
          const count = t === "함께 북톡" ? meetings.length : notes.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px flex-1 border-b-2 pb-3 text-center text-[15px] transition-colors ${
                active
                  ? "border-gray-900 font-bold text-gray-900"
                  : "border-transparent font-medium text-gray-400"
              }`}
            >
              {t} {count}
            </button>
          );
        })}
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col">
        {tab === "함께 북톡" ? (
          loading ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : error ? (
            <p className="py-16 text-center text-sm text-red-600">{error}</p>
          ) : hasMeetings ? (
            <div className="mt-5 flex flex-col gap-4">
              {meetings.map((m) => (
                <MeetingListCard key={m.id} meeting={m} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10">
              <EmptyState
                image="/images/bookmate-together.png"
                title="아직 함께하는 북톡이 없어요"
                lines={["같은 책을 읽고 문장을 나눌", "첫 모임을 만들어 보세요"]}
              />
            </div>
          )
        ) : notesLoading ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : notesError ? (
          <p className="py-16 text-center text-sm text-red-600">{notesError}</p>
        ) : notes.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {notes.map((n) => (
              <BookNoteCard key={n.id} note={n} onDelete={handleDeleteNote} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center py-10">
            <EmptyState
              image="/images/bookmate-solo.png"
              title="아직 남긴 기록이 없어요"
              lines={["읽다가 멈춘 문장, 떠오른 생각을", "가볍게 남겨 보세요"]}
            />
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="mt-6 flex flex-col gap-3">
          {tab === "함께 북톡" ? (
            <>
              <Link
                href="/community/new"
                className="flex items-center justify-center rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-gray-900 transition-colors hover:brightness-95"
              >
                + 모임 만들기
              </Link>
              <button
                onClick={handleJoinByCode}
                className="flex items-center justify-center rounded-full border border-gray-900 py-3.5 text-[15px] font-bold text-gray-900 transition-colors hover:bg-gray-50"
              >
                초대 코드로 참여하기
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/community/record")}
              className="flex items-center justify-center rounded-full border border-gray-900 py-3.5 text-[15px] font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              {notes.length > 0 ? "기록 남기기" : "첫 기록 남기기"}
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
