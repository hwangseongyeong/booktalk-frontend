"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type BookSearchResult,
} from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { BellIcon, BooksStackIcon } from "../../../components/icons";
import { MeetingCover } from "../../../components/community";

export default function CreateMeetingPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [intro, setIntro] = useState(""); // 모임 소개 — 현재 백엔드 미지원(UI 전용)
  const [book, setBook] = useState<BookSearchResult | null>(null);

  // 책 선택(검색) 패널
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
    if (!name.trim()) setName(`${item.title} 함께 읽기`);
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

      // 읽는 방식/공개 범위는 현재 화면에 없으므로 기본값(함께·공개)으로 생성한다.
      await apiClient.createMeeting({
        readingMode: "TOGETHER",
        bookId,
        name: name.trim(),
        visibility: "PUBLIC",
      });
      router.push("/community");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "모임 생성에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-28 pt-8">
      {/* 헤더 */}
      <header>
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} aria-label="뒤로" className="text-2xl text-gray-900">
            ←
          </button>
          <button aria-label="알림" className="text-gray-900">
            <BellIcon />
          </button>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">모임 만들기</h1>
      </header>

      {/* 모임 이름 */}
      <section className="mt-8">
        <h2 className="text-base font-bold text-gray-900">모임 이름</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 소년이 온다 함께 읽기"
          className="mt-3 w-full rounded-full border border-gray-300 bg-white px-5 py-4 text-base outline-none placeholder:text-gray-400 focus:border-gray-900"
        />
      </section>

      {/* 모임 소개 */}
      <section className="mt-7">
        <h2 className="text-base font-bold text-gray-900">모임 소개</h2>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="예: 소년이 온다 함께 읽기"
          rows={4}
          className="mt-3 w-full resize-none rounded-3xl border border-gray-300 bg-white px-5 py-4 text-base outline-none placeholder:text-gray-400 focus:border-gray-900"
        />
      </section>

      {/* 함께 읽을 첫 책 */}
      <section className="mt-7">
        <h2 className="text-base font-bold text-gray-900">함께 읽을 첫 책</h2>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="mt-3 flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-gray-300 px-5 py-5 text-left"
        >
          {book ? (
            <>
              <MeetingCover
                title={book.title}
                coverImageUrl={book.coverImageUrl}
                className="h-16 w-12"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-gray-900">{book.title}</p>
                <p className="truncate text-sm text-gray-400">{book.author ?? "저자 미상"}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-gray-400">변경</span>
            </>
          ) : (
            <span className="relative flex h-16 w-12 items-center justify-center rounded-md border border-gray-300 text-2xl text-gray-400">
              {/* 책갈피 */}
              <span className="absolute left-1/2 top-0 h-3 w-2.5 -translate-x-1/2 bg-[#F7EF82]" aria-hidden />
              +
            </span>
          )}
        </button>

        {pickerOpen && (
          <div className="mt-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목, 저자로 검색 (카카오 통합검색)"
                className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white"
              >
                검색
              </button>
            </form>

            {searching && <p className="mt-4 px-1 text-center text-sm text-gray-400">불러오는 중...</p>}
            {searchError && <p className="mt-4 px-1 text-center text-sm text-red-600">{searchError}</p>}

            {!searching && !searchError && results.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center text-gray-400">
                <BooksStackIcon />
                <p className="mt-4 text-base font-bold text-gray-700">어떤 책을 함께 읽을까요?</p>
                <p className="mt-1 text-sm leading-relaxed">
                  제목이나 지은이 이름으로
                  <br />
                  책을 찾아보세요
                </p>
              </div>
            )}

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

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-white px-5 pb-6 pt-3">
        {submitError && <p className="mb-2 text-center text-sm text-red-600">{submitError}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-full bg-[#F7EF82] py-4 text-base font-bold text-gray-900 transition-[filter] hover:brightness-95 disabled:opacity-40"
        >
          {submitting ? "만드는 중..." : "모임 만들기"}
        </button>
      </div>
    </main>
  );
}
