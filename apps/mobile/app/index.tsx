import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { apiClient, authStorage } from "@booktalk/api-client";

/**
 * 스캐폴드 확인용 홈 화면.
 * 공유 패키지(@booktalk/api-client)가 모바일에서 정상 연결되는지 보여준다.
 * 실제 화면(서재/기록/커뮤니티)은 이후 단계에서 RN 컴포넌트로 이식한다.
 */
export default function Home() {
  const [status, setStatus] = useState<string>("백엔드 연결 확인 중...");

  useEffect(() => {
    // 공개 엔드포인트로 연결 확인(인증 불필요). 실패해도 앱은 동작.
    apiClient
      .searchBooks("해리포터")
      .then((books) => setStatus(`백엔드 연결 OK · 검색 결과 ${books.length}건`))
      .catch((e) => setStatus(`백엔드 연결 실패: ${e instanceof Error ? e.message : "오류"}`));
  }, []);

  const loggedIn = authStorage.getAccessToken() != null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookTalk Mobile</Text>
      <Text style={styles.badge}>{loggedIn ? "로그인됨" : "로그인 필요"}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1f6",
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  badge: { fontSize: 13, color: "#6b7280" },
  status: { fontSize: 13, color: "#374151", textAlign: "center" },
});
