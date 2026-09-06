"use client";

/**
 * 로그인 후 온보딩(닉네임 → 프로필 → 친구 초대) 상태 관리.
 *
 * ⚠️ 임시 구현: 백엔드에 온보딩 API(PATCH /users/me 등)가 아직 없어 값을 localStorage에만 저장한다.
 * API가 생기면 setProfile을 서버 호출로 바꾸고, done 플래그는 서버의 유저 상태로 대체한다.
 */

const PROFILE_KEY = "booktalk_profile";
const PROFILE_DONE_KEY = "booktalk_profile_done";

/** 아바타 배경으로 쓰는 프리셋 색 (피그마 무채색 톤 + 후보 액센트 1개) */
export const AVATAR_COLORS = [
  "#111111",
  "#6B6B6B",
  "#B3AFA4",
  "#8C7A5B",
  "#4A6C6F",
  "#3700FF",
] as const;

export type OnboardingProfile = {
  nickname: string;
  avatarColor: string;
  /** 초대 화면에서 채운 슬롯 수 (프론트 임시값) */
  invitedCount: number;
};

const EMPTY: OnboardingProfile = {
  nickname: "",
  avatarColor: AVATAR_COLORS[0],
  invitedCount: 0,
};

export function getProfile(): OnboardingProfile {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<OnboardingProfile>) };
  } catch {
    return { ...EMPTY };
  }
}

export function setProfile(patch: Partial<OnboardingProfile>): OnboardingProfile {
  const next = { ...getProfile(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isProfileOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PROFILE_DONE_KEY) === "1";
}

export function markProfileOnboardingDone() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_DONE_KEY, "1");
}

/** 로그인 직후 이동할 경로: 온보딩 미완료면 닉네임부터, 완료면 홈. */
export function postLoginPath(): string {
  return isProfileOnboardingDone() ? "/" : "/onboarding/nickname";
}
