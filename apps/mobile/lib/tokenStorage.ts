import * as SecureStore from "expo-secure-store";
import type { TokenPersistenceAdapter } from "@booktalk/api-client";

const ACCESS_KEY = "booktalk_access_token";
const REFRESH_KEY = "booktalk_refresh_token";

/**
 * expo-secure-store 기반 토큰 저장 어댑터(모바일).
 * iOS 키체인 / Android 키스토어에 안전하게 저장한다.
 * api-client는 동기 읽기(getAccessToken)를 메모리 캐시로 처리하므로,
 * 앱 시작 시 hydrateAuth()로 이 load()를 1회 await 하면 된다.
 */
export const secureTokenStorage: TokenPersistenceAdapter = {
  async load() {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    return { accessToken, refreshToken };
  },
  async save(accessToken, refreshToken) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ]);
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
