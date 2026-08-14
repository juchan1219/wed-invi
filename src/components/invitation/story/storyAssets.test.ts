import { existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import { STORY_ASSETS } from "./storyAssets";

const STYLE_BIBLE_ASSETS = {
  styleGuide: {
    kind: "image",
    src: "/story/doodle-v2/style-guide.webp",
    width: 430,
    height: 932,
    fit: "contain",
  },
  casualYechanNeutral: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 0, row: 0 } },
  casualYechanDriving: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 1, row: 0 } },
  casualYechanTalking: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 2, row: 0 } },
  casualYechanLaughing: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 3, row: 0 } },
  casualJueunNeutral: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 0, row: 1 } },
  casualJueunSidecarPassenger: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 1, row: 1 } },
  casualJueunTalking: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 2, row: 1 } },
  casualJueunLaughing: { kind: "sprite", src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 3, row: 1 } },
  weddingYechanNeutral: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 0, row: 0 } },
  weddingYechanWalking: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 1, row: 0 } },
  weddingYechanWaving: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 2, row: 0 } },
  weddingYechanCheering: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 3, row: 0 } },
  weddingJueunNeutral: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 0, row: 1 } },
  weddingJueunWalking: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 1, row: 1 } },
  weddingJueunWaving: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 2, row: 1 } },
  weddingJueunCheering: { kind: "sprite", src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, columns: 4, rows: 2, cell: { column: 3, row: 1 } },
} as const;

const STYLE_BIBLE_FILES = [
  { src: "/story/doodle-v2/style-guide.webp", width: 430, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/characters-casual.webp", width: 2048, height: 1024, hasAlpha: true },
  { src: "/story/doodle-v2/characters-wedding.webp", width: 2048, height: 1024, hasAlpha: true },
] as const;

const OPENING_AND_OFFICE_ASSETS = {
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
} as const;

const OPENING_AND_OFFICE_FILES = [
  { src: "/story/doodle-v2/01-opening-background.webp", width: 860, height: 1864, hasAlpha: false },
  { src: "/story/doodle-v2/02-sidecar-road.webp", width: 860, height: 1864, hasAlpha: false },
  { src: "/story/doodle-v2/03-paper-turn.webp", width: 860, height: 1864, hasAlpha: false },
  { src: "/story/doodle-v2/04-tower-card.webp", width: 860, height: 1864, hasAlpha: false },
  { src: "/story/doodle-v2/05-office-background.webp", width: 860, height: 1864, hasAlpha: false },
  { src: "/story/doodle-v2/06-office-desk.webp", width: 860, height: 520, hasAlpha: true },
  { src: "/story/doodle-v2/sidecar.png", width: 1024, height: 768, hasAlpha: true },
] as const;

const PROPOSAL_AND_FINALE_ASSETS = {
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
} as const;

const PROPOSAL_AND_FINALE_FILES = [
  { src: "/story/doodle-v2/07-joke-panel.webp", width: 430, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/08-laugh-panel.webp", width: 430, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/09-laugh-burst.webp", width: 430, height: 932, hasAlpha: true },
  { src: "/story/doodle-v2/10-12-proposal-triptych.webp", width: 1290, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/13-venue-exterior.webp", width: 430, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/14-venue-interior.webp", width: 430, height: 932, hasAlpha: false },
  { src: "/story/doodle-v2/15-crowd-left.webp", width: 430, height: 932, hasAlpha: true },
  { src: "/story/doodle-v2/15-crowd-right.webp", width: 430, height: 932, hasAlpha: true },
  { src: "/story/doodle-v2/16-paper-veil.webp", width: 430, height: 932, hasAlpha: true },
] as const;

const PROPOSAL_AND_FINALE_TRANSPARENT_FILES = [
  {
    src: "/story/doodle-v2/09-laugh-burst.webp",
    minimumTransparentRatio: 0.72,
    minimumOpaqueRatio: 0.01,
    transparentSamples: [[0, 0], [429, 0], [0, 931], [429, 931], [215, 466]],
    bounds: { minWidth: 300, minHeight: 650, bottomEdge: "clear" },
  },
  {
    src: "/story/doodle-v2/15-crowd-left.webp",
    minimumTransparentRatio: 0.35,
    minimumOpaqueRatio: 0.08,
    transparentSamples: [[429, 0], [429, 200], [429, 466], [429, 700]],
    bounds: {
      minWidth: 120,
      minHeight: 360,
      bottomEdge: "full-body-or-bottom-crop",
      minimumPadding: { left: 8, top: 100, right: 40 },
    },
  },
  {
    src: "/story/doodle-v2/15-crowd-right.webp",
    minimumTransparentRatio: 0.35,
    minimumOpaqueRatio: 0.08,
    transparentSamples: [[0, 0], [0, 200], [0, 466], [0, 700]],
    bounds: {
      minWidth: 120,
      minHeight: 360,
      bottomEdge: "full-body-or-bottom-crop",
      minimumPadding: { left: 100, top: 200, right: 8 },
    },
  },
  {
    src: "/story/doodle-v2/16-paper-veil.webp",
    minimumTransparentRatio: 0.2,
    minimumOpaqueRatio: 0.12,
    transparentSamples: [[0, 0], [215, 0], [429, 931]],
    bounds: { minWidth: 300, minHeight: 650, bottomEdge: "touch" },
  },
] as const;

const TRANSPARENT_PROP_FILES = [
  {
    src: "/story/doodle-v2/06-office-desk.webp",
    minimumTransparentRatio: 0.35,
    minimumOpaqueRatio: 0.08,
    minimumPadding: { left: 16, top: 40, right: 16, bottom: 8 },
  },
  {
    src: "/story/doodle-v2/sidecar.png",
    minimumTransparentRatio: 0.45,
    minimumOpaqueRatio: 0.08,
    minimumPadding: { left: 64, top: 64, right: 64, bottom: 64 },
  },
] as const;

const SPRITE_CELL_SIZE = 512;
const MINIMUM_SPRITE_PADDING = 80;

function alphaBounds(
  data: Buffer,
  channels: number,
  imageWidth: number,
  column: number,
  row: number,
) {
  let minX = SPRITE_CELL_SIZE;
  let minY = SPRITE_CELL_SIZE;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < SPRITE_CELL_SIZE; y++) {
    for (let x = 0; x < SPRITE_CELL_SIZE; x++) {
      const alphaIndex = ((row * SPRITE_CELL_SIZE + y) * imageWidth + column * SPRITE_CELL_SIZE + x) * channels + 3;
      if (data[alphaIndex] === 0) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1 || maxY === -1) return undefined;
  return { left: minX, top: minY, right: SPRITE_CELL_SIZE - 1 - maxX, bottom: SPRITE_CELL_SIZE - 1 - maxY };
}

function pixelAlpha(data: Buffer, channels: number, width: number, x: number, y: number) {
  return data[(y * width + x) * channels + 3];
}

test("every story asset exists under doodle-v2 and declares positive dimensions", () => {
  const ids = Object.keys(STORY_ASSETS);

  assert.equal(new Set(ids).size, ids.length, "story asset IDs must be unique");

  for (const [id, asset] of Object.entries(STORY_ASSETS)) {
    assert.match(asset.src, /^\/story\/doodle-v2\//, id);
    assert.ok(asset.width > 0 && asset.height > 0, id);
    assert.ok(existsSync(join(process.cwd(), "public", asset.src.slice(1))), id);
  }
});

test("every story asset declares its real on-disk dimensions", async () => {
  for (const [id, asset] of Object.entries(STORY_ASSETS)) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    const metadata = await sharp(filePath).metadata();

    assert.equal(metadata.width, asset.width, `${id} width`);
    assert.equal(metadata.height, asset.height, `${id} height`);
  }
});

test("style bible assets register every required sprite cell", () => {
  for (const [id, expected] of Object.entries(STYLE_BIBLE_ASSETS)) {
    assert.deepEqual(STORY_ASSETS[id as keyof typeof STORY_ASSETS], expected, id);
  }
});

test("style bible files retain their exact dimensions and alpha contract", async () => {
  for (const asset of STYLE_BIBLE_FILES) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    const metadata = await sharp(filePath).metadata();

    assert.equal(metadata.width, asset.width, `${asset.src} width`);
    assert.equal(metadata.height, asset.height, `${asset.src} height`);
    assert.equal(metadata.hasAlpha, asset.hasAlpha, `${asset.src} alpha`);
  }
});

