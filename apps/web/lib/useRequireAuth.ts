"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@booktalk/api-client";
import { saveReturnTo } from "./returnTo";

/**
 * 로그인이 필요한 페이지에서 사용.
 * 토큰이 없으면 /login으로 보내고, 데이터 로딩 useEffect는 ready === true일 때만 실행하도록 가드한다.
 * 로그인 전 현재 경로를 저장해, 로그인 완료 후 그 경로(초대 링크 등)로 복귀시킨다.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authStorage.getAccessToken()) {
      saveReturnTo(window.location.pathname + window.location.search);
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}
