// TODO: 백엔드 Swagger 스펙이 안정화되면 openapi-typescript로 자동 생성된 타입으로 교체
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

// ---------- 도메인 타입 ----------
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

// 도서 검색 결과 한 건. id가 있으면 이미 로컬에 등록된 책(바로 읽기 시작 가능),
// null이면 카카오 책 검색에서만 찾은 책(등록부터 필요).
export type BookSearchResult = {
  id: number | null;
  source: "LOCAL" | "KAKAO";
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  coverImageUrl: string | null;
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

// ---------- 인증 타입 ----------
export type OAuthProviderKey = "kakao" | "naver" | "google" | "facebook";

export type AuthUser = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  /** 온보딩에서 고른 프로필 색 (#RRGGBB). 미설정이면 null. */
  profileColor: string | null;
  oauthProvider: string;
  /** 로그인 후 온보딩(닉네임·프로필·친구초대) 완료 여부. false면 온보딩으로 보낸다. */
  onboardingCompleted: boolean;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

// ---------- 토큰 저장(localStorage) ----------
const ACCESS_TOKEN_KEY = "booktalk_access_token";
const REFRESH_TOKEN_KEY = "booktalk_refresh_token";

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// 백엔드 global.common.ApiResponse<T> 래핑 포맷
type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

let refreshingPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("로그인이 필요합니다.");
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    authStorage.clearTokens();
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }

  const body = (await res.json()) as ApiEnvelope<TokenPair>;
  if (!body.success) {
    authStorage.clearTokens();
    throw new Error(body.message ?? "세션이 만료되었습니다. 다시 로그인해주세요.");
  }

  authStorage.setTokens(body.data.accessToken, body.data.refreshToken);
}

async function request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const accessToken = authStorage.getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  });

  // access token 만료(401) 시 refresh token으로 1회 재시도
  if ((res.status === 401 || res.status === 403) && retry && authStorage.getRefreshToken()) {
    if (!refreshingPromise) {
      refreshingPromise = refreshAccessToken().finally(() => {
        refreshingPromise = null;
      });
    }
    try {
      await refreshingPromise;
      return request<T>(path, options, false);
    } catch {
      throw new Error("로그인이 필요합니다.");
    }
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("로그인이 필요합니다.");
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // 바디가 없는 응답(빈 401 등) 방어
  }

  if (!res.ok || !body || !body.success) {
    throw new Error(body?.message ?? `API 요청 실패: ${res.status} ${path}`);
  }

  return body.data;
}

export const apiClient = {
  // ---------- 인증 ----------
  loginWithOAuth: (
    provider: OAuthProviderKey,
    payload: { code: string; redirectUri?: string; state?: string }
  ) =>
    request<TokenPair>(`/auth/${provider}/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<AuthUser>("/auth/me"),

  logout: () => {
    authStorage.clearTokens();
  },

  // ---------- 사용자 / 온보딩 ----------
  getMyProfile: () => request<AuthUser>("/users/me"),

  /** 닉네임/프로필 수정. 온보딩 닉네임·프로필 단계에서도 이 API로 저장한다. */
  updateMyProfile: (payload: {
    nickname: string;
    profileImageUrl?: string;
    profileColor?: string;
  }) =>
    request<AuthUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  completeOnboarding: () =>
    request<AuthUser>("/users/me/onboarding/complete", { method: "POST" }),

  // ---------- 책 ----------
  searchBooks: (query?: string) =>
    request<BookSearchResult[]>(`/books${query ? `?query=${encodeURIComponent(query)}` : ""}`),

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

  // ---------- 독서 기록 ----------
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

  // ---------- 서재 ----------
  getMonthlyShelf: (yearMonth?: string) =>
    request<MonthlyShelf>(`/shelves/monthly${yearMonth ? `?yearMonth=${yearMonth}` : ""}`),
};
