/**
 * 소통(독서 모임) 화면용 라벨/표시 헬퍼.
 * 데이터 타입은 packages/api-client 의 것을 그대로 재사용한다(중복 정의 금지 — CLAUDE.md).
 */
import type { ReadingMode, MeetingStatus } from "@booktalk/api-client";

export type { ReadingMode, MeetingStatus } from "@booktalk/api-client";

export const READING_MODE_LABEL: Record<ReadingMode, string> = {
  TOGETHER: "함께 읽기",
  SOLO: "각자 읽기",
};

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  RECRUITING: "모집 중",
  ONGOING: "진행 중",
  CLOSED: "종료",
};

/** dday(남은 일수)를 'D-2' / 'D-DAY' / 'D+1' 표기로 변환 */
export function formatDday(dday: number | null): string {
  if (dday == null) return "";
  if (dday === 0) return "D-DAY";
  return dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`;
}
