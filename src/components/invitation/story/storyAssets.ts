export const STORY_CANVAS = { width: 430, height: 932 } as const;

export const STORY_CANVAS_LAYOUT = {
  casualCouple: { bottom: "1%", left: "27%", width: 249.4 },
  chapterNavMinimumBottom: 17.6,
  // Parent-relative crop bases mapped through the sidecar's 537.5px-wide contain box.
  sidecar: {
    wheelFront: { left: 123.171875, top: 305.26828125 },
    wheelBack: { left: 383.5234375, top: 305.26828125 },
  },
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
  display: { cellWidth: number; cellHeight: number };
};

export type StoryImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  display: { width: number; height: number };
};

export type StoryLayerPart = {
  assetId: keyof typeof STORY_ASSETS;
  x: number;
  y: number;
};

export type StoryLayerDefinition = {
  id: string;
  assetId?: keyof typeof STORY_ASSETS;
  className?: "background" | "midground" | "character" | "foreground" | "mask";
  crop?: StoryImageCrop;
  parts?: readonly StoryLayerPart[];
  text?: { kind: "title" | "caption"; value: string };
};

function storySprite(
  src: StorySpriteAsset["src"],
  cell: StorySpriteAsset["cell"],
): StorySpriteAsset {
  return {
    kind: "sprite",
    src,
    width: 2048,
    height: 1024,
    columns: 4,
    rows: 2,
    cell,
    display: { cellWidth: 256, cellHeight: 256 },
  };
}

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
  jokePanel: {
    kind: "image",
    src: "/story/doodle-v2/07-joke-panel.webp",
    width: 430,
    height: 932,
    fit: "cover",
    focalPoint: { x: 0.5, y: 0.5 },
  },
  laughPanel: {
    kind: "image",
    src: "/story/doodle-v2/08-laugh-panel.webp",
    width: 430,
    height: 932,
    fit: "cover",
    focalPoint: { x: 0.5, y: 0.5 },
  },
  laughBurst: {
    kind: "image",
    src: "/story/doodle-v2/09-laugh-burst.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  proposalTriptych: {
    kind: "image",
    src: "/story/doodle-v2/10-12-proposal-triptych.webp",
    width: 1290,
    height: 932,
    fit: "cover",
    focalPoint: { x: 0.5, y: 0.5 },
  },
  venueExterior: {
    kind: "image",
    src: "/story/doodle-v2/13-venue-exterior.webp",
    width: 430,
    height: 932,
    fit: "cover",
    focalPoint: { x: 0.5, y: 0.55 },
  },
  venueInterior: {
    kind: "image",
    src: "/story/doodle-v2/14-venue-interior.webp",
    width: 430,
    height: 932,
    fit: "cover",
    focalPoint: { x: 0.5, y: 0.55 },
  },
  crowdLeft: {
    kind: "image",
    src: "/story/doodle-v2/15-crowd-left.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  crowdRight: {
    kind: "image",
    src: "/story/doodle-v2/15-crowd-right.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  paperVeil: {
    kind: "image",
    src: "/story/doodle-v2/16-paper-veil.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  casualYechanNeutral: storySprite("/story/doodle-v2/characters-casual.webp", { column: 0, row: 0 }),
  casualYechanDriving: storySprite("/story/doodle-v2/characters-casual.webp", { column: 1, row: 0 }),
  casualYechanTalking: storySprite("/story/doodle-v2/characters-casual.webp", { column: 2, row: 0 }),
  casualYechanLaughing: storySprite("/story/doodle-v2/characters-casual.webp", { column: 3, row: 0 }),
  casualJueunNeutral: storySprite("/story/doodle-v2/characters-casual.webp", { column: 0, row: 1 }),
  casualJueunSidecarPassenger: storySprite("/story/doodle-v2/characters-casual.webp", { column: 1, row: 1 }),
  casualJueunTalking: storySprite("/story/doodle-v2/characters-casual.webp", { column: 2, row: 1 }),
  casualJueunLaughing: storySprite("/story/doodle-v2/characters-casual.webp", { column: 3, row: 1 }),
  weddingYechanNeutral: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 0, row: 0 }),
  weddingYechanWalking: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 1, row: 0 }),
  weddingYechanWaving: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 2, row: 0 }),
  weddingYechanCheering: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 3, row: 0 }),
  weddingJueunNeutral: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 0, row: 1 }),
  weddingJueunWalking: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 1, row: 1 }),
  weddingJueunWaving: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 2, row: 1 }),
  weddingJueunCheering: storySprite("/story/doodle-v2/characters-wedding.webp", { column: 3, row: 1 }),
} satisfies Record<string, StoryImageAsset | StorySpriteAsset>;

