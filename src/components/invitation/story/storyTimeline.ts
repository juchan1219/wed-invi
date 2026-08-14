import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";
import { STORY_LAYER_DEFINITIONS } from "./storyAssets";
import {
  sampleClipTrack,
  sampleNumberTrack,
  type Clip,
  type ClipFrame,
  type EaseName,
  type NumberFrame,
} from "./timelineMath";

type SourceFrame = {
  at: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
  opacity: number;
  ease?: EaseName;
};

export type LayerKind = "background" | "scenery" | "character" | "prop" | "transition" | "type";

export type LayerTrack = {
  id: string;
  kind: LayerKind;
  parentId?: string;
  x?: readonly NumberFrame[];
  y?: readonly NumberFrame[];
  scaleX?: readonly NumberFrame[];
  scaleY?: readonly NumberFrame[];
  rotate?: readonly NumberFrame[];
  opacity?: readonly NumberFrame[];
  originX?: readonly NumberFrame[];
  originY?: readonly NumberFrame[];
  clip?: readonly ClipFrame[];
  techniques?: readonly StoryTransition[];
};

export type StoryTransition = "paperTear" | "polygonReveal" | "cameraZoom" | "panelExpansion" | "matchCut";

export type LayerState = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  opacity: number;
  originX: number;
  originY: number;
  clip: Clip;
};

export type StoryChapter = {
  id: string;
  title: string;
  start: number;
  end: number;
};

export type StoryShot = {
  id: string;
  chapterId: string;
  start: number;
  end: number;
  copyStart: number;
  copyEnd: number;
  eyebrow?: string;
  copy: string;
  layerIds: readonly string[];
};

export type StoryMotionMode = "pending" | "full" | "reduce";

export function getStoryMotionPresentation(mode: StoryMotionMode) {
  const full = mode === "full";
  return {
    showStage: full,
    showFallback: !full,
    runTimeline: full,
  };
}

const f = (
  at: number,
  opacity: number,
  x = 0,
  y = 0,
  size = 1,
  rotate = 0,
  ease: EaseName = "easeInOut",
): SourceFrame => ({ at, x, y, size, rotate, opacity, ease });

const LOGICAL_WIDTH = 430;
const LOGICAL_HEIGHT = 932;
const FULL_CLIP: Clip = [0, 0, 100, 0, 100, 100, 0, 100];

type SourceLayer = {
  id: string;
  kind: LayerKind;
  parentId?: string;
  frames: readonly SourceFrame[];
  xFrames?: readonly NumberFrame[];
  yFrames?: readonly NumberFrame[];
  scaleXFrames?: readonly NumberFrame[];
  scaleYFrames?: readonly NumberFrame[];
  rotateFrames?: readonly NumberFrame[];
  opacityFrames?: readonly NumberFrame[];
  originXFrames?: readonly NumberFrame[];
  originYFrames?: readonly NumberFrame[];
  clipFrames?: readonly ClipFrame[];
  techniques?: readonly StoryTransition[];
};

function numberFrames(
  frames: readonly SourceFrame[],
  field: keyof Pick<SourceFrame, "x" | "y" | "size" | "rotate" | "opacity">,
  factor = 1,
): readonly NumberFrame[] {
  return frames.map(({ at, ease, [field]: value }) => ({ at, value: value * factor, ease }));
}

function toLogicalTrack({
  id,
  kind,
  parentId,
  frames,
  xFrames,
  yFrames,
  scaleXFrames,
  scaleYFrames,
  rotateFrames,
  opacityFrames,
  originXFrames,
  originYFrames,
  clipFrames,
  techniques,
}: SourceLayer): LayerTrack {
  return {
    id,
    kind,
    parentId,
    x: xFrames ?? numberFrames(frames, "x", LOGICAL_WIDTH / 100),
    y: yFrames ?? numberFrames(frames, "y", LOGICAL_HEIGHT / 100),
    scaleX: scaleXFrames ?? numberFrames(frames, "size"),
    scaleY: scaleYFrames ?? numberFrames(frames, "size"),
    rotate: rotateFrames ?? numberFrames(frames, "rotate"),
    opacity: opacityFrames ?? numberFrames(frames, "opacity"),
    originX: originXFrames,
    originY: originYFrames,
    clip: clipFrames,
    techniques,
  };
}

export const CHAPTERS: readonly StoryChapter[] = [
  { id: "beginning", title: "같은 방향을 바라보기 시작한 날", start: 0, end: 0.15 },
  { id: "coworkers", title: "처음엔 그냥 회사 동료", start: 0.15, end: 0.33 },
  { id: "laughter", title: "웃음을 참는 데 실패했습니다", start: 0.33, end: 0.52 },
  { id: "journey", title: "우리의 길은 이어졌습니다", start: 0.52, end: 0.7 },
  { id: "destination", title: "우리가 향한 곳", start: 0.7, end: 0.86 },
  { id: "wedding", title: "우리 결혼합니다", start: 0.86, end: 1 },
] as const;