test("opening and office scenes register their exact files, dimensions, and alpha contract", async () => {
  for (const [id, expected] of Object.entries(OPENING_AND_OFFICE_ASSETS)) {
    assert.deepEqual(STORY_ASSETS[id as keyof typeof STORY_ASSETS], expected, id);
  }

  for (const asset of OPENING_AND_OFFICE_FILES) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    assert.ok(existsSync(filePath), `${asset.src} exists`);

    const metadata = await sharp(filePath).metadata();
    assert.equal(metadata.width, asset.width, `${asset.src} width`);
    assert.equal(metadata.height, asset.height, `${asset.src} height`);
    assert.equal(metadata.hasAlpha, asset.hasAlpha, `${asset.src} alpha`);
  }
});

test("proposal and finale scenes register their exact files, dimensions, fit, focal points, and alpha contract", async () => {
  for (const [id, expected] of Object.entries(PROPOSAL_AND_FINALE_ASSETS)) {
    assert.deepEqual(STORY_ASSETS[id as keyof typeof STORY_ASSETS], expected, id);
  }

  for (const asset of PROPOSAL_AND_FINALE_FILES) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    assert.ok(existsSync(filePath), `${asset.src} exists`);

    const metadata = await sharp(filePath).metadata();
    assert.equal(metadata.width, asset.width, `${asset.src} width`);
    assert.equal(metadata.height, asset.height, `${asset.src} height`);
    assert.equal(metadata.hasAlpha, asset.hasAlpha, `${asset.src} alpha`);
  }
});

