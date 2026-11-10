"use client";

/**
 * 로그인 후 온보딩(닉네임) 흐름의 임시 저장소.
 *
 * 최종 저장은 백엔드(PATCH /users/me, POST /users/me/onboarding/complete)가 담당한다.
 * 여기서는 입력 중인 값을 잠깐 들고 있기 위한 draft만 sessionStorage에 둔다.
 * 온보딩 완료 시 clearDraft()로 비운다.
 */

const DRAFT_KEY = "booktalk_onboarding_draft";

export type OnboardingDraft = {
  nickname: string;
};

const EMPTY: OnboardingDraft = { nickname: "" };

export function getDraft(): OnboardingDraft {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<OnboardingDraft>) };
  } catch {
    return { ...EMPTY };
  }
}

export function setDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = { ...getDraft(), ...patch };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_KEY);
}
