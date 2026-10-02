/**
 * 소통(독서 모임) 데이터 타입과 임시 목업.
 *
 * NOTE: 백엔드 모임 API가 아직 없어 화면 구성을 위해 목업을 사용한다.
 * 스펙이 나오면 packages/api-client 에 meetings 엔드포인트를 추가하고
 * 이 파일의 MOCK_* 를 교체한다. (컴포넌트에서 직접 fetch 금지 — CLAUDE.md)
 */

/** 함께 읽기(한 책을 같이) / 각자 읽기(자유롭게 각자) */
export type ReadingMode = "TOGETHER" | "SOLO";

/** 모집 중 / 진행 중 */
export type MeetingStatus = "RECRUITING" | "ONGOING";

/** 모임 생성 시 내 역할 */
export type MeetingRole = "LEADER" | "MEMBER";

export type Meeting = {
  id: string;
  mode: ReadingMode;
  /** 모임 이름 */
  title: string;
  bookTitle: string;
  bookAuthor: string | null;
  coverImageUrl: string | null;
  /** 표지 폴백 배경색 */
  primaryColor?: string | null;
  /** 현재 참여 인원 */
  current: number;
  /** 정원 */
  capacity: number;
  /** 모집 마감까지 남은 일수(D-day) */
  dday: number;
  status: MeetingStatus;
};

export const READING_MODE_LABEL: Record<ReadingMode, string> = {
  TOGETHER: "함께 읽기",
  SOLO: "각자 읽기",
};

/** 참여 중인 모임 (상단 가로 스크롤) */
export const MOCK_JOINED: Meeting[] = [
  {
    id: "joined-1",
    mode: "TOGETHER",
    title: "소년이 온다",
    bookTitle: "소년이 온다",
    bookAuthor: "한강",
    coverImageUrl: null,
    primaryColor: "#2F2A24",
    current: 5,
    capacity: 6,
    dday: 5,
    status: "ONGOING",
  },
  {
    id: "joined-2",
    mode: "SOLO",
    title: "퇴근 후 30분",
    bookTitle: "퇴근 후 30분",
    bookAuthor: null,
    coverImageUrl: null,
    primaryColor: "#6B7280",
    current: 8,
    capacity: 10,
    dday: 3,
    status: "ONGOING",
  },
];

/** 모집/진행 중 모임 목록 */
export const MOCK_MEETINGS: Meeting[] = [
  {
    id: "m-1",
    mode: "TOGETHER",
    title: "불안한 사람들과 함께",
    bookTitle: "책먹는 여우",
    bookAuthor: "베드만",
    coverImageUrl: null,
    primaryColor: "#C9A24B",
    current: 4,
    capacity: 6,
    dday: 2,
    status: "RECRUITING",
  },
  {
    id: "m-2",
    mode: "SOLO",
    title: "불안한 사람들과 함께",
    bookTitle: "요즘애들",
    bookAuthor: "이기선",
    coverImageUrl: null,
    primaryColor: "#B23A3A",
    current: 4,
    capacity: 6,
    dday: 2,
    status: "RECRUITING",
  },
  {
    id: "m-3",
    mode: "TOGETHER",
    title: "천천히 함께 읽는 고전",
    bookTitle: "데미안",
    bookAuthor: "헤르만 헤세",
    coverImageUrl: null,
    primaryColor: "#3F6C8C",
    current: 6,
    capacity: 6,
    dday: 0,
    status: "ONGOING",
  },
];
