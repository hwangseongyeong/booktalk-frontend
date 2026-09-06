"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@booktalk/api-client";
import { OnboardingScaffold } from "../../../components/onboarding-scaffold";
import { Avatar } from "../../../components/ui";
import { PlusIcon } from "../../../components/icons";
import { clearDraft, getDraft } from "../../../lib/onboarding";

const SLOTS = 5;

export default function InvitePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [invited, setInvited] = useState(0);
  const [copied, setCopied] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = getDraft();
    setNickname(draft.nickname);
    setColor(draft.avatarColor);
  }, []);

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    setError(null);
    try {
      await apiClient.completeOnboarding();
      clearDraft();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.");
      setFinishing(false);
    }
  }

  async function shareInvite() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/login?ref=${encodeURIComponent(nickname || "friend")}`
        : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "BookTalk", text: "북톡에서 같이 책 읽어요", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
      setInvited((n) => Math.min(n + 1, SLOTS));
    } catch {
      /* 사용자가 공유를 취소한 경우 — 무시 */
    }
  }

  return (
    <OnboardingScaffold
      step={2}
      title="친구를 초대해보세요"
      description="함께하는 친구가 있으면 서로의 서재를 구경하고 이야기 나눌 수 있어요."
      primary={{
        label: finishing ? "시작하는 중..." : "초대하고 시작하기",
        onClick: async () => {
          await shareInvite();
          await finish();
        },
        disabled: finishing,
      }}
      secondary={{ label: "나중에 할게요", onClick: finish, disabled: finishing }}
    >
      <div className="flex flex-wrap justify-center gap-4">
        <Avatar nickname={nickname} color={color} size={84} />
        {Array.from({ length: SLOTS }).map((_, i) => {
          const filled = i < invited;
          return (
            <button
              key={i}
              type="button"
              onClick={shareInvite}
              aria-label={filled ? "초대한 친구" : "친구 초대하기"}
              className={`flex h-[84px] w-[84px] items-center justify-center rounded-full border-bold ${
                filled ? "border-line bg-fill" : "border-muted-light border-dashed text-muted"
              }`}
            >
              {filled ? (
                <span className="text-lg font-bold text-ink">친구</span>
              ) : (
                <PlusIcon size={26} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pt-8">
        {copied ? (
          <p className="text-sm font-bold text-ink">초대 링크를 복사했어요</p>
        ) : null}
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </OnboardingScaffold>
  );
}
