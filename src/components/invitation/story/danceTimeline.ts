import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime, formatCeremonyWeekdayShort } from "@/lib/date";

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

const date = `${formatCeremonyDateShort().replaceAll(" ", "")}(${formatCeremonyWeekdayShort()})`; // "2026.12.19(토)"
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
    eyebrow: "SAVE THE DATE",
    copy: `${date} ${time}\n${wedding.venue.name}`,
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
    copy: "바라만 봐도 웃음이 나는\n사람을 만났습니다",
    narration: "가까이 다가가 서로를 안은 두 사람",
  },
  {
    id: "spin",
    pose: 4,
    start: 0.5,
    end: 0.67,
    actorSide: "right",
    copySide: "left",
    eyebrow: "HAND IN HAND",
    copy: "그 손을 꼭 잡고\n평생을 걸어가려 합니다",
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
    copy: "그 첫걸음을\n따뜻하게 지켜봐 주세요",
    narration: "서로를 꼭 안고 입맞추는 두 사람",
  },
  {
    id: "bridal-carry",
    pose: 6,
    start: 0.84,
    end: 1,
    actorSide: "center",
    copySide: "center",
    eyebrow: "CELEBRATE WITH US",
    copy: "소중한 인연에 감사드리며\n기쁜 날, 초대드리고자 합니다",
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

/**
 * "{이름}님께 편지가 왔어요" 버튼이 나타나는 진행률. 엔딩 그림(0.84~)이 자리 잡은 뒤,
 * 스크롤이 끝나기(1.0, 무대 고정 해제) 직전에만 보인다. 편지가 있는 하객에게만 렌더된다.
 */
export const LETTER_BUTTON_START = 0.9;

export function isLetterButtonShown(progress: number) {
  return progress >= LETTER_BUTTON_START;
}

/** 엔딩 그림(마지막 프레임)에서 잉크가 차지하는 세로 범위 — 프레임 높이 대비(576px 중 79~547행). */
export const ENDING_INK = { top: 79 / 576, bottom: 547 / 576 } as const;
/** 그림을 줄일 때의 기준점(그림 상자 높이 대비). `.actor`의 transform-origin(50% 95%)과 같아야 한다 — 발이 제자리에 있다. */
export const ACTOR_SCALE_ORIGIN = 0.95;
/** 편지 버튼 아래끝과 엔딩 그림 사이 최소 간격(px). 흔들림(±3°, 1.05배)으로 모서리가 내려오는 만큼을 포함한다. */
export const LETTER_ROOM_GAP = 14;
/** 발끝이 내려가도 되는 한계: 스크롤 안내 위로 이만큼 띄운다(px). */
export const LETTER_ROOM_FLOOR_MARGIN = 8;
/** 그림을 이보다 작게 줄이지는 않는다. 이보다 더 짧은 화면이면 조금 겹치는 쪽을 택한다. */
export const LETTER_ROOM_MIN_SCALE = 0.75;

/**
 * 편지 버튼이 나타날 때 엔딩 그림이 비켜 줄 양. 이름이 들어가 넓어진 버튼이 세로가 짧은 화면(카카오톡 인앱 등)에서
 * 그림의 머리·부케를 덮지 않도록, 먼저 아래로 내리고(발끝이 `floor`에 닿기 전까지) 그래도 모자라면 발을 기준으로 줄인다.
 * 넉넉한 화면에서는 { shift: 0, scale: 1 } — 그림이 움직이지 않는다. 값은 모두 무대 기준 레이아웃 px(변형 전).
 */
export function getLetterRoom({ buttonBottom, actorTop, actorSize, floor }: {
  buttonBottom: number;
  actorTop: number;
  actorSize: number;
  floor: number;
}) {
  const need = buttonBottom + LETTER_ROOM_GAP - (actorTop + ENDING_INK.top * actorSize);
  if (need <= 0) return { shift: 0, scale: 1 };
  const shift = Math.min(need, Math.max(0, floor - (actorTop + ENDING_INK.bottom * actorSize)));
  const rest = need - shift;
  if (rest <= 0) return { shift, scale: 1 };
  // 발(ACTOR_SCALE_ORIGIN) 기준으로 s배 줄이면 잉크 윗끝이 (1 - s) × (기준 - 윗끝) × 한 변만큼 내려온다.
  const scale = Math.max(LETTER_ROOM_MIN_SCALE, 1 - rest / ((ACTOR_SCALE_ORIGIN - ENDING_INK.top) * actorSize));
  return { shift, scale };
}

/** 편지가 있을 때 "댄스 이야기 건너뛰기"의 도착점: 무대가 끝나는 지점 / 동작 줄이기의 마지막 카드. */
export const DANCE_ENDING_ID = "wedding-dance-ending";
export const DANCE_ENDING_CARD_ID = "wedding-dance-ending-card";

/**
 * 건너뛰기 링크의 대상. 본문에는 편지 자리가 없으므로(2026-09-19 사용자 요청) 편지가 있는 하객은
 * 본문 대신 편지 버튼이 보이는 곳으로 보낸다 — 춤이면 끝나는 지점(진행률 1), 정적 카드면 마지막 카드.
 */
export function getDanceSkipTarget(contentTargetId: string, hasLetter: boolean, animated: boolean) {
  if (!hasLetter) return contentTargetId;
  return animated ? DANCE_ENDING_ID : DANCE_ENDING_CARD_ID;
}

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
