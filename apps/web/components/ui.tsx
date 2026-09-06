"use client";

/**
 * BookTalk 공용 UI 프리미티브.
 * 피그마 디자인 시스템(화이트/블랙 + 미색, 볼드 서체, 알약 버튼, 굵은 라인)을 코드로 고정한다.
 * 화면별 컴포넌트를 만들기 전에 여기 있는 것부터 재사용한다.
 */
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  ScreenShell — 모바일 화면 공통 셸                                   */
/* ------------------------------------------------------------------ */
export function ScreenShell({
  children,
  footer,
  className = "",
}: {
  children: ReactNode;
  /** 화면 하단에 고정되는 액션 영역(주로 PillButton) */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="app-shell flex flex-col px-6 pb-8 pt-10">
      <div className={`flex flex-1 flex-col ${className}`}>{children}</div>
      {footer ? <div className="mt-8 flex flex-col gap-3">{footer}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PillButton — 알약 버튼 (버튼 / 링크 겸용)                            */
/* ------------------------------------------------------------------ */
type PillVariant = "primary" | "outline" | "ghost";
type PillSize = "md" | "sm";

const PILL_BASE =
  "inline-flex items-center justify-center rounded-full font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none";

const PILL_SIZE: Record<PillSize, string> = {
  md: "px-6 py-4 text-base",
  sm: "px-4 py-2 text-sm",
};

const PILL_VARIANT: Record<PillVariant, string> = {
  primary: "bg-ink text-paper-pure hover:bg-ink-soft",
  outline: "border-bold border-line text-ink hover:bg-fill",
  ghost: "text-ink hover:bg-fill",
};

export function pillClasses(
  variant: PillVariant = "primary",
  { size = "md", fullWidth = true, extra = "" }: { size?: PillSize; fullWidth?: boolean; extra?: string } = {}
) {
  return [PILL_BASE, PILL_SIZE[size], fullWidth ? "w-full" : "", PILL_VARIANT[variant], extra]
    .filter(Boolean)
    .join(" ");
}

type PillButtonProps = {
  variant?: PillVariant;
  size?: PillSize;
  fullWidth?: boolean;
  /** 값이 있으면 링크로 렌더. 외부(http)면 <a>, 내부면 next/link. */
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function PillButton({
  variant = "primary",
  size = "md",
  fullWidth = true,
  href,
  external,
  className = "",
  children,
  ...buttonProps
}: PillButtonProps) {
  const cls = pillClasses(variant, { size, fullWidth, extra: className });

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...buttonProps}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TextField — 입력창 (pill / box)                                    */
/* ------------------------------------------------------------------ */
type TextFieldProps = {
  label?: string;
  /** 라벨을 화면에 노출하지 않고 스크린리더에만 제공 */
  hideLabel?: boolean;
  shape?: "pill" | "box";
  hint?: string;
  error?: string | null;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className">;

export function TextField({
  label,
  hideLabel = false,
  shape = "box",
  hint,
  error,
  id,
  className = "",
  ...inputProps
}: TextFieldProps) {
  const inputId = id ?? inputProps.name ?? label;
  const radius = shape === "pill" ? "rounded-full" : "rounded-field";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className={hideLabel ? "sr-only" : "text-sm font-bold text-ink"}
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full border-bold border-line bg-paper-pure px-5 py-3.5 text-base font-medium text-ink outline-none placeholder:font-medium placeholder:text-muted-light focus:border-ink ${radius} ${
          error ? "border-red-500" : ""
        }`}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs font-medium text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProgressDots — 온보딩 단계 표시                                     */
/* ------------------------------------------------------------------ */
export function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${count}단계 중 ${active + 1}단계`}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === active ? "w-6 bg-ink" : "w-2 bg-fill-strong"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar — 원형 프로필                                               */
/* ------------------------------------------------------------------ */
export function Avatar({
  nickname,
  size = 92,
  src,
  color,
  className = "",
}: {
  nickname?: string;
  size?: number;
  src?: string | null;
  /** 배경색을 지정하면 이니셜은 흰색으로 표시된다. */
  color?: string;
  className?: string;
}) {
  const initial = nickname?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-bold border-line font-bold ${
        color ? "text-paper-pure" : "bg-fill text-ink"
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        backgroundColor: color,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nickname ?? "프로필"} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
