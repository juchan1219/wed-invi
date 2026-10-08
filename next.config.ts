import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 파일명에 크롭 지점·비트레이트·버전을 넣은 배경음악은 내용이 바뀌면 새 이름으로 배포한다.
  // 4MB 음원을 재방문 때 다시 받지 않도록 장기 캐시한다.
  headers() {
    return [
      {
        source: "/audio/merry-go-round-49s-128k-v1.m4a",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // 색인 차단을 **비-HTML 응답까지** 넓힌다. layout.tsx의 `robots` 는 HTML
      // 메타태그만 만들어서 `og.jpg`·`/audio/*`·`/uploads/*` 에는 적용되지 않았다.
      // `noimageindex` 는 사진 색인을, `noarchive` 는 캐시 사본을 막는다.
      //
      // ⚠️ Wayback Machine 은 `noarchive` 와 robots.txt 를 **무시한다.**
      //    이걸로 아카이브를 막았다고 적지 말 것.
      // 뒤의 두 헤더는 최신 브라우저 기본값과 같아 실익이 거의 없다 — 의도 명시용이다.
      {
        source: "/(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // 개발 전용. 휴대폰에서 `http://192.168.x.x:3000`으로 접속하면 Next 16이 dev 리소스(JS chunk·HMR)를
  // cross-origin으로 보고 403을 내서 hydration이 안 되고, 댄스가 정적 fallback 목록으로 고정된다.
  // 사설 IP 대역만 허용한다. 배포(next start/Vercel)에는 영향이 없다.
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
  ],

  images: {
    // 최신 포맷 우선. 브라우저가 지원하면 AVIF, 아니면 WebP, 마지막이 원본.
    formats: ["image/avif", "image/webp"],
    // 청첩장은 사실상 모바일 전용이므로 큰 뷰포트 후보를 줄여
    // Vercel 이미지 변환 횟수(무료 5K/월)를 아낀다.
    deviceSizes: [360, 420, 640, 828, 1080, 1200],
    // 갤러리 썸네일용 폭. Next 16 기본값에서 16은 이미 제거됨.
    imageSizes: [96, 128, 200, 256, 384],
    // Next 16부터 qualities 기본값이 [75]로 제한된다.
    // 웨딩 사진은 85로 올리되, 목록에 없는 값은 가장 가까운 값으로 강제되므로 둘 다 등록.
    qualities: [75, 85],
    // 편지 본문에 삽입되는 이미지(Vercel Blob)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  // 스트리밍 메타데이터는 Next의 기본 봇 목록에 있는 크롤러에만 비활성화되는데,
  // 카카오톡 스크래퍼는 그 목록에 없다. 링크 미리보기가 핵심 요구사항이므로
  // 전체 요청에 대해 블로킹 메타데이터를 쓴다. (페이지 수가 적어 비용이 사실상 없다.)
  htmlLimitedBots: /.*/,
};

export default nextConfig;
