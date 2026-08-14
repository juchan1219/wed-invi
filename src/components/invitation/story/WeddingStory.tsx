"use client";

import { useEffect, useRef, useState } from "react";
import { StoryFallback } from "./StoryFallback";
import { StoryLayer } from "./StoryLayer";
import { CHAPTERS, LAYER_TRACKS, SHOTS, assertStoryTimeline } from "./storyTimeline";
import { useStoryTimeline } from "./useStoryTimeline";
import styles from "./WeddingStory.module.css";

assertStoryTimeline();

export function WeddingStory({ contentTargetId }: { contentTargetId: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useStoryTimeline({ root: rootRef, stage: stageRef, enabled: !reducedMotion });

  return (
    <section
      ref={rootRef}
      className={styles.story}
      aria-label="예찬과 주은의 결혼 이야기"
    >
      <a className={styles.skip} href={`#${contentTargetId}`}>이야기 건너뛰기</a>

      <ol className={styles.transcript} aria-label="결혼 이야기 전체 대본">
        {SHOTS.map((shot) => (
          <li key={shot.id}>
            {shot.eyebrow && <span>{shot.eyebrow}. </span>}
            {shot.copy}
          </li>
        ))}
      </ol>

      <div
        ref={stageRef}
        className={styles.stage}
        data-shot="island-opens"
        data-chapter="beginning"
      >
        <div className={styles.layers} aria-hidden="true">
          {LAYER_TRACKS.map((track) => <StoryLayer key={track.id} track={track} />)}
        </div>

        <div className={styles.storyCopy} aria-hidden="true">
          {SHOTS.map((shot, index) => (
            <article
              key={shot.id}
              className={styles.copyCard}
              data-story-copy={shot.id}
              data-copy-start={shot.copyStart}
              data-copy-end={shot.copyEnd}
              style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}
            >
              {shot.eyebrow && <p className={styles.eyebrow}>{shot.eyebrow}</p>}
              {index === 0
                ? <h1>{shot.copy}</h1>
                : <p className={styles.copyLine}>{shot.copy}</p>}
            </article>
          ))}
        </div>

        <nav className={styles.chapterNav} aria-label="이야기 챕터">
          <span className={styles.chapterName} data-chapter-name>{CHAPTERS[0].title}</span>
          <ol>
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.id} data-chapter-id={chapter.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
              </li>
            ))}
          </ol>
        </nav>

        <div
          className={styles.rail}
          role="progressbar"
          aria-label="결혼 이야기 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        ><span /></div>

        <p className={styles.scrollHint} aria-hidden="true"><span>SCROLL TO BEGIN</span><i /></p>
      </div>

      <StoryFallback />
    </section>
  );
}
