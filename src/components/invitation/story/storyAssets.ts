export const STORY_CANVAS = { width: 430, height: 932 } as const;

export const STORY_CANVAS_LAYOUT = {
  casualCouple: { bottom: "1%", left: "27%", width: 249.4 },
  chapterNavMinimumBottom: 17.6,
  titleGlyphSize: 68.8,
} as const;

const STORY_TITLE_LETTER_DROPS_PX = [633.76, 810.84, 987.92, 1165, 1342.08] as const;

export function titleLetterDropStyle(index: number) {
  const distance = STORY_TITLE_LETTER_DROPS_PX[index];
  if (distance === undefined) throw new RangeError(`unknown title letter index: ${index}`);
  return `${distance}px`;
}

export type StoryImageAsset = {
  kind: "image";
  src: `/story/doodle-v2/${string}`;
  width: number;
  height: number;
  fit: "cover" | "contain";
  focalPoint?: { x: number; y: number };
  eager?: boolean;
};

export type StorySpriteAsset = {
  kind: "sprite";
  src: `/story/doodle-v2/${string}`;
  width: number;
  height: number;
  columns: number;
  rows: number;
  cell: { column: number; row: number };
};

export const STORY_ASSETS = {
  characterAtlasLegacy: {
    kind: "image",
    src: "/story/doodle-v2/legacy-character-atlas.webp",
    width: 1536,
    height: 1024,
    fit: "contain",
  },
  proposalTriptychLegacy: {
    kind: "image",
    src: "/story/doodle-v2/legacy-proposal-triptych.webp",
    width: 1834,
    height: 858,
    fit: "cover",
  },
} satisfies Record<string, StoryImageAsset | StorySpriteAsset>;
