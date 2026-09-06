"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "../../lib/useRequireAuth";

/** 온보딩 화면은 로그인된 사용자만 접근. 토큰이 없으면 useRequireAuth가 /login으로 보낸다. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const ready = useRequireAuth();
  if (!ready) return null;
  return <>{children}</>;
}
