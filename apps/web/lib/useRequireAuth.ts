"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@booktalk/api-client";

/**
 * 로그인이 필요한 페이지에서 사용.
 * 토큰이 없으면 /login으로 보내고, 데이터 로딩 useEffect는 ready === true일 때만 실행하도록 가드한다.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authStorage.getAccessToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}
