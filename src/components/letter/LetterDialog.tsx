"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { formatCeremonyDateShort } from "@/lib/date";
import type { LetterView } from "@/lib/letters";
import { LetterMarkdown } from "./LetterMarkdown";
import { describeLetterSheet } from "./letterSheets";
import styles from "./LetterDialog.module.css";

const EASE_RISE = "cubic-bezier(.05,.7,.1,1)";
/** y1 > 1이라 날개가 살짝 지나쳤다 제자리에 눕는다 — 종이가 안착하는 느낌. */
const EASE_UNFOLD = "cubic-bezier(.3,1.15,.4,1)";
const EASE_EXIT = "cubic-bezier(.3,0,.8,.15)";
/** 소인이 쿵 찍히며 살짝 눌렸다 돌아온다. */
const EASE_STAMP = "cubic-bezier(.3,1.35,.55,1)";
/** 소인 기울기 — CSS `.postmark`의 transform과 같아야 한다(애니메이션이 transform을 통째로 바꾼다). */
const POSTMARK_TILT = "rotate(-9deg)";
/** 소인 날짜: 예식일 "2026.12.19" (서울 기준). */
const POSTMARK_DATE = formatCeremonyDateShort().replaceAll(" ", "");

/**
 * 펼침 순서(ms): 올라오기 → 소인 찍힘 → 겉면 보여 주기(hold) → 날개 펼침. 두 번째 편지지는 조금 빠르게.
 * 글은 펼침이 끝나기를 기다리지 않고 종이가 거의 다 펼쳐진 지점(TEXT_START)부터 나타난다.
 */
const TIMING = {
  first: { rise: 350, stamp: 200, hold: 200, unfold: 650, text: 140 },
  next: { rise: 250, stamp: 150, hold: 200, unfold: 550, text: 120 },
} as const;
/**
 * 펼침 시간 중 글이 나타나기 시작하는 지점. EASE_UNFOLD는 30% 시점에 약 84%, 45% 시점에 97% 펼쳐지고
 * 나머지는 거의 움직이지 않는 안착이라, 끝까지 기다리면 빈 종이만 보이는 시간이 생긴다.
 * 글이 투명에서 시작하고 반쯤 보일 때쯤엔 종이가 거의 누워 있어, 겹쳐 보여도 어긋남이 드러나지 않는다.
 */
const TEXT_START = 0.3;

type Phase = "folded" | "open";

/**
 * 반으로 접힌 편지지가 3D로 펼쳐지는 편지 대화상자.
 *
 * - 네이티브 `<dialog>` + `showModal()`: 포커스 가두기·뒤 페이지 비활성·Esc는 브라우저가 처리한다.
 *   기본 `overflow:auto`는 3D를 평면으로 만들므로 대화상자는 투명한 전체 화면 틀로만 쓴다.
 * - 위 절반(날개)이 아래 절반 위로 접혀 있다가 아래에서 위로 펼쳐진다. 접힌 겉면은 우편 봉투 앞면이다
 *   (받는 사람·우표·소인·보내는 사람).
 * - 3D 시트(.sheet, preserve-3d)와 그 조상에는 opacity·overflow·filter를 두지 않는다(3D가 꺼짐).
 *   페이드는 바깥 .stack에만 준다.
 * - 펼치는 동안에는 빈 종이만 돌리고, 끝나면 같은 크기의 평평한 편지(<article>)에 글을 보여 준다.
 *   긴 글·이미지를 두 면에 나눠 그리지 않고, Safari의 3D 후 흐린 글씨도 피한다.
 * - 안드로이드 뒤로가기: 열 때 history 항목을 하나 넣고, popstate에서 닫는다.
 */
