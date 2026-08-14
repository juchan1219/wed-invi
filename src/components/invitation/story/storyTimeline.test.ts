import assert from "node:assert/strict";
import test from "node:test";

import {
  CHAPTERS,
  LAYER_TRACKS,
  SHOTS,
  STORY_TRANSITIONS,
  assertStoryTimeline,
  sampleLayerState,
} from "./storyTimeline";

test("the rebuild has six continuous chapters and sixteen ordered shots", () => {
  assert.equal(CHAPTERS.length, 6);
  assert.equal(CHAPTERS[0]?.start, 0);
  assert.equal(CHAPTERS.at(-1)?.end, 1);
  for (let index = 1; index < CHAPTERS.length; index += 1) {
    assert.equal(CHAPTERS[index - 1]?.end, CHAPTERS[index]?.start);
  }

  assert.equal(SHOTS.length, 16);
  assert.deepEqual([...new Set(SHOTS.map(({ id }) => id))], SHOTS.map(({ id }) => id));
  for (let index = 1; index < SHOTS.length; index += 1) {
    assert.ok(SHOTS[index - 1]!.end <= SHOTS[index]!.start);
  }
});

test("copy intervals never overlap and every shot owns visible story layers", () => {
  for (let index = 0; index < SHOTS.length; index += 1) {
    const shot = SHOTS[index]!;
    assert.ok(shot.copyStart >= shot.start && shot.copyEnd <= shot.end);
    assert.ok(shot.layerIds.length >= 2, `${shot.id} has too few layers`);
    if (index > 0) assert.ok(SHOTS[index - 1]!.copyEnd <= shot.copyStart);
  }
});

test("the timeline contains independently animated depth, character, and transition layers", () => {
  assert.ok(LAYER_TRACKS.length >= 24);
  assert.ok(
    LAYER_TRACKS.reduce((sum, track) => sum + track.frames.length, 0) >= 100,
    "the timeline needs at least 100 intentional keyframes",
  );
  assert.deepEqual(
    [...new Set(LAYER_TRACKS.map(({ id }) => id))],
    LAYER_TRACKS.map(({ id }) => id),
  );
  assert.ok(LAYER_TRACKS.some(({ mobile }) => mobile && mobile.length > 0));
  assert.ok(LAYER_TRACKS.some(({ desktop }) => desktop && desktop.length > 0));
});

test("an opaque background covers every sampled point of the scroll", () => {
  const backgrounds = LAYER_TRACKS.filter(({ kind }) => kind === "background");
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const opacity = backgrounds.reduce(
      (sum, track) => sum + sampleLayerState(track, progress, "mobile").opacity,
      0,
    );
    assert.ok(opacity >= 0.99, `background gap at ${progress}`);
  }
});

test("all five non-crossfade transition techniques are represented", () => {
  const implemented = LAYER_TRACKS.flatMap(({ techniques = [] }) => techniques);
  assert.deepEqual(new Set(STORY_TRANSITIONS), new Set([
    "paperTear",
    "polygonReveal",
    "cameraZoom",
    "panelExpansion",
    "matchCut",
  ]));
  assert.deepEqual(new Set(implemented), new Set(STORY_TRANSITIONS));
});

test("polygon reveal is sampled from a real production layer", () => {
  const reveal = LAYER_TRACKS.find(({ id }) => id === "tower-card");
  assert.ok(reveal?.clipFrames);
  assert.notDeepEqual(
    sampleLayerState(reveal, 0.165, "mobile").clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
  assert.deepEqual(
    sampleLayerState(reveal, 0.21, "mobile").clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
});

test("the complete timeline passes its runtime invariant audit", () => {
  assert.doesNotThrow(() => assertStoryTimeline());
});
