import { useEffect } from "react";
import { progressBetween, storyProgress } from "./scrollMath";
import { dampedProgress, inlineClipPathForTrack, shouldSnapPlayhead } from "./timelineMath";
import {
  CHAPTERS,
  LAYER_TRACKS,
  SHOTS,
  nextStoryProgressAnnouncement,
  sampleLayerState,
} from "./storyTimeline";

type StoryTimelineOptions = {
  root: React.RefObject<HTMLElement | null>;
  stage: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
};

export function useStoryTimeline({ root, stage, enabled }: StoryTimelineOptions) {
  useEffect(() => {
    if (!enabled) return;
    const rootElement = root.current;
    const stageElement = stage.current;
    if (!rootElement || !stageElement) return;

    const layerElements = new Map(
      Array.from(stageElement.querySelectorAll<HTMLElement>("[data-story-layer]"))
        .map((element) => [element.dataset.storyLayer!, element]),
    );
    const copyElements = Array.from(stageElement.querySelectorAll<HTMLElement>("[data-story-copy]"));
    const progressElement = stageElement.querySelector<HTMLElement>("[role='progressbar']");
    const announcementElement = stageElement.querySelector<HTMLElement>("[data-story-announcement]");
    const chapterName = stageElement.querySelector<HTMLElement>("[data-chapter-name]");

    let target = 0;
    let playhead = 0;
    let frame = 0;
    let lastTime = performance.now();
    let visible = true;
    let lastShot = "";
    let lastChapter = "";

    const measure = () => {
      const rect = rootElement.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      target = storyProgress(window.scrollY, top, rootElement.offsetHeight, window.innerHeight);
      if (shouldSnapPlayhead(playhead, target)) playhead = target;
    };

    const paint = (progress: number) => {
      stageElement.style.setProperty("--story-progress", progress.toFixed(5));

      for (const track of LAYER_TRACKS) {
        const element = layerElements.get(track.id);
        if (!element) continue;
        const state = sampleLayerState(track, progress);
        const active = state.opacity >= 0.002;
        const wasActive = element.dataset.timelineActive === "true";
        if (!active) {
          if (element.dataset.timelineActive !== "false") {
            element.style.opacity = "0";
            element.style.visibility = "hidden";
            element.style.willChange = "auto";
            element.dataset.timelineActive = "false";
          }
          continue;
        }
        if (!wasActive) {
          element.style.visibility = "visible";
          element.style.willChange = "transform, opacity";
          element.dataset.timelineActive = "true";
        }
        element.style.opacity = state.opacity.toFixed(4);
        element.style.transformOrigin = `${state.originX.toFixed(3)}% ${state.originY.toFixed(3)}%`;
        element.style.transform = `translate3d(${state.x.toFixed(3)}px, ${state.y.toFixed(3)}px, 0) rotate(${state.rotate.toFixed(3)}deg) scale(${state.scaleX.toFixed(4)}, ${state.scaleY.toFixed(4)})`;
        element.style.clipPath = inlineClipPathForTrack(track, state) ?? "";
      }

      for (const element of copyElements) {
        const start = Number(element.dataset.copyStart);
        const end = Number(element.dataset.copyEnd);
        const fade = Math.min(0.009, (end - start) * 0.22);
        const opacity = Math.min(
          start === 0 ? 1 : progressBetween(progress, start, start + fade),
          1 - progressBetween(progress, end - fade, end),
        );
        const active = opacity >= 0.002;
        const wasActive = element.dataset.timelineActive === "true";
        if (!active) {
          if (element.dataset.timelineActive !== "false") {
            element.style.opacity = "0";
            element.style.visibility = "hidden";
            element.style.willChange = "auto";
            element.dataset.timelineActive = "false";
          }
          continue;
        }
        if (!wasActive) {
          element.style.visibility = "visible";
          element.style.willChange = "transform, opacity";
          element.dataset.timelineActive = "true";
        }
        element.style.opacity = opacity.toFixed(3);
        element.style.transform = `translate3d(-50%, ${(1 - opacity) * 18}px, 0) rotate(${(0.5 - opacity * 0.5).toFixed(2)}deg)`;
      }

      const shot = SHOTS.find(({ start, end }) => progress >= start && (progress < end || end === 1));
      const chapter = CHAPTERS.find(({ start, end }) => progress >= start && (progress < end || end === 1));
      const announcement = nextStoryProgressAnnouncement(lastShot, progress);
      if (shot && announcement) {
        stageElement.dataset.shot = announcement.shotId;
        progressElement?.setAttribute("aria-valuenow", String(announcement.value));
        progressElement?.setAttribute("aria-valuetext", announcement.text);
        announcementElement?.replaceChildren(announcement.text);
        lastShot = announcement.shotId;
      }
      if (chapter && chapter.id !== lastChapter) {
        stageElement.dataset.chapter = chapter.id;
        chapterName?.replaceChildren(chapter.title);
        lastChapter = chapter.id;
      }
    };

    const tick = (time: number) => {
      frame = 0;
      const deltaSeconds = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      playhead = Math.abs(playhead - target) < 0.00008
        ? target
        : dampedProgress(playhead, target, deltaSeconds, 13);
      paint(playhead);
      if (visible && Math.abs(playhead - target) >= 0.00008) frame = requestAnimationFrame(tick);
    };

    const schedule = () => {
      measure();
      if (!visible || frame) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const syncImmediately = () => {
      measure();
      playhead = target;
      paint(playhead);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) schedule();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { rootMargin: "100% 0px" });

    observer.observe(rootElement);
    syncImmediately();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", syncImmediately);
    window.addEventListener("orientationchange", syncImmediately);
    window.addEventListener("pageshow", syncImmediately);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", syncImmediately);
      window.removeEventListener("orientationchange", syncImmediately);
      window.removeEventListener("pageshow", syncImmediately);
    };
  }, [enabled, root, stage]);
}
