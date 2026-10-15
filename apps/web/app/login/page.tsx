"use client";

import { useEffect, useState } from "react";
import { buildAuthorizeUrl, OAUTH_LABELS, type OAuthProviderKey } from "../../lib/oauthProviders";
import {
  BubbleIcon,
  PaperPlaneIcon,
  PencilIcon,
} from "../../components/icons";
import { PillButton, ScreenShell } from "../../components/ui";

const ONBOARDING_KEY = "booktalk_onboarding_done";
const PROVIDERS: OAuthProviderKey[] = ["kakao", "naver", "google"];

// 로고(TEXT42 워드마크)는 이름·태그라인을 모두 포함한 완성형이라 별도 텍스트 없이 이미지만 쓴다.
// 로고 배경이 앱 배경(bg-paper #FAF9F5)과 같은 미색이라 화면에 자연스럽게 얹힌다.
function Wordmark({ width = 220 }: { width?: number }) {
  return (
    <div className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="text42" width={width} style={{ width }} className="h-auto" />
    </div>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenShell
      className="items-center justify-center gap-10 text-center"
      footer={<PillButton onClick={onNext}>text42는 →</PillButton>}
    >
      <Wordmark width={248} />
      <p className="text-base font-medium leading-loose text-ink-soft">
        책을 읽고, 생각을 가지고 놀고
        <br />
        이야기를 나누다.
        <br />
        text42에 오신 걸 환영합니다!
      </p>
    </ScreenShell>
  );
}

const FEATURES = [
  { Icon: PencilIcon, title: "기록", desc: "읽은 책을 정리하고\n나만의 서가를 완성해요" },
  { Icon: BubbleIcon, title: "북메이트", desc: "친구의 책을 보고\n함께 이야기 나눠요" },
  { Icon: PaperPlaneIcon, title: "공유", desc: "나의 독서 기록을\n이미지로 공유해요" },
];

function FeaturesScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenShell
      className="justify-center gap-14"
      footer={<PillButton onClick={onNext}>시작하기 →</PillButton>}
    >
      <div className="flex w-full flex-col gap-10">
        {FEATURES.map(({ Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-7">
            <Icon className="shrink-0 text-ink" />
            <div>
              <p className="text-lg font-bold text-ink">{title}</p>
              <p className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-muted">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function LoginScreen() {
  return (
    <ScreenShell
      className="items-center justify-center gap-9 text-center"
      footer={
        <>
          {PROVIDERS.map((provider) => (
            <PillButton key={provider} href={buildAuthorizeUrl(provider)}>
              {OAUTH_LABELS[provider]}로 로그인
            </PillButton>
          ))}
        </>
      }
    >
      <Wordmark width={208} />
      <p className="text-sm font-medium leading-relaxed text-muted">
        소셜 계정으로 로그인하고
        <br />내 서재를 만들어보세요
      </p>
    </ScreenShell>
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
