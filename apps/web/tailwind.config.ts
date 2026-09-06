import type { Config } from "tailwindcss";

/**
 * BookTalk 디자인 토큰.
 * 피그마 "독서앱 개발 프로젝트" 기준:
 *  - 화이트 & 블랙 메인 + 약간의 미색(paper)
 *  - 볼드한 서체, 심플, 손그림 느낌
 *  - 굵은 라인(2.7px) 테두리, 알약(pill) 버튼
 *  - accent(#3700FF)는 피그마 메모의 후보색. 등록만 하고 기본 UI에는 쓰지 않는다.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#111111", // 본문/라인 기본 검정 (완전한 #000보다 살짝 부드럽게)
          soft: "#3D3D3D",
          pure: "#000000",
        },
        paper: {
          DEFAULT: "#FAF9F5", // 화면 배경 미색
          pure: "#FFFFFF", // 카드/입력 등 순백이 필요한 곳
        },
        line: "#111111", // 굵은 테두리 색
        muted: {
          DEFAULT: "#9A9A9A", // 비활성 텍스트
          light: "#C9C7C1", // 더 옅은 보조 텍스트/플레이스홀더
        },
        fill: {
          DEFAULT: "#F1F0EB", // 옅은 채움(스켈레톤, 미선택 토글)
          strong: "#E5E3DC",
        },
        accent: {
          DEFAULT: "#3700FF", // 후보 액센트 — 기본 미사용
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      borderRadius: {
        field: "6px", // 입력창/검색바
        card: "20px", // 카드/모달
      },
      borderWidth: {
        bold: "2.7px", // 피그마 카드 스트로크
      },
      maxWidth: {
        app: "26rem", // 모바일 화면 셸 (= max-w-md, 명시적으로 토큰화)
      },
    },
  },
  plugins: [],
};

export default config;
