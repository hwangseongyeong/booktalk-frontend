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

/**
 * 책 읽는 사람 — 로그인/시작 화면 일러스트.
 * 선은 `currentColor`(부모 text-ink), 책·손 내부는 배경 미색으로 채워 겹친 선을 가린다.
 * 책갈피만 노란 포인트 컬러로 고정.
 */
export function ReaderIllustration({ size = 184, ...props }: IconProps) {
  const paper = "var(--illust-paper, #FAF9F5)";
  const h = Math.round((size * 210) / 220);
  return (
    <svg width={size} height={h} viewBox="0 0 220 210" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        {/* 얼굴 */}
        <ellipse cx="110" cy="70" rx="46" ry="52" fill={paper} />
        {/* 앞머리(물결 스트랜드) */}
        <g strokeWidth={2.3} fill="none">
          <path d="M78 64 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M88 65 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M98 66 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M110 66 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M122 66 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M132 65 q3 -4 0 -8 q-3 -4 0 -8" />
          <path d="M142 64 q3 -4 0 -8 q-3 -4 0 -8" />
        </g>
        {/* 눈 */}
        <circle cx="94" cy="80" r="3.4" fill="currentColor" stroke="none" />
        <circle cx="122" cy="80" r="3.4" fill="currentColor" stroke="none" />
        {/* 코·입 */}
        <path d="M108 87 q4 6 -2 8" strokeWidth={2.3} />
        {/* 펼친 책(두 페이지) */}
        <path d="M110 118 L50 126 L60 168 L110 160 Z" fill={paper} />
        <path d="M110 118 L170 126 L160 168 L110 160 Z" fill={paper} />
        {/* 오른쪽 페이지 라벨 */}
        <rect x="126" y="134" width="27" height="15" rx="2" strokeWidth={2.3} />
        <line x1="131" y1="139.5" x2="148" y2="139.5" strokeWidth={1.7} />
        <line x1="131" y1="144" x2="148" y2="144" strokeWidth={1.7} />
        {/* 왼손(책을 쥔 손가락) */}
        <g strokeWidth={3} fill={paper}>
          <path d="M58 128 q-16 -1 -18 6 q2 5 10 5" />
          <path d="M40 134 q-9 1 -8 7 q1 4 9 3" />
          <path d="M41 144 q-8 1 -7 6 q1 4 8 3" />
          <path d="M44 153 q-7 1 -6 5" />
        </g>
        {/* 오른손 */}
        <g strokeWidth={3} fill={paper}>
          <path d="M162 128 q16 -1 18 6 q-2 5 -10 5" />
          <path d="M180 134 q9 1 8 7 q-1 4 -9 3" />
          <path d="M179 144 q8 1 7 6 q-1 4 -8 3" />
          <path d="M176 153 q7 1 6 5" />
        </g>
        {/* 책갈피(노란 포인트) */}
        <path d="M102 160 L118 160 L118 186 L110 178 L102 186 Z" fill="#FFCF33" />
      </g>
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

/** 말풍선 — "북메이트" */
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

/* ---------- 오른쪽 꺾쇠 (배너/리스트 이동 표시) ---------- */
export function ChevronRightIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M9 5 L16 12 L9 19" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- 둘러보기 타일 아이콘 (얇은 라인) ---------- */
/** 주변 도서관 — 기둥이 있는 건물 */
export function LibraryIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3 L22 8 L4 8 Z" />
        <line x1="6.5" y1="11" x2="6.5" y2="18" />
        <line x1="11" y1="11" x2="11" y2="18" />
        <line x1="15" y1="11" x2="15" y2="18" />
        <line x1="19.5" y1="11" x2="19.5" y2="18" />
        <line x1="3.5" y1="21" x2="22.5" y2="21" />
      </g>
    </svg>
  );
}

/** 읽을거리 — 글이 적힌 문서 */
export function ArticleIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3.5" width="16" height="19" rx="2.5" />
        <line x1="9" y1="9" x2="17" y2="9" />
        <line x1="9" y1="13" x2="17" y2="13" />
        <line x1="9" y1="17" x2="14" y2="17" />
      </g>
    </svg>
  );
}

/** 공지사항 — 확성기 */
export function MegaphoneIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11 L5 15 L8 15 L18 20 L18 6 L8 11 Z" />
        <path d="M8 15 L8 11" />
        <path d="M9 19 L9 21 L11.5 21 L11 17" />
        <path d="M21 11 L23 11 M20.5 8 L22.5 7 M20.5 18 L22.5 19" />
      </g>
    </svg>
  );
}

