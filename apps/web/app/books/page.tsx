"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type BookSearchResult } from "@booktalk/api-client";
import { PillButton, TextField } from "../../components/ui";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [wishlistKey, setWishlistKey] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // 검색 결과 한 건을 식별하는 키(로딩/버튼 상태용). 목록 렌더링 key와 동일하게 맞춘다.
  const itemKey = (item: BookSearchResult) =>
    `${item.source}-${item.id ?? item.isbn ?? item.title}`;

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    await loadBooks(query);
  }

  // 검색 결과에서 바로 읽기 시작. 로컬 미등록(id 없음)인 카카오 책은 내부적으로 먼저 등록한 뒤 읽기 시작한다.
  async function handleStartReading(item: BookSearchResult) {
    setError(null);
    setMessage(null);
    setStartingKey(itemKey(item));
    try {
      let bookId = item.id;
      if (bookId == null) {
        const book = await apiClient.registerBook({
          title: item.title,
          author: item.author ?? undefined,
          publisher: item.publisher ?? undefined,
          isbn: item.isbn ?? undefined,
          coverImageUrl: item.coverImageUrl ?? undefined,
        });
        bookId = book.id;
      }
      await apiClient.startReadingRecord({ bookId });
      // 읽기 시작 후 홈으로 이동해 '지금 읽고 있어요'에서 바로 확인하도록 한다.
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "읽기 시작 처리에 실패했습니다.");
      setStartingKey(null);
    }
  }

  // 읽고 싶은 책으로 담기. 로컬 미등록(id 없음) 책은 먼저 등록한 뒤 위시리스트에 추가한다.
  async function handleAddToWishlist(item: BookSearchResult) {
    setError(null);
    setMessage(null);
    setWishlistKey(itemKey(item));
    try {
      let bookId = item.id;
      if (bookId == null) {
        const book = await apiClient.registerBook({
          title: item.title,
          author: item.author ?? undefined,
          publisher: item.publisher ?? undefined,
          isbn: item.isbn ?? undefined,
          coverImageUrl: item.coverImageUrl ?? undefined,
        });
        bookId = book.id;
      }
      await apiClient.addToWishlist(bookId);
      setMessage(`'${item.title}'을(를) 읽고 싶은 책에 담았어요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "읽고 싶은 책 담기에 실패했습니다.");
    } finally {
      setWishlistKey(null);
    }
  }

  return (
    <main className="app-shell px-6 pb-24 pt-8">
      <Link href="/" className="text-sm font-bold text-muted hover:text-ink">
        ← 홈
      </Link>

      <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-ink">책 검색</h1>
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
        {!loading && searched && results.length === 0 && (
          <p className="text-sm font-medium text-muted">
            검색 결과가 없어요. 다른 키워드로 검색해보세요.
          </p>
        )}
        {results.map((item) => (
          <div
            key={itemKey(item)}
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

            <div className="flex shrink-0 flex-col gap-1.5">
              <PillButton
                size="sm"
                fullWidth={false}
                disabled={startingKey === itemKey(item) || wishlistKey === itemKey(item)}
                onClick={() => handleStartReading(item)}
              >
                {startingKey === itemKey(item) ? "시작 중" : "읽기 시작"}
              </PillButton>
              <button
                type="button"
                disabled={startingKey === itemKey(item) || wishlistKey === itemKey(item)}
                onClick={() => handleAddToWishlist(item)}
                className="rounded-full border-2 border-line px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-fill disabled:opacity-50"
              >
                {wishlistKey === itemKey(item) ? "담는 중" : "읽고 싶어요"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
