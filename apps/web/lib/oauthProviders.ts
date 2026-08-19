export type OAuthProviderKey = "kakao" | "naver" | "google" | "facebook";

export const OAUTH_LABELS: Record<OAuthProviderKey, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
  facebook: "페이스북",
};

const NAVER_STATE_KEY = "booktalk_oauth_state_naver";

function randomState() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * 각 제공자의 인가(authorize) 화면 URL을 만든다.
 * Next.js는 process.env.NEXT_PUBLIC_* 를 빌드 타임에 리터럴로 치환하므로,
 * 변수로 키를 조립하지 않고 각 case마다 명시적으로 참조한다.
 */
export function buildAuthorizeUrl(provider: OAuthProviderKey): string {
  switch (provider) {
    case "kakao": {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "",
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? "",
        response_type: "code",
      });
      return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    }
    case "naver": {
      const state = randomState();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(NAVER_STATE_KEY, state);
      }
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "",
        redirect_uri: process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI ?? "",
        response_type: "code",
        state,
      });
      return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
    }
    case "google": {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "",
        response_type: "code",
        scope: "openid email profile",
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    case "facebook": {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ?? "",
        redirect_uri: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI ?? "",
        response_type: "code",
        scope: "email public_profile",
      });
      return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
    }
  }
}

/** 콜백 페이지에서 네이버 state를 검증할 때 사용. 검증 후 반드시 clearNaverState()로 지운다. */
export function getSavedNaverState(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(NAVER_STATE_KEY);
}

export function clearNaverState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(NAVER_STATE_KEY);
}