/* ---------- 공유 (헤더 우상단, iOS 스타일 박스+위 화살표) ---------- */
export function ShareIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden {...props}>
      <path d="M13 3 L13 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7 L13 3 L17 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11 L5 11 L5 22 L21 22 L21 11 L19 11" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- 북로그 빈 상태 일러스트 (탭별) ---------- */
/** 독서중 — 펼친 책 */
export function OpenBookIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 14 C19 11 11 11 6 14 L6 38 C11 35 19 35 26 38 Z" />
        <path d="M26 14 C33 11 41 11 46 14 L46 38 C41 35 33 35 26 38 Z" />
      </g>
    </svg>
  );
}

/** 완독 — 덮은 책(노란 라벨) */
export function ClosedBookIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11 L34 11 C35.1 11 36 11.9 36 13 L36 41 L18 41 Z" />
        <path d="M22 11 L22 41" />
        <path d="M18 41 C18 44 36 44 36 41" />
        <rect x="25" y="16" width="8" height="6" rx="1" fill="#FFCF33" strokeWidth={2.2} />
      </g>
    </svg>
  );
}

/** 담아둔 책 — 쌓인 책 */
export function StackedBooksIcon({ size = 52, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="13" width="16" height="8" rx="2" />
        <rect x="14" y="22" width="24" height="8" rx="2" />
        <rect x="12" y="31" width="28" height="9" rx="2" />
        <line x1="30" y1="16.5" x2="33" y2="16.5" strokeWidth={2.2} />
        <line x1="30" y1="25.5" x2="34" y2="25.5" strokeWidth={2.2} />
      </g>
    </svg>
  );
}

/** 더보기(점 3개, 가로) */
export function KebabIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="5.5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

/** 삭제(휴지통) */
export function TrashIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7 L20 7" />
        <path d="M9 7 L9 5 C9 4.4 9.4 4 10 4 L14 4 C14.6 4 15 4.4 15 5 L15 7" />
        <path d="M6 7 L7 20 C7 20.6 7.4 21 8 21 L16 21 C16.6 21 17 20.6 17 20 L18 7" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </g>
    </svg>
  );
}

/* ---------- 책 3권 (빈 상태 일러스트) ---------- */
export function BooksStackIcon({ size = 48, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <rect x="7" y="14" width="9" height="24" rx="1.5" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" />
      <rect x="18" y="10" width="9" height="28" rx="1.5" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" />
      <rect
        x="29.5" y="15" width="9" height="24" rx="1.5"
        transform="rotate(11 34 27)"
        stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round"
      />
      <line x1="9.5" y1="20" x2="13.5" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="20.5" y1="16" x2="24.5" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
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

/* ---------- 하단 내비게이션 (홈·북로그·기록·북메이트·내정보) ---------- */
export function NavHomeIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      {/* 뾰족한 지붕 + 가운데 좁고 긴 문 (디자인: 폭이 좁고 세로로 긴 집) */}
      <path d="M6 11 L12 3 L18 11 L18 20.5 L13.5 20.5 L13.5 14.8 L10.5 14.8 L10.5 20.5 L6 20.5 Z" />
    </svg>
  );
}

export function NavShelfIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      {/* 선 책 2권 + 상단 표지선 */}
      <rect x="3.3" y="6.5" width="4" height="13.5" rx="0.8" />
      <line x1="3.3" y1="9.4" x2="7.3" y2="9.4" />
      <rect x="8.3" y="5" width="4" height="15" rx="0.8" />
      <line x1="8.3" y1="7.9" x2="12.3" y2="7.9" />
      {/* 기울어진 세 번째 책 */}
      <g transform="rotate(20 15.6 20)">
        <rect x="13.6" y="6.5" width="4" height="13.5" rx="0.8" />
        <line x1="13.6" y1="9.4" x2="17.6" y2="9.4" />
      </g>
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

export function NavBoxIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden>
      {/* 상자 몸통 */}
      <path d="M12 2.6 L20.5 7 L20.5 16.6 L12 21 L3.5 16.6 L3.5 7 Z" />
      {/* 윗면 모서리 */}
      <path d="M3.5 7 L12 11.3 L20.5 7" />
      {/* 윗면 뚜껑 이음선(두 쪽 플랩) */}
      <path d="M12 2.6 L12 11.3" />
      {/* 앞면 테이프 심 */}
      <path d="M12 11.3 L12 21" />
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
