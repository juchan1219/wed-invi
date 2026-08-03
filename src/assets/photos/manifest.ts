// 이 파일은 `npm run photos:prep` 이 생성합니다. 직접 고치지 마세요.
// 사진을 추가/교체하려면 photos/ 폴더의 원본을 바꾸고 스크립트를 다시 실행하세요.
import type { StaticImageData } from "next/image";

import p_gallery_01 from "./gallery-01.jpg";
import p_gallery_02 from "./gallery-02.jpg";
import p_gallery_03 from "./gallery-03.jpg";
import p_gallery_04 from "./gallery-04.jpg";
import p_gallery_05 from "./gallery-05.jpg";
import p_gallery_06 from "./gallery-06.jpg";
import p_hero from "./hero.jpg";
import p_map from "./map.jpg";

/** 갤러리 사진 (gallery-*.jpg, 이름순) */
export const galleryPhotos: StaticImageData[] = [p_gallery_01, p_gallery_02, p_gallery_03, p_gallery_04, p_gallery_05, p_gallery_06];

/** 첫 화면 사진. hero.jpg가 없으면 갤러리 첫 장, 그것도 없으면 null. */
export const heroPhoto: StaticImageData | null = p_hero;

/** 오시는 길 지도 썸네일 (map.jpg). 없으면 null. */
export const mapPhoto: StaticImageData | null = p_map;
