import assert from "node:assert/strict";
import test from "node:test";

import { STORY_CANVAS } from "./storyAssets";
import * as storyTimeline from "./storyTimeline";
import {
  CHAPTERS,
  FULL_CLIP,
  LAYER_TRACKS,
  SHOTS,
  STORY_TRANSITIONS,
  assertStoryTimeline,
  sampleLayerState,
  type LayerTrack,
} from "./storyTimeline";

test("the contained story canvas keeps the 430 by 932 logical layer contract", () => {
  assert.deepEqual(STORY_CANVAS, { width: 430, height: 932 });

  assert.equal(typeof storyTimeline.isStoryLayerRenderable, "function");
  assert.deepEqual(
    LAYER_TRACKS.map(({ id }) => id),
    storyTimeline.STORY_RENDERABLE_LAYER_IDS,
  );
  assert.ok(
    LAYER_TRACKS.every(({ id }) => storyTimeline.isStoryLayerRenderable(id)),
    "every timeline layer needs a DOM renderer inside the fixed canvas",
  );
});

test("layer state uses stable spatial defaults when a track omits overrides", () => {
  const trackWithoutOverrides = {
    id: "defaults",
    kind: "prop",
  } as LayerTrack;

  assert.deepEqual(sampleLayerState(trackWithoutOverrides, 0.5), {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    opacity: 1,
    originX: 50,
    originY: 50,
    clip: FULL_CLIP,
  });
});

test("layer state interpolates scale and transform origin axes independently", () => {
  const track = {
    id: "independent-spatial-axes",
    kind: "prop",
    scaleX: [{ at: 0, value: 1 }, { at: 1, value: 2 }],
    scaleY: [{ at: 0, value: 1 }, { at: 1, value: 0.5 }],
    originX: [{ at: 0, value: 0 }, { at: 1, value: 40 }],
    originY: [{ at: 0, value: 100 }, { at: 1, value: 60 }],
  } as LayerTrack;

  assert.deepEqual(sampleLayerState(track, 0.5), {
    x: 0,
    y: 0,
    scaleX: 1.5,
    scaleY: 0.75,
    rotate: 0,
    opacity: 1,
    originX: 20,
    originY: 80,
    clip: FULL_CLIP,
  });
});

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
    LAYER_TRACKS.reduce((sum, track) => sum + (track.x?.length ?? 0), 0) >= 100,
    "the timeline needs at least 100 intentional keyframes",
  );
  assert.deepEqual(
    [...new Set(LAYER_TRACKS.map(({ id }) => id))],
    LAYER_TRACKS.map(({ id }) => id),
  );
  assert.ok(LAYER_TRACKS.every((track) => track.scaleX && track.scaleY));
});

test("an opaque background covers every sampled point of the scroll", () => {
  const backgrounds = LAYER_TRACKS.filter(({ kind }) => kind === "background");
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const opacity = backgrounds.reduce(
      (sum, track) => sum + sampleLayerState(track, progress).opacity,
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
  assert.ok(reveal?.clip);
  assert.notDeepEqual(
    sampleLayerState(reveal, 0.165).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
  assert.deepEqual(
    sampleLayerState(reveal, 0.21).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
});

test("the complete timeline passes its runtime invariant audit", () => {
  assert.doesNotThrow(() => assertStoryTimeline());
});
