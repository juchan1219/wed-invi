import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

export type StoryBeat = {
  id: string;
  eyebrow?: string;
  copy: string;
  image: "/story/jeju-sidecar.webp" | "/story/jeju-sidecar-forward.webp" | "/story/tower-coworkers.webp" | "/story/joke-closeup.webp" | "/story/joke-laugh.webp" | "/story/journey-postcards.webp" | "/story/venue-arrival.webp" | "/story/wedding-finale.webp";
  imagePosition: string;
};

export const STORY_BEATS: readonly StoryBeat[] = [
  { id: "opening", eyebrow: "예찬과 주은의", copy: "결혼 이야기", image: "/story/jeju-sidecar.webp", imagePosition: "50% 22%" },
  { id: "look", copy: "서로를 보던 두 사람은", image: "/story/jeju-sidecar-forward.webp", imagePosition: "50% 70%" },
  { id: "tower", eyebrow: "을지로 SK T타워", copy: "처음엔 그냥 회사 동료였습니다.", image: "/story/tower-coworkers.webp", imagePosition: "50% 18%" },
  { id: "awkward", copy: "아주 조금… 어색한 동료였죠.", image: "/story/tower-coworkers.webp", imagePosition: "50% 76%" },
  { id: "joke", copy: "그러다 예찬이 한마디를 건넸고—", image: "/story/joke-closeup.webp", imagePosition: "50% 76%" },
  { id: "laugh", copy: "주은은 웃음을 참는 데 실패했습니다.", image: "/story/joke-laugh.webp", imagePosition: "50% 65%" },
  { id: "promise", copy: "평생 웃겨주고 웃어주는 짝꿍이 되기로 했습니다.", image: "/story/joke-closeup.webp", imagePosition: "50% 64%" },
  { id: "journey", eyebrow: "제주 · 을지로 · 잠실", copy: "우리의 길은 한곳으로 이어졌습니다.", image: "/story/journey-postcards.webp", imagePosition: "50% 50%" },
  {
    id: "destination",
    copy: `${formatCeremonyDateShort().replaceAll(" ", "")} ${formatCeremonyTime()}, ${wedding.venue.name}에서요!`,
    image: "/story/venue-arrival.webp",
    imagePosition: "50% 48%",
  },
  { id: "matchcut", copy: "여행복은 잠시 내려놓고—", image: "/story/wedding-finale.webp", imagePosition: "50% 72%" },
  { id: "finale", eyebrow: "예찬 ♥ 주은", copy: "우리 결혼합니다!!", image: "/story/wedding-finale.webp", imagePosition: "50% 54%" },
] as const;
