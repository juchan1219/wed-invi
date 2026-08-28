"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { StoryFallback } from "./StoryFallback";
import { StoryLayer } from "./StoryLayer";
import { STORY_CANVAS, STORY_CANVAS_LAYOUT } from "./storyAssets";
import { readReloadStoryProgress, writeStoryProgress } from "./storyHistory";
import {
  CHAPTERS,
  LAYER_TRACKS,
  SHOTS,
  assertStoryTimeline,
  buildStoryLayerTree,
  getStoryMotionPresentation,
  getStoryProgressAnnouncement,
  type StoryMotionMode,
  type StoryLayerNode,
} from "./storyTimeline";
import { useStoryTimeline } from "./useStoryTimeline";
import styles from "./WeddingStory.module.css";

assertStoryTimeline();
const STORY_LAYER_TREE = buildStoryLayerTree(LAYER_TRACKS);

function StoryLayerTreeNode({ node }: { node: StoryLayerNode }) {
  return (
    <StoryLayer track={node.track}>
      {node.children.map((child) => <StoryLayerTreeNode key={child.track.id} node={child} />)}
    </StoryLayer>
  );
}

const storyCanvasLayoutStyle = {
  "--story-chapter-nav-min-bottom": `${STORY_CANVAS_LAYOUT.chapterNavMinimumBottom}px`,
  "--story-sidecar-wheel-front-left": `${STORY_CANVAS_LAYOUT.sidecar.wheelFront.left}px`,
  "--story-sidecar-wheel-front-top": `${STORY_CANVAS_LAYOUT.sidecar.wheelFront.top}px`,
  "--story-sidecar-wheel-back-left": `${STORY_CANVAS_LAYOUT.sidecar.wheelBack.left}px`,
  "--story-sidecar-wheel-back-top": `${STORY_CANVAS_LAYOUT.sidecar.wheelBack.top}px`,
  "--story-title-glyph-size": `${STORY_CANVAS_LAYOUT.titleGlyphSize}px`,
} as CSSProperties;

export function WeddingStory({ contentTargetId }: { contentTargetId: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reloadRestoredRef = useRef(false);
  const [motionMode, setMotionMode] = useState<StoryMotionMode>("pending");
  const presentation = getStoryMotionPresentation(motionMode);
  const initialAnnouncement = getStoryProgressAnnouncement(0);

  useCanvasContainment(stageShellRef, presentation.showStage);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const documentStyle = document.documentElement.style;
    let currentMode: StoryMotionMode = "pending";
    let anchorFrame = 0;
    let previousOverflowAnchor = documentStyle.overflowAnchor;

    const suspendScrollAnchoring = () => {
      if (!anchorFrame) previousOverflowAnchor = documentStyle.overflowAnchor;
      else window.cancelAnimationFrame(anchorFrame);
      documentStyle.overflowAnchor = "none";
      anchorFrame = window.requestAnimationFrame(() => {
        anchorFrame = window.requestAnimationFrame(() => {
          documentStyle.overflowAnchor = previousOverflowAnchor;
          anchorFrame = 0;
        });
      });
    };
    const sync = () => {
      const nextMode: StoryMotionMode = media.matches ? "reduce" : "full";
      if (nextMode === currentMode) return;
      if (nextMode === "full" || currentMode === "full") suspendScrollAnchoring();
      currentMode = nextMode;
      setMotionMode(nextMode);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      if (anchorFrame) window.cancelAnimationFrame(anchorFrame);
      documentStyle.overflowAnchor = previousOverflowAnchor;
    };
  }, []);

  useLayoutEffect(() => {
    if (motionMode !== "full" || reloadRestoredRef.current) return;
    const progress = readReloadStoryProgress(window);
    if (progress === null) return;

    let frame = 0;
    let scheduled = false;
    const restore = () => {
      if (scheduled || reloadRestoredRef.current) return;
      scheduled = true;
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          const rootElement = rootRef.current;
          if (!rootElement) return;
          const storyTop = window.scrollY + rootElement.getBoundingClientRect().top;
          const travel = Math.max(0, rootElement.offsetHeight - window.innerHeight);
          window.scrollTo(0, storyTop + travel * progress);
          writeStoryProgress(window, progress);
          reloadRestoredRef.current = true;
        });
      });
    };

    if (document.readyState === "complete") restore();
    else window.addEventListener("pageshow", restore, { once: true });

    return () => {
      window.removeEventListener("pageshow", restore);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [motionMode]);

  useStoryTimeline({ root: rootRef, stage: stageRef, enabled: presentation.runTimeline });

  return (
    <section
      ref={rootRef}
      className={styles.story}
      aria-label="예찬과 주은의 결혼 이야기"
      data-motion={motionMode}
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

      <div ref={stageShellRef} className={styles.stageShell} aria-hidden={!presentation.showStage}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={storyCanvasLayoutStyle}
          data-story-canvas
          data-shot="island-opens"
          data-chapter="beginning"
        >
          <div className={styles.canvasPlane}>
            <div className={styles.layers} aria-hidden="true">
              {STORY_LAYER_TREE.map((node) => <StoryLayerTreeNode key={node.track.id} node={node} />)}
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
              aria-valuemin={1}
              aria-valuemax={SHOTS.length}
              aria-valuenow={initialAnnouncement.value}
              aria-valuetext={initialAnnouncement.text}
            ><span /></div>

            <p className={styles.progressAnnouncement} data-story-announcement aria-live="polite">
              {initialAnnouncement.text}
            </p>

            <p className={styles.scrollHint} aria-hidden="true"><span>SCROLL TO BEGIN</span><i /></p>
          </div>
        </div>
      </div>

      <StoryFallback />
    </section>
  );
}

function useCanvasContainment(shell: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const element = shell.current;
    if (!element) return;

    const setScale = (width: number, height: number) => {
      const scale = Math.min(width / STORY_CANVAS.width, height / STORY_CANVAS.height, 1);
      element.style.setProperty("--story-canvas-scale", scale.toFixed(5));
    };
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setScale(width, height);
    };
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width, entry.contentRect.height);
    });

    measure();
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, shell]);
}
