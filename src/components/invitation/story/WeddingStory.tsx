"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { progressBetween, storyProgress } from "./scrollMath";
import { LOOK_LABELS, STORY_BEATS } from "./storyCopy";
import styles from "./WeddingStory.module.css";

const LAST_INDEX = STORY_BEATS.length - 1;

export function WeddingStory({ contentTargetId }: { contentTargetId: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const loadedThroughRef = useRef(1);
  const [loadedThrough, setLoadedThrough] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const scenes = Array.from(stage.querySelectorAll<HTMLElement>("[data-index]"));
    const progressElement = stage.querySelector<HTMLElement>("[role='progressbar']");

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const progress = storyProgress(window.scrollY, top, root.offsetHeight, window.innerHeight);
      const scaled = progress * STORY_BEATS.length;
      const index = Math.min(LAST_INDEX, Math.floor(scaled + 0.00001));
      const local = Math.min(1, scaled - index);
      const blend = index === LAST_INDEX ? 0 : progressBetween(local, 0.82, 1);

      stage.style.setProperty("--story-progress", progress.toFixed(4));
      stage.dataset.beat = String(index);
      progressElement?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
      const nextLoadedThrough = Math.min(LAST_INDEX, index + 1);
      if (nextLoadedThrough > loadedThroughRef.current) {
        loadedThroughRef.current = nextLoadedThrough;
        setLoadedThrough(nextLoadedThrough);
      }
      scenes.forEach((scene, sceneIndex) => {
        const isCurrent = sceneIndex === index;
        const isNext = sceneIndex === index + 1 && blend > 0;
        scene.style.setProperty("--scene-progress", isCurrent ? local.toFixed(4) : "0");
        scene.style.visibility = isCurrent || isNext ? "visible" : "hidden";
        scene.style.opacity = isCurrent ? String(1 - blend) : isNext ? String(blend) : "0";
        scene.style.zIndex = isNext ? "1" : "0";
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  return (
    <section ref={rootRef} className={styles.story} aria-label="예찬과 주은의 결혼 이야기">
      {reducedMotion ? (
        <div className={styles.motionFallback}>
          {[STORY_BEATS[0], STORY_BEATS[3], STORY_BEATS[6], STORY_BEATS[10]].map((beat) => (
            <article key={beat.id} className={styles.fallbackCard}>
              <Image src={beat.image} alt="" width={1080} height={1920} sizes="(max-width: 416px) 100vw, 416px" />
              <p>{beat.copy}</p>
            </article>
          ))}
        </div>
      ) : <div ref={stageRef} className={styles.stage} data-beat="0">
        <div className={styles.scenes} aria-live="off">
          {STORY_BEATS.map((beat, index) => (
            <article
              key={beat.id}
              className={styles.scene}
              data-index={index}
              data-id={beat.id}
            >
              {index <= loadedThrough && <>
                <Image
                  src={beat.image}
                  alt=""
                  fill
                  preload={index === 0}
                  sizes="(max-width: 416px) 100vw, 416px"
                  className={styles.art}
                  style={{ objectPosition: beat.imagePosition }}
                />
                {(["opening", "look", "destination", "finale"] as string[]).includes(beat.id) && (
                  <Image
                    src={beat.image}
                    alt=""
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 416px) 100vw, 416px"
                    className={styles.foregroundArt}
                    style={{ objectPosition: beat.imagePosition }}
                  />
                )}
              </>}
              <div className={styles.tint} />
              <div className={styles.copy}>
                {beat.eyebrow && <p className={styles.eyebrow}>{beat.eyebrow}</p>}
                {index === 0 ? <h1>{beat.copy}</h1> : <p className={styles.line}>{beat.copy}</p>}
              </div>

              {beat.id === "look" && (
                <div className={styles.names} aria-hidden>
                  <span className={styles.yechan}>↘ {LOOK_LABELS.left}</span>
                  <span className={styles.jueun}>{LOOK_LABELS.right} ↙</span>
                </div>
              )}
              {beat.id === "laugh" && <div className={styles.laughMarks} aria-hidden>HA! HA!</div>}
              {beat.id === "journey" && <PostcardReveal />}
              {beat.id === "matchcut" && <div className={styles.paperWipe} aria-hidden />}
              {beat.id === "finale" && <Confetti />}
            </article>
          ))}
        </div>

        <a className={styles.skip} href={`#${contentTargetId}`}>이야기 건너뛰기</a>
        <div
          className={styles.rail}
          role="progressbar"
          aria-label="결혼 이야기 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        ><span /></div>
        <p className={styles.scrollHint} aria-hidden><span>SCROLL</span><i /></p>
      </div>}
    </section>
  );
}

function PostcardReveal() {
  return <div className={styles.postcardReveal} aria-hidden><i /><i /><i /></div>;
}

function Confetti() {
  return (
    <div className={styles.confetti} aria-hidden>
      {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
    </div>
  );
}
