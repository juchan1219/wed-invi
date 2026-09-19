"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import type { LetterView } from "@/lib/letters";
import { LetterMarkdown } from "./LetterMarkdown";
import { describeLetterSheet } from "./letterSheets";
import styles from "./LetterDialog.module.css";

const EASE_RISE = "cubic-bezier(.05,.7,.1,1)";
/** y1 > 1이라 날개가 살짝 지나쳤다 제자리에 눕는다 — 종이가 안착하는 느낌. */
const EASE_UNFOLD = "cubic-bezier(.3,1.15,.4,1)";
const EASE_EXIT = "cubic-bezier(.3,0,.8,.15)";

/** 펼침 순서(ms): 올라오기 → 하트 봉인 사라짐 → 날개 펼침 → 글. 두 번째 편지지는 조금 빠르게. */
const TIMING = {
  first: { rise: 350, seal: 200, unfold: 800, text: 300 },
  next: { rise: 250, seal: 150, unfold: 650, text: 250 },
} as const;

type Phase = "folded" | "open";

/**
 * 반으로 접힌 편지지가 3D로 펼쳐지는 편지 대화상자.
 *
 * - 네이티브 `<dialog>` + `showModal()`: 포커스 가두기·뒤 페이지 비활성·Esc는 브라우저가 처리한다.
 *   기본 `overflow:auto`는 3D를 평면으로 만들므로 대화상자는 투명한 전체 화면 틀로만 쓴다.
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
  const sealRef = useRef<HTMLSpanElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const running = useRef<Animation[]>([]);
  const closing = useRef(false);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduced ? "open" : "folded");
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
      running.current = [stack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "both" })];
      return;
    }

    const t = index === 0 ? TIMING.first : TIMING.next;
    const unfoldAt = t.rise + t.seal;
    const total = unfoldAt + t.unfold;
    const sheetElement = sheetRef.current!;
    const flap = flapRef.current!;
    sheetElement.style.willChange = "transform";
    flap.style.willChange = "transform";
    const animations = [
      stack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: t.rise, easing: EASE_RISE, fill: "both" }),
      // 접힌 동안엔 위 절반만 보이므로 시트를 H/4 내려 가운데에 두고, 펼치면서 제자리로 올린다.
      sheetElement.animate([
        { transform: "translateY(calc(25% + 24px))", offset: 0, easing: EASE_RISE },
        { transform: "translateY(25%)", offset: t.rise / total },
        { transform: "translateY(25%)", offset: unfoldAt / total, easing: EASE_UNFOLD },
        { transform: "translateY(0)", offset: 1 },
      ], { duration: total, fill: "both" }),
      sealRef.current!.animate(
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.8)" }],
        { delay: t.rise, duration: t.seal, easing: "ease-in", fill: "both" },
      ),
      // translateZ(1px): 접힌 날개와 위 절반이 같은 평면에서 깜빡이지 않게 띄운다.
      flap.animate(
        [{ transform: "translateZ(1px) rotateX(180deg)" }, { transform: "translateZ(0px) rotateX(0deg)" }],
        { delay: unfoldAt, duration: t.unfold, easing: EASE_UNFOLD, fill: "both" },
      ),
      shadeRef.current!.animate([{ opacity: 1 }, { opacity: 0 }], { delay: unfoldAt, duration: t.unfold, fill: "both" }),
      article.animate([{ opacity: 0 }, { opacity: 1 }], { delay: total, duration: t.text, easing: "ease-out", fill: "both" }),
    ];
    running.current = animations;
    animations.at(-1)!.finished.then(() => {
      sheetElement.style.willChange = "";
      flap.style.willChange = "";
      setPhase("open");
    }).catch(() => {});
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // 펼치는 도중 편지를 누르면 기다리지 않고 끝 상태로 건너뛴다.
  const skip = () => {
    if (phase === "folded") for (const animation of running.current) animation.finish();
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
      setIndex((current) => current + 1);
      setPhase(reduced ? "open" : "folded");
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
          <div className={styles.scene} data-phase={phase} onPointerDown={skip}>
            <div ref={sheetRef} className={styles.sheet} aria-hidden="true">
              <div className={`${styles.paper} ${styles.top}`} />
              <div ref={flapRef} className={styles.flap}>
                <div className={`${styles.face} ${styles.paper} ${styles.inner}`}>
                  <div ref={shadeRef} className={styles.shade} />
                </div>
                <div className={`${styles.face} ${styles.paper} ${styles.outer}`}>
                  <span className={styles.to}>To. {recipientName}님</span>
                  <span ref={sealRef} className={styles.seal}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 18.2s-5.4-3.3-5.4-7c0-1.6 1.2-2.8 2.7-2.8 1.2 0 2.1.7 2.7 1.7.6-1 1.5-1.7 2.7-1.7 1.5 0 2.7 1.2 2.7 2.8 0 3.7-5.4 7-5.4 7z" />
                    </svg>
                  </span>
                  <span className={styles.from}>From. {sheet.author}</span>
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
