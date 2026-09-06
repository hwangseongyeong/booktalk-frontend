"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type BookSearchResult } from "@booktalk/api-client";
import { PillButton, TextField } from "../../components/ui";
import { PlusIcon } from "../../components/icons";
import { BottomNav } from "../../components/bottom-nav";

// 검색 결과용 표지 썸네일. 표지 URL이 없거나 로드에 실패하면 회색 블록으로 대체한다(피그마 톤).
function BookCover({ title, coverImageUrl }: { title: string; coverImageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const box = "h-[84px] w-16 shrink-0 overflow-hidden rounded-[6px] border-2 border-line bg-fill-strong";

  if (coverImageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImageUrl}
        alt={title}
        onError={() => setFailed(true)}
        className={`${box} object-cover`}
      />
    );
  }
  return (
    <div className={`${box} flex items-center justify-center`}>
      <span className="px-1 text-center text-[9px] font-bold leading-tight text-muted">
        {title.slice(0, 10)}
      </span>
    </div>
  );
}

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [registeringIsbn, setRegisteringIsbn] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", publisher: "", isbn: "", coverImageUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  async function loadBooks(searchQuery?: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.searchBooks(searchQuery);
      setResults(result);
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

  // 카카오 검색 결과(id 없음)를 우리 DB에 등록. 등록 후 목록을 새로고침하면 "읽기 시작" 버튼으로 바뀐다.
  async function handleRegisterFromSearch(item: BookSearchResult) {
    setError(null);
    setRegisteringIsbn(item.isbn);
    try {
      await apiClient.registerBook({
        title: item.title,
        author: item.author ?? undefined,
        publisher: item.publisher ?? undefined,
        isbn: item.isbn ?? undefined,
        coverImageUrl: item.coverImageUrl ?? undefined,
      });
      setMessage("책이 등록되었어요. 이제 '읽기 시작'을 눌러보세요.");
      await loadBooks(query);
    } catch (e) {
      setError(e instanceof Error ? e.message : "책 등록에 실패했습니다.");
    } finally {
      setRegisteringIsbn(null);
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
    <main className="app-shell px-6 pb-24 pt-8">
      <Link href="/" className="text-sm font-bold text-muted hover:text-ink">
        ← 홈
      </Link>

      <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-ink">책 등록</h1>
      <p className="mt-1 text-sm font-bold text-muted">읽은 책이 하나의 서재가 되다</p>

      {/* 카카오 통합검색 */}
      <form onSubmit={handleSearch} className="mt-6 flex items-start gap-2">
        <TextField
          label="검색어"
          hideLabel
          className="flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 저자로 검색 (카카오 통합검색)"
        />
        <PillButton
          type="submit"
          fullWidth={false}
          size="sm"
          className="shrink-0 px-5 py-3.5 text-base"
        >
          검색
        </PillButton>
      </form>

      {/* 직접 책 등록 */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-field border-2 border-dashed border-muted-light py-3 text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink"
      >
        {showForm ? (
          "직접 등록 닫기"
        ) : (
          <>
            <PlusIcon size={18} />
            직접 책 등록
          </>
        )}
      </button>

      {showForm && (
        <form
          onSubmit={handleRegister}
          className="mt-3 flex flex-col gap-3 rounded-card border-bold border-line bg-paper-pure p-5"
        >
          <TextField
            label="책 제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="책 제목"
          />
          <TextField
            label="저자"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="저자"
          />
          <TextField
            label="출판사"
            value={form.publisher}
            onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            placeholder="출판사"
          />
          <TextField
            label="ISBN (선택)"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            placeholder="ISBN"
          />
          <TextField
            label="표지 이미지 URL (선택)"
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            placeholder="https://"
          />
          <PillButton type="submit" disabled={submitting} className="mt-1">
            {submitting ? "등록 중..." : "등록하기"}
          </PillButton>
        </form>
      )}

      {message && <p className="mt-4 text-sm font-bold text-green-600">{message}</p>}
      {error && (
        <p className="mt-4 text-sm font-bold text-red-600">
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

      {/* 검색 결과 */}
      <div className="mt-6 flex flex-col gap-3">
        {loading && <p className="text-sm font-medium text-muted">불러오는 중...</p>}
        {!loading && results.length === 0 && (
          <p className="text-sm font-medium text-muted">
            검색 결과가 없어요. 다른 키워드로 검색하거나 직접 등록해보세요.
          </p>
        )}
        {results.map((item) => (
          <div
            key={`${item.source}-${item.id ?? item.isbn ?? item.title}`}
            className="flex items-center gap-3 rounded-card border-bold border-line bg-paper-pure p-3.5"
          >
            <BookCover title={item.title} coverImageUrl={item.coverImageUrl} />

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink">{item.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-muted">
                <span className="truncate">{item.author ?? "저자 미상"}</span>
                {item.source === "KAKAO" && (
                  <span className="shrink-0 rounded-full bg-fill px-1.5 py-0.5 text-[11px] font-bold text-muted">
                    카카오
                  </span>
                )}
              </p>
            </div>

            {item.id != null ? (
              <PillButton
                variant="outline"
                size="sm"
                fullWidth={false}
                className="shrink-0"
                onClick={() => handleStartReading(item.id!)}
              >
                읽기 시작
              </PillButton>
            ) : (
              <PillButton
                size="sm"
                fullWidth={false}
                className="shrink-0"
                disabled={registeringIsbn === item.isbn}
                onClick={() => handleRegisterFromSearch(item)}
              >
                {registeringIsbn === item.isbn ? "등록 중" : "등록"}
              </PillButton>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
