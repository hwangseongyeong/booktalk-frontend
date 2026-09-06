"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient, authStorage } from "@booktalk/api-client";
import {
  clearNaverState,
  getSavedNaverState,
  type OAuthProviderKey,
} from "../../../../lib/oauthProviders";
import { postLoginPath } from "../../../../lib/onboarding";

const VALID_PROVIDERS: OAuthProviderKey[] = ["kakao", "naver", "google", "facebook"];

function redirectUriFor(provider: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/oauth/callback/${provider}`;
}

function CallbackInner() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = params.provider;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const providerError = searchParams.get("error");

    if (providerError) {
      setError("로그인이 취소되었습니다.");
      return;
    }
    if (!provider || !VALID_PROVIDERS.includes(provider as OAuthProviderKey)) {
      setError("지원하지 않는 로그인 방식입니다.");
      return;
    }
    if (!code) {
      setError("인증 코드가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (provider === "naver") {
      const savedState = getSavedNaverState();
      if (!state || state !== savedState) {
        setError("로그인 요청이 유효하지 않습니다. 다시 시도해주세요.");
        return;
      }
      clearNaverState();
    }

    apiClient
      .loginWithOAuth(provider as OAuthProviderKey, {
        code,
        redirectUri: redirectUriFor(provider),
        state: state ?? undefined,
      })
      .then((tokens) => {
        authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
        // 온보딩(닉네임·프로필·친구초대) 미완료 사용자는 온보딩으로, 완료 사용자는 홈으로.
        router.replace(postLoginPath());
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
      });
    // 최초 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <a href="/login" className="mt-4 text-sm underline">
            다시 로그인하기
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-400">로그인 처리 중...</p>
      )}
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-8">
          <p className="text-sm text-gray-400">로그인 처리 중...</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
