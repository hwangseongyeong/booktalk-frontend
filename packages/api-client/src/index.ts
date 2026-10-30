// TODO: 백엔드 Swagger 스펙이 안정화되면 openapi-typescript로 자동 생성된 타입으로 교체
// 웹(Next)은 NEXT_PUBLIC_*, 모바일(Expo)은 EXPO_PUBLIC_* 를 빌드 시 인라인한다. 둘 다 지원.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api/v1";

/** API 서버 origin(예: http://localhost:8080). 상대 경로 애셋(책등 SVG 등) 해석용. */
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

/**
 * 모임 채팅 WebSocket URL. API origin의 http→ws로 바꿔 /ws/chat 에 연결한다.
 * 핸드셰이크에서 token(access token)과 meetingId로 인증/참여 검증을 한다.
 */
export function meetingChatSocketUrl(meetingId: number, token: string): string {
  const wsOrigin = API_ORIGIN.replace(/^http/, "ws"); // http→ws, https→wss
  return `${wsOrigin}/ws/chat?meetingId=${meetingId}&token=${encodeURIComponent(token)}`;
}

/**
 * 백엔드가 내려주는 이미지 URL을 <img src> 에 바로 쓸 수 있는 절대 URL로 바꾼다.
 * - 외부 절대 URL(표지: http...)·data URL 은 그대로 둔다.
 * - '/api/v1/...' 같은 상대 경로(책등 SVG: /api/v1/books/{id}/spine.svg)는 API origin을 붙인다.
 *   책등이 S3 저장 URL → 실시간 렌더 엔드포인트(상대 경로)로 바뀌면서 필요해졌다.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

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

export type ReadingStatus = "WISHLIST" | "READING" | "COMPLETED";

/** 완독량: 전체 읽었어요 / 일부 읽었어요 */
export type ReadAmount = "ALL" | "PARTIAL";

export type ReadingRecord = {
  id: number;
  book: Book;
  status: ReadingStatus;
  startDate: string;
  endDate: string | null;
  rating: number | null;
  oneLineNote: string | null;
  /** 나의 감상 태그(감정+분위기+장르) 평면 목록. 서재/홈/북박스 표시용 */
  myWords: string[];
  /** 나의 감상 태그 - 감정(최대 3) */
  emotions: string[];
  /** 나의 감상 태그 - 분위기(최대 3) */
  moods: string[];
  /** 나의 감상 태그 - 장르(최대 3) */
  genres: string[];
  readAmount: ReadAmount | null;
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
  /** 완독 시 선택한 My Words 키워드(최대 3개) */
  myWords: string[];
};

export type MonthlyShelf = {
  yearMonth: string;
  bookCount: number;
  books: ShelfBookItem[];
};

// ---------- 혼자 기록 타입 ----------
/** 혼자 기록. 책(book)은 선택이며, 사진(imageUrl)·글(content) 중 하나 이상이 있다. */
export type BookNote = {
  id: number;
  book: Book | null;
  imageUrl: string | null;
  content: string | null;
  createdAt: string;
};

// ---------- 모임(소통) 타입 ----------
/** 함께 읽기 / 각자 읽기 */
export type ReadingMode = "TOGETHER" | "SOLO";
/** 모집 중 / 진행 중 / 종료 */
export type MeetingStatus = "RECRUITING" | "ONGOING" | "CLOSED";
/** 공개(목록 노출+직접 참여) / 비공개(목록 숨김+초대 토큰으로만 참여) */
export type MeetingVisibility = "PUBLIC" | "PRIVATE";

export type Meeting = {
  id: number;
  name: string;
  readingMode: ReadingMode;
  status: MeetingStatus;
  visibility: MeetingVisibility;
  capacity: number;
  currentMemberCount: number;
  /** 모집 마감까지 남은 일수(양수=남음, 0=오늘, 음수=지남, null=미설정) */
  dday: number | null;
  recruitDeadline: string | null;
  book: Book;
  /** 현재 로그인 사용자가 이 모임의 생성자인지(종료/시작 권한) */
  isHost: boolean;
  /** 현재 로그인 사용자가 참여 중인지 */
  joined: boolean;
  createdAt: string;
};

export type MeetingMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  profileColor: string | null;
  joinedAt: string;
};

export type MeetingDetail = Meeting & {
  members: MeetingMember[];
  /** 모임 생성자(모임장) 닉네임 */
  hostNickname: string;
  /** 비공개 초대 링크 토큰. 참여자(멤버)에게만 내려오고, 비참여자에게는 null */
  inviteToken: string | null;
};

/** 메시지 이모지 리액션 집계. mine=true면 내가 누른 이모지. */
export type MeetingChatReaction = {
  emoji: string;
  count: number;
  mine: boolean;
};

