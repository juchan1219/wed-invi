export const STORY_CANVAS = { width: 430, height: 932 } as const;

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