test("proposal triptych keeps three exact 430px focal crops", async () => {
  const filePath = join(process.cwd(), "public/story/doodle-v2/10-12-proposal-triptych.webp");
  const metadata = await sharp(filePath).metadata();
  assert.equal(metadata.width, 430 * 3);
  assert.equal(metadata.height, 932);

  for (let panel = 0; panel < 3; panel++) {
    const cropBuffer = await sharp(filePath)
      .extract({ left: panel * 430, top: 0, width: 430, height: 932 })
      .png()
      .toBuffer();
    const crop = await sharp(cropBuffer).stats();
    assert.ok(crop.entropy > 2, `proposal panel ${panel + 1} retains scene detail`);
  }
});

test("proposal and finale overlays keep real alpha, clear samples, useful coverage, and intended bounds", async () => {
  for (const asset of PROPOSAL_AND_FINALE_TRANSPARENT_FILES) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const totalPixels = info.width * info.height;
    let transparentPixels = 0;
    let opaquePixels = 0;
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const alpha = pixelAlpha(data, info.channels, info.width, x, y);
        if (alpha === 0) transparentPixels++;
        if (alpha === 255) opaquePixels++;
        if (alpha === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    assert.ok(transparentPixels / totalPixels >= asset.minimumTransparentRatio, `${asset.src} transparent coverage`);
    assert.ok(opaquePixels / totalPixels >= asset.minimumOpaqueRatio, `${asset.src} opaque artwork`);
    assert.ok(maxX - minX + 1 >= asset.bounds.minWidth, `${asset.src} artwork width`);
    assert.ok(maxY - minY + 1 >= asset.bounds.minHeight, `${asset.src} artwork height`);
    if (asset.bounds.bottomEdge === "touch") {
      assert.equal(maxY, info.height - 1, `${asset.src} must reach bottom edge`);
    } else if (asset.bounds.bottomEdge === "clear") {
      assert.ok(maxY < info.height - 1, `${asset.src} must keep bottom clear`);
    }
    if ("minimumPadding" in asset.bounds) {
      assert.ok(minX >= asset.bounds.minimumPadding.left, `${asset.src} left crop rule`);
      assert.ok(minY >= asset.bounds.minimumPadding.top, `${asset.src} top crop rule`);
      assert.ok(info.width - 1 - maxX >= asset.bounds.minimumPadding.right, `${asset.src} right crop rule`);
    }

    for (const [x, y] of asset.transparentSamples) {
      assert.equal(pixelAlpha(data, info.channels, info.width, x, y), 0, `${asset.src} transparent sample ${x},${y}`);
    }
  }
});

test("transparent props keep meaningful alpha coverage, artwork, clear background samples, and padding", async () => {
  for (const asset of TRANSPARENT_PROP_FILES) {
    const filePath = join(process.cwd(), "public", asset.src.slice(1));
    const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const totalPixels = info.width * info.height;
    let transparentPixels = 0;
    let opaquePixels = 0;
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const alpha = pixelAlpha(data, info.channels, info.width, x, y);
        if (alpha === 0) transparentPixels++;
        if (alpha === 255) opaquePixels++;
        if (alpha === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    assert.ok(transparentPixels / totalPixels >= asset.minimumTransparentRatio, `${asset.src} transparent coverage`);
    assert.ok(opaquePixels / totalPixels >= asset.minimumOpaqueRatio, `${asset.src} opaque artwork`);
    assert.ok(maxX >= minX && maxY >= minY, `${asset.src} nonempty alpha bounds`);

    const backgroundSamples = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1],
      [Math.floor(info.width / 2), 0],
    ] as const;
    for (const [x, y] of backgroundSamples) {
      assert.equal(pixelAlpha(data, info.channels, info.width, x, y), 0, `${asset.src} transparent sample ${x},${y}`);
    }

    const padding = {
      left: minX,
      top: minY,
      right: info.width - 1 - maxX,
      bottom: info.height - 1 - maxY,
    };
    for (const edge of ["left", "top", "right", "bottom"] as const) {
      assert.ok(
        padding[edge] >= asset.minimumPadding[edge],
        `${asset.src} ${edge} padding: ${padding[edge]}px`,
      );
    }
  }
});

test("every character sprite cell keeps at least 80 pixels of transparent padding", async () => {
  for (const src of ["/story/doodle-v2/characters-casual.webp", "/story/doodle-v2/characters-wedding.webp"] as const) {
    const filePath = join(process.cwd(), "public", src.slice(1));
    const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    assert.equal(info.width, SPRITE_CELL_SIZE * 4, `${src} sheet width`);
    assert.equal(info.height, SPRITE_CELL_SIZE * 2, `${src} sheet height`);

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 4; column++) {
        const padding = alphaBounds(data, info.channels, info.width, column, row);
        assert.ok(padding, `${src} cell ${column},${row} must contain a character`);
        for (const [edge, pixels] of Object.entries(padding)) {
          assert.ok(pixels >= MINIMUM_SPRITE_PADDING, `${src} cell ${column},${row} ${edge}: ${pixels}px`);
        }
      }
    }
  }
});