export const SHOTS: readonly StoryShot[] = [
  { id: "island-opens", chapterId: "beginning", start: 0, end: 0.05, copyStart: 0, copyEnd: 0.018, eyebrow: "예찬과 주은의", copy: "결혼 이야기", layerIds: ["bg-jeju", "opening-island", "title-shards"] },
  { id: "sidecar-arrives", chapterId: "beginning", start: 0.05, end: 0.1, copyStart: 0.054, copyEnd: 0.094, copy: "제주에서 시작된 우리의 여행", layerIds: ["opening-field", "sidecar", "wheel-front", "wheel-back"] },
  { id: "same-direction", chapterId: "beginning", start: 0.1, end: 0.15, copyStart: 0.104, copyEnd: 0.144, copy: "서로를 보던 두 사람은 같은 방향을 바라봤습니다.", layerIds: ["sidecar", "name-labels", "opening-clouds"] },
  { id: "paper-to-tower", chapterId: "coworkers", start: 0.15, end: 0.21, copyStart: 0.155, copyEnd: 0.205, eyebrow: "을지로 SK T타워", copy: "그런데 처음엔—", layerIds: ["paper-tear", "tower-card", "bg-office"] },
  { id: "through-window", chapterId: "coworkers", start: 0.21, end: 0.27, copyStart: 0.215, copyEnd: 0.265, copy: "그냥 회사 동료였습니다.", layerIds: ["tower-card", "tower-wall-left", "tower-wall-right", "office-yechan", "office-jueun"] },
  { id: "awkward-desk", chapterId: "coworkers", start: 0.27, end: 0.33, copyStart: 0.275, copyEnd: 0.325, copy: "아주 조금… 어색한 동료였죠.", layerIds: ["office-yechan", "office-jueun", "office-props"] },
  { id: "joke-panel", chapterId: "laughter", start: 0.33, end: 0.39, copyStart: 0.335, copyEnd: 0.385, copy: "그러다 예찬이 한마디를 건넸고—", layerIds: ["bg-laugh", "panel-left", "joke-yechan", "speech-bubble"] },
  { id: "trying-not-to-laugh", chapterId: "laughter", start: 0.39, end: 0.455, copyStart: 0.395, copyEnd: 0.45, copy: "주은은 웃음을 참아보려 했지만", layerIds: ["panel-right", "jueun-expression", "speech-bubble"] },
  { id: "laugh-together", chapterId: "laughter", start: 0.455, end: 0.52, copyStart: 0.46, copyEnd: 0.515, copy: "평생 웃겨주고 웃어주는 짝꿍이 되기로 했습니다.", layerIds: ["panel-left", "panel-right", "laugh-burst", "joke-yechan", "jueun-expression"] },
  { id: "postcards-open", chapterId: "journey", start: 0.52, end: 0.58, copyStart: 0.525, copyEnd: 0.575, eyebrow: "함부르크 · 도쿄 · 그리고 서울", copy: "함부르크의 노을 아래", layerIds: ["bg-journey", "proposal-triptych"] },
  { id: "route-connects", chapterId: "journey", start: 0.58, end: 0.64, copyStart: 0.585, copyEnd: 0.635, copy: "작은 상자 속 질문에 주은은 웃음으로 답했고", layerIds: ["proposal-triptych", "ring-glint"] },
  { id: "jeju-expands", chapterId: "journey", start: 0.64, end: 0.7, copyStart: 0.645, copyEnd: 0.695, copy: "도쿄의 여름을 지나, 우리의 다음 장면으로", layerIds: ["proposal-triptych", "ring-glint", "venue-reveal"] },
  { id: "venue-approach", chapterId: "destination", start: 0.7, end: 0.78, copyStart: 0.706, copyEnd: 0.774, copy: `${formatCeremonyDateShort().replaceAll(" ", "")} ${formatCeremonyTime()},`, layerIds: ["bg-venue", "venue-reveal", "venue-doors", "casual-couple"] },
  { id: "outfit-matchcut", chapterId: "destination", start: 0.78, end: 0.86, copyStart: 0.786, copyEnd: 0.854, copy: `${wedding.venue.name}에서요!`, layerIds: ["venue-doors", "casual-couple", "matchcut-strip", "wedding-couple"] },
  { id: "everyone-arrives", chapterId: "wedding", start: 0.86, end: 0.93, copyStart: 0.866, copyEnd: 0.924, eyebrow: "예찬 ♥ 주은", copy: "소중한 분들과 함께", layerIds: ["bg-finale", "wedding-couple", "crowd-left", "crowd-right", "confetti-back", "confetti", "confetti-front"] },
  { id: "invitation-rises", chapterId: "wedding", start: 0.93, end: 1, copyStart: 0.936, copyEnd: 0.987, copy: "우리 결혼합니다!!", layerIds: ["final-title", "confetti-back", "confetti", "confetti-front", "invitation-paper"] },
] as const;

