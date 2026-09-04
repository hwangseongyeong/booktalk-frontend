"use client";

import { useState, useEffect } from "react";
import { buildAuthorizeUrl, OAUTH_LABELS, type OAuthProviderKey } from "../../lib/oauthProviders";

const ONBOARDING_KEY = "booktalk_onboarding_done";
const PROVIDERS: OAuthProviderKey[] = ["kakao", "naver", "google", "facebook"];

function BookTalkLogo({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 110 90" fill="none">
      {/* 왼쪽 페이지 */}
      <path
        d="M55 74 C44 71 22 67 10 63 L10 27 C22 31 44 35 55 38 Z"
        stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* 오른쪽 페이지 */}
      <path
        d="M55 74 C66 71 88 67 100 63 L100 27 C88 31 66 35 55 38 Z"
        stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* 왼쪽 페이지 줄 */}
      <line x1="18" y1="37" x2="50" y2="42" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="48" x2="50" y2="53" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="59" x2="50" y2="64" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      {/* 오른쪽 페이지 줄 */}
      <line x1="60" y1="42" x2="92" y2="37" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="53" x2="92" y2="48" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      {/* 말풍선 */}
      <rect x="62" y="2" width="44" height="28" rx="8" stroke="black" strokeWidth="3" />
      {/* 말풍선 꼬리 */}
      <path d="M72 30 L65 41 L80 30" fill="white" stroke="black" strokeWidth="3" strokeLinejoin="round" />
      {/* 점 3개 */}
      <circle cx="76" cy="16" r="3" fill="black" />
      <circle cx="84" cy="16" r="3" fill="black" />
      <circle cx="92" cy="16" r="3" fill="black" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path
        d="M38 7 L45 14 L16 43 L7 45 L9 36 Z"
        stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="34" y1="11" x2="41" y2="18" stroke="black" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path
        d="M26 7 C13 7 5 15 5 24 C5 33 13 41 26 41 C29 41 32 40 35 39 L44 44 L40 35 C43 32 47 28 47 24 C47 15 39 7 26 7 Z"
        stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="18" cy="24" r="2.5" fill="black" />
      <circle cx="26" cy="24" r="2.5" fill="black" />
      <circle cx="34" cy="24" r="2.5" fill="black" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path
        d="M6 7 L46 24 L24 30 L17 46 Z"
        stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="24" y1="30" x2="46" y2="24" stroke="black" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="30" x2="30" y2="40" stroke="black" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-10 bg-white px-10">
      <div className="flex flex-col items-center gap-3">
        <BookTalkLogo size={120} />
        <p className="text-2xl font-bold tracking-tight text-gray-900">BookTalk</p>
      </div>
      <p className="text-center text-base leading-loose text-gray-800">
        책을 읽고, 생각을 가지고 놀고<br />
        이야기를 나누다.<br />
        복톡(가제)에 오신걸 환영합니다!
      </p>
      <button
        onClick={onNext}
        className="w-full rounded-full bg-gray-900 py-4 text-base font-medium text-white"
      >
        BookTalk은 →
      </button>
    </main>
  );
}

const FEATURES = [
  {
    Icon: PencilIcon,
    title: "기록",
    desc: "읽은 책을 정리하고\n나만의 서가를 완성해요",
  },
  {
    Icon: BubbleIcon,
    title: "소통",
    desc: "친구의 책을 보고\n함께 이야기 나눠요",
  },
  {
    Icon: PaperPlaneIcon,
    title: "공유",
    desc: "나의 독서 기록을\n이미지로 공유해요",
  },
];

function FeaturesScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-14 bg-white px-10">
      <div className="flex w-full flex-col gap-10">
        {FEATURES.map(({ Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-8">
            <div className="shrink-0">
              <Icon />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{title}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full rounded-full bg-gray-900 py-4 text-base font-medium text-white"
      >
        시작하기 →
      </button>
    </main>
  );
}

function LoginScreen() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 bg-white px-10">
      <div className="flex flex-col items-center gap-3">
        <BookTalkLogo size={100} />
        <p className="text-2xl font-bold tracking-tight text-gray-900">BookTalk</p>
        <p className="text-center text-sm leading-relaxed text-gray-600">
          소셜 계정으로 로그인하고<br />내 서재를 만들어보세요
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {PROVIDERS.map((provider) => (
          <a
            key={provider}
            href={buildAuthorizeUrl(provider)}
            className="w-full rounded-full bg-gray-900 py-4 text-center text-base font-medium text-white"
          >
            {OAUTH_LABELS[provider]}로 로그인
          </a>
        ))}
      </div>
    </main>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    setStep(done ? 2 : 0);
  }, []);

  function nextStep() {
    setStep((prev) => {
      const next = (prev ?? 0) + 1;
      if (next === 2) localStorage.setItem(ONBOARDING_KEY, "1");
      return next;
    });
  }

  if (step === null) return null;
  if (step === 0) return <WelcomeScreen onNext={nextStep} />;
  if (step === 1) return <FeaturesScreen onNext={nextStep} />;
  return <LoginScreen />;
}
