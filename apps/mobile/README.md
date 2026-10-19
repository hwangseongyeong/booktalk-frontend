# BookTalk Mobile (Expo / React Native)

안드로이드·iOS 네이티브 앱. 웹(`apps/web`)과 **백엔드·`@booktalk/api-client`·타입을 공유**하고,
화면 UI만 React Native로 작성한다. (모바일 웹은 기존 `apps/web`이 그대로 담당)

## 구조
- `app/` — expo-router 파일 기반 라우팅 (Next App Router와 유사)
  - `_layout.tsx` — 루트 레이아웃. SecureStore 토큰 어댑터 주입 + 토큰 하이드레이션
  - `index.tsx` — 스캐폴드 확인용 홈(백엔드 연결 확인)
- `lib/tokenStorage.ts` — `expo-secure-store` 기반 토큰 저장 어댑터
- `metro.config.js` — pnpm 모노레포용(워크스페이스 공유 패키지 해석)

## 처음 실행
```bash
# 1) 레포 루트에서 의존성 설치 (.npmrc의 node-linker=hoisted 적용됨)
pnpm install

# 2) 환경변수 (실기기는 localhost 대신 개발 PC의 LAN IP로)
cp apps/mobile/.env.example apps/mobile/.env

# 3) 개발 서버 실행 (QR로 Expo Go 앱 또는 시뮬레이터)
pnpm --filter mobile start
#   또는: cd apps/mobile && npx expo start
```
- iOS 시뮬레이터: `i` · 안드로이드 에뮬레이터: `a` · 실기기: Expo Go 앱으로 QR 스캔

> 버전 정렬이 필요하면 `cd apps/mobile && npx expo install --fix` 로 Expo SDK에 맞춰 조정한다.

## 다음 작업(이식 순서)
1. 소셜 로그인(`expo-auth-session` + 딥링크, 각 provider 콘솔에 모바일 리다이렉트 등록)
2. 핵심 화면: 서재/독서기록/책검색 (책등 SVG는 `react-native-svg`의 `SvgUri`로 렌더)
3. 커뮤니티/채팅 (RN 내장 WebSocket으로 `/ws/chat` 재사용)
4. EAS 빌드·스토어 배포 (`eas build` / `eas submit`)

## 주의
- 화면 UI는 웹과 공유되지 않는다(웹은 DOM/Tailwind, 모바일은 RN 컴포넌트). 로직·API는 공유.
- 백엔드 CORS 허용 Origin·OAuth 리다이렉트에 모바일(앱 스킴)을 추가해야 로그인이 동작한다.
