"use client";

import Image from "next/image";
import { useState } from "react";
import { galleryPhotos } from "@/assets/photos/manifest";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Lightbox } from "./Lightbox";

export function Gallery() {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (galleryPhotos.length === 0) {
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
          {galleryPhotos.map((photo, i) => (
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
          photos={galleryPhotos}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </Section>
  );
}
