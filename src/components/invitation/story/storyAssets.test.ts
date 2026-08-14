import { existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import { STORY_ASSETS } from "./storyAssets";

test("every story asset exists under doodle-v2 and declares positive dimensions", () => {
  const ids = Object.keys(STORY_ASSETS);

  assert.equal(new Set(ids).size, ids.length, "story asset IDs must be unique");

  for (const [id, asset] of Object.entries(STORY_ASSETS)) {
    assert.match(asset.src, /^\/story\/doodle-v2\//, id);
    assert.ok(asset.width > 0 && asset.height > 0, id);
    assert.ok(existsSync(join(process.cwd(), "public", asset.src.slice(1))), id);
  }
});
