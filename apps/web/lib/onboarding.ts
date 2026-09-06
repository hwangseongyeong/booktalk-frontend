"use client";

/**
 * 로그인 후 온보딩(닉네임 → 프로필 → 친구 초대) 흐름의 임시 저장소.
 *
 * 최종 저장은 백엔드(PATCH /users/me, POST /users/me/onboarding/complete)가 담당한다.
 * 여기서는 여러 단계에 걸쳐 입력한 값을 잠깐 들고 있기 위한 draft만 sessionStorage에 둔다.
 * 온보딩 완료 시 clearDraft()로 비운다.
 */

const DRAFT_KEY = "booktalk_onboarding_draft";

/** 아바타 배경 프리셋 (피그마 무채색 톤 + 후보 액센트 1개). 모두 #RRGGBB. */
export const AVATAR_COLORS = [
  "#111111",
  "#6B6B6B",
  "#B3AFA4",
  "#8C7A5B",
  "#4A6C6F",
  "#3700FF",
] as const;

export type OnboardingDraft = {
  nickname: string;
  avatarColor: string;
};

const EMPTY: OnboardingDraft = { nickname: "", avatarColor: AVATAR_COLORS[0] };

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
