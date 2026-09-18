"use client";

import { useEffect } from "react";
import type { DanceActorHandle } from "./DanceActor";
import {
  DANCE_SCENES,
  getDanceFrame,
  getDanceProgressAnnouncement,
  sideToStagePercent,
  smoothstep,
} from "./danceTimeline";

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
      let lastSceneId = "";

      const paint = (progress: number) => {
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
          actorElement.style.setProperty("--dance-actor-travel", `${(left - 50).toFixed(3)}vw`);
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
        ScrollTrigger.refresh();
        const bounds = rootElement.getBoundingClientRect();
        paint(Math.max(0, Math.min(1, -bounds.top / Math.max(1, rootElement.offsetHeight - window.innerHeight))));
      }, rootElement);

      cleanup = () => context.revert();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [actor, enabled, root, stage]);
}
