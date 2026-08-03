import { wedding } from "@/config/wedding";

/**
 * 지도 앱 연결.
 *
 * 세 앱 모두 커스텀 스킴(nmap://, kakaomap://, tmap://)이 1순위이고,
 * 앱이 없거나 카카오톡 인앱 브라우저처럼 스킴이 막힌 환경에서는
 * 웹 URL로 떨어진다. 스킴 실행 여부는 감지할 방법이 없어서
 * "1.2초 뒤에도 페이지가 계속 보이면 실패한 것"으로 판단한다.
 *
 * ⚠️ 이 분기는 실제 기기(iOS·Android × 카카오톡 인앱 브라우저)에서 확인이 필요하다.
 */

export type MapApp = "naver" | "kakao" | "tmap";

export const MAP_APPS: { id: MapApp; label: string }[] = [
  { id: "naver", label: "네이버지도" },
  { id: "kakao", label: "카카오맵" },
  { id: "tmap", label: "티맵" },
];

const { name, address, lat, lng } = wedding.venue;

/** 네이버 지도 스킴은 appname(호출한 앱 식별자)을 필수로 요구한다. */
function naverAppName(): string {
  try {
    return new URL(wedding.site.url).hostname;
  } catch {
    return "wed-invi";
  }
}

type MapLink = { scheme: string; web: string };

export function mapLinks(app: MapApp): MapLink {
  const q = encodeURIComponent(name);

  switch (app) {
    case "naver":
      return {
        scheme: `nmap://place?lat=${lat}&lng=${lng}&name=${q}&appname=${encodeURIComponent(naverAppName())}`,
        web: `https://map.naver.com/p/search/${encodeURIComponent(address)}`,
      };
    case "kakao":
      return {
        scheme: `kakaomap://look?p=${lat},${lng}`,
        // 카카오맵 링크 API. 모바일에서는 앱으로 연결된다.
        web: `https://map.kakao.com/link/map/${q},${lat},${lng}`,
      };
    case "tmap":
      return {
        // 티맵은 x가 경도, y가 위도다 (네이버·카카오와 순서가 반대).
        scheme: `tmap://route?goalname=${q}&goalx=${lng}&goaly=${lat}`,
        // 티맵은 공개된 웹 길찾기가 없어 카카오맵 길찾기로 떨어뜨린다.
        web: `https://map.kakao.com/link/to/${q},${lat},${lng}`,
      };
  }
}

/**
 * 스킴을 먼저 시도하고, 앱이 열리지 않으면 웹으로 보낸다.
 * 브라우저에서만 호출할 것.
 */
export function openMapApp(app: MapApp): void {
  const { scheme, web } = mapLinks(app);

  let settled = false;
  const settle = () => {
    settled = true;
  };

  // 앱으로 전환되면 문서가 hidden 되거나 페이지가 blur 된다 → fallback 취소.
  document.addEventListener("visibilitychange", settle, { once: true });
  window.addEventListener("pagehide", settle, { once: true });
  window.addEventListener("blur", settle, { once: true });

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", settle);
    window.removeEventListener("pagehide", settle);
    window.removeEventListener("blur", settle);
    if (!settled && document.visibilityState === "visible") {
      window.location.href = web;
    }
  }, 1200);

  window.location.href = scheme;
}
