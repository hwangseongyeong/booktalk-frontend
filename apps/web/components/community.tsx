"use client";

/**
 * 소통(독서 모임) 화면 공용 조각.
 * - ReadingModeBadge: 함께 읽기(파랑) / 각자 읽기(노랑) 알약 배지
 * - MeetingCover: 책 표지. 표지 URL이 없으면 primaryColor + 제목 폴백
 */
import type { ReadingMode } from "@booktalk/api-client";
import { READING_MODE_LABEL } from "../lib/meetings";

const MODE_BADGE: Record<ReadingMode, string> = {
  TOGETHER: "bg-sky-100 text-sky-700",
  SOLO: "bg-amber-100 text-amber-700",
};

export function ReadingModeBadge({
  mode,
  className = "",
}: {
  mode: ReadingMode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${MODE_BADGE[mode]} ${className}`}
    >
      {READING_MODE_LABEL[mode]}
    </span>
  );
}

export function MeetingCover({
  title,
  coverImageUrl,
  primaryColor,
  className = "h-16 w-12",
}: {
  title: string;
  coverImageUrl: string | null;
  primaryColor?: string | null;
  className?: string;
}) {
  const box = `${className} shrink-0 overflow-hidden rounded-md`;

  if (coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverImageUrl} alt={title} className={`${box} object-cover`} />
    );
  }
  return (
    <div
      className={`${box} flex items-center justify-center p-1.5 text-center`}
      style={{ backgroundColor: primaryColor ?? "#8B5E3C" }}
    >
      <span className="line-clamp-3 text-[10px] font-bold leading-tight text-white">{title}</span>
    </div>
  );
}