export const STORY_LAYER_DEFINITIONS: readonly StoryLayerDefinition[] = [
  { id: "bg-jeju", assetId: "openingBackground", className: "background" },
  { id: "bg-office", assetId: "officeBackground", className: "background" },
  { id: "bg-laugh", assetId: "officeBackground", className: "background" },
  { id: "bg-journey", assetId: "paperTurn", className: "background" },
  { id: "bg-venue", assetId: "venueExterior", className: "background" },
  { id: "bg-finale", assetId: "venueInterior", className: "background" },
  { id: "opening-clouds", assetId: "openingBackground", className: "midground" },
  { id: "opening-island", assetId: "openingBackground", className: "midground" },
  { id: "opening-field", assetId: "sidecarRoad", className: "foreground" },
  { id: "title-shards", className: "foreground", text: { kind: "title", value: "예찬과 주은\n의 결혼 이야기" } },
  {
    id: "sidecar",
    className: "character",
    parts: [
      { assetId: "sidecar", x: 0, y: 0 },
      { assetId: "casualYechanDriving", x: 20, y: -145 },
      { assetId: "casualJueunSidecarPassenger", x: 105, y: -105 },
    ],
  },
  {
    id: "wheel-front",
    assetId: "sidecar",
    className: "foreground",
    crop: { x: 176, y: 392, width: 224, height: 224, display: { width: 56, height: 56 } },
  },
  {
    id: "wheel-back",
    assetId: "sidecar",
    className: "foreground",
    crop: { x: 672, y: 392, width: 224, height: 224, display: { width: 56, height: 56 } },
  },
  { id: "name-labels", className: "foreground", text: { kind: "caption", value: "예찬 ↘\n↙ 주은" } },
  { id: "paper-tear", assetId: "paperTurn", className: "mask" },
  { id: "tower-card", assetId: "towerCard", className: "midground" },
  { id: "tower-wall-left", assetId: "towerCard", className: "foreground" },
  { id: "tower-wall-right", assetId: "towerCard", className: "foreground" },
  { id: "office-yechan", assetId: "casualYechanNeutral", className: "character" },
  { id: "office-jueun", assetId: "casualJueunNeutral", className: "character" },
  { id: "office-props", assetId: "officeDesk", className: "foreground" },
  { id: "panel-left", assetId: "jokePanel", className: "midground" },
  { id: "panel-right", assetId: "laughPanel", className: "midground" },
  { id: "joke-yechan", assetId: "casualYechanTalking", className: "character" },
  { id: "jueun-expression", assetId: "casualJueunLaughing", className: "character" },
  { id: "speech-bubble", className: "foreground", text: { kind: "caption", value: "오늘 퇴근하고\n맛있는 거 어때요?" } },
  { id: "laugh-burst", assetId: "laughBurst", className: "foreground" },
  { id: "proposal-triptych", assetId: "proposalTriptych", className: "midground" },
  { id: "travel-route", assetId: "proposalTriptych", className: "foreground" },
  {
    id: "ring-glint",
    assetId: "proposalTriptych",
    className: "foreground",
    crop: { x: 464, y: 340, width: 248, height: 300, display: { width: 248, height: 300 } },
  },
  { id: "venue-doors", assetId: "venueInterior", className: "midground" },
  {
    id: "casual-couple",
    className: "character",
    parts: [
      { assetId: "casualYechanNeutral", x: -56, y: 0 },
      { assetId: "casualJueunNeutral", x: 56, y: 0 },
    ],
  },
  { id: "matchcut-strip", assetId: "paperVeil", className: "mask" },
  {
    id: "wedding-couple",
    className: "character",
    parts: [
      { assetId: "weddingYechanWalking", x: -56, y: 0 },
      { assetId: "weddingJueunWalking", x: 56, y: 0 },
    ],
  },
  { id: "crowd-left", assetId: "crowdLeft", className: "foreground" },
  { id: "crowd-right", assetId: "crowdRight", className: "foreground" },
  { id: "confetti-back", assetId: "laughBurst", className: "midground" },
  { id: "confetti", assetId: "laughBurst", className: "foreground" },
  { id: "confetti-front", assetId: "laughBurst", className: "foreground" },
  { id: "final-title", className: "foreground", text: { kind: "title", value: "예찬 ♥ 주은\n우리 결혼합니다!!" } },
  { id: "invitation-paper", assetId: "paperVeil", className: "mask" },
] as const;

export function getStorySpriteCrop(asset: StorySpriteAsset) {
  const intrinsicCellWidth = asset.width / asset.columns;
  const intrinsicCellHeight = asset.height / asset.rows;
  const viewportWidth = asset.display.cellWidth;
  const viewportHeight = asset.display.cellHeight;

  return {
    intrinsicCellWidth,
    intrinsicCellHeight,
    viewportWidth,
    viewportHeight,
    atlasWidth: viewportWidth * asset.columns,
    atlasHeight: viewportHeight * asset.rows,
    translateX: -asset.cell.column * viewportWidth,
    translateY: -asset.cell.row * viewportHeight,
  };
}

export function getStoryImageCrop(asset: StoryImageAsset, crop: StoryImageCrop) {
  const scaleX = crop.display.width / crop.width;
  const scaleY = crop.display.height / crop.height;

  return {
    viewportWidth: crop.display.width,
    viewportHeight: crop.display.height,
    sourceWidth: asset.width * scaleX,
    sourceHeight: asset.height * scaleY,
    translateX: -crop.x * scaleX,
    translateY: -crop.y * scaleY,
  };
}
