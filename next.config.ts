import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
