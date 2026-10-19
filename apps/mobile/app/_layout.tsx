// new URL(...) 등 web 표준 API 폴리필 — 반드시 api-client import 보다 먼저 로드한다.
import "react-native-url-polyfill/auto";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { configureTokenStorage, hydrateAuth } from "@booktalk/api-client";
import { secureTokenStorage } from "../lib/tokenStorage";

// 모바일 토큰 저장소(SecureStore)를 api-client에 주입한다.
configureTokenStorage(secureTokenStorage);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 저장된 토큰을 메모리 캐시로 끌어온 뒤 화면을 렌더한다.
    hydrateAuth().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
