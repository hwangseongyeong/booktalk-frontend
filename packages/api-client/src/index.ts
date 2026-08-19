const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

// TODO: 백엔드 Swagger 스펙이 안정화되면 openapi-typescript로 자동 생성된 타입으로 교체
export type Book = {
  id: number;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  coverImageUrl: string | null;
  pageCount: number | null;
  spineImageUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
};

export type ReadingStatus = "READING" | "COMPLETED";

export type ReadingRecord = {
  id: number;
  book: Book;
  status: ReadingStatus;
  startDate: string;
  endDate: string | null;
  rating: number | null;
  oneLineNote: string | null;
};

export type ShelfBookItem = {
  readingRecordId: number;
  bookId: number;
  title: string;
  author: string | null;
  spineImageUrl: string | null;
  primaryColor: string | null;
  endDate: string;
  rating: number | null;
  oneLineNote: string | null;
};

export type MonthlyShelf = {
  yearMonth: string;
  bookCount: number;
  books: ShelfBookItem[];
};

// 백엔드 global.common.ApiResponse<T> 래핑 포맷
type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `API 요청 실패: ${res.status} ${path}`);
  }

  return body.data;
}

export const apiClient = {
  searchBooks: (query?: string) =>
    request<Book[]>(`/books${query ? `?query=${encodeURIComponent(query)}` : ""}`),

  registerBook: (payload: {
    isbn?: string;
    title: string;
    author?: string;
    publisher?: string;
    coverImageUrl?: string;
    pageCount?: number;
  }) =>
    request<Book>("/books", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyReadingRecords: (status?: ReadingStatus) =>
    request<ReadingRecord[]>(`/reading-records${status ? `?status=${status}` : ""}`),

  startReadingRecord: (payload: { bookId: number; startDate?: string }) =>
    request<ReadingRecord>("/reading-records", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  completeReadingRecord: (
    id: number,
    payload: { endDate?: string; rating?: number; oneLineNote?: string }
  ) =>
    request<ReadingRecord>(`/reading-records/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getMonthlyShelf: (yearMonth?: string) =>
    request<MonthlyShelf>(`/shelves/monthly${yearMonth ? `?yearMonth=${yearMonth}` : ""}`),
};
