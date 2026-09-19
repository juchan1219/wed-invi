"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DANCE_ENDING_CARD_ID, DANCE_ENDING_ID } from "@/components/invitation/story/danceTimeline";
import { LetterIcon } from "./LetterIcon";
import { useLetter } from "./LetterProvider";
import styles from "./LetterFab.module.css";

/**
 * 본문 윗변이 이 선(px, 화면 맨 위 기준)을 지나 올라가면 나타난다. 춤 무대의 "건너뛰기" 버튼과 같은 자리인데,
 * 그 버튼은 음수 margin(-2rem)과 transform 때문에 무대가 끝난 뒤에도 본문 윗변 아래로 약 32px 더 남아 보인다.
 * 본문 윗변이 화면 위로 40px 지나간 뒤에 나타나야 겹치지 않는다(안전 영역 여백과 무관).
 */
const SHOW_LINE = -40;
/** scrollend를 모르는 브라우저(구형 Safari)에서 스크롤이 끝났다고 볼 시간. */
const SCROLL_SETTLE_MS = 900;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/**
 * "편지가 왔어요" 버튼이 보이는 곳: 춤이면 무대가 끝나는 지점(진행률 1), 동작 줄이기면 마지막 카드.
 * 둘 다 문서에 있지만 화면에 그려진(상자가 있는) 쪽이 지금 모드다.
 */
function findLetterScene() {
  const ending = document.getElementById(DANCE_ENDING_ID);
  if (ending && ending.getClientRects().length > 0) {
    return { anchor: ending, button: document.querySelector<HTMLElement>("[data-dance-letter] button") };
  }
  const card = document.getElementById(DANCE_ENDING_CARD_ID);
  if (card && card.getClientRects().length > 0) {
    return { anchor: card, button: card.querySelector<HTMLElement>("button") };
  }
  return null;
}

/** 편지 버튼의 흔들림(CSS)을 처음부터 다시 돌린다. 동작 줄이기면 CSS가 흔들림을 끄므로 아무 일도 없다. */
function replayWiggle(button: HTMLElement) {
  button.style.animation = "none";
  void button.offsetWidth; // 스타일을 한 번 계산시켜야 같은 애니메이션이 처음부터 다시 돈다
  button.style.animation = "";
}

/**
 * 플로팅 편지 버튼(편지 아이콘만). 편지가 있는 청첩장에서만 그려진다(LetterProvider 안, `Invitation`의 편지 분기).
 * 본문 첫 섹션(캘린더)부터 오른쪽 위에 뜨고, 아직 안 읽었으면 레드닷과 좌우 흔들림으로 알린다.
 * 누르면 편지를 바로 열지 않고 춤 마지막 장면의 "편지가 왔어요" 버튼으로 스크롤한다(사용자 요청).
 */
export function LetterFab({ startId }: { startId: string }) {
  const letter = useLetter();
  // 스크롤마다 위치를 읽되, "본문에 들어왔는지"가 바뀔 때만 다시 그린다. 서버에서는 숨김.
  const getShown = useCallback(() => {
    const start = document.getElementById(startId);
    return start !== null && start.getBoundingClientRect().top <= SHOW_LINE;
  }, [startId]);
  const shown = useSyncExternalStore(subscribeScroll, getShown, () => false);

  if (!letter) return null;
  const unread = !letter.read;

  const goToLetterButton = (fab: HTMLElement) => {
    const scene = findLetterScene();
    // 춤 장면을 못 찾는 예외 상황에서만 편지를 바로 연다.
    if (!scene) {
      letter.open(fab);
      return;
    }

    // 도착하면 편지 버튼으로 초점을 옮기고(키보드·스크린리더) 한 번 더 흔들어 눈에 띄게 한다.
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (!scene.button) return;
      scene.button.focus({ preventScroll: true });
      replayWiggle(scene.button);
    };
    if (Math.abs(scene.anchor.getBoundingClientRect().top) < 2) {
      settle();
      return;
    }
    window.addEventListener("scrollend", settle, { once: true });
    window.setTimeout(settle, "onscrollend" in window ? 3000 : SCROLL_SETTLE_MS);
    // 부드럽게 갈지는 전역 scroll-behavior가 정한다(동작 줄이기면 바로 이동).
    scene.anchor.scrollIntoView({ block: "start" });
  };

  return (
    <button
      type="button"
      className={styles.fab}
      data-shown={shown}
      data-unread={unread}
      aria-label={unread ? "편지 보러 가기, 읽지 않은 편지가 있어요" : "편지 보러 가기"}
      onClick={(event) => goToLetterButton(event.currentTarget)}
    >
      <LetterIcon />
      {unread && <span className={styles.dot} aria-hidden="true" />}
    </button>
  );
}