export function LetterDialog({
  recipientName,
  letters,
  onClosed,
}: {
  recipientName: string;
  letters: LetterView[];
  onClosed(): void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const postmarkRef = useRef<SVGSVGElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const running = useRef<Animation[]>([]);
  const closing = useRef(false);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [index, setIndex] = useState(0);
  const phaseRef = useRef<Phase>(reduced ? "open" : "folded");
  const suppressOpeningClick = useRef(false);
  const titleId = useId();
  const sheet = describeLetterSheet(letters, index);

  const stopRunning = () => {
    for (const animation of running.current) animation.cancel();
    running.current = [];
  };

  const finishClose = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const dialog = dialogRef.current;
    if (dialog?.open) {
      const exit = { duration: reduced ? 150 : 220, easing: EASE_EXIT, fill: "forwards" as const };
      const animations = [
        frameRef.current?.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(12px)" }], exit),
        backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], exit),
      ];
      await Promise.allSettled(animations.map((animation) => animation?.finished));
      dialog.close();
    }
    onClosed();
  }, [onClosed, reduced]);

  // 직접 닫을 때(×·배경·Esc·닫기)는 넣어 둔 history 항목을 되돌린다. popstate가 실제로 닫는다.
  const requestClose = useCallback(() => {
    if (window.history.state?.letterDialog) {
      window.history.back();
      window.setTimeout(() => void finishClose(), 600); // popstate가 오지 않는 환경 대비
    } else {
      void finishClose();
    }
  }, [finishClose]);

  // 열기: 모달·스크롤 잠금·history. <html> overflow를 잠근다 — body를 position:fixed로 고정하면
  // 스크롤 위치가 0이 되어 반투명 배경 뒤의 춤이 첫 장면으로 튄다.
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    // 개발 모드 StrictMode의 이중 실행에서도 항목이 하나만 쌓이도록 이미 있으면 넣지 않는다.
    if (!window.history.state?.letterDialog) window.history.pushState({ letterDialog: true }, "");
    const onPopState = () => void finishClose();
    window.addEventListener("popstate", onPopState);
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "both" });
    return () => {
      window.removeEventListener("popstate", onPopState);
      html.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [finishClose]);

  // 편지지 한 장 보여 주기: 열 때마다 접힌 채 올라와 펼쳐진다(사용자 요청). 동작 줄이기면 페이드만 한다.
  // 편지지(index)가 바뀔 때만 다시 시작한다 — 펼침이 끝나 phase가 "open"이 될 때 다시 돌면 글이 한 번 더 깜빡인다.
  useLayoutEffect(() => {
    stopRunning();
    const stack = stackRef.current!;
    const article = articleRef.current!;
    article.scrollTop = 0;
    if (index > 0) article.focus({ preventScroll: true });

    if (reduced) {
      phaseRef.current = "open";
      running.current = [stack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "both" })];
      return;
    }

    phaseRef.current = "folded";
    const t = index === 0 ? TIMING.first : TIMING.next;
    const unfoldAt = t.rise + t.stamp + t.hold;
    const textAt = unfoldAt + t.unfold * TEXT_START;
    const total = unfoldAt + t.unfold;
    const sheetElement = sheetRef.current!;
    const flap = flapRef.current!;
    sheetElement.style.willChange = "transform";
    flap.style.willChange = "transform";
    const animations = [
      stack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: t.rise, easing: EASE_RISE, fill: "both" }),
      // 접힌 동안엔 아래 절반만 보이므로 시트를 H/4 올려 가운데에 두고, 펼치면서 제자리로 내린다.
      // 글이 나타나기 시작할 때(textAt) 이미 제자리여야 평평한 편지와 가장자리가 겹쳐 보이지 않는다.
      sheetElement.animate([
        { transform: "translateY(calc(-25% + 24px))", offset: 0, easing: EASE_RISE },
        { transform: "translateY(-25%)", offset: t.rise / total },
        { transform: "translateY(-25%)", offset: unfoldAt / total, easing: EASE_RISE },
        { transform: "translateY(0)", offset: textAt / total },
      ], { duration: total, fill: "both" }),
      // 우편이 도착한 순간: 소인이 쿵 찍힌 뒤 편지가 펼쳐진다.
      postmarkRef.current!.animate(
        [
          { opacity: 0, transform: `${POSTMARK_TILT} scale(1.45)` },
          { opacity: 1, transform: `${POSTMARK_TILT} scale(1)` },
        ],
        { delay: t.rise, duration: t.stamp, easing: EASE_STAMP, fill: "both" },
      ),
      // 위 절반이 아래에서 위로 넘어온다. -180°라야 펼치는 동안 보는 사람 쪽으로 넘어온다(+180°면 종이 뒤로 돈다).
      // translateZ(1px): 접힌 날개와 아래 절반이 같은 평면에서 깜빡이지 않게 띄운다.
      flap.animate(
        [{ transform: "translateZ(1px) rotateX(-180deg)" }, { transform: "translateZ(0px) rotateX(0deg)" }],
        { delay: unfoldAt, duration: t.unfold, easing: EASE_UNFOLD, fill: "both" },
      ),
      shadeRef.current!.animate([{ opacity: 1 }, { opacity: 0 }], { delay: unfoldAt, duration: t.unfold, fill: "both" }),
      // scrollable article 자체를 Safari의 forwards-fill 합성 레이어로 남기지 않는다.
      // backwards는 지연 중에만 opacity:0을 적용하고 종료 즉시 원래 opacity:1로 돌아가므로,
      // 애니메이션 종료와 React 재렌더가 겹칠 때 iOS에서 생기던 한 프레임 공백을 피한다.
      article.animate([{ opacity: 0 }, { opacity: 1 }], {
        delay: textAt,
        duration: t.text,
        easing: "ease-out",
        fill: "backwards",
      }),
    ];
    running.current = animations;
    animations.at(-1)!.finished.then(() => {
      sheetElement.style.willChange = "";
      flap.style.willChange = "";
      // 시각적 완료 시 React 상태나 DOM 속성을 바꾸면 iOS Safari가 article 합성 레이어를
      // 한 프레임 비우므로, 상호작용 상태만 ref에 기록한다.
      phaseRef.current = "open";
    }).catch(() => {});
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // 펼치는 도중 편지를 누르면 기다리지 않고 끝 상태로 건너뛴다.
  const skip = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "folded") return;
    // 투명한 article 안의 링크/버튼이 이 탭으로 함께 눌리지 않게 뒤따르는 click을 막는다.
    suppressOpeningClick.current = true;
    event.preventDefault();
    for (const animation of running.current) animation.finish();
  };

  const suppressSkippedClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressOpeningClick.current) return;
    suppressOpeningClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const goNext = () => {
    stopRunning();
    const exit = stackRef.current!.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(14px)" }],
      { duration: reduced ? 120 : 200, easing: EASE_EXIT, fill: "forwards" },
    );
    running.current = [exit];
    exit.finished.then(() => {
      // 다음 편지지의 효과가 같은 프레임에 시작되므로 이 퇴장 애니메이션은 그때 취소된다(깜빡임 없음).
      phaseRef.current = reduced ? "open" : "folded";
      setIndex((current) => current + 1);
    }).catch(() => {});
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={() => {
        // 브라우저가 직접 닫은 경우(Esc 연타 등)에도 history와 상태를 정리한다.
        // close 이벤트는 나중에 도착하므로, 그사이 다시 열렸으면(개발 모드 StrictMode 재실행) 무시한다.
        if (closing.current || dialogRef.current?.open) return;
        closing.current = true;
        if (window.history.state?.letterDialog) window.history.back();
        onClosed();
      }}
    >
      <div ref={backdropRef} className={styles.backdrop} onClick={requestClose} aria-hidden="true" />
      <button type="button" className={styles.close} onClick={requestClose} aria-label="편지 닫기">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
      <div ref={frameRef} className={styles.frame}>
        <div ref={stackRef} className={styles.stack}>
          <div
            className={styles.scene}
            onPointerDown={skip}
            onPointerCancel={() => { suppressOpeningClick.current = false; }}
            onClickCapture={suppressSkippedClick}
          >
            <div ref={sheetRef} className={styles.sheet} aria-hidden="true">
              <div className={`${styles.paper} ${styles.bottom}`} />
              <div ref={flapRef} className={styles.flap}>
                <div className={`${styles.face} ${styles.paper} ${styles.inner}`}>
                  <div ref={shadeRef} className={styles.shade} />
                </div>
                {/* 우편 봉투 앞면: 받는 사람(왼쪽 위) · 우표와 소인(오른쪽 위) · 보내는 사람(오른쪽 아래) */}
                <div className={`${styles.face} ${styles.paper} ${styles.outer}`}>
                  <p className={styles.to}>
                    <span className={styles.prefix}>To.</span> {recipientName}<small>님</small>
                  </p>
                  <span className={styles.stamp}>
                    <svg viewBox="0 0 24 24">
                      <path d="M12 18.2s-5.4-3.3-5.4-7c0-1.6 1.2-2.8 2.7-2.8 1.2 0 2.1.7 2.7 1.7.6-1 1.5-1.7 2.7-1.7 1.5 0 2.7 1.2 2.7 2.8 0 3.7-5.4 7-5.4 7z" />
                    </svg>
                  </span>
                  <svg ref={postmarkRef} className={styles.postmark} viewBox="0 0 100 64">
                    <g fill="none" stroke="currentColor" strokeLinecap="round">
                      <path d="M4 20q5-4 10 0t10 0 10 0 10 0M4 32q5-4 10 0t10 0 10 0 10 0M4 44q5-4 10 0t10 0 10 0 10 0" strokeWidth={1.3} />
                      <circle cx="70" cy="32" r="27" strokeWidth={1.6} />
                      <path d="M45 25h50M45 39h50" strokeWidth={1} />
                    </g>
                    <g fill="currentColor" textAnchor="middle">
                      <text x="70" y="19.5" fontSize="6.5" letterSpacing="1.2">WEDDING</text>
                      <text x="70" y="35.3" fontSize="9" fontWeight="700">{POSTMARK_DATE}</text>
                      <text x="70" y="52" fontSize="7.5">♥</text>
                    </g>
                  </svg>
                  <p className={styles.from}>
                    <span className={styles.prefix}>From.</span> {sheet.author}
                  </p>
                </div>
              </div>
            </div>
            <article ref={articleRef} className={`${styles.paper} ${styles.letter}`} tabIndex={-1}>
              {sheet.counter && <p className={styles.counter}>{sheet.counter}</p>}
              <h2 id={titleId} className={styles.title}>{recipientName}님께</h2>
              <LetterMarkdown body={letters[index]!.body} />
              <p className={styles.signoff}>{sheet.author} 드림</p>
              <div className={styles.actions}>
                {sheet.next ? (
                  <button type="button" className={styles.action} onClick={goNext}>{sheet.next} →</button>
                ) : (
                  <button type="button" className={styles.action} onClick={requestClose}>닫기</button>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>
    </dialog>
  );
}