export function getStoryProgressAnnouncement(progress: number) {
  const normalized = Math.min(1, Math.max(0, progress));
  const index = SHOTS.findIndex(({ start, end }) => (
    normalized >= start && (normalized < end || end === 1)
  ));
  const shotIndex = index < 0 ? SHOTS.length - 1 : index;
  const shot = SHOTS[shotIndex]!;
  const value = shotIndex + 1;
  return {
    shotId: shot.id,
    value,
    text: `${value}/${SHOTS.length}. ${shot.copy}`,
  };
}

export function nextStoryProgressAnnouncement(previousShotId: string, progress: number) {
  const announcement = getStoryProgressAnnouncement(progress);
  return announcement.shotId === previousShotId ? null : announcement;
}

const SIDECAR_X_FRAMES = [
  { at: 0, value: 520 },
  { at: 0.0425, value: 520 },
  { at: 0.1, value: 70 },
  { at: 0.13, value: 108 },
  { at: 0.15, value: 155 },
  { at: 0.165, value: 240 },
] as const satisfies readonly NumberFrame[];

const SIDECAR_Y_FRAMES = [
  { at: 0, value: 298 },
  { at: 0.0425, value: 280 },
  { at: 0.1, value: 28 },
  { at: 0.13, value: 82 },
  { at: 0.15, value: 186 },
  { at: 0.165, value: 280 },
] as const satisfies readonly NumberFrame[];

const PARENT_LOCAL_ZERO_FRAMES = [
  { at: 0, value: 0 },
  { at: 1, value: 0 },
] as const satisfies readonly NumberFrame[];

const PARENT_LOCAL_ONE_FRAMES = [
  { at: 0, value: 1 },
  { at: 1, value: 1 },
] as const satisfies readonly NumberFrame[];

