import assert from "node:assert/strict";
import test from "node:test";

import {
  clipToPolygon,
  dampedProgress,
  easeProgress,
  inlineClipPathForTrack,
  sampleClipTrack,
  sampleNumberTrack,
  shouldSnapPlayhead,
  type Clip,
} from "./timelineMath";
import type { LayerState, LayerTrack } from "./storyTimeline";

test("easeProgress applies the named easing without leaving the 0..1 range", () => {
  assert.equal(easeProgress(-1, "linear"), 0);
  assert.equal(easeProgress(2, "linear"), 1);
  assert.equal(easeProgress(0.25, "linear"), 0.25);
  assert.equal(easeProgress(0.5, "easeIn"), 0.25);
  assert.equal(easeProgress(0.5, "easeOut"), 0.75);
  assert.equal(easeProgress(0.25, "easeInOut"), 0.125);
  assert.equal(easeProgress(0.75, "easeInOut"), 0.875);
  assert.equal(easeProgress(0.999, "hold"), 0);
  assert.equal(easeProgress(1, "hold"), 1);
});

test("sampleNumberTrack clamps outside the track and interpolates in either scroll direction", () => {
  const frames = [
    { at: 0.2, value: 10 },
    { at: 0.6, value: 30 },
    { at: 0.8, value: 10 },
  ] as const;

  assert.equal(sampleNumberTrack(frames, 0), 10);
  assert.equal(sampleNumberTrack(frames, 0.4), 20);
  assert.ok(Math.abs(sampleNumberTrack(frames, 0.7) - 20) < 1e-12);
  assert.equal(sampleNumberTrack(frames, 1), 10);
  assert.equal(sampleNumberTrack(frames, 0.4), 20);
});

test("sampleNumberTrack holds sprite values until the next keyframe", () => {
  const frames = [
    { at: 0, value: 0, ease: "hold" as const },
    { at: 0.5, value: 1, ease: "hold" as const },
    { at: 0.75, value: 2 },
  ] as const;

  assert.equal(sampleNumberTrack(frames, 0.49), 0);
  assert.equal(sampleNumberTrack(frames, 0.5), 1);
  assert.equal(sampleNumberTrack(frames, 0.74), 1);
  assert.equal(sampleNumberTrack(frames, 0.75), 2);
});

test("sampleClipTrack interpolates all polygon corners", () => {
  const closed: Clip = [50, 0, 50, 0, 50, 100, 50, 100];
  const open: Clip = [0, 0, 100, 0, 100, 100, 0, 100];
  assert.deepEqual(sampleClipTrack([
    { at: 0, value: closed },
    { at: 1, value: open },
  ], 0.5), [25, 0, 75, 0, 75, 100, 25, 100]);
});

test("clipToPolygon produces a valid four-corner CSS polygon", () => {
  assert.equal(
    clipToPolygon([0, 0, 100, 0, 100, 100, 0, 100]),
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  );
});

test("inline clip paths belong only to tracks that author a clip and otherwise clear", () => {
  const state = {
    clip: [0, 0, 100, 0, 100, 100, 0, 100],
  } as Pick<LayerState, "clip">;
  const trackWithClip = {
    clip: [{ at: 0, value: [0, 0, 100, 0, 100, 100, 0, 100] }],
  } as Pick<LayerTrack, "clip">;
  const trackWithoutClip = {} as Pick<LayerTrack, "clip">;

  assert.equal(
    inlineClipPathForTrack(trackWithClip, state),
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  );
  assert.equal(inlineClipPathForTrack(trackWithoutClip, state), undefined);
  assert.equal(inlineClipPathForTrack(trackWithoutClip, state) ?? "", "");
});

test("dampedProgress is frame-time based and converges symmetrically", () => {
  const forward = dampedProgress(0, 1, 0.1, 10);
  const backward = dampedProgress(1, 0, 0.1, 10);
  assert.ok(Math.abs(forward - 0.6321205588) < 1e-9);
  assert.ok(Math.abs(backward - 0.3678794412) < 1e-9);
  assert.equal(dampedProgress(0.4, 1, 0, 10), 0.4);
});

test("shouldSnapPlayhead catches equally large forward and backward jumps", () => {
  assert.equal(shouldSnapPlayhead(0.1, 0.27), false);
  assert.equal(shouldSnapPlayhead(0.1, 0.28), true);
  assert.equal(shouldSnapPlayhead(0.8, 0.62), true);
});
