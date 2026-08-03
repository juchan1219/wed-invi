"use client";

import Image, { type StaticImageData } from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 전체화면 사진 뷰어. 스와이프는 embla가 처리하고
 * 여기서는 스크롤 잠금·키보드·카운터만 담당한다.
 */
export function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: StaticImageData[];
  startIndex: number;
  onClose: () => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: true });
  const [current, setCurrent] = useState(startIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 뷰어가 떠 있는 동안 배경이 스크롤되지 않게 한다.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", sync);
    return () => {
      emblaApi.off("select", sync);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, scrollPrev, scrollNext]);

  // 청첩장 본문은 max-width 26rem 컨테이너 안에 있어서,
  // 포털로 body에 붙여야 화면 전체를 덮을 수 있다.
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
    >
      <div className="flex items-center justify-between px-5 py-4 text-white/80">
        <span className="text-sm tabular-nums">
          {current + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-2 p-2"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center px-3"
            >
              <Image
                src={photo}
                alt={`${i + 1}번째 사진`}
                sizes="100vw"
                quality={85}
                className="max-h-full w-auto object-contain"
                // 현재 장과 좌우 한 장씩만 미리 받는다.
                loading={Math.abs(i - startIndex) <= 1 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 데스크톱 좌우 버튼. 모바일은 스와이프로 충분해 숨긴다. */}
      <div className="hidden justify-center gap-6 pb-6 sm:flex">
        <button type="button" onClick={scrollPrev} aria-label="이전 사진" className="p-2 text-white/70">
          <Chevron direction="left" />
        </button>
        <button type="button" onClick={scrollNext} aria-label="다음 사진" className="p-2 text-white/70">
          <Chevron direction="right" />
        </button>
      </div>
      <div className="pb-6 sm:hidden" />
    </div>,
    document.body,
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-6 w-6 ${direction === "right" ? "rotate-180" : ""}`}
    >
      <path
        d="M10 3L5 8l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
