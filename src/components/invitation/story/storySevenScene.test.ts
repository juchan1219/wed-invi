import assert from "node:assert/strict";
import test from "node:test";

import { STORY_LAYER_DEFINITIONS } from "./storyAssets";
import { STORY_SCENES } from "./storyNarrative";
import {
  LAYER_TRACKS,
  retimeLegacyStoryProgress,
  sampleLayerState,
  type LayerState,
} from "./storyTimeline";

function track(id: string) {
  const result = LAYER_TRACKS.find((candidate) => candidate.id === id);
  assert.ok(result, `missing timeline track: ${id}`);
  return result;
}

function spatialState(state: LayerState) {
  const { opacity: _opacity, ...spatial } = state;
  return spatial;
}

const DEFAULT_RENDERER_STACK = {
  background: 0,
  scenery: 3,
  character: 8,
  prop: 10,
  transition: 20,
  type: 24,
} as const;

const CSS_STACK_OVERRIDES = new Map<string, number>([
  ["title-shards", 28],
]);

function rendererStack(id: string) {
  const definition = STORY_LAYER_DEFINITIONS.find((candidate) => candidate.id === id);
  assert.ok(definition, `missing layer definition: ${id}`);
  return definition.composite?.stack
    ?? CSS_STACK_OVERRIDES.get(id)
    ?? DEFAULT_RENDERER_STACK[track(id).kind];
}

function compositedVisibleOpacity(id: string, progress: number) {
  const targetStack = rendererStack(id);
  return STORY_LAYER_DEFINITIONS.reduce((visibleOpacity, definition) => {
    if (definition.id === id || definition.composite?.coverage !== "opaque-full") {
      return visibleOpacity;
    }
    if (rendererStack(definition.id) <= targetStack) return visibleOpacity;
    return visibleOpacity * (1 - sampleLayerState(track(definition.id), progress).opacity);
  }, sampleLayerState(track(id), progress).opacity);
}

test("legacy progress maps piecewise onto the seven public scene landmarks", () => {
  assert.deepEqual(
    [0, 0.05, 0.15, 0.33, 0.52, 0.7, 0.86, 1].map(retimeLegacyStoryProgress),
    [0, 0.08, 0.18, 0.34, 0.5, 0.72, 0.84, 1],
  );
  assert.equal(retimeLegacyStoryProgress(-1), 0);
  assert.equal(retimeLegacyStoryProgress(2), 1);

  const samples = Array.from({ length: 101 }, (_, index) => (
    retimeLegacyStoryProgress(index / 100)
  ));
  for (let index = 1; index < samples.length; index += 1) {
    assert.ok(samples[index - 1]! <= samples[index]!, `retiming reversed at ${index / 100}`);
  }
});

test("track creation retimes every authored frame type once without changing values or ease names", () => {
  const sidecar = track("sidecar");
  assert.deepEqual(
    sidecar.opacity?.find(({ at }) => at === 0.18),
    { at: 0.18, value: 1, ease: "easeInOut" },
    "derived opacity frames must be retimed once rather than again from 0.18",
  );
  assert.deepEqual(
    sidecar.x?.find(({ at }) => at === 0.18),
    { at: 0.18, value: 155 },
    "explicit x frames must use the same single retiming pass",
  );

  const tower = track("tower-card");
  assert.deepEqual(
    tower.clip?.[0],
    { at: 0.18, value: [50, 0, 50, 0, 50, 100, 50, 100], ease: "easeOut" },
  );
  assert.deepEqual(tower.originX, [
    { at: 0, value: 51 },
    { at: 1, value: 51 },
  ]);

  const expression = track("jueun-expression");
  assert.equal(expression.opacity?.find(({ value }) => value === 1)?.ease, "hold");

  const frameTracks = LAYER_TRACKS.flatMap((layer) => [
    layer.x,
    layer.y,
    layer.scaleX,
    layer.scaleY,
    layer.rotate,
    layer.opacity,
    layer.originX,
    layer.originY,
    layer.clip,
  ]);
  for (const frames of frameTracks) {
    if (!frames) continue;
    for (let index = 1; index < frames.length; index += 1) {
      assert.ok(frames[index - 1]!.at <= frames[index]!.at, "retimed frames must remain monotonic");
    }
  }
});

