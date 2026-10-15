"use client";

/**
 * 완독 리뷰의 '나의 감상 태그' 공용 조각.
 * - 완독 입력(records/[id]/complete)과 리뷰 수정(records/[id]/review)에서 함께 쓴다.
 */
import { useEffect, useRef, useState } from "react";

// 감정 / 분위기 — 한 섹션에서 함께 고른다. 저장 시 EMOTIONS/MOODS로 다시 분류한다.
export const EMOTIONS = [
  "감동적인", "따뜻한", "위로가 되는", "여운이 깊은",
  "설레는", "벅찬", "쓸쓸한", "슬픈",
  "먹먹한", "아련한", "묵직한", "통쾌한",
  "분노하는", "당혹스러운", "묘한", "용기를 얻는",
];
export const MOODS = [
  "매혹적인", "황홀한", "사랑스러운", "신비로운",
  "유쾌한", "잔잔한", "포근한", "담담한",
  "치밀한", "긴박한",
];
export const FEELINGS = [...EMOTIONS, ...MOODS];
export const MAX_FEELINGS = 3;

// 접힌 상태에서 칩을 약 4줄까지만 노출한다(칩 높이 ~38px + gap 8px 기준).
const COLLAPSED_MAX_PX = 184;

/** 한 섹션에서 고른 감상 태그를 저장용 emotions/moods로 분류한다. */
export function splitFeelings(feelings: string[]) {
  return {
    emotions: feelings.filter((w) => EMOTIONS.includes(w)),
    moods: feelings.filter((w) => MOODS.includes(w)),
  };
}

/** 감상 태그 토글(최대 MAX_FEELINGS). 이미 있으면 제거, 없고 한도 미만이면 추가. */
export function toggleFeeling(setter: React.Dispatch<React.SetStateAction<string[]>>) {
  return (word: string) =>
    setter((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= MAX_FEELINGS) return prev;
      return [...prev, word];
    });
}

/** 감상 태그 칩 섹션(최대 3개 다중 선택). 접힌 상태에선 4줄까지만 보이고 more로 토글한다. */
export function WordSection({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const reachedMax = selected.length >= MAX_FEELINGS;
  const chipsRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // 전체 칩 높이(scrollHeight)가 접힘 높이를 넘으면 more 버튼을 노출한다. 너비 변화 시 재측정.
  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    const check = () => setHasMore(el.scrollHeight > COLLAPSED_MAX_PX + 4);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [options]);

  return (
    <section className="mt-6">
      <h3 className="text-base font-bold text-gray-900">
        {title}
        <span className="text-gray-900">*</span>
        <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>
        <span className="ml-2 text-xs font-normal text-gray-400">
          {selected.length}/{MAX_FEELINGS}
        </span>
      </h3>
      <div
        ref={chipsRef}
        className={`mt-3 flex flex-wrap gap-2 ${expanded ? "" : "overflow-hidden"}`}
        style={{ maxHeight: expanded ? undefined : COLLAPSED_MAX_PX }}
      >
        {options.map((word) => {
          const active = selected.includes(word);
          const disabled = !active && reachedMax;
          return (
            <button
              key={word}
              type="button"
              onClick={() => onToggle(word)}
              disabled={disabled}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : disabled
                    ? "cursor-not-allowed border-gray-200 bg-white text-gray-300"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-bold text-gray-400 hover:text-gray-900"
        >
          {expanded ? "접기" : "more"}
        </button>
      )}
    </section>
  );
}
