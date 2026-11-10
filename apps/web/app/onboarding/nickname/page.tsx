"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@booktalk/api-client";
import { OnboardingScaffold } from "../../../components/onboarding-scaffold";
import { TextField } from "../../../components/ui";
import { clearDraft, getDraft, setDraft } from "../../../lib/onboarding";

const MIN = 2;
const MAX = 12;

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = getDraft().nickname;
    if (draft) {
      setNickname(draft);
      return;
    }
    // draft가 없으면 소셜 제공자가 넣어준 기본 닉네임을 채워준다.
    apiClient
      .getMyProfile()
      .then((me) => setNickname((cur) => cur || me.nickname))
      .catch(() => {});
  }, []);

  const trimmed = nickname.trim();
  const tooLong = trimmed.length > MAX;
  const valid = trimmed.length >= MIN && !tooLong;

  async function handleStart() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    setDraft({ nickname: trimmed });
    try {
      await apiClient.updateMyProfile({ nickname: trimmed });
      await apiClient.completeOnboarding();
      clearDraft();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.");
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={0}
      title="닉네임을 입력해주세요"
      description="서재와 기록에 표시되는 이름이에요. 나중에 바꿀 수 있어요."
      primary={{ label: saving ? "시작하는 중..." : "시작하기", onClick: handleStart, disabled: !valid || saving }}
    >
      <TextField
        label="닉네임"
        hideLabel
        shape="pill"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임 입력"
        maxLength={MAX + 4}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleStart();
        }}
        hint={`${trimmed.length}/${MAX}자`}
        error={tooLong ? `${MAX}자 이하로 입력해주세요` : error}
      />
    </OnboardingScaffold>
  );
}