test("seven public scenes remain contiguous and meet at visible spatial handoffs", () => {
  assert.equal(STORY_SCENES.length, 7);
  assert.deepEqual(
    STORY_SCENES.map(({ start, end }) => [start, end]),
    [[0, 0.08], [0.08, 0.18], [0.18, 0.34], [0.34, 0.5], [0.5, 0.72], [0.72, 0.84], [0.84, 1]],
  );

  const boundaries = [
    { at: 0.08, outgoing: "title-shards", incoming: "opening-field", connector: "opening-field" },
    { at: 0.18, outgoing: "sidecar", incoming: "paper-tear", connector: "paper-tear" },
    { at: 0.34, outgoing: "office-props", incoming: "panel-left", connector: "panel-left" },
    { at: 0.5, outgoing: "laugh-burst", incoming: "proposal-triptych", connector: "laugh-burst" },
    { at: 0.72, outgoing: "proposal-triptych", incoming: "venue-reveal", connector: "venue-reveal" },
    { at: 0.84, outgoing: "wedding-couple", incoming: "bg-finale", connector: "wedding-couple" },
  ] as const;

  for (const [index, boundary] of boundaries.entries()) {
    assert.ok(STORY_SCENES[index]?.layerIds.includes(boundary.outgoing));
    assert.ok(STORY_SCENES[index + 1]?.layerIds.includes(boundary.incoming));
    for (const progress of [boundary.at - 0.0075, boundary.at + 0.0075]) {
      assert.ok(
        compositedVisibleOpacity(boundary.outgoing, progress) > 0.25,
        `${boundary.outgoing} must remain visible at ${progress}`,
      );
      assert.ok(
        compositedVisibleOpacity(boundary.incoming, progress) > 0.25,
        `${boundary.incoming} must already be visible at ${progress}`,
      );
      assert.ok(
        compositedVisibleOpacity(boundary.connector, progress) > 0.25,
        `${boundary.connector} must be an unoccluded connector at ${progress}`,
      );
    }

    assert.notDeepEqual(
      spatialState(sampleLayerState(track(boundary.connector), boundary.at - 0.0075)),
      spatialState(sampleLayerState(track(boundary.connector), boundary.at + 0.0075)),
      `${boundary.connector} must bridge ${boundary.at} spatially`,
    );
  }

  for (const progress of [0.0725, 0.0875]) {
    assert.equal(
      compositedVisibleOpacity("sidecar", progress),
      0,
      "the opaque road must prevent a covered sidecar from qualifying as the 0.08 bridge",
    );
  }
});

test("retimed choreography reaches the required seven-scene landmarks", () => {
  assert.equal(track("wheel-front").parentId, "sidecar");
  assert.equal(track("wheel-back").parentId, "sidecar");
  assert.ok(sampleLayerState(track("office-yechan"), 0.27).opacity > 0.5);
  assert.ok(sampleLayerState(track("jueun-expression"), 0.45).opacity > 0.5);
  assert.ok(sampleLayerState(track("proposal-triptych"), 0.55).opacity > 0.98);
  assert.ok(sampleLayerState(track("proposal-triptych"), 0.68).opacity > 0.98);
  assert.ok(sampleLayerState(track("bg-venue"), 0.74).opacity > 0.98);
  assert.ok(sampleLayerState(track("venue-doors"), 0.8).opacity > 0.002);
  assert.ok(sampleLayerState(track("wedding-couple"), 0.9).opacity > 0.5);
});

test("retimed boundary, reverse, and direct-jump samples are deterministic", () => {
  const samples = [
    ...STORY_SCENES.slice(1).flatMap(({ start }) => [start - 0.002, start, start + 0.002]),
    0.02,
    0.999,
  ];
  const ids = [
    "bg-jeju",
    "sidecar",
    "paper-tear",
    "office-props",
    "panel-left",
    "proposal-triptych",
    "bg-venue",
    "venue-doors",
    "wedding-couple",
    "crowd-left",
    "invitation-paper",
  ];
  const captureState = (progress: number) => ids.map((id) => sampleLayerState(track(id), progress));
  const forward = new Map(samples.map((progress) => [progress, captureState(progress)]));
  const reverse = new Map([...samples].reverse().map((progress) => [progress, captureState(progress)]));
  for (const progress of samples) assert.deepEqual(reverse.get(progress), forward.get(progress));

  const low = captureState(0.02);
  const high = captureState(0.999);
  assert.deepEqual([0.02, 0.999].map(captureState), [low, high]);
  assert.deepEqual([0.999, 0.02].map(captureState), [high, low]);
});
