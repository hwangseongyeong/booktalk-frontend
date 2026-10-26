import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { apiClient, authStorage } from "@booktalk/api-client";

// 웹(Next.js) 기본 주소. 실기기에서는 localhost가 안 잡히므로 개발 PC LAN IP로 바꾼다.
// 예) EXPO_PUBLIC_WEB_BASE_URL=http://192.168.0.10:3000
const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "http://localhost:3000";

// 웹 api-client가 localStorage에서 읽는 토큰 키와 동일해야 한다.
// (packages/api-client/src/index.ts의 ACCESS/REFRESH_TOKEN_KEY)
const ACCESS_KEY = "booktalk_access_token";
const REFRESH_KEY = "booktalk_refresh_token";

/**
 * 콘텐츠 로드 전에 실행할 주입 스크립트:
 * 1) 네이티브 JWT를 localStorage에 심어 웹 로그인 상태를 공유한다.
 * 2) 웹 하단바(data-bottom-nav)와 하단 여백(pb-24)을 숨기는 <style>을 넣어
 *    네이티브 탭바와 이중으로 겹치지 않게 한다. SPA 내부 이동에도 유지된다.
 */
function buildInjection(): string {
  const access = JSON.stringify(authStorage.getAccessToken());
  const refresh = JSON.stringify(authStorage.getRefreshToken?.() ?? null);
  return `
    (function () {
      try {
        if (${access} != null) localStorage.setItem(${JSON.stringify(ACCESS_KEY)}, ${access});
        if (${refresh} != null) localStorage.setItem(${JSON.stringify(REFRESH_KEY)}, ${refresh});
      } catch (e) {}
      try {
        var id = "bt-embedded-style";
        if (!document.getElementById(id)) {
          var s = document.createElement("style");
          s.id = id;
          s.textContent =
            "nav[data-bottom-nav]{display:none !important;}" +
            ".pb-24{padding-bottom:0 !important;}";
          (document.head || document.documentElement).appendChild(s);
        }
      } catch (e) {}
    })();
    true;
  `;
}

type Props = {
  /** 웹 라우트 경로. 예) "/shelf", "/community" */
  path: string;
};

/**
 * 특정 웹 화면을 WebView로 띄우는 탭. 홈·북로그·북메이트·북박스·내정보에 재사용한다.
 * - 네이티브 JWT를 주입해 로그인 공유
 * - 웹 하단바를 숨김(네이티브 탭바가 네비게이션을 담당)
 * - 웹에서 로그아웃/만료로 /login 이동 시 네이티브 토큰도 정리하고 로그인 화면으로
 * - Android 하드웨어 뒤로가기 → WebView 히스토리 뒤로
 */
export default function WebTab({ path }: Props) {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const canGoBack = useRef(false);

  const source = useMemo(() => ({ uri: `${WEB_BASE_URL}${path}` }), [path]);
  const injected = useMemo(() => buildInjection(), []);

  // Android 물리 뒤로가기: WebView 내부 히스토리를 우선 소비한다.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack.current) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, []),
  );

  function handleNavChange(nav: WebViewNavigation) {
    canGoBack.current = nav.canGoBack;
    // 웹에서 로그아웃/세션만료로 /login으로 가면 네이티브 토큰도 비우고 로그인 화면으로.
    if (nav.url.includes("/login")) {
      apiClient.logout();
      router.replace("/login");
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={source}
        injectedJavaScriptBeforeContentLoaded={injected}
        onNavigationStateChange={handleNavChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={["*"]}
        sharedCookiesEnabled
        domStorageEnabled
        startInLoadingState
      />
      {loading ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef1f6" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1f6",
  },
});
