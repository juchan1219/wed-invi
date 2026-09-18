export const DANCE_FRAME_COUNT = 80;
// scripts/prepare-dance-frames.mjs의 cellSize와 같아야 한다(테스트로 고정).
export const DANCE_FRAME_SIZE = 576;
export const DANCE_FRAMES_PER_PAGE = 16;

export function sampleFrameSequence(progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const stops = [0, .16, .33, .5, .67, .84, 1];
  const poses = [0, 15, 31, 47, 63, 79, 79];
  const segment = Math.max(0, stops.findIndex((end) => end > p) - 1);
  const frame = p >= .84 ? 79 : poses[segment] +
    (poses[segment + 1] - poses[segment]) * (p - stops[segment]) / (stops[segment + 1] - stops[segment]);
  const first = Math.floor(frame);
  return { first, second: Math.min(DANCE_FRAME_COUNT - 1, first + 1), blend: frame - first };
}

export function frameAtlasRect(frame: number) {
  const safe = Math.max(0, Math.min(DANCE_FRAME_COUNT - 1, Math.floor(frame)));
  const local = safe % DANCE_FRAMES_PER_PAGE;
  return { page: Math.floor(safe / DANCE_FRAMES_PER_PAGE), x: (local % 4) * DANCE_FRAME_SIZE, y: Math.floor(local / 4) * DANCE_FRAME_SIZE };
}
