"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type BookSearchResult,
  type ReadingMode,
  type MeetingVisibility,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { BellIcon } from "../../../components/icons";
import { MeetingCover } from "../../../components/community";
import { READING_MODE_LABEL } from "../../../lib/meetings";

const MODES: { mode: ReadingMode; emoji: string; desc: string }[] = [
  { mode: "TOGETHER", emoji: "📖", desc: "한 책을 같이" },
  { mode: "SOLO", emoji: "👭", desc: "자유롭게 각자" },
];

const VISIBILITIES: { value: MeetingVisibility; emoji: string; label: string; desc: string }[] = [
  { value: "PUBLIC", emoji: "🌐", label: "공개", desc: "목록에 노출, 누구나 참여" },
  { value: "PRIVATE", emoji: "🔒", label: "비공개", desc: "초대 링크로만 참여" },
];

export default function CreateMeetingPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [mode, setMode] = useState<ReadingMode>("TOGETHER");
  const [visibility, setVisibility] = useState<MeetingVisibility>("PUBLIC");
  const [book, setBook] = useState<BookSearchResult | null>(null);
  const [name, setName] = useState("");

  // 책 선택 패널
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!ready) return null;

  const canSubmit = !!book && name.trim().length > 0 && !submitting;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResults(await apiClient.searchBooks(query));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "책 검색에 실패했어요.");
    } finally {
      setSearching(false);
    }
  }

  function pickBook(item: BookSearchResult) {
    setBook(item);
    setPickerOpen(false);
    // 모임 이름이 비어 있으면 기본값을 제안한다. (예: 소년이 온다 함께 읽기)
    if (!name.trim()) setName(`${item.title} ${READING_MODE_LABEL[mode]}`);
  }

  async function handleSubmit() {
    if (!book || name.trim().length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 카카오 검색 결과(id 없음)는 모임 생성 전에 먼저 로컬에 등록한다.
      let bookId = book.id;
      if (bookId == null) {
        const registered = await apiClient.registerBook({
          title: book.title,
          author: book.author ?? undefined,
          publisher: book.publisher ?? undefined,
          isbn: book.isbn ?? undefined,
          coverImageUrl: book.coverImageUrl ?? undefined,
        });
        bookId = registered.id;
      }

      await apiClient.createMeeting({
        readingMode: mode,
        bookId,
        name: name.trim(),
        visibility,
      });
      router.push("/community");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "모임 생성에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-28 pt-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-2xl font-bold text-gray-900"
          aria-label="뒤로"
        >
          <span aria-hidden>‹</span>
          모임 만들기
        </button>
        <button aria-label="알림" className="text-gray-800">
          <BellIcon />
        </button>
      </header>

      {/* 읽는 방식 */}
      <section className="mt-8">
        <h2 className="text-base font-bold text-gray-900">읽는 방식</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MODES.map(({ mode: m, emoji, desc }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-7 transition-colors ${
                  active ? "border-gray-900 bg-white" : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="text-2xl" aria-hidden>{emoji}</span>
                <span className="text-base font-bold text-gray-900">{READING_MODE_LABEL[m]}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 공개 범위 */}
      <section className="mt-7">
        <h2 className="text-base font-bold text-gray-900">공개 범위</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {VISIBILITIES.map(({ value, emoji, label, desc }) => {
            const active = visibility === value;
            return (
              <button
                key={value}
                onClick={() => setVisibility(value)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-7 transition-colors ${
                  active ? "border-gray-900 bg-white" : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="text-2xl" aria-hidden>{emoji}</span>
                <span className="text-base font-bold text-gray-900">{label}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 책 선택 */}
      <section className="mt-7">
        <h2 className="text-base font-bold text-gray-900">책 선택</h2>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm"
        >
          {book ? (
            <>
              <MeetingCover
                title={book.title}
                coverImageUrl={book.coverImageUrl}
                className="h-12 w-9"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-gray-900">{book.title}</p>
                <p className="truncate text-sm text-gray-400">{book.author ?? "저자 미상"}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-gray-400">변경</span>
            </>
          ) : (
            <>
              <span className="flex h-12 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                +
              </span>
              <span className="text-base font-medium text-gray-400">읽을 책을 선택해주세요</span>
            </>
          )}
        </button>

        {pickerOpen && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목, 저자로 검색"
                className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white"
              >
                검색
              </button>
            </form>

            {searching && <p className="mt-3 px-1 text-sm text-gray-400">불러오는 중...</p>}
            {searchError && <p className="mt-3 px-1 text-sm text-red-600">{searchError}</p>}

            {!searching && results.length > 0 && (
              <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                {results.map((item) => (
                  <li key={`${item.source}-${item.id ?? item.isbn ?? item.title}`}>
                    <button
                      onClick={() => pickBook(item)}
                      className="flex w-full items-center gap-3 rounded-xl bg-white p-2.5 text-left hover:bg-gray-100"
                    >
                      <MeetingCover
                        title={item.title}
                        coverImageUrl={item.coverImageUrl}
                        className="h-12 w-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="truncate text-xs text-gray-400">{item.author ?? "저자 미상"}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 모임 이름 */}
      <section className="mt-7">
        <h2 className="text-base font-bold text-gray-900">모임 이름</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 소년이 온다 함께 읽기"
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base outline-none placeholder:text-gray-400 focus:border-gray-900"
        />
      </section>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-6 pb-6 pt-3">
        {submitError && <p className="mb-2 text-center text-sm text-red-600">{submitError}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition-colors hover:bg-black disabled:opacity-40"
        >
          {submitting ? "만드는 중..." : "모임 만들기"}
        </button>
      </div>
    </main>
  );
}
