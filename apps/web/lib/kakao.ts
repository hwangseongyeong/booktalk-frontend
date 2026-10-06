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

// 카카오 JS SDK v2 (Kakao.Share). 순서대로 시도한다.
// 1순위는 같은 출처 프록시(/assets/bt-client.js, next.config rewrites) — 경로에 kakao/sdk 키워드가
//   없어 광고/추적 차단기(도메인·경로 키워드 기반, ERR_BLOCKED_BY_CLIENT)를 우회한다.
// 이후는 kakao CDN 직접 로드(버전 404 대비 여러 버전).
// (https://developers.kakao.com/docs/latest/ko/kakao-login/js)
const SDK_URLS = [
  "/assets/bt-client.js",
  "https://t1.kakao.com/kakao_js_sdk/2.7.4/kakao.min.js",
  "https://t1.kakao.com/kakao_js_sdk/2.7.2/kakao.min.js",
  "https://t1.kakao.com/kakao_js_sdk/2.6.0/kakao.min.js",
];

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

function loadScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    // integrity/crossorigin 없이 평범한 스크립트로 불러온다(CORS 요구 제거해 로드 실패 가능성 최소화).
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`로드 실패: ${src}`));
    };
    document.head.appendChild(script);
  });
}

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 공유할 수 있어요."));
  }
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    for (const url of SDK_URLS) {
      try {
        await loadScript(url);
        if (window.Kakao) return;
      } catch {
        // 다음 후보 URL로 재시도
      }
    }
    loadPromise = null;
    throw new Error(
      "카카오 SDK를 불러오지 못했어요. 광고/추적 차단 확장 프로그램이나 네트워크 차단을 확인해 주세요.",
    );
  })();
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
