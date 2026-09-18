"use client";

import { useEffect, useRef, useState } from "react";
import { DanceActor, type DanceActorHandle } from "./DanceActor";
import { FrameDanceActor } from "./FrameDanceActor";
import { DANCE_SCENES, getDanceProgressAnnouncement } from "./danceTimeline";
import { useDanceTimeline } from "./useDanceTimeline";
import styles from "./WeddingDance.module.css";

type MotionMode = "pending" | "full" | "reduce";

export function WeddingDance({ contentTargetId }: { contentTargetId: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<DanceActorHandle>(null);
  const [motionMode, setMotionMode] = useState<MotionMode>("pending");
  const firstAnnouncement = getDanceProgressAnnouncement(0);
  const riveSrc = process.env.NEXT_PUBLIC_DANCE_RIVE_SRC?.trim();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionMode(media.matches ? "reduce" : "full");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useDanceTimeline({
    root: rootRef,
    stage: stageRef,
    actor: actorRef,
    enabled: motionMode === "full",
  });

  return (
    <section
      ref={rootRef}
      className={styles.story}
      data-motion={motionMode}
      aria-label="예찬과 주은의 웨딩 댄스"
    >
      <a className={styles.skip} href={`#${contentTargetId}`}>댄스 이야기 건너뛰기</a>

      <ol className={styles.transcript} aria-label="웨딩 댄스 전체 대본">
        {DANCE_SCENES.map(({ id, narration }) => <li key={id}>{narration}</li>)}
      </ol>

      <div ref={stageRef} className={styles.stage} aria-hidden={motionMode !== "full"}>
        <div className={styles.paperTexture} aria-hidden="true" />
        <div className={styles.actor} data-dance-actor>
          {motionMode === "full" && (riveSrc
            ? <DanceActor key={riveSrc} ref={actorRef} riveSrc={riveSrc} />
            : <FrameDanceActor ref={actorRef} />)}
        </div>

        <div className={styles.copyLayer}>
          {DANCE_SCENES.map((scene, index) => (
            <article
              key={scene.id}
              className={styles.copy}
              data-dance-copy={scene.id}
              data-side={scene.copySide}
              style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}
            >
              <small>{scene.eyebrow}</small>
              <p>{scene.copy}</p>
            </article>
          ))}
        </div>

        <div
          className={styles.progress}
          role="progressbar"
          aria-label="웨딩 댄스 진행률"
          aria-valuemin={1}
          aria-valuemax={DANCE_SCENES.length}
          aria-valuenow={firstAnnouncement.value}
          aria-valuetext={firstAnnouncement.text}
        ><span /></div>
        <p className={styles.announcement} data-dance-announcement aria-live="polite">
          {firstAnnouncement.text}
        </p>
        <p className={styles.scrollHint} aria-hidden="true">SCROLL TO DANCE <i /></p>
      </div>

      <div className={styles.fallback} aria-label="웨딩 댄스 장면">
        {DANCE_SCENES.map((scene) => (
          <article key={scene.id} className={styles.fallbackCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/story/wedding-dance/pose-${scene.pose}.webp`} alt="" aria-hidden="true" />
            <div><small>{scene.eyebrow}</small><p>{scene.copy}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
