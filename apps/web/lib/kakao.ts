/**
 * 카카오톡 공유(모임 초대) 헬퍼.
 *
 * 카카오 JS SDK를 지연 로드해 Kakao.Share.sendDefault 로 친구에게 모임 초대 메시지를 보낸다.
 * - 책 표지(절대 URL)가 있으면 리치 카드(feed), 없으면 텍스트 템플릿으로 자동 폴백한다.
 *   (feed 템플릿은 imageUrl이 필수라 표지가 없을 때를 대비한다)
 * - 백엔드 호출이 아니라 클라이언트 SDK 연동이므로 api-client가 아닌 여기 둔다.
 *
 * 사전 준비: 카카오 개발자 콘솔에서 JavaScript 키 발급(NEXT_PUBLIC_KAKAO_JS_KEY) +
 * 플랫폼 > Web 사이트 도메인에 서비스 도메인 등록이 필요하다.
 */

// 카카오 JS SDK v2 (https://developers.kakao.com/docs/latest/ko/kakao-login/js)
const SDK_URL = "https://t1.kakao.com/kakao_js_sdk/2.7.4/kakao.min.js";

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

type KakaoLink = { mobileWebUrl: string; webUrl: string };
type KakaoSdk = {
  isInitialized: () => boolean;
  init: (jsKey: string) => void;
  Share: {
    sendDefault: (settings: Record<string, unknown>) => void;
  };
};

let loadPromise: Promise<void> | null = null;

/** JS 키가 설정돼 있는지 (빌드 타임에 인라인됨). */
export function isKakaoShareConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
}

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 공유할 수 있어요."));
  }
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("카카오 SDK를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

async function ensureKakao(): Promise<KakaoSdk> {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) {
    throw new Error("카카오 공유가 설정되지 않았어요. (NEXT_PUBLIC_KAKAO_JS_KEY)");
  }
  await loadSdk();
  const kakao = window.Kakao!;
  if (!kakao.isInitialized()) kakao.init(jsKey);
  return kakao;
}

/** 모임 초대 메시지를 카카오톡으로 공유한다. */
export async function shareMeetingToKakao(params: {
  /** 초대 수신자가 열게 될 참여 링크(절대 URL) */
  url: string;
  meetingName: string;
  bookTitle: string;
  coverImageUrl: string | null;
}): Promise<void> {
  const { url, meetingName, bookTitle, coverImageUrl } = params;
  const kakao = await ensureKakao();
  const link: KakaoLink = { mobileWebUrl: url, webUrl: url };

  if (coverImageUrl && /^https?:\/\//.test(coverImageUrl)) {
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `📚 '${bookTitle}' 독서 모임 초대`,
        description: meetingName,
        imageUrl: coverImageUrl,
        link,
      },
      buttons: [{ title: "모임 참여하기", link }],
    });
    return;
  }

  kakao.Share.sendDefault({
    objectType: "text",
    text: `📚 '${bookTitle}' 독서 모임 '${meetingName}'에 초대합니다!`,
    link,
    buttonTitle: "모임 참여하기",
  });
}