const SOURCE_LAYERS: readonly SourceLayer[] = [
  {
    id: "bg-jeju",
    kind: "background",
    frames: [f(0, 1, 0, 0, 1.02), f(0.12, 1, 0, 0, 1.08), f(0.15, 1, 0, -2, 1.12), f(0.17, 0, 0, -4, 1.16)],
    xFrames: [{ at: 0, value: 0 }, { at: 0.15, value: -36 }, { at: 0.17, value: -44 }],
  },
  {
    id: "bg-office",
    kind: "background",
    frames: [f(0, 0), f(0.14, 0), f(0.15, 0.3), f(0.17, 1), f(0.5, 1), f(0.53, 0)],
    scaleXFrames: [{ at: 0, value: 1.35 }, { at: 0.21, value: 1.35 }, { at: 0.255, value: 1 }],
    scaleYFrames: [{ at: 0, value: 1.35 }, { at: 0.21, value: 1.35 }, { at: 0.255, value: 1 }],
    originXFrames: [{ at: 0, value: 51 }, { at: 1, value: 51 }],
    originYFrames: [{ at: 0, value: 43 }, { at: 1, value: 43 }],
  },
  { id: "bg-laugh", kind: "background", frames: [f(0, 0), f(0.315, 0.3), f(0.335, 1), f(0.5, 1), f(0.53, 0)] },
  { id: "bg-journey", kind: "background", frames: [f(0, 0), f(0.5, 0), f(0.53, 1), f(0.68, 1), f(0.71, 0)] },
  {
    id: "bg-venue",
    kind: "background",
    techniques: ["polygonReveal", "matchCut"],
    frames: [f(0, 0), f(0.6825, 0), f(0.69, 1), f(0.84, 1), f(0.85, 0, 0, 0, 1, 0, "hold")],
    scaleXFrames: [{ at: 0, value: 1.35 }, { at: 0.69, value: 1.35 }, { at: 0.76, value: 1 }, { at: 1, value: 1 }],
    scaleYFrames: [{ at: 0, value: 1.35 }, { at: 0.69, value: 1.35 }, { at: 0.76, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 44 }, { at: 1, value: 44 }],
    clipFrames: [
      { at: 0.6825, value: [49, 0, 51, 0, 75, 100, 73, 100], ease: "easeInOut" },
      { at: 0.69, value: [47, 0, 53, 0, 79, 100, 69, 100], ease: "easeInOut" },
      { at: 0.72, value: FULL_CLIP },
    ],
  },
  {
    id: "bg-finale",
    kind: "background",
    techniques: ["polygonReveal", "matchCut"],
    frames: [f(0, 0), f(0.84, 0), f(0.85, 1), f(1, 1)],
    clipFrames: [
      { at: 0, value: FULL_CLIP },
      { at: 0.985, value: FULL_CLIP, ease: "easeInOut" },
      { at: 1, value: [50, 50, 50, 50, 50, 50, 50, 50] },
    ],
  },

  { id: "opening-clouds", kind: "scenery", frames: [f(0, 0, -8, -6, 1.08), f(0.015, 1, -5, 0, 1.05), f(0.1, 1, 2, 1, 1.05), f(0.15, 0, 8, -4, 1.08), f(0.64, 0), f(0.66, 1, -4, 0, 1.08), f(0.7, 0, 8, -2, 1.12)] },
  { id: "opening-island", kind: "scenery", frames: [f(0, 0, 0, 12, 0.92), f(0.02, 1, 0, 0, 1), f(0.12, 1, -2, -1, 1.04), f(0.15, 0, -4, -4, 1.08), f(0.64, 0), f(0.66, 1, 0, 5, 1.2), f(0.7, 0, -5, -4, 1.5)] },
  { id: "opening-field", kind: "scenery", frames: [f(0, 0, 0, 18, 1.08), f(0.025, 1, 0, 0, 1.04), f(0.1, 1, -5, 0, 1.12), f(0.15, 0, -10, 8, 1.2)] },
  { id: "title-shards", kind: "type", frames: [f(0, 0, 0, -18, 0.72, -6), f(0.016, 1, 0, 0, 1.04, 1), f(0.036, 1, 0, 0, 1, -1), f(0.048, 1), f(0.058, 0, 5, -20, 1.18, 8)] },
  {
    id: "sidecar",
    kind: "character",
    frames: [f(0, 0, 0, 32, 0.72), f(0.0425, 0.3, 0, 30, 0.75), f(0.065, 1, 0, 8, 0.94), f(0.1, 1, 0, 3, 1.02, -1), f(0.15, 1, 0, 20, 1.08, 1), f(0.165, 0, 0, 30, 1.16)],
    xFrames: SIDECAR_X_FRAMES,
    yFrames: SIDECAR_Y_FRAMES,
  },
  { id: "wheel-front", kind: "prop", parentId: "sidecar", frames: [f(0, 0, 0, 24, 0.8), f(0.055, 0, 0, 20, 0.9), f(0.07, 1, 0, 3, 1, 0), f(0.105, 1, 1, 0, 1.08, 240), f(0.15, 1, 0, -2, 1.14, 520), f(0.165, 0, 0, -8, 1.2, 680)], xFrames: PARENT_LOCAL_ZERO_FRAMES, yFrames: PARENT_LOCAL_ZERO_FRAMES, scaleXFrames: PARENT_LOCAL_ONE_FRAMES, scaleYFrames: PARENT_LOCAL_ONE_FRAMES },
  { id: "wheel-back", kind: "prop", parentId: "sidecar", frames: [f(0, 0, 0, 24, 0.8), f(0.055, 0, 0, 20, 0.9), f(0.07, 1, 0, 3, 1), f(0.105, 1, 1, 0, 1.08, 240), f(0.15, 1, 0, -2, 1.14, 520), f(0.165, 0, 0, -8, 1.2, 680)], xFrames: PARENT_LOCAL_ZERO_FRAMES, yFrames: PARENT_LOCAL_ZERO_FRAMES, scaleXFrames: PARENT_LOCAL_ONE_FRAMES, scaleYFrames: PARENT_LOCAL_ONE_FRAMES },
  { id: "name-labels", kind: "type", frames: [f(0, 0, 0, 3, 0.8), f(0.09, 0, 0, 3, 0.8), f(0.112, 1, 0, 0, 1.05, -2), f(0.14, 1, 0, -1, 1), f(0.155, 0, 0, -4, 1.1)] },

  {
    id: "paper-tear",
    kind: "transition",
    techniques: ["paperTear"],
    frames: [f(0, 0), f(0.135, 0.3), f(0.15, 1), f(0.195, 1), f(0.2175, 0.3), f(0.225, 0)],
    scaleXFrames: [{ at: 0, value: 0.15 }, { at: 0.135, value: 0.15 }, { at: 0.17, value: 2.4 }, { at: 0.225, value: 2.4 }],
    scaleYFrames: [{ at: 0, value: 0.15 }, { at: 0.135, value: 0.15 }, { at: 0.17, value: 2.4 }, { at: 0.225, value: 2.4 }],
    originXFrames: [{ at: 0, value: 84 }, { at: 1, value: 84 }],
    originYFrames: [{ at: 0, value: 78 }, { at: 1, value: 78 }],
  },
  {
    id: "tower-card",
    kind: "prop",
    techniques: ["polygonReveal", "cameraZoom"],
    frames: [f(0, 0), f(0.16, 0), f(0.17, 0.35), f(0.195, 1), f(0.245, 1), f(0.265, 0)],
    scaleXFrames: [{ at: 0, value: 0.72 }, { at: 0.17, value: 0.72 }, { at: 0.195, value: 1 }, { at: 0.21, value: 1 }, { at: 0.255, value: 4.8 }],
    scaleYFrames: [{ at: 0, value: 0.58 }, { at: 0.17, value: 0.58 }, { at: 0.195, value: 1 }, { at: 0.21, value: 1 }, { at: 0.255, value: 4.8 }],
    rotateFrames: [{ at: 0, value: -5 }, { at: 0.17, value: -5 }, { at: 0.195, value: 0 }, { at: 1, value: 0 }],
    originXFrames: [{ at: 0, value: 51 }, { at: 1, value: 51 }],
    originYFrames: [{ at: 0, value: 43 }, { at: 1, value: 43 }],
    clipFrames: [
      { at: 0.15, value: [50, 0, 50, 0, 50, 100, 50, 100], ease: "easeOut" },
      { at: 0.19, value: [12, 5, 88, 0, 94, 96, 6, 100], ease: "easeOut" },
      { at: 0.21, value: [0, 0, 100, 0, 100, 100, 0, 100] },
    ],
  },
  { id: "tower-wall-left", kind: "scenery", frames: [f(0, 0, -52, 0, 1.1), f(0.2, 0, -52, 0, 1.1), f(0.225, 1, 0, 0, 1), f(0.255, 1, -18, 0, 1.08), f(0.28, 0, -58, 0, 1.15)] },
  { id: "tower-wall-right", kind: "scenery", frames: [f(0, 0, 52, 0, 1.1), f(0.2, 0, 52, 0, 1.1), f(0.225, 1, 0, 0, 1), f(0.255, 1, 18, 0, 1.08), f(0.28, 0, 58, 0, 1.15)] },
  { id: "office-yechan", kind: "character", frames: [f(0, 0, -28, 15, 0.82), f(0.215, 0, -28, 15, 0.82), f(0.245, 1, -18, 2, 1), f(0.3, 1, -14, 0, 1.04, 1), f(0.33, 0, -20, 4, 1.08)] },
  { id: "office-jueun", kind: "character", frames: [f(0, 0, 28, 15, 0.82), f(0.215, 0, 28, 15, 0.82), f(0.245, 1, 18, 2, 1), f(0.3, 1, 14, 0, 1.04, -1), f(0.33, 0, 20, 4, 1.08)] },
  {
    id: "office-props",
    kind: "prop",
    frames: [f(0, 0), f(0.255, 0.35), f(0.27, 1), f(0.3375, 1), f(0.35, 0)],
    yFrames: [{ at: 0, value: 280 }, { at: 0.255, value: 280 }, { at: 0.3375, value: 665 }],
    scaleXFrames: [{ at: 0, value: 1 }, { at: 1, value: 1 }],
    scaleYFrames: [{ at: 0, value: 1 }, { at: 0.315, value: 1 }, { at: 0.3375, value: 0.82 }],
  },

  {
    id: "panel-left",
    kind: "scenery",
    techniques: ["panelExpansion"],
    frames: [f(0, 0), f(0.315, 0.3), f(0.33, 1), f(0.5125, 1), f(0.53, 0)],
    xFrames: [{ at: 0, value: -430 }, { at: 0.315, value: -430 }, { at: 0.37, value: 0 }, { at: 1, value: 0 }],
    scaleXFrames: [{ at: 0, value: 1 }, { at: 0.455, value: 1 }, { at: 0.49, value: 0.5 }, { at: 1, value: 0.5 }],
    scaleYFrames: [{ at: 0, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 0 }, { at: 1, value: 0 }],
  },
  {
    id: "panel-right",
    kind: "scenery",
    techniques: ["polygonReveal", "panelExpansion"],
    frames: [f(0, 0), f(0.375, 0.3), f(0.39, 0.7), f(0.5125, 1), f(0.53, 0)],
    scaleXFrames: [{ at: 0, value: 1 }, { at: 0.455, value: 1 }, { at: 0.49, value: 0.5 }, { at: 1, value: 0.5 }],
    scaleYFrames: [{ at: 0, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 100 }, { at: 1, value: 100 }],
    clipFrames: [
      { at: 0.3675, value: [100, 0, 100, 0, 100, 100, 100, 100], ease: "easeOut" },
      { at: 0.39, value: [76, 0, 100, 4, 100, 96, 82, 100], ease: "easeOut" },
      { at: 0.455, value: [8, 0, 100, 0, 100, 100, 5, 100], ease: "easeOut" },
      { at: 0.47, value: FULL_CLIP },
    ],
  },
  { id: "joke-yechan", kind: "character", frames: [f(0, 0, -35, 8, 0.8), f(0.33, 0, -35, 8, 0.8), f(0.36, 1, -20, 2, 1, -4), f(0.405, 1, -14, 0, 1.08, 1), f(0.49, 1, -8, 0, 1.12, -1), f(0.525, 0, -4, 3, 1.2)] },
  { id: "jueun-expression", kind: "character", frames: [f(0, 0, 30, 8, 0.8), f(0.38, 0, 30, 8, 0.8), f(0.405, 1, 20, 2, 1, 0, "hold"), f(0.43, 1, 18, 1, 1.03, -1, "hold"), f(0.455, 1, 15, 0, 1.08, 2, "hold"), f(0.49, 1, 8, 0, 1.12, -1), f(0.525, 0, 4, 3, 1.2)] },
  { id: "speech-bubble", kind: "prop", frames: [f(0, 0, 10, 6, 0.25, -12), f(0.345, 0, 10, 6, 0.25, -12), f(0.375, 1, 2, 0, 1.05, 3), f(0.415, 1, 0, -1, 1, -1), f(0.45, 0, -6, -10, 1.35, 8)] },
  {
    id: "laugh-burst",
    kind: "type",
    frames: [f(0, 0), f(0.43, 0.3), f(0.455, 0.7), f(0.47, 1), f(0.5275, 0.3), f(0.535, 0)],
    scaleXFrames: [{ at: 0, value: 0.2 }, { at: 0.43, value: 0.2 }, { at: 0.52, value: 1.6 }, { at: 1, value: 1.6 }],
    scaleYFrames: [{ at: 0, value: 0.2 }, { at: 0.43, value: 0.2 }, { at: 0.52, value: 1.6 }, { at: 1, value: 1.6 }],
    rotateFrames: [{ at: 0, value: -8 }, { at: 0.43, value: -8 }, { at: 0.52, value: 0 }, { at: 1, value: 0 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
  },

  {
    id: "proposal-triptych",
    kind: "prop",
    techniques: ["cameraZoom", "matchCut"],
    frames: [f(0, 0), f(0.51, 0), f(0.5125, 1), f(0.72, 1, 0, 0, 1, 0, "hold"), f(0.720001, 0)],
    xFrames: [
      { at: 0, value: 0 },
      { at: 0.55, value: 0, ease: "easeInOut" },
      { at: 0.58, value: -430 },
      { at: 0.61, value: -430, ease: "easeInOut" },
      { at: 0.64, value: -860 },
      { at: 1, value: -860 },
    ],
    yFrames: PARENT_LOCAL_ZERO_FRAMES,
    scaleXFrames: [{ at: 0, value: 1 }, { at: 0.64, value: 1 }, { at: 0.7, value: 1.8 }, { at: 1, value: 1.8 }],
    scaleYFrames: [{ at: 0, value: 1 }, { at: 0.64, value: 1 }, { at: 0.7, value: 1.8 }, { at: 1, value: 1.8 }],
    rotateFrames: PARENT_LOCAL_ZERO_FRAMES,
    originXFrames: [{ at: 0, value: 80.32945736434109 }, { at: 1, value: 80.32945736434109 }],
    originYFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
  },
  {
    id: "venue-reveal",
    kind: "transition",
    techniques: ["polygonReveal", "matchCut"],
    frames: [f(0, 0), f(0.6825, 0), f(0.69, 1), f(0.72, 1, 0, 0, 1, 0, "hold"), f(0.720001, 0)],
    scaleXFrames: [{ at: 0, value: 1.35 }, { at: 0.69, value: 1.35 }, { at: 0.76, value: 1 }, { at: 1, value: 1 }],
    scaleYFrames: [{ at: 0, value: 1.35 }, { at: 0.69, value: 1.35 }, { at: 0.76, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 44 }, { at: 1, value: 44 }],
    clipFrames: [
      { at: 0.6825, value: [49, 0, 51, 0, 75, 100, 73, 100], ease: "easeInOut" },
      { at: 0.69, value: [47, 0, 53, 0, 79, 100, 69, 100], ease: "easeInOut" },
      { at: 0.72, value: FULL_CLIP },
    ],
  },
  {
    id: "ring-glint",
    kind: "prop",
    frames: [f(0, 0), f(0.575, 0), f(0.58, 1), f(0.635, 1), f(0.64, 0)],
    xFrames: PARENT_LOCAL_ZERO_FRAMES,
    yFrames: PARENT_LOCAL_ZERO_FRAMES,
    scaleXFrames: [{ at: 0, value: 0.8 }, { at: 0.58, value: 0.8 }, { at: 0.61, value: 1.12 }, { at: 0.64, value: 1 }, { at: 1, value: 1 }],
    scaleYFrames: [{ at: 0, value: 0.8 }, { at: 0.58, value: 0.8 }, { at: 0.61, value: 1.12 }, { at: 0.64, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
  },

  {
    id: "venue-doors",
    kind: "scenery",
    techniques: ["polygonReveal", "matchCut"],
    frames: [f(0, 0), f(0.7725, 0), f(0.78, 1), f(0.86, 1), f(0.87, 0)],
    scaleXFrames: [{ at: 0, value: 1.35 }, { at: 0.78, value: 1.35 }, { at: 0.84, value: 1 }, { at: 1, value: 1 }],
    scaleYFrames: [{ at: 0, value: 1.35 }, { at: 0.78, value: 1.35 }, { at: 0.84, value: 1 }, { at: 1, value: 1 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 62 }, { at: 1, value: 62 }],
    clipFrames: [
      { at: 0.7725, value: [49, 39, 51, 39, 51, 91, 49, 91], ease: "easeInOut" },
      { at: 0.78, value: [47, 36, 53, 36, 55, 92, 45, 92], ease: "easeInOut" },
      { at: 0.84, value: FULL_CLIP },
    ],
  },
  {
    id: "casual-couple",
    kind: "character",
    frames: [f(0, 0), f(0.7, 0), f(0.71, 1, 0, 0, 1, 0, "hold"), f(0.8225, 0)],
    xFrames: PARENT_LOCAL_ZERO_FRAMES,
    yFrames: [{ at: 0, value: 660 }, { at: 0.71, value: 660, ease: "easeInOut" }, { at: 0.8175, value: 610 }, { at: 1, value: 610 }],
    scaleXFrames: PARENT_LOCAL_ONE_FRAMES,
    scaleYFrames: PARENT_LOCAL_ONE_FRAMES,
  },
  { id: "matchcut-strip", kind: "transition", techniques: ["matchCut"], frames: [f(0, 0), f(0.8, 0), f(0.8175, 0.35, 0, 0, 1), f(0.825, 0, 0, -8, 1.08)] },
  {
    id: "wedding-couple",
    kind: "character",
    frames: [f(0, 0), f(0.81, 0, 0, 0, 1, 0, "hold"), f(0.8175, 0.3), f(0.825, 1), f(0.97, 1), f(0.985, 0)],
    xFrames: PARENT_LOCAL_ZERO_FRAMES,
    yFrames: [{ at: 0, value: 610 }, { at: 0.86, value: 610 }, { at: 0.93, value: 470 }, { at: 1, value: 470 }],
    scaleXFrames: PARENT_LOCAL_ONE_FRAMES,
    scaleYFrames: PARENT_LOCAL_ONE_FRAMES,
  },

  {
    id: "crowd-left",
    kind: "character",
    frames: [f(0, 0), f(0.85, 0), f(0.8525, 0.3), f(0.86, 1), f(0.96, 1), f(0.975, 0)],
    xFrames: [{ at: 0, value: -180 }, { at: 0.86, value: -180 }, { at: 0.9, value: 0 }, { at: 1, value: 0 }],
    yFrames: PARENT_LOCAL_ZERO_FRAMES,
  },
  {
    id: "crowd-right",
    kind: "character",
    frames: [f(0, 0), f(0.85, 0), f(0.8525, 0.3), f(0.86, 1), f(0.96, 1), f(0.975, 0)],
    xFrames: [{ at: 0, value: 180 }, { at: 0.86, value: 180 }, { at: 0.9, value: 20 }, { at: 1, value: 20 }],
    yFrames: PARENT_LOCAL_ZERO_FRAMES,
  },
  { id: "confetti-back", kind: "prop", frames: [f(0, 0, 0, -24, 0.72, -15), f(0.85, 0, 0, -24, 0.72, -15), f(0.885, 0.65, -2, -10, 0.76, 50), f(0.94, 0.7, 2, 14, 0.82, 180), f(1, 0, -2, 46, 0.9, 340)] },
  { id: "confetti", kind: "prop", frames: [f(0, 0, 0, -30, 1), f(0.855, 0, 0, -30, 1), f(0.88, 1, 0, -18, 1), f(0.93, 1, 0, 5, 1.08, 180), f(0.98, 1, 0, 28, 1.18, 420), f(1, 0, 0, 55, 1.25, 600)] },
  { id: "confetti-front", kind: "prop", frames: [f(0, 0, 0, -38, 1.25, 12), f(0.865, 0, 0, -38, 1.25, 12), f(0.9, 1, 3, -20, 1.28, 90), f(0.95, 1, -3, 11, 1.34, 300), f(1, 0, 3, 62, 1.42, 640)] },
  { id: "final-title", kind: "type", frames: [f(0, 0, 0, 10, 0.5, -5), f(0.9, 0, 0, 10, 0.5, -5), f(0.935, 1, 0, 0, 1.12, 2), f(0.965, 1, 0, -2, 1, -1), f(0.985, 0, 0, -8, 1.18, 4)] },
  {
    id: "invitation-paper",
    kind: "transition",
    techniques: ["matchCut"],
    frames: [f(0, 0), f(0.92, 0), f(0.9225, 0.3), f(0.945, 1), f(1, 1)],
    xFrames: [{ at: 0, value: 390 }, { at: 0.93, value: 390 }, { at: 1, value: -40 }],
    yFrames: [{ at: 0, value: -180 }, { at: 0.93, value: -180 }, { at: 1, value: -20 }],
    scaleXFrames: [{ at: 0, value: 0.35 }, { at: 0.93, value: 0.35 }, { at: 1, value: 2.2 }],
    scaleYFrames: [{ at: 0, value: 0.35 }, { at: 0.93, value: 0.35 }, { at: 1, value: 2.2 }],
    originXFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
    originYFrames: [{ at: 0, value: 50 }, { at: 1, value: 50 }],
  },
] as const;

export const LAYER_TRACKS: readonly LayerTrack[] = SOURCE_LAYERS.map(toLogicalTrack);

export type StoryLayerNode = {
  track: LayerTrack;
  children: readonly StoryLayerNode[];
};

export function buildStoryLayerTree(tracks: readonly LayerTrack[]): readonly StoryLayerNode[] {
  const tracksById = new Map<string, LayerTrack>();
  const childrenByParentId = new Map<string, LayerTrack[]>();

  for (const track of tracks) {
    if (tracksById.has(track.id)) throw new Error(`duplicate layer id: ${track.id}`);
    tracksById.set(track.id, track);
  }

  for (const track of tracks) {
    if (!track.parentId) continue;
    if (track.parentId === track.id) throw new Error(`${track.id} cannot parent itself`);
    if (!tracksById.has(track.parentId)) throw new Error(`${track.id} has unknown parent ${track.parentId}`);
    const siblings = childrenByParentId.get(track.parentId) ?? [];
    siblings.push(track);
    childrenByParentId.set(track.parentId, siblings);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const buildNode = (track: LayerTrack): StoryLayerNode => {
    if (visiting.has(track.id)) throw new Error(`layer parent cycle includes ${track.id}`);
    if (visited.has(track.id)) throw new Error(`${track.id} has multiple DOM owners`);
    visiting.add(track.id);
    const children = (childrenByParentId.get(track.id) ?? []).map(buildNode);
    visiting.delete(track.id);
    visited.add(track.id);
    return { track, children };
  };

  const roots = tracks.filter(({ parentId }) => !parentId).map(buildNode);
  for (const track of tracks) {
    if (!visited.has(track.id)) buildNode(track);
  }
  return roots;
}

export const STORY_RENDERABLE_LAYER_IDS = STORY_LAYER_DEFINITIONS.map(({ id }) => id);
const STORY_RENDERABLE_LAYER_ID_SET = new Set<string>(STORY_RENDERABLE_LAYER_IDS);

export function isStoryLayerRenderable(id: string) {
  return STORY_RENDERABLE_LAYER_ID_SET.has(id);
}

export const STORY_TRANSITIONS = [...new Set(
  LAYER_TRACKS.flatMap(({ techniques = [] }) => techniques),
)] as readonly StoryTransition[];

export { FULL_CLIP };

function sampleOptionalNumberTrack(
  frames: readonly NumberFrame[] | undefined,
  progress: number,
  fallback: number,
) {
  return frames ? sampleNumberTrack(frames, progress) : fallback;
}

export function sampleLayerState(
  track: LayerTrack,
  progress: number,
): LayerState {
  return {
    x: sampleOptionalNumberTrack(track.x, progress, 0),
    y: sampleOptionalNumberTrack(track.y, progress, 0),
    scaleX: sampleOptionalNumberTrack(track.scaleX, progress, 1),
    scaleY: sampleOptionalNumberTrack(track.scaleY, progress, 1),
    rotate: sampleOptionalNumberTrack(track.rotate, progress, 0),
    opacity: sampleOptionalNumberTrack(track.opacity, progress, 1),
    originX: sampleOptionalNumberTrack(track.originX, progress, 50),
    originY: sampleOptionalNumberTrack(track.originY, progress, 50),
    clip: track.clip ? sampleClipTrack(track.clip, progress) : FULL_CLIP,
  };
}

export function assertStoryTimeline() {
  const ids = new Set<string>();
  const chapterIds = new Set(CHAPTERS.map(({ id }) => id));
  const trackIds = new Set(LAYER_TRACKS.map(({ id }) => id));
  const renderableLayerIds = new Set<string>(STORY_RENDERABLE_LAYER_IDS);

  for (const track of LAYER_TRACKS) {
    if (ids.has(track.id)) throw new Error(`duplicate layer id: ${track.id}`);
    ids.add(track.id);
    if (!renderableLayerIds.has(track.id)) throw new Error(`${track.id} has no DOM renderer`);
    for (const frames of [
      track.x,
      track.y,
      track.scaleX,
      track.scaleY,
      track.rotate,
      track.opacity,
      track.originX,
      track.originY,
    ]) {
      if (!frames) continue;
      for (let index = 0; index < frames.length; index += 1) {
        const frame = frames[index]!;
        if (frame.at < 0 || frame.at > 1) throw new Error(`${track.id} frame is outside 0..1`);
        if (index > 0 && frames[index - 1]!.at > frame.at) throw new Error(`${track.id} frames are unordered`);
      }
    }
    if (track.clip) {
      for (let index = 0; index < track.clip.length; index += 1) {
        const frame = track.clip[index]!;
        if (frame.at < 0 || frame.at > 1) throw new Error(`${track.id} clip frame is outside 0..1`);
        if (index > 0 && track.clip[index - 1]!.at > frame.at) throw new Error(`${track.id} clip frames are unordered`);
        if (frame.value.some((value) => value < 0 || value > 100)) throw new Error(`${track.id} clip point is outside 0..100`);
      }
    }
  }

  for (const layerId of renderableLayerIds) {
    if (!trackIds.has(layerId)) throw new Error(`${layerId} has no timeline track`);
  }

  buildStoryLayerTree(LAYER_TRACKS);

  for (const shot of SHOTS) {
    if (!chapterIds.has(shot.chapterId)) throw new Error(`${shot.id} has an unknown chapter`);
    if (shot.start < 0 || shot.end > 1 || shot.start >= shot.end) throw new Error(`${shot.id} has invalid bounds`);
    if (shot.copyStart < shot.start || shot.copyEnd > shot.end) throw new Error(`${shot.id} copy leaves its shot`);
    for (const layerId of shot.layerIds) {
      if (!trackIds.has(layerId)) throw new Error(`${shot.id} references unknown layer ${layerId}`);
    }
  }

  const backgrounds = LAYER_TRACKS.filter(({ kind }) => kind === "background");
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const opacity = backgrounds.reduce((sum, track) => sum + sampleLayerState(track, progress).opacity, 0);
    if (opacity < 0.99) throw new Error(`background gap at ${progress}`);
  }
}
