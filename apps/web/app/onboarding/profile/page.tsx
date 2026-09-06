"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScaffold } from "../../../components/onboarding-scaffold";
import { Avatar } from "../../../components/ui";
import { CheckIcon } from "../../../components/icons";
import { AVATAR_COLORS, getProfile, setProfile } from "../../../lib/onboarding";

const NEXT = "/onboarding/invite";

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);

  useEffect(() => {
    const p = getProfile();
    setNickname(p.nickname);
    setColor(p.avatarColor);
  }, []);

  function handleNext() {
    setProfile({ avatarColor: color });
    router.push(NEXT);
  }

  return (
    <OnboardingScaffold
      step={1}
      title="프로필을 추가해보세요"
      description="색을 골라 나만의 프로필을 만들어요. 사진 업로드는 곧 지원돼요."
      primary={{ label: "다음", onClick: handleNext }}
      secondary={{ label: "나중에 할게요", href: NEXT }}
    >
      <div className="flex flex-col items-center gap-5">
        <Avatar nickname={nickname} color={color} size={120} />
        <p className="text-xl font-bold text-ink">{nickname || "닉네임"}</p>
      </div>

      <div className="mt-10">
        <p className="mb-3 text-sm font-bold text-ink">프로필 색</p>
        <div className="flex flex-wrap gap-3">
          {AVATAR_COLORS.map((c) => {
            const selected = c === color;
            return (
              <button
                key={c}
                type="button"
                aria-label={`색상 ${c}`}
                aria-pressed={selected}
                onClick={() => setColor(c)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-bold transition-transform ${
                  selected ? "border-line scale-105" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              >
                {selected ? <CheckIcon size={20} className="text-paper-pure" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingScaffold>
  );
}
