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
  styleGuide: {
    kind: "image",
    src: "/story/doodle-v2/style-guide.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  openingBackground: {
    kind: "image",
    src: "/story/doodle-v2/01-opening-background.webp",
    width: 860,
    height: 1864,
    fit: "cover",
  },
  sidecarRoad: {
    kind: "image",
    src: "/story/doodle-v2/02-sidecar-road.webp",
    width: 860,
    height: 1864,
    fit: "cover",
  },
  paperTurn: {
    kind: "image",
    src: "/story/doodle-v2/03-paper-turn.webp",
    width: 860,
    height: 1864,
    fit: "cover",
  },
  towerCard: {
    kind: "image",
    src: "/story/doodle-v2/04-tower-card.webp",
    width: 860,
    height: 1864,
    fit: "contain",
  },
  officeBackground: {
    kind: "image",
    src: "/story/doodle-v2/05-office-background.webp",
    width: 860,
    height: 1864,
    fit: "cover",
  },
  officeDesk: {
    kind: "image",
    src: "/story/doodle-v2/06-office-desk.webp",
    width: 860,
    height: 520,
    fit: "contain",
  },
  sidecar: {
    kind: "image",
    src: "/story/doodle-v2/sidecar.png",
    width: 1024,
    height: 768,
    fit: "contain",
  },
  casualYechanNeutral: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 0, row: 0 },
  },
  casualYechanDriving: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 1, row: 0 },
  },
  casualYechanTalking: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 2, row: 0 },
  },
  casualYechanLaughing: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 3, row: 0 },
  },
  casualJueunNeutral: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 0, row: 1 },
  },
  casualJueunSidecarPassenger: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 1, row: 1 },
  },
  casualJueunTalking: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 2, row: 1 },
  },
  casualJueunLaughing: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-casual.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 3, row: 1 },
  },
  weddingYechanNeutral: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 0, row: 0 },
  },
  weddingYechanWalking: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 1, row: 0 },
  },
  weddingYechanWaving: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 2, row: 0 },
  },
  weddingYechanCheering: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 3, row: 0 },
  },
  weddingJueunNeutral: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 0, row: 1 },
  },
  weddingJueunWalking: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 1, row: 1 },
  },
  weddingJueunWaving: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 2, row: 1 },
  },
  weddingJueunCheering: {
    kind: "sprite",
    src: "/story/doodle-v2/characters-wedding.webp",
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell: { column: 3, row: 1 },
  },
} satisfies Record<string, StoryImageAsset | StorySpriteAsset>;
