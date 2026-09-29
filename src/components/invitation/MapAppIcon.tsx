import Image, { type StaticImageData } from "next/image";
import kakaoMapIcon from "@/assets/map-icons/kakao-map.webp";
import naverMapIcon from "@/assets/map-icons/naver-map.webp";
import tmapIcon from "@/assets/map-icons/tmap.webp";
import type { MapApp } from "@/lib/maps";

export function MapAppIcon({ app }: { app: MapApp }) {
  const icons: Record<MapApp, StaticImageData> = {
    naver: naverMapIcon,
    kakao: kakaoMapIcon,
    tmap: tmapIcon,
  };
  return (
    <Image
      src={icons[app]}
      alt=""
      aria-hidden="true"
      sizes="28px"
      className="h-full w-full rounded-[22%] object-cover"
    />
  );
}
