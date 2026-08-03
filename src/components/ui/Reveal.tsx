"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤해서 화면에 들어오면 한 번 페이드업.
 *
 * 기본값은 "보임"이다. 숨기는 건 마운트 후, 그 요소가 실제로 화면 아래에 있을 때만.
 * 반대로(기본 숨김 + 관찰되면 보임) 만들면 아래 상황에서 콘텐츠가 영영 안 보인다:
 *   - 뒤로가기 스크롤 복원이나 #앵커 이동으로 이미 화면을 지나친 요소
 *   - 백그라운드 탭에서 열려 IntersectionObserver가 throttle된 경우
 *   - JS가 죽은 경우
 * 청첩장에서 본문이 안 보이는 사고는 애니메이션이 없는 것보다 훨씬 나쁘다.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  // "animating" = 아직 화면 밖이라 숨겨둔 상태
  const [animating, setAnimating] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    // 애니메이션을 원치 않는 사용자에겐 그냥 보여준다.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 이미 화면 안이거나 위로 지나간 요소는 건드리지 않는다 — 연출할 기회가 이미 지났다.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setAnimating(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      {
        // 위쪽 여백을 크게 잡는 게 핵심이다.
        // IntersectionObserver는 교차 '비율이 threshold를 넘을 때'만 콜백을 부르는데,
        // 점프 스크롤로 요소가 화면 아래(비율 0)에서 위(비율 0)로 건너뛰면
        // 비율이 한 번도 threshold를 넘지 않아 콜백이 아예 불리지 않는다.
        // root를 위로 100000px 늘려두면 지나쳐 버린 요소도 계속 '교차 중'이라
        // 어떤 스크롤 방식에서도 반드시 한 번은 보이게 된다.
        // 아래쪽 -10%는 요소가 조금 올라온 뒤 연출이 시작되게 하는 용도.
        rootMargin: "100000px 0px -10% 0px",
        threshold: 0.05,
      },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${animating ? "reveal" : ""} ${shown ? "is-visible" : ""} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
