import { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { login as kakaoLogin } from "@react-native-kakao/user";
import { apiClient, authStorage } from "@booktalk/api-client";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKakaoLogin() {
    setError(null);
    setLoading(true);
    try {
      // 1) 네이티브 카카오 로그인(카카오톡 앱 또는 카카오 계정) → 카카오 access token
      const token = await kakaoLogin();
      // 2) 카카오 토큰을 백엔드로 보내 BookTalk JWT 발급
      const pair = await apiClient.loginWithKakaoToken(token.accessToken);
      // 3) JWT 저장(SecureStore) 후 홈으로
      authStorage.setTokens(pair.accessToken, pair.refreshToken);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookTalk</Text>
      <Text style={styles.subtitle}>독서 기록을 시각적 서재로</Text>

      <TouchableOpacity
        style={styles.kakaoButton}
        onPress={handleKakaoLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#191600" />
        ) : (
          <Text style={styles.kakaoText}>카카오로 시작하기</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    gap: 10,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 32 },
  kakaoButton: {
    width: "100%",
    maxWidth: 320,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FEE500", // 카카오 공식 노란색
    alignItems: "center",
    justifyContent: "center",
  },
  kakaoText: { fontSize: 16, fontWeight: "700", color: "#191600" },
  error: { marginTop: 12, color: "#dc2626", fontSize: 13, textAlign: "center" },
});
