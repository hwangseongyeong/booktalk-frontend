/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // 카카오 JS SDK를 같은 출처로 프록시한다. 실제 다운로드는 서버가 수행.
      // 경로에 'kakao'/'sdk' 등 키워드를 넣지 않는다 — 광고/추적 차단기(특히 한국 List-KR)는
      // 도메인뿐 아니라 URL 경로 키워드로도 차단(ERR_BLOCKED_BY_CLIENT)하기 때문.
      {
        source: "/assets/bt-client.js",
        destination: "https://t1.kakao.com/kakao_js_sdk/2.7.4/kakao.min.js",
      },
    ];
  },
};

export default nextConfig;
