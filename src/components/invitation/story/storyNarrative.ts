import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

export type StoryCopyCue = { id: string; start: number; end: number; copy: string };

export type StoryScene = {
  id: string;
  title: string;
  start: number;
  end: number;
  narration: string;
  copyCues: readonly StoryCopyCue[];
  layerIds: readonly string[];
};

const ceremonyCopy = `${formatCeremonyDateShort().replaceAll(" ", "")} ${formatCeremonyTime()},\n${wedding.venue.name}에서요!`;

export const STORY_SCENES: readonly StoryScene[] = [
  {
    id: "jeju-opening",
    title: "제주 오프닝",
    start: 0,
    end: 0.08,
    narration: "예찬과 주은의 결혼 이야기",
    copyCues: [
      { id: "jeju-opening-copy", start: 0.004, end: 0.064, copy: "예찬과 주은의 결혼 이야기" },
    ],
    layerIds: ["bg-jeju", "opening-island", "title-shards"],
  },
  {
    id: "same-direction",
    title: "같은 방향을 바라보는 두 사람",
    start: 0.08,
    end: 0.18,
    narration: "사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람",
    copyCues: [],
    layerIds: ["opening-field", "sidecar", "wheel-front", "wheel-back", "opening-clouds"],
  },
  {
    id: "office-coworkers",
    title: "처음엔 회사 동기",
    start: 0.18,
    end: 0.34,
    narration: "처음엔 회사 동기였던 두 사람",
    copyCues: [
      { id: "office-coworkers-copy", start: 0.235, end: 0.325, copy: "처음엔 회사 동기였던 두 사람" },
    ],
    layerIds: ["paper-tear", "tower-card", "bg-office", "office-yechan", "office-jueun", "office-props"],
  },
  {
    id: "joke-and-laughter",
    title: "농담과 웃음",
    start: 0.34,
    end: 0.5,
    narration: "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
    copyCues: [
      {
        id: "joke-and-laughter-copy",
        start: 0.365,
        end: 0.485,
        copy: "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
      },
    ],
    layerIds: ["bg-laugh", "panel-left", "panel-right", "joke-yechan", "jueun-expression", "laugh-burst"],
  },
  {
    id: "lifelong-partners",
    title: "평생의 짝꿍",
    start: 0.5,
    end: 0.72,
    narration: "그렇게 평생 웃겨주고 웃어주는 짝꿍이 되기로 했습니다.",
    copyCues: [
      { id: "lifelong-partners-laughter", start: 0.515, end: 0.605, copy: "그렇게 평생 웃겨주고 웃어주는" },
      { id: "lifelong-partners-commitment", start: 0.625, end: 0.708, copy: "짝꿍이 되기로 했습니다." },
    ],
    layerIds: ["bg-journey", "proposal-triptych", "ring-glint", "venue-reveal"],
  },
  {
    id: "seoul-venue",
    title: "서울로 돌아와 결혼식장으로",
    start: 0.72,
    end: 0.84,
    narration: ceremonyCopy,
    copyCues: [
      { id: "seoul-venue-copy", start: 0.742, end: 0.825, copy: ceremonyCopy },
    ],
    layerIds: ["bg-venue", "venue-reveal", "venue-doors", "casual-couple", "matchcut-strip", "wedding-couple"],
  },
  {
    id: "wedding-finale",
    title: "하객들과 함께하는 결혼식",
    start: 0.84,
    end: 1,
    narration: "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
    copyCues: [
      {
        id: "wedding-finale-copy",
        start: 0.875,
        end: 0.985,
        copy: "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
      },
    ],
    layerIds: [
      "bg-finale",
      "wedding-couple",
      "crowd-left",
      "crowd-right",
      "confetti-back",
      "confetti",
      "confetti-front",
      "final-title",
      "invitation-paper",
    ],
  },
];

export const STORY_COPY_CUES = STORY_SCENES.flatMap(({ copyCues }) => copyCues);

export const CHAPTERS = STORY_SCENES.map(({ id, title, start, end }) => ({ id, title, start, end }));

export function getStoryProgressAnnouncement(progress: number) {
  const normalized = Math.min(1, Math.max(0, progress));
  const index = STORY_SCENES.findIndex(({ start, end }) => (
    normalized >= start && (normalized < end || end === 1)
  ));
  const sceneIndex = index < 0 ? STORY_SCENES.length - 1 : index;
  const scene = STORY_SCENES[sceneIndex]!;
  const value = sceneIndex + 1;
  return {
    sceneId: scene.id,
    value,
    text: `${value}/${STORY_SCENES.length}. ${scene.narration}`,
  };
}

export function nextStoryProgressAnnouncement(previousSceneId: string, progress: number) {
  const announcement = getStoryProgressAnnouncement(progress);
  return announcement.sceneId === previousSceneId ? null : announcement;
}
