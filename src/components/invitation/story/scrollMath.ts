export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function progressBetween(progress: number, start: number, end: number) {
  if (start === end) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export function storyProgress(
  scrollY: number,
  top: number,
  height: number,
  viewportHeight: number,
) {
  const travel = height - viewportHeight;
  if (travel <= 0) return scrollY >= top ? 1 : 0;
  return clamp01((scrollY - top) / travel);
}
