import assert from "node:assert/strict";
import test from "node:test";

import { clamp01, progressBetween, storyProgress } from "./scrollMath";

test("clamp01 limits values to the inclusive 0..1 range", () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(3), 1);
});

test("progressBetween normalizes a segment and survives a zero-length range", () => {
  assert.ok(Math.abs(progressBetween(0.25, 0.2, 0.4) - 0.25) < Number.EPSILON);
  assert.equal(progressBetween(0.1, 0.2, 0.4), 0);
  assert.equal(progressBetween(0.8, 0.2, 0.4), 1);
  assert.equal(progressBetween(0.4, 0.4, 0.4), 1);
});

test("storyProgress maps container travel to 0..1 in either scroll direction", () => {
  const top = 100;
  const height = 1_000;
  const viewportHeight = 200;

  assert.equal(storyProgress(0, top, height, viewportHeight), 0);
  assert.equal(storyProgress(500, top, height, viewportHeight), 0.5);
  assert.equal(storyProgress(900, top, height, viewportHeight), 1);
  assert.equal(storyProgress(500, top, height, viewportHeight), 0.5);
  assert.equal(storyProgress(1_100, top, height, viewportHeight), 1);
});

test("storyProgress does not divide by zero when a container fits the viewport", () => {
  assert.equal(storyProgress(100, 100, 500, 500), 1);
});
