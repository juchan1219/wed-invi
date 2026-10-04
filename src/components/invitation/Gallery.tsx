"use client";

import Image from "next/image";
import { useState } from "react";
import { galleryPhotos } from "@/assets/photos/manifest";
import { wedding } from "@/config/wedding";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Lightbox } from "./Lightbox";

/**
 * @param largeType 어르신용(`/big`) 여부. 설정에 적힌 번호의 사진을 뺀다.
 *   배열에서 아예 빼야 한다 — CSS로 숨기면 라이트박스가 인덱스로 동작해
 *   "크게 보기"가 엉뚱한 사진을 연다.
 */
export function Gallery({ largeType = false }: { largeType?: boolean }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const photos = largeType
    ? galleryPhotos.filter(
        (_, i) => !(wedding.gallery.hiddenInLargeType as readonly number[]).includes(i + 1),
      )
    : galleryPhotos;

  if (photos.length === 0) {
    return (
      <Section label="Gallery" title="사진">
        <p className="text-center text-xs leading-relaxed text-ink-faint">
          <code className="rounded bg-line/60 px-1.5 py-0.5">photos/gallery-01.jpg</code>{" "}
          형식으로 사진을 넣고
          <br />
          <code className="rounded bg-line/60 px-1.5 py-0.5">npm run photos:prep</code> 을
          실행하세요.
        </p>
      </Section>
    );
  }

  return (
    <Section label="Gallery" title="사진">
      <Reveal>
        <ul className="grid grid-cols-3 gap-1.5">
          {photos.map((photo, i) => (
            <li key={photo.src}>
              <button
                type="button"
                onClick={() => setOpenAt(i)}
                className="block w-full overflow-hidden"
                aria-label={`${i + 1}번째 사진 크게 보기`}
              >
                <Image
                  src={photo}
                  alt=""
                  // 3열 그리드 → 컨테이너(최대 416px)의 1/3
                  sizes="(max-width: 416px) 33vw, 139px"
                  className="aspect-square h-full w-full object-cover transition-opacity active:opacity-80"
                  placeholder="blur"
                  // 첫 줄(3장)만 미리 받고 나머지는 스크롤할 때.
                  loading={i < 3 ? "eager" : "lazy"}
                />
              </button>
            </li>
          ))}
        </ul>
      </Reveal>

      {openAt !== null && (
        <Lightbox
          photos={photos}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </Section>
  );
}
