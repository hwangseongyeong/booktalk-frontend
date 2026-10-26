// new URL(...) 등 web 표준 API 폴리필 — 반드시 api-client import 보다 먼저 로드한다.
import "react-native-url-polyfill/auto";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { configureTokenStorage, hydrateAuth } from "@booktalk/api-client";
import { secureTokenStorage } from "../lib/tokenStorage";

// 모바일 토큰 저장소(SecureStore)를 api-client에 주입한다.
configureTokenStorage(secureTokenStorage);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 카카오 네이티브 SDK 초기화(네이티브 앱 키 필요, dev build에서만 실제 동작).
    const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
    if (kakaoKey) {
      try {
        initializeKakaoSDK(kakaoKey);
      } catch (e) {
        // Expo Go 등 네이티브 모듈이 없는 환경에서는 조용히 넘어간다.
        console.warn("Kakao SDK init skipped:", e);
      }
    }
    // 저장된 토큰을 메모리 캐시로 끌어온 뒤 화면을 렌더한다.
    hydrateAuth().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  // (tabs) 그룹이 네이티브 탭바를, login은 탭 밖 전체화면으로 렌더된다.
  return <Stack screenOptions={{ headerShown: false }} />;
}
