import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authStorage } from "@booktalk/api-client";

/**
 * 네이티브 하단 탭바. 콘텐츠 화면(홈/북로그/북메이트/북박스/내정보)은 WebView로 웹을 재사용하고,
 * 탭 전환·네비게이션은 네이티브가 담당한다(웹 하단바는 WebTab에서 숨김).
 * 미로그인 시 네이티브 로그인 화면으로 보낸다.
 */
export default function TabsLayout() {
  const loggedIn = authStorage.getAccessToken() != null;
  if (!loggedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { height: 58, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shelf"
        options={{
          title: "북로그",
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "북메이트",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookbox"
        options={{
          title: "북박스",
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "내 정보",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
