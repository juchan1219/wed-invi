import { clamp01 } from "./scrollMath";

export type EaseName = "linear" | "easeIn" | "easeOut" | "easeInOut" | "hold";

export type NumberFrame = {
  at: number;
  value: number;
  ease?: EaseName;
};

export type Clip = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type ClipFrame = {
  at: number;
  value: Clip;
  ease?: EaseName;
};

export function easeProgress(progress: number, ease: EaseName = "linear") {
  const value = clamp01(progress);
  switch (ease) {
    case "easeIn":
      return value * value;
    case "easeOut":
      return 1 - (1 - value) * (1 - value);
    case "easeInOut":
      return value < 0.5
        ? 2 * value * value
        : 1 - Math.pow(-2 * value + 2, 2) / 2;
    case "hold":
      return value >= 1 ? 1 : 0;
    default:
      return value;
  }
}

function framePair<T extends { at: number }>(frames: readonly T[], progress: number) {
  if (frames.length === 0) throw new Error("A timeline track needs at least one frame");
  if (progress <= frames[0].at) return [frames[0], frames[0]] as const;

  for (let index = 0; index < frames.length - 1; index += 1) {
    const current = frames[index];
    const next = frames[index + 1];
    if (progress < next.at) return [current, next] as const;
  }

  const last = frames.at(-1)!;
  return [last, last] as const;
}

function segmentProgress(
  progress: number,
  current: { at: number; ease?: EaseName },
  next: { at: number },
) {
  if (current === next || current.at === next.at) return 0;
  return easeProgress((progress - current.at) / (next.at - current.at), current.ease);
}

export function sampleNumberTrack(frames: readonly NumberFrame[], progress: number) {
  const [current, next] = framePair(frames, progress);
  const amount = segmentProgress(progress, current, next);
  return current.value + (next.value - current.value) * amount;
}

export function sampleClipTrack(frames: readonly ClipFrame[], progress: number): Clip {
  const [current, next] = framePair(frames, progress);
  const amount = segmentProgress(progress, current, next);
  return current.value.map((value, index) => (
    value + (next.value[index] - value) * amount
  )) as unknown as Clip;
}

export function clipToPolygon(clip: Clip) {
  return `polygon(${clip[0]}% ${clip[1]}%, ${clip[2]}% ${clip[3]}%, ${clip[4]}% ${clip[5]}%, ${clip[6]}% ${clip[7]}%)`;
}

export function dampedProgress(
  current: number,
  target: number,
  deltaSeconds: number,
  response = 10,
) {
  if (deltaSeconds <= 0) return current;
  const amount = 1 - Math.exp(-response * deltaSeconds);
  return current + (target - current) * amount;
}

export function shouldSnapPlayhead(
  current: number,
  target: number,
  threshold = 0.18,
) {
  return Math.abs(target - current) >= threshold;
}
