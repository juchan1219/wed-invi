// 춤 80프레임(atlas 5장) + 엔딩 그림 1장(프레임 80, 576px 한 칸짜리 dance-6.webp).
export const DANCE_FRAME_COUNT = 81;
// scripts/prepare-dance-frames.mjs의 cellSize와 같아야 한다(테스트로 고정).
export const DANCE_FRAME_SIZE = 576;
export const DANCE_FRAMES_PER_PAGE = 16;
export const DANCE_ATLAS_PAGES = Math.ceil(DANCE_FRAME_COUNT / DANCE_FRAMES_PER_PAGE);

// 스크롤 진행률(STOPS) → 프레임 번호(POSES)의 구간별 선형 대응. 같은 번호가 이어지면 그 구간은 멈춘다.
// 입맞춤 장면(0.67~)에서 들어 올리며 일어서고(63→74, 기존과 같은 속도), 일어선 채 안은 프레임(74→79)은
// 빠르게 지나간다. 마지막 문구가 나타나는 동안(~0.835)만 안은 자세를 유지하고, 마지막 장면이 시작되는
// 0.84부터 엔딩 그림(80)으로 멈춘다. 안고 마주 보는 모습이 너무 오래 보인다는 피드백으로 줄였다(2026-09-19).
const STOPS = [0, .16, .33, .5, .67, .78, .8, .835, .84, 1];
const POSES = [0, 15, 31, 47, 63, 74, 79, 79, 80, 80];

export function sampleFrameSequence(progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const segment = Math.min(STOPS.length - 2, Math.max(0, STOPS.findIndex((end) => end > p) - 1));
  const frame = p >= 1 ? POSES[POSES.length - 1] :
    POSES[segment] + (POSES[segment + 1] - POSES[segment]) * (p - STOPS[segment]) / (STOPS[segment + 1] - STOPS[segment]);
  const first = Math.floor(frame);
  return { first, second: Math.min(DANCE_FRAME_COUNT - 1, first + 1), blend: frame - first };
}

export function frameAtlasRect(frame: number) {
  const safe = Math.max(0, Math.min(DANCE_FRAME_COUNT - 1, Math.floor(frame)));
  const local = safe % DANCE_FRAMES_PER_PAGE;
  return { page: Math.floor(safe / DANCE_FRAMES_PER_PAGE), x: (local % 4) * DANCE_FRAME_SIZE, y: Math.floor(local / 4) * DANCE_FRAME_SIZE };
}

export function danceAtlasUrl(page: number) {
  return `/story/wedding-dance/frames/dance-${page + 1}.webp`;
}
