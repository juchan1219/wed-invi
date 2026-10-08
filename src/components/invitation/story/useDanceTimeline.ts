"use client";

import { useEffect } from "react";
import type { DanceActorHandle } from "./DanceActor";
import {
  DANCE_EXIT_FADE,
  DANCE_SCENES,
  getDanceFrame,
  getDanceProgressAnnouncement,
  getLetterRoom,
  getScrollHintState,
  isLetterButtonShown,
  LETTER_ROOM_FLOOR_MARGIN,
  sideToStagePercent,
  smoothstep,
} from "./danceTimeline";

/** 스크롤이 이만큼 멈추면 "아래로 스크롤" 안내를 다시 진하게 보여 준다. */
const HINT_IDLE_MS = 2000;

type DanceTimelineOptions = {
  root: React.RefObject<HTMLElement | null>;
  stage: React.RefObject<HTMLDivElement | null>;
  actor: React.RefObject<DanceActorHandle | null>;
  enabled: boolean;
};

export function useDanceTimeline({ root, stage, actor, enabled }: DanceTimelineOptions) {
  useEffect(() => {
    if (!enabled) return;
    const rootElement = root.current;
    const stageElement = stage.current;
    if (!rootElement || !stageElement) return;

    let disposed = false;
    let cleanup = () => {};

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([
      { gsap },
      { ScrollTrigger },
    ]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const actorElement = stageElement.querySelector<HTMLElement>("[data-dance-actor]");
      const copies = Array.from(stageElement.querySelectorAll<HTMLElement>("[data-dance-copy]"));
      const progressElement = stageElement.querySelector<HTMLElement>("[role='progressbar']");
      const announcementElement = stageElement.querySelector<HTMLElement>("[data-dance-announcement]");
      const letterButton = stageElement.querySelector<HTMLElement>("[data-dance-letter] button");
      const hintElement = stageElement.querySelector<HTMLElement>("[data-dance-hint]");
      let lastSceneId = "";
      let lastProgress = -1;
      let scrolling = false;
      let idleTimer = 0;

      /** 무대 기준 레이아웃 위치(변형 제외): offsetParent 사슬을 무대까지 더한다. */
      const topInStage = (element: HTMLElement) => {
        let top = 0;
        for (let node: HTMLElement | null = element; node && node !== stageElement; node = node.offsetParent as HTMLElement | null) {
          top += node.offsetTop;
        }
        return top;
      };

      // 편지 버튼이 보일 때 엔딩 그림이 비켜 줄 양(세로가 짧은 화면만). 프레임마다 레이아웃을 읽지 않도록
      // 무대 크기·문구 높이(글꼴 로딩)가 바뀔 때만 다시 잰다. CSS가 data-letter="shown"일 때 적용한다.
      const measureLetterRoom = () => {
        if (!letterButton || !actorElement) return;
        const room = getLetterRoom({
          buttonBottom: topInStage(letterButton) + letterButton.offsetHeight,
          actorTop: actorElement.offsetTop - actorElement.offsetHeight / 2,
          actorSize: actorElement.offsetHeight,
          floor: (hintElement?.offsetTop ?? stageElement.clientHeight) - LETTER_ROOM_FLOOR_MARGIN,
        });
        stageElement.style.setProperty("--letter-shift", `${room.shift.toFixed(1)}px`);
        stageElement.style.setProperty("--letter-scale", room.scale.toFixed(3));
      };
      const roomObserver = letterButton ? new ResizeObserver(measureLetterRoom) : null;
      if (roomObserver && letterButton) {
        roomObserver.observe(stageElement);
        roomObserver.observe(letterButton.closest<HTMLElement>("[data-dance-copy]")!);
      }

      const syncHint = () => {
        stageElement.dataset.hint = getScrollHintState(lastProgress, scrolling);
      };

      const paint = (progress: number) => {
        // 첫 paint(lastProgress < 0)는 사용자 스크롤이 아니므로 안내를 흐리게 하지 않는다.
        if (lastProgress >= 0 && Math.abs(progress - lastProgress) > 0.0001) {
          scrolling = true;
          window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(() => {
            scrolling = false;
            syncHint();
          }, HINT_IDLE_MS);
        }
        lastProgress = progress;
        syncHint();

        const { scene, sceneProgress } = getDanceFrame(progress);
        const sceneIndex = DANCE_SCENES.indexOf(scene);
        const nextScene = DANCE_SCENES[Math.min(DANCE_SCENES.length - 1, sceneIndex + 1)]!;
        const travelProgress = smoothstep(Math.max(0, (sceneProgress - 0.18) / 0.72));
        const left = gsap.utils.interpolate(
          sideToStagePercent(scene.actorSide),
          sideToStagePercent(nextScene.actorSide),
          travelProgress,
        );

        actor.current?.setProgress(progress);
        if (actorElement) {
          // cqw: stage 컨테이너 폭 기준. vw를 쓰면 데스크톱에서 시트 밖으로 벗어난다.
          actorElement.style.setProperty("--dance-actor-travel", `${(left - 50).toFixed(3)}cqw`);
        }

        const copyBlend = sceneIndex === DANCE_SCENES.length - 1
          ? 0
          : smoothstep((sceneProgress - 0.78) / 0.22);
        copies.forEach((element, index) => {
          const opacity = index === sceneIndex ? 1 - copyBlend : index === sceneIndex + 1 ? copyBlend : 0;
          element.style.opacity = opacity.toFixed(4);
          element.style.visibility = opacity > 0.002 ? "visible" : "hidden";
          element.style.transform = `translate3d(0, ${(1 - opacity) * 18}px, 0)`;
        });

        stageElement.style.setProperty("--dance-progress", progress.toFixed(5));
        stageElement.dataset.letter = isLetterButtonShown(progress) ? "shown" : "hidden";
        stageElement.dataset.scene = scene.id;
        if (scene.id !== lastSceneId) {
          const announcement = getDanceProgressAnnouncement(progress);
          progressElement?.setAttribute("aria-valuenow", String(announcement.value));
          progressElement?.setAttribute("aria-valuetext", announcement.text);
          announcementElement?.replaceChildren(announcement.text);
          lastSceneId = scene.id;
        }
      };

      const context = gsap.context(() => {
        const playhead = { progress: 0 };
        gsap.to(playhead, {
          progress: 1,
          ease: "none",
          onUpdate: () => paint(playhead.progress),
          scrollTrigger: {
            trigger: rootElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });
        // 무대 고정이 풀린 뒤(start = 진행률 1)부터 진행률 막대의 검은 칠을 걷는다.
        // 고정 중에는 진행률 막대가 예전처럼 검은색이고, 춤이 끝나고 더 스크롤해야 연해진다.
        const exit = { amount: 0 };
        gsap.to(exit, {
          amount: 1,
          ease: "none",
          onUpdate: () => {
            stageElement.style.setProperty("--dance-exit", exit.amount.toFixed(4));
            // 고정이 풀리는 순간 = 캘린더가 보이기 시작하는 순간. 떠 있는 두 버튼을 그때 감춘다
            // (2026-10-08 사용자 보고: 건너뛰기·오시는 길이 캘린더 최상단에 붙어 따라왔다).
            // **무대가 아니라 루트에 둔다** — `오시는 길`은 무대 밖 형제라 무대 선택자로는 못 잡는다.
            // 이 훅은 `motionMode === "full"` 일 때만 돌므로 동작 줄이기에서는 플래그가 서지 않는다.
            rootElement.dataset.exiting = exit.amount > 0 ? "yes" : "no";
          },
          scrollTrigger: {
            trigger: rootElement,
            start: "bottom bottom",
            end: () => `bottom bottom-=${window.innerHeight * DANCE_EXIT_FADE}`,
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });

        ScrollTrigger.refresh();
        const bounds = rootElement.getBoundingClientRect();
        paint(Math.max(0, Math.min(1, -bounds.top / Math.max(1, rootElement.offsetHeight - window.innerHeight))));
      }, rootElement);

      cleanup = () => {
        window.clearTimeout(idleTimer);
        roomObserver?.disconnect();
        context.revert();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [actor, enabled, root, stage]);
}
