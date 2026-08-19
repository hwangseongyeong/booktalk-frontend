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

## 소셜 로그인 (카카오/네이버/구글/페이스북)
1. `apps/web/.env.example`을 참고해 각 제공자 콘솔에서 클라이언트 ID를 발급받고 `.env.local`에 채워 넣습니다.
   - 각 제공자 콘솔에 등록할 **Redirect URI**는 `.env.local`의 `NEXT_PUBLIC_{PROVIDER}_REDIRECT_URI`와
     정확히 일치해야 합니다 (예: `http://localhost:3000/oauth/callback/kakao`).
2. 로그인 흐름: `/login` → 제공자 인가 화면으로 이동 → `/oauth/callback/{provider}`로 돌아와
   백엔드(`POST /api/v1/auth/{provider}/login`)에 code를 전달 → JWT(access/refresh) 발급받아
   `localStorage`에 저장.
3. 이후 `packages/api-client`가 모든 요청에 `Authorization: Bearer {accessToken}`을 자동으로 붙이고,
   401이면 refresh token으로 재발급을 1회 자동 시도합니다.
4. `/records`, `/shelf` 페이지는 `lib/useRequireAuth.ts` 가드로 비로그인 시 `/login`으로 리다이렉트됩니다.
   `/books`는 목록 조회는 비로그인도 가능하지만, 등록/읽기 시작은 로그인이 필요합니다.
