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
