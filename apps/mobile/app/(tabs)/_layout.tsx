import { Redirect, Tabs } from "expo-router";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authStorage } from "@booktalk/api-client";

/**
 * 네이티브 하단 탭바. 웹 하단바(apps/web/components/bottom-nav.tsx)와 "모양·크기"를 맞춘다.
 * - 웹과 동일한 Figma 추출 PNG 아이콘(assets/nav/*.png)을 그대로 사용(Ionicons 대신)
 * - 웹 값과 동일: 아이콘 높이 36px, 라벨 11px/bold, 활성 불투명도 100·비활성 40,
 *   바 높이 80px, 상단 경계선 gray-200, 흰 배경
 * 콘텐츠 화면은 WebView로 웹을 재사용하고, 탭 전환만 네이티브가 담당한다.
 */

// 각 아이콘의 원본 비율(가로/세로)로 웹의 `h-9 w-auto`(세로 36px, 가로 자동)를 재현한다.
const ICONS = {
  home: { src: require("../../assets/nav/home.png"), ratio: 210 / 212 },
  shelf: { src: require("../../assets/nav/shelf.png"), ratio: 285 / 212 },
  chat: { src: require("../../assets/nav/chat.png"), ratio: 258 / 227 },
  box: { src: require("../../assets/nav/box.png"), ratio: 228 / 220 },
  my: { src: require("../../assets/nav/my.png"), ratio: 217 / 226 },
} as const;

function TabIcon({ name, focused }: { name: keyof typeof ICONS; focused: boolean }) {
  const { src, ratio } = ICONS[name];
  return (
    <Image
      source={src}
      resizeMode="contain"
      style={{ height: 36, aspectRatio: ratio, opacity: focused ? 1 : 0.4 }}
    />
  );
}

export default function TabsLayout() {
  const loggedIn = authStorage.getAccessToken() != null;
  const insets = useSafeAreaInsets();
  if (!loggedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          height: 80 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 8,
          borderTopColor: "#e5e7eb",
          backgroundColor: "#ffffff",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 4 },
        tabBarIconStyle: { height: 36 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "홈", tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="shelf"
        options={{ title: "북로그", tabBarIcon: ({ focused }) => <TabIcon name="shelf" focused={focused} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: "북메이트", tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} /> }}
      />
      <Tabs.Screen
        name="bookbox"
        options={{ title: "북박스", tabBarIcon: ({ focused }) => <TabIcon name="box" focused={focused} /> }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: "내 정보", tabBarIcon: ({ focused }) => <TabIcon name="my" focused={focused} /> }}
      />
    </Tabs>
  );
}
