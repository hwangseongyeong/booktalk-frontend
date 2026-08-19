"use client";

import Link from "next/link";
import { buildAuthorizeUrl, OAUTH_LABELS, type OAuthProviderKey } from "../../lib/oauthProviders";

const PROVIDERS: OAuthProviderKey[] = ["kakao", "naver", "google", "facebook"];

const PROVIDER_STYLE: Record<OAuthProviderKey, string> = {
  kakao: "bg-[#FEE500] text-black border-[#FEE500]",
  naver: "bg-[#03C75A] text-white border-[#03C75A]",
  google: "bg-white text-gray-900 border-gray-300",
  facebook: "bg-[#1877F2] text-white border-[#1877F2]",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium">BookTalk</h1>
        <p className="mt-2 text-sm text-gray-500">소셜 계정으로 로그인하고 내 서재를 만들어보세요</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {PROVIDERS.map((provider) => (
          <a
            key={provider}
            href={buildAuthorizeUrl(provider)}
            className={`rounded-md border py-3 text-center text-sm font-medium ${PROVIDER_STYLE[provider]}`}
          >
            {OAUTH_LABELS[provider]}로 로그인
          </a>
        ))}
      </div>

      <Link href="/" className="text-xs text-gray-400 hover:underline">
        ← 홈으로
      </Link>
    </main>
  );
}
