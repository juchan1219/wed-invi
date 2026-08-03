import type { Metadata, Viewport } from "next";
import { Nanum_Myeongjo, Gowun_Dodum } from "next/font/google";
import { wedding } from "@/config/wedding";
import "./globals.css";

// 한글 폰트는 next/font의 subset 목록에 'korean'이 없다.
// subsets를 지정하면 라틴 글리프만 내려와 한글이 시스템 폰트로 떨어지므로,
// subsets를 생략하고 preload를 끈다 — 이러면 Google Fonts CSS 전체(한글 청크 포함)를
// 받아 self-host 한다. 대신 preload 링크가 없어 폰트는 CSS 파싱 후 로드된다.
const myeongjo = Nanum_Myeongjo({
  weight: ["400", "700"],
  variable: "--font-myeongjo",
  preload: false,
  display: "swap",
});

const dodum = Gowun_Dodum({
  weight: "400",
  variable: "--font-dodum",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  // OG/트위터 이미지의 절대 URL을 만들 기준
  metadataBase: new URL(wedding.site.url),
  title: wedding.site.title,
  description: wedding.site.description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: wedding.site.title,
    title: wedding.site.title,
    description: wedding.site.description,
    url: "/",
    images: [
      {
        url: wedding.site.ogImage,
        width: 1200,
        height: 630,
        alt: wedding.site.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: wedding.site.title,
    description: wedding.site.description,
    images: [wedding.site.ogImage],
  },
  // 개인화 URL이 검색엔진에 잡히면 안 된다.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 사진을 확대해 보고 싶을 수 있으므로 확대를 막지 않는다.
  themeColor: "#fdfbf7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={`${myeongjo.variable} ${dodum.variable}`}
    >
      <body className="bg-paper-deep">{children}</body>
    </html>
  );
}
