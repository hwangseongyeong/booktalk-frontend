/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // 카카오 JS SDK를 같은 출처(/vendor/kakao-sdk.js)로 프록시한다.
      // 브라우저는 kakao 도메인으로 직접 요청하지 않으므로 광고/추적 차단기의
      // 도메인 기반 차단(ERR_BLOCKED_BY_CLIENT)을 우회한다. 실제 다운로드는 서버가 수행.
      {
        source: "/vendor/kakao-sdk.js",
        destination: "https://t1.kakao.com/kakao_js_sdk/2.7.4/kakao.min.js",
      },
    ];
  },
};

export default nextConfig;
