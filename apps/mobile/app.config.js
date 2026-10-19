// app.json을 기반으로 하되, 카카오 네이티브 SDK 플러그인을 환경변수로 주입한다.
// (네이티브 앱 키를 코드/깃에 하드코딩하지 않고 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY로 받는다.)
// 키가 없으면 플러그인을 넣지 않아, 키 없이도 prebuild/빌드가 깨지지 않게 한다.
//
// 주의:
// - 플러그인은 bare 이름('@react-native-kakao/core')이 아니라 app.plugin.js 경로로 참조한다.
//   (Expo가 bare 이름을 패키지 메인(ESM)으로 오인해 로드 실패하는 문제 회피)
// - android/ios는 객체로 넘겨야 실제 네이티브 설정(로그인 스킴/URL 처리)이 적용된다.
module.exports = ({ config }) => {
  const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(kakaoNativeAppKey
        ? [
            [
              "@react-native-kakao/core/app.plugin.js",
              {
                nativeAppKey: kakaoNativeAppKey,
                android: { authCodeHandlerActivity: true },
                ios: { handleKakaoOpenUrl: true },
              },
            ],
          ]
        : []),
    ],
  };
};
