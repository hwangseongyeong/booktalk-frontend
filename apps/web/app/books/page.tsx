"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type Book } from "@booktalk/api-client";

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", publisher: "", isbn: "", coverImageUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  async function loadBooks(searchQuery?: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.searchBooks(searchQuery);
      setBooks(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "책 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await loadBooks(query);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("제목은 필수입니다.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.registerBook({
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        publisher: form.publisher.trim() || undefined,
        isbn: form.isbn.trim() || undefined,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
      });
      setForm({ title: "", author: "", publisher: "", isbn: "", coverImageUrl: "" });
      setShowForm(false);
      setMessage("책이 등록되었습니다.");
      await loadBooks(query);
    } catch (e) {
      setError(e instanceof Error ? e.message : "책 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartReading(bookId: number) {
    setError(null);
    try {
      await apiClient.startReadingRecord({ bookId });
      setMessage("읽기 시작으로 등록했어요. '독서 기록'에서 확인하세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "읽기 시작 처리에 실패했습니다.");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <Link href="/" className="text-sm text-gray-400 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-2 text-xl font-medium">책 등록/검색</h1>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 저자로 검색"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
          검색
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
          {error.includes("로그인이 필요합니다") && (
            <>
              {" "}
              <Link href="/login" className="underline">
                로그인하러 가기
              </Link>
            </>
          )}
        </p>
      )}

      <button
        onClick={() => setShowForm((v) => !v)}
        className="mt-4 w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-gray-400"
      >
        {showForm ? "취소" : "+ 직접 입력해서 책 등록하기"}
      </button>

      {showForm && (
        <form onSubmit={handleRegister} className="mt-3 flex flex-col gap-2 rounded-md border border-gray-200 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="책 제목 *"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="저자"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.publisher}
            onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            placeholder="출판사"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            placeholder="ISBN (선택)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            placeholder="표지 이미지 URL (선택)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-md bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </form>
      )}

      <ul className="mt-6 flex flex-col gap-2">
        {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
        {!loading && books.length === 0 && (
          <p className="text-sm text-gray-400">등록된 책이 없습니다. 먼저 책을 등록해보세요.</p>
        )}
        {books.map((book) => (
          <li key={book.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
            <div>
              <p className="text-sm font-medium">{book.title}</p>
              <p className="text-xs text-gray-500">{book.author ?? "저자 미상"}</p>
            </div>
            <button
              onClick={() => handleStartReading(book.id)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            >
              읽기 시작
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
