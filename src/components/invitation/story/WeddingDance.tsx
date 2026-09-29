"use client";

import { useEffect, useRef, useState } from "react";
import { DanceActor, type DanceActorHandle } from "./DanceActor";
import { FrameDanceActor } from "./FrameDanceActor";
import {
  DANCE_ENDING_CARD_ID,
  DANCE_ENDING_ID,
  DANCE_SCENES,
  getDanceProgressAnnouncement,
  getDanceSkipTarget,
} from "./danceTimeline";
import { useDanceTimeline } from "./useDanceTimeline";
import styles from "./WeddingDance.module.css";
import { LetterButton } from "@/components/letter/LetterButton";
import { useLetter } from "@/components/letter/LetterProvider";

type MotionMode = "pending" | "full" | "reduce";

export function WeddingDance({ contentTargetId }: { contentTargetId: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<DanceActorHandle>(null);
  const [motionMode, setMotionMode] = useState<MotionMode>("pending");
  const firstAnnouncement = getDanceProgressAnnouncement(0);
  const riveSrc = process.env.NEXT_PUBLIC_DANCE_RIVE_SRC?.trim();
  const hasLetter = useLetter() !== null;
  const lastScene = DANCE_SCENES.length - 1;

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
      {/* 편지가 있으면 본문 대신 편지 버튼이 보이는 마지막 장면으로 건너뛴다(본문에는 편지 자리가 없다). */}
      <a className={styles.skip} href={`#${getDanceSkipTarget(contentTargetId, hasLetter, motionMode === "full")}`}>
        댄스 이야기 건너뛰기
      </a>

      <ol className={styles.transcript} aria-label="웨딩 댄스 전체 대본">
        {DANCE_SCENES.map(({ id, narration }) => <li key={id}>{narration}</li>)}
      </ol>

      {/* 건너뛰기의 도착점: 무대가 끝나는 지점(진행률 1)이라 마지막 장면과 편지 버튼이 보인다.
          무대 바로 앞에 두어, 도착한 뒤 Tab을 누르면 편지 버튼으로 간다. */}
      {hasLetter && <span id={DANCE_ENDING_ID} className={styles.ending} />}

      <div ref={stageRef} className={styles.stage} aria-hidden={motionMode !== "full"}>
        <div className={styles.actor} data-dance-actor>
          {motionMode !== "reduce" && (riveSrc
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
              {/* 편지가 있으면 마지막 장면 끝(진행률 0.9~)에 나타난다. 보임 여부는 useDanceTimeline이 data-letter로 정한다. */}
              {hasLetter && index === lastScene && (
                <div className={styles.letterSlot} data-dance-letter><LetterButton /></div>
              )}
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
        <p className={styles.scrollHint} aria-hidden="true" data-dance-hint><span>아래로 스크롤</span><i /></p>
      </div>

      <div className={styles.fallback} aria-label="웨딩 댄스 장면">
        {DANCE_SCENES.map((scene, index) => (
          <article
            key={scene.id}
            id={hasLetter && index === lastScene ? DANCE_ENDING_CARD_ID : undefined}
            className={styles.fallbackCard}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/story/wedding-dance/pose-${scene.pose}.webp`} alt="" aria-hidden="true" />
            <div><small>{scene.eyebrow}</small><p>{scene.copy}</p></div>
            {/* 동작 줄이기에서는 무대 대신 이 카드들이 보이므로, 편지 버튼도 마지막 장 아래에 둔다. */}
            {hasLetter && index === lastScene && (
              <div className={styles.fallbackLetter}><LetterButton /></div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
