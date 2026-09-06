"use client";

/**
 * 로그인 후 온보딩 3단계(닉네임 → 프로필 → 친구 초대) 공용 레이아웃.
 * 상단에 진행 표시, 큰 볼드 제목, 본문, 하단 고정 액션.
 */
import type { ReactNode } from "react";
import { PillButton, ProgressDots, ScreenShell } from "./ui";

export const ONBOARDING_STEPS = 3;

type Action =
  | { label: string; onClick: () => void; href?: never; disabled?: boolean }
  | { label: string; href: string; onClick?: never; disabled?: boolean };

export function OnboardingScaffold({
  step,
  title,
  description,
  children,
  primary,
  secondary,
}: {
  step: number;
  title: string;
  description?: string;
  children?: ReactNode;
  primary: Action;
  secondary?: Action;
}) {
  return (
    <ScreenShell
      footer={
        <>
          <PillButton
            href={primary.href}
            onClick={primary.onClick}
            disabled={primary.disabled}
          >
            {primary.label}
          </PillButton>
          {secondary ? (
            <PillButton
              variant="ghost"
              href={secondary.href}
              onClick={secondary.onClick}
              disabled={secondary.disabled}
            >
              {secondary.label}
            </PillButton>
          ) : null}
        </>
      }
    >
      <ProgressDots count={ONBOARDING_STEPS} active={step} />
      <h1 className="mt-8 text-2xl leading-snug text-ink">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{description}</p>
      ) : null}
      <div className="mt-10 flex flex-1 flex-col">{children}</div>
    </ScreenShell>
  );
}
