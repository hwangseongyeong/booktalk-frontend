# BookTalk Frontend

pnpm workspace 기반 모노레포. 웹(Next.js)을 우선 개발하고, 이후 모바일(Expo)을 추가합니다.

## 시작하기

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # API base URL 등 설정
pnpm dev:web
```

## 구조
- `apps/web`: Next.js 웹 (MVP 우선순위 1)
- `apps/mobile`: React Native/Expo (이후 착수)
- `packages/ui`: 공유 컴포넌트 (BookShelf, BookSpine 등)
- `packages/api-client`: 백엔드 API 호출 래퍼 + 타입

## 개발 시 참고
- 프로젝트 컨벤션은 `CLAUDE.md` 참고 (Claude Code 사용 시 자동 참조됨)