/** 메시지별 리액션 집계. */
export type MeetingChatMessageReactions = {
  messageId: number;
  reactions: MeetingChatReaction[];
};

/**
 * 리액션 폴링 응답(최근 메시지 윈도우만). fromMessageId 이상인 메시지에 대해서만 갱신/비우고,
 * 그보다 오래된 메시지는 마지막 값을 유지한다.
 */
export type MeetingChatReactionsResponse = {
  fromMessageId: number;
  messages: MeetingChatMessageReactions[];
};

/** 모임 채팅 메시지. mine=true면 내가 보낸 메시지. */
export type MeetingChatAttachmentType = "IMAGE" | "FILE";

export type MeetingChatMessage = {
  id: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string | null;
  senderProfileColor: string | null;
  /** 첨부만 있는 메시지는 null일 수 있다. */
  content: string | null;
  /** 첨부(사진/파일) 접근 URL. 없으면 null. resolveAssetUrl로 절대화해 사용. */
  attachmentUrl: string | null;
  attachmentType: MeetingChatAttachmentType | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  createdAt: string;
  mine: boolean;
  reactions: MeetingChatReaction[];
};

export type CreateMeetingPayload = {
  readingMode: ReadingMode;
  bookId: number;
  name: string;
  /** 생략 시 PUBLIC(공개) */
  visibility?: MeetingVisibility;
  /** 생략 시 서버 기본 정원 */
  capacity?: number;
  /** YYYY-MM-DD. 생략 시 서버 기본 모집기간 */
  recruitDeadline?: string;
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

// ---------- 토큰 저장 (플랫폼 주입식) ----------
// 웹은 localStorage(동기), 모바일은 expo-secure-store/AsyncStorage(비동기)를 주입한다.
// 동기 읽기 API(getAccessToken 등)는 메모리 캐시로 처리하고, 영속화만 어댑터에 위임한다.
const ACCESS_TOKEN_KEY = "booktalk_access_token";
const REFRESH_TOKEN_KEY = "booktalk_refresh_token";

export type PersistedTokens = { accessToken: string | null; refreshToken: string | null };

/**
 * 토큰 영속화 어댑터. 비동기 저장소도 지원하도록 load는 Promise를 반환할 수 있다.
 * 모바일에서는 configureTokenStorage()로 주입하고, 앱 시작 시 hydrateAuth()를 1회 await 한다.
 */
export type TokenPersistenceAdapter = {
  load(): PersistedTokens | Promise<PersistedTokens>;
  save(accessToken: string, refreshToken: string): void | Promise<void>;
  clear(): void | Promise<void>;
};

// 기본 어댑터: 웹 localStorage. SSR 및 localStorage가 없는 환경(React Native 등)에선 no-op.
// RN은 window는 있지만 window.localStorage가 없으므로 존재 여부까지 확인한다.
const hasLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const localStorageAdapter: TokenPersistenceAdapter = {
  load() {
    if (!hasLocalStorage()) return { accessToken: null, refreshToken: null };
    return {
      accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY),
    };
  },
  save(accessToken, refreshToken) {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    if (!hasLocalStorage()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

let persistence: TokenPersistenceAdapter = localStorageAdapter;
let memAccessToken: string | null = null;
let memRefreshToken: string | null = null;

// 기본(동기) 어댑터는 모듈 로드 시 즉시 하이드레이트한다(웹은 기존 동작 그대로).
(() => {
  const loaded = localStorageAdapter.load();
  if (!(loaded instanceof Promise)) {
    memAccessToken = loaded.accessToken;
    memRefreshToken = loaded.refreshToken;
  }
})();

/** 플랫폼별 토큰 저장소 주입(모바일: expo-secure-store 등). 주입 후 hydrateAuth()를 호출한다. */
export function configureTokenStorage(adapter: TokenPersistenceAdapter) {
  persistence = adapter;
}

/** 저장된 토큰을 메모리 캐시로 끌어온다(비동기 저장소용, 앱 시작 시 1회 await). */
export async function hydrateAuth(): Promise<void> {
  const loaded = await persistence.load();
  memAccessToken = loaded.accessToken;
  memRefreshToken = loaded.refreshToken;
}

export const authStorage = {
  getAccessToken(): string | null {
    return memAccessToken;
  },
  getRefreshToken(): string | null {
    return memRefreshToken;
  },
  setTokens(accessToken: string, refreshToken: string) {
    memAccessToken = accessToken;
    memRefreshToken = refreshToken;
    void persistence.save(accessToken, refreshToken);
  },
  clearTokens() {
    memAccessToken = null;
    memRefreshToken = null;
    void persistence.clear();
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

  // 멀티파트(FormData) 전송 시엔 Content-Type을 지정하지 않는다.
  // 브라우저가 boundary를 포함한 multipart/form-data 헤더를 자동으로 붙여야 하기 때문.
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

// ---------- 어드민 타입 ----------
export type AdminMetrics = {
  totalUsers: number;
  newUsersToday: number;
  newUsers7d: number;
  totalBooks: number;
  readingRecords: number;
  completedRecords: number;
  wishlistRecords: number;
  totalMeetings: number;
  recruitingMeetings: number;
  ongoingMeetings: number;
  closedMeetings: number;
  totalBookNotes: number;
  totalChatMessages: number;
};
export type AdminPageResult<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type AdminUserListItem = {
  id: number;
  nickname: string;
  email: string | null;
  profileImageUrl: string | null;
  oauthProvider: string;
  role: string;
  suspended: boolean;
  createdAt: string;
};
export type AdminUserDetail = AdminUserListItem & {
  profileColor: string | null;
  onboardingCompleted: boolean;
  readingRecordCount: number;
  bookNoteCount: number;
};
export type AdminBookNoteItem = {
  id: number;
  userId: number;
  userNickname: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
};
export type AdminChatMessageItem = {
  id: number;
  meetingId: number;
  userId: number;
  userNickname: string;
  content: string;
  deleted: boolean;
  createdAt: string;
};

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

  /** 네이티브 카카오 SDK 로그인(모바일). 앱에서 받은 카카오 access token으로 로그인한다. */
  loginWithKakaoToken: (accessToken: string) =>
    request<TokenPair>(`/auth/kakao/login/token`, {
      method: "POST",
      body: JSON.stringify({ accessToken }),
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

  // ---------- 업로드 ----------
  /** 이미지 업로드 → 저장된 접근 URL(상대경로). resolveAssetUrl로 절대 URL 변환해 사용. */
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/uploads/images", { method: "POST", body: form });
  },

  /** 일반 파일(문서류) 업로드 → URL·원본명·크기. 채팅 첨부로 사용. */
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; name: string; size: number; contentType: string | null }>(
      "/uploads/files",
      { method: "POST", body: form }
    );
  },

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

  /** 읽고 싶은 책 담기(WISHLIST로 등록) */
  addToWishlist: (bookId: number) =>
    request<ReadingRecord>("/reading-records/wishlist", {
      method: "POST",
      body: JSON.stringify({ bookId }),
    }),

  /** 읽고 싶은 책 → 읽기 시작(READING) 전환 */
  startReadingFromWishlist: (id: number) =>
    request<ReadingRecord>(`/reading-records/${id}/start`, { method: "PATCH" }),

  completeReadingRecord: (
    id: number,
    payload: {
      endDate?: string;
      rating?: number;
      oneLineNote?: string;
      emotions?: string[];
      moods?: string[];
      genres?: string[];
      readAmount?: ReadAmount;
    }
  ) =>
    request<ReadingRecord>(`/reading-records/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /** 독서중 취소 — 독서 기록을 삭제한다(독서중 목록에서 제거) */
  cancelReadingRecord: (id: number) =>
    request<void>(`/reading-records/${id}`, { method: "DELETE" }),

  // ---------- 혼자 기록 ----------
  /** 내 혼자 기록 목록(최신순) */
  getMyBookNotes: () => request<BookNote[]>("/book-notes"),

  /** 혼자 북톡 단건 조회(본인 것만) */
  getBookNote: (id: number) => request<BookNote>(`/book-notes/${id}`),

  /** 혼자 기록 작성. 사진(imageUrl)·글(content) 중 하나 이상 필요, bookId는 선택. */
  createBookNote: (payload: { bookId?: number; imageUrl?: string; content?: string }) =>
    request<BookNote>("/book-notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** 혼자 기록 삭제 */
  deleteBookNote: (id: number) =>
    request<void>(`/book-notes/${id}`, { method: "DELETE" }),

  // ---------- 서재 ----------
  getMonthlyShelf: (yearMonth?: string) =>
    request<MonthlyShelf>(`/shelves/monthly${yearMonth ? `?yearMonth=${yearMonth}` : ""}`),

  // ---------- 모임(소통) ----------
  /** 전체 모임 목록. status=RECRUITING|ONGOING|CLOSED, 생략 시 전체 */
  getMeetings: (status?: MeetingStatus) =>
    request<Meeting[]>(`/meetings${status ? `?status=${status}` : ""}`),

  /** 내가 참여 중인 모임 목록 */
  getJoinedMeetings: () => request<Meeting[]>("/meetings/joined"),

  /** 모임 상세(참여자 포함) */
  getMeeting: (id: number) => request<MeetingDetail>(`/meetings/${id}`),

  createMeeting: (payload: CreateMeetingPayload) =>
    request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** 공개 모임 직접 참여(비공개 모임은 초대 토큰 필요) */
  joinMeeting: (id: number) =>
    request<Meeting>(`/meetings/${id}/join`, { method: "POST" }),

  /** 초대 토큰으로 모임 미리보기(참여 수락 화면용) */
  getMeetingByInvite: (token: string) =>
    request<MeetingDetail>(`/meetings/invite/${encodeURIComponent(token)}`),

  /** 초대 토큰으로 모임 참여(비공개: 토큰 링크로만 참여 가능) */
  joinByInvite: (token: string) =>
    request<Meeting>(`/meetings/invite/${encodeURIComponent(token)}/join`, { method: "POST" }),

  /** 공개 범위 변경(생성자) */
  changeMeetingVisibility: (id: number, visibility: MeetingVisibility) =>
    request<MeetingDetail>(`/meetings/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visibility }),
    }),

  /** 초대 링크 재발급(생성자). 기존 링크는 무효화됨 */
  reissueInviteToken: (id: number) =>
    request<MeetingDetail>(`/meetings/${id}/invite/reissue`, { method: "POST" }),

  leaveMeeting: (id: number) =>
    request<void>(`/meetings/${id}/leave`, { method: "DELETE" }),

  /** 모집 → 진행 중 전환(생성자) */
  startMeeting: (id: number) =>
    request<Meeting>(`/meetings/${id}/start`, { method: "POST" }),

  /** 모임 종료(생성자) */
  closeMeeting: (id: number) =>
    request<Meeting>(`/meetings/${id}/close`, { method: "POST" }),

  // ---------- 모임 채팅 ----------
  /** 모임 메시지 목록. afterId가 있으면 그 이후 새 메시지만(폴링) */
  getMeetingMessages: (id: number, afterId?: number) =>
    request<MeetingChatMessage[]>(
      `/meetings/${id}/messages${afterId != null ? `?afterId=${afterId}` : ""}`
    ),

  /** 메시지 전송. 본문(content) 또는 첨부(attachmentUrl) 중 하나는 있어야 한다. */
  sendMeetingMessage: (
    id: number,
    payload: {
      content?: string;
      attachmentUrl?: string;
      attachmentType?: MeetingChatAttachmentType;
      attachmentName?: string;
      attachmentSize?: number;
    }
  ) =>
    request<MeetingChatMessage>(`/meetings/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** 최근 메시지 윈도우의 리액션 집계(폴링용). fromMessageId 이상 메시지에만 적용 */
  getMeetingMessageReactions: (id: number) =>
    request<MeetingChatReactionsResponse>(`/meetings/${id}/messages/reactions`),

  /** 메시지 이모지 리액션 토글(추가/교체/취소). 갱신된 메시지를 반환 */
  reactToMeetingMessage: (id: number, messageId: number, emoji: string) =>
    request<MeetingChatMessage>(`/meetings/${id}/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),

  // ---------- 어드민 (ADMIN 역할 전용. 비-관리자는 403) ----------
  getAdminMetrics: () => request<AdminMetrics>("/admin/metrics"),

  getAdminUsers: (query?: string, page = 0, size = 20) =>
    request<AdminPageResult<AdminUserListItem>>(
      `/admin/users?page=${page}&size=${size}${query ? `&query=${encodeURIComponent(query)}` : ""}`
    ),
  getAdminUserDetail: (id: number) => request<AdminUserDetail>(`/admin/users/${id}`),
  suspendUser: (id: number) => request<void>(`/admin/users/${id}/suspend`, { method: "PATCH" }),
  unsuspendUser: (id: number) => request<void>(`/admin/users/${id}/unsuspend`, { method: "PATCH" }),
  grantAdmin: (id: number) => request<void>(`/admin/users/${id}/grant-admin`, { method: "PATCH" }),
  revokeAdmin: (id: number) => request<void>(`/admin/users/${id}/revoke-admin`, { method: "PATCH" }),

  getAdminBookNotes: (page = 0, size = 20) =>
    request<AdminPageResult<AdminBookNoteItem>>(`/admin/book-notes?page=${page}&size=${size}`),
  deleteAdminBookNote: (id: number) => request<void>(`/admin/book-notes/${id}`, { method: "DELETE" }),
  getAdminMeetingMessages: (meetingId: number) =>
    request<AdminChatMessageItem[]>(`/admin/meetings/${meetingId}/messages`),
  deleteAdminChatMessage: (id: number) => request<void>(`/admin/chat-messages/${id}`, { method: "DELETE" }),
};
