"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@booktalk/api-client";
import { OnboardingScaffold } from "../../../components/onboarding-scaffold";
import { TextField } from "../../../components/ui";
import { getDraft, setDraft } from "../../../lib/onboarding";

const MIN = 2;
const MAX = 12;

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

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

  function handleNext() {
    if (!valid) return;
    setDraft({ nickname: trimmed });
    router.push("/onboarding/profile");
  }

  return (
    <OnboardingScaffold
      step={0}
      title="닉네임을 입력해주세요"
      description="서재와 기록에 표시되는 이름이에요. 나중에 바꿀 수 있어요."
      primary={{ label: "다음", onClick: handleNext, disabled: !valid }}
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
          if (e.key === "Enter") handleNext();
        }}
        hint={`${trimmed.length}/${MAX}자`}
        error={tooLong ? `${MAX}자 이하로 입력해주세요` : null}
      />
    </OnboardingScaffold>
  );
}
