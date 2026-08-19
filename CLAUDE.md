# BookTalk Frontend - Claude Code 가이드

이 문서는 Claude Code가 매 세션마다 프로젝트 컨텍스트를 빠르게 파악하기 위한 참고 문서입니다.

## 프로젝트 개요
독서 기록을 시각적 서재(책꽂이)로 보여주는 SNS형 독서 앱의 프론트엔드.
웹(Next.js)과 모바일(React Native/Expo)을 pnpm workspace 모노레포로 관리합니다.
MVP 단계에서는 **웹(apps/web)을 우선 완성**하고, 모바일은 이후 착수합니다.

## 모노레포 구조
```
booktalk-frontend/
├── apps/
│   ├── web/          # Next.js (MVP 우선순위 1)
│   └── mobile/        # React Native / Expo (이후 착수)
├── packages/
│   ├── ui/             # 공유 컴포넌트 (책등, 책장, 카드 등 시각화 컴포넌트)
│   ├── api-client/      # 백엔드 API 호출 로직 + 타입 (openapi-typescript로 백엔드 스펙에서 생성)
│   └── config/          # 공유 ESLint/TS 설정
├── pnpm-workspace.yaml
└── turbo.json
```

## 기술 스택
- Next.js 14 (App Router), TypeScript
- React Native + Expo (모바일, 이후 단계)
- Tailwind CSS
- pnpm workspace + Turborepo

## 네이밍/구조 컨벤션
- 컴포넌트: PascalCase 파일명 (`BookShelf.tsx`, `BookSpine.tsx`)
- API 호출은 반드시 `packages/api-client`를 통해서만 (컴포넌트에서 직접 fetch 금지)
- 페이지 라우팅은 Next.js App Router 컨벤션(`app/{route}/page.tsx`) 준수

## MVP 범위
- 회원가입/로그인 화면 (소셜 로그인 1개)
- 도서 검색/등록 화면
- 독서 기록 작성/조회
- **책꽂이 시각화 화면** (가장 중요 - packages/ui의 BookSpine, BookShelf 컴포넌트)
- 월별 서재 뷰

## 책등/책장 컴포넌트 (핵심)
- 책등 이미지는 백엔드에서 이미 생성/캐싱된 정적 이미지 URL(`book.spineImageUrl`)을 받아서 `<img>`로 렌더링만 합니다. 프론트에서 직접 색상 추출/SVG 생성 로직을 돌리지 않습니다 (성능/일관성 문제).
- `packages/ui/BookShelf.tsx`: 가로 스크롤 책꽂이, 책등 이미지들을 배열
- `packages/ui/BookSpine.tsx`: 개별 책등 이미지 래퍼 (로딩 스켈레톤, fallback 처리 포함)

## 코드 작성 시 참고
- 새 화면 추가 시 `apps/web/app/{route}/page.tsx` 생성 후 필요한 컴포넌트는 `packages/ui`에 먼저 있는지 확인
- 타입은 `packages/api-client`의 타입을 그대로 재사용 (중복 정의 금지)
- 스타일은 Tailwind 우선, 커스텀 CSS는 최소화
