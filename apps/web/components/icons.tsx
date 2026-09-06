/**
 * BookTalk 손그림 아이콘 세트.
 * 피그마 컨셉: 굵은 획(약 3~3.5px), 둥근 끝, 검정 단색.
 * 색은 `currentColor`를 따르므로 부모에서 `text-ink` 등으로 제어한다.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

/** 펼친 책 + 말풍선. 브랜드 심볼. */
export function BookTalkLogo({ size = 110, ...props }: IconProps) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 110 90" fill="none" aria-hidden {...props}>
      <path
        d="M55 74 C44 71 22 67 10 63 L10 27 C22 31 44 35 55 38 Z"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 74 C66 71 88 67 100 63 L100 27 C88 31 66 35 55 38 Z"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="18" y1="37" x2="50" y2="42" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="18" y1="48" x2="50" y2="53" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="18" y1="59" x2="50" y2="64" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="60" y1="42" x2="92" y2="37" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="60" y1="53" x2="92" y2="48" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      <rect x="62" y="2" width="44" height="28" rx="8" stroke="currentColor" strokeWidth={3} />
      <path d="M72 30 L65 41 L80 30" fill="var(--logo-bubble-fill, #FAF9F5)" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
      <circle cx="76" cy="16" r="3" fill="currentColor" />
      <circle cx="84" cy="16" r="3" fill="currentColor" />
      <circle cx="92" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

/** 연필 — "기록" */
export function PencilIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <path d="M38 7 L45 14 L16 43 L7 45 L9 36 Z" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="34" y1="11" x2="41" y2="18" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** 말풍선 — "소통" */
export function BubbleIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <path
        d="M26 7 C13 7 5 15 5 24 C5 33 13 41 26 41 C29 41 32 40 35 39 L44 44 L40 35 C43 32 47 28 47 24 C47 15 39 7 26 7 Z"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="24" r="2.5" fill="currentColor" />
      <circle cx="26" cy="24" r="2.5" fill="currentColor" />
      <circle cx="34" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** 종이비행기 — "공유" */
export function PaperPlaneIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <path d="M6 7 L46 24 L24 30 L17 46 Z" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="30" x2="46" y2="24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <line x1="24" y1="30" x2="30" y2="40" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <path d="M4 8 h3 l1.5 -2.5 h7 L18 8 h2 a1 1 0 0 1 1 1 v9 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 V9 a1 1 0 0 1 1 -1 Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <path d="M5 12.5 L10 17.5 L19 6.5" />
    </svg>
  );
}

/* ---------- 알림 ---------- */
export function BellIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden {...props}>
      <path d="M13 4 C9.1 4 6 7.1 6 11 L6 17 L4 19 L22 19 L20 17 L20 11 C20 7.1 16.9 4 13 4 Z"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 19 C10.5 20.4 11.6 21.5 13 21.5 C14.4 21.5 15.5 20.4 15.5 19"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="19" y1="5" x2="22" y2="3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <line x1="21" y1="8" x2="24" y2="7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ---------- 하단 내비게이션 (홈·책장·기록·소통·마이) ---------- */
export function NavHomeIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <path d="M3 10 L12 3 L21 10 L21 21 L15 21 L15 15 L9 15 L9 21 L3 21 Z" />
    </svg>
  );
}

export function NavShelfIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <rect x="2" y="4" width="4" height="16" rx="1" />
      <rect x="8" y="7" width="4" height="13" rx="1" />
      <rect x="14" y="5" width="4" height="15" rx="1" />
      <line x1="2" y1="21" x2="20" y2="21" />
    </svg>
  );
}

export function NavRecordIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <path d="M17 3 L21 7 L8 20 L3 21 L4 16 Z" />
    </svg>
  );
}

export function NavChatIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <path d="M21 15 C21 16.1 20.1 17 19 17 L7 17 L3 21 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5 Z" />
      <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NavMyIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21 C4 17.1 7.6 14 12 14 C16.4 14 20 17.1 20 21" />
    </svg>
  );
}
