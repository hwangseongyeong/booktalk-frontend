const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

// TODO: 백엔드 Swagger 스펙이 안정화되면 openapi-typescript로 자동 생성된 타입으로 교체
export type Book = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImageUrl: string;
  spineImageUrl: string | null;
  primaryColor: string | null;
};

export type ReadingRecord = {
  id: number;
  book: Book;
  status: "READING" | "COMPLETED";
  startDate: string;
  endDate: string | null;
  rating: number | null;
  oneLineNote: string | null;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  searchBooks: (query: string) => request<Book[]>(`/books/search?q=${encodeURIComponent(query)}`),
  getMyReadingRecords: (yearMonth: string) =>
    request<ReadingRecord[]>(`/reading-records?yearMonth=${yearMonth}`),
  createReadingRecord: (payload: { bookId: number; startDate: string }) =>
    request<ReadingRecord>("/reading-records", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
