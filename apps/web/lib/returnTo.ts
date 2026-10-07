/**
 * 로그인 후 돌아갈 경로를 보존한다(초대 링크 등 딥링크 대응).
 * OAuth는 외부로 나갔다 같은 탭·같은 출처로 돌아오므로 sessionStorage로 충분하다.
 */
const KEY = "booktalk.returnTo";

export function saveReturnTo(path: string): void {
  try {
    // 로그인/콜백 자체로는 되돌아가지 않는다.
    if (!path || path.startsWith("/login") || path.startsWith("/oauth")) return;
    sessionStorage.setItem(KEY, path);
  } catch {
    // sessionStorage 미지원 환경 방어
  }
}

/** 저장된 복귀 경로를 꺼내고 제거한다(일회성). */
export function takeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
