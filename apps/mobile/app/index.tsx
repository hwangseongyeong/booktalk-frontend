import { useEffect, useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient, authStorage } from "@booktalk/api-client";

/**
 * 홈(스캐폴드). 로그인 안 돼 있으면 /login으로 보낸다.
 * 실제 화면(서재/기록/커뮤니티)은 이후 단계에서 RN 컴포넌트로 이식한다.
 */
export default function Home() {
  const [status, setStatus] = useState("백엔드 연결 확인 중...");
  const loggedIn = authStorage.getAccessToken() != null;

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    // 로그인 사용자 정보로 연결 확인
    apiClient
      .getMe()
      .then((me) => setStatus(`${me.nickname}님 환영합니다 · 백엔드 연결 OK`))
      .catch((e) => setStatus(`연결 실패: ${e instanceof Error ? e.message : "오류"}`));
  }, [loggedIn]);

  if (!loggedIn) return null;

  async function handleLogout() {
    apiClient.logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookTalk Mobile</Text>
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
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
  status: { fontSize: 13, color: "#374151", textAlign: "center" },
  logout: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#111827",
  },
  logoutText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
