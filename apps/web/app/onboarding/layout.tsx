"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { apiClient } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";

/**
 * 온보딩 화면 가드.
 * - 토큰이 없으면 useRequireAuth가 /login으로 보낸다.
 * - 이미 온보딩을 마친 사용자가 URL로 접근하면 홈으로 돌려보낸다.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const ready = useRequireAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    apiClient
      .getMyProfile()
      .then((me) => {
        if (cancelled) return;
        if (me.onboardingCompleted) {
          router.replace("/");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // 프로필 조회 실패 시에도 온보딩은 진행할 수 있게 둔다.
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  if (!ready || !checked) return null;
  return <>{children}</>;
}
