import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

export type DanceSide = "left" | "right" | "center";

export type DanceScene = {
  id: string;
  pose: 1 | 2 | 3 | 4 | 5 | 6;
  start: number;
  end: number;
  actorSide: DanceSide;
  copySide: DanceSide;
  eyebrow: string;
  copy: string;
  narration: string;
};

const date = formatCeremonyDateShort().replaceAll(" ", "");
const time = formatCeremonyTime();

export const DANCE_SCENES = [
  {
    id: "holding-hands",
    pose: 1,
    start: 0,
    end: 0.16,
    actorSide: "left",
    copySide: "right",
    eyebrow: "WE ARE GETTING MARRIED",
    copy: `${wedding.groom.name} · ${wedding.bride.name}\n결혼합니다`,
    narration: "서로 마주 보고 손을 잡은 두 사람",
  },
  {
    id: "open-dance",
    pose: 2,
    start: 0.16,
    end: 0.33,
    actorSide: "right",
    copySide: "left",
    eyebrow: "OUR DAY",
    copy: `${date}\n${time}`,
    narration: "손을 잡고 한 걸음 벌어져 춤추는 두 사람",
  },
  {
    id: "close-embrace",
    pose: 3,
    start: 0.33,
    end: 0.5,
    actorSide: "left",
    copySide: "right",
    eyebrow: "TOGETHER",
    copy: "서로의 가장 가까운 곳에서\n같은 마음으로",
    narration: "가까이 다가가 서로를 안은 두 사람",
  },
  {
    id: "spin",
    pose: 4,
    start: 0.5,
    end: 0.67,
    actorSide: "right",
    copySide: "left",
    eyebrow: "CELEBRATE WITH US",
    copy: `${wedding.venue.name}\n${wedding.venue.hall}`,
    narration: "손을 높이 들고 빙글 도는 두 사람",
  },
  {
    id: "kiss",
    pose: 5,
    start: 0.67,
    end: 0.84,
    actorSide: "left",
    copySide: "right",
    eyebrow: "WITH LOVE",
    copy: "소중한 분들과 함께\n이 순간을 나누고 싶습니다",
    narration: "서로를 꼭 안고 입맞추는 두 사람",
  },
  {
    id: "bridal-carry",
    pose: 6,
    start: 0.84,
    end: 1,
    actorSide: "center",
    copySide: "center",
    eyebrow: "SAVE THE DATE",
    copy: "우리, 결혼합니다",
    narration: "신랑이 신부를 안아 들고 함께 웃는 두 사람",
  },
] as const satisfies readonly DanceScene[];

export function clampDanceProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

export function getDanceFrame(progress: number) {
  const normalized = clampDanceProgress(progress);
  const scene = DANCE_SCENES.find(({ start, end }) => (
    normalized >= start && (normalized < end || end === 1)
  )) ?? DANCE_SCENES.at(-1)!;
  const duration = scene.end - scene.start;
  const sceneProgress = duration === 0 ? 0 : (normalized - scene.start) / duration;
  return { scene, sceneProgress };
}

export function getDanceProgressAnnouncement(progress: number) {
  const { scene } = getDanceFrame(progress);
  const index = DANCE_SCENES.indexOf(scene);
  const value = index + 1;
  return {
    sceneId: scene.id,
    value,
    text: `${value}/${DANCE_SCENES.length}. ${scene.narration}`,
  };
}

export function getDancePoseOpacities(progress: number): number[] {
  const { scene, sceneProgress } = getDanceFrame(progress);
  const currentIndex = scene.pose - 1;
  const nextIndex = Math.min(DANCE_SCENES.length - 1, currentIndex + 1);
  if (nextIndex === currentIndex) {
    return DANCE_SCENES.map((_, index) => index === currentIndex ? 1 : 0);
  }

  const blend = sceneProgress > 0.72 ? (sceneProgress - 0.72) / 0.28 : 0;
  return DANCE_SCENES.map((_, index) => (
    index === currentIndex ? 1 - blend : index === nextIndex ? blend : 0
  ));
}

/**
 * 스크롤 안내를 숨기는 진행률. 마지막 장면(0.84~)도 아직 stage가 고정된 구간이라
 * 거기서 안내가 사라지면 "끝났다"고 오해한다. 고정이 풀리기 직전에만 숨긴다.
 */
export const SCROLL_HINT_END = 0.97;

export type ScrollHintState = "resting" | "moving" | "done";

/** 멈춰 있으면 진하게(resting), 스크롤 중엔 흐리게(moving), 끝나기 직전엔 숨김(done). */
export function getScrollHintState(progress: number, scrolling: boolean): ScrollHintState {
  if (progress >= SCROLL_HINT_END) return "done";
  return scrolling ? "moving" : "resting";
}

export function sideToStagePercent(side: DanceSide) {
  if (side === "left") return 34;
  if (side === "right") return 66;
  return 50;
}

export function smoothstep(value: number) {
  const clamped = clampDanceProgress(value);
  return clamped * clamped * (3 - 2 * clamped);
}
