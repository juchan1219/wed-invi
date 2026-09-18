import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDance, solveLimb, local, world } from './choreography.mjs';

test('two-bone joints preserve lengths and reach a reachable wrist', () => {
  const { elbow, end } = solveLimb([0, 0], [60, 60], 60, 60, 1);
  assert.ok(Math.abs(Math.hypot(...elbow) - 60) < 1e-6);
  assert.ok(Math.abs(Math.hypot(end[0] - elbow[0], end[1] - elbow[1]) - 60) < 1e-6);
  assert.ok(Math.hypot(end[0] - 60, end[1] - 60) < 1e-6);
});

test('far and coincident targets remain finite without stretching', () => {
  for (const target of [[1000, 0], [0, 0]]) {
    const limb = solveLimb([0, 0], target, 60, 55, -1);
    assert.ok(Object.values(limb).flat().every(Number.isFinite));
    assert.ok(Math.hypot(...limb.end) <= 115);
  }
});

test('scrubbing is deterministic, bounded and clamps endpoints', () => {
  assert.deepEqual(sampleDance(-1), sampleDance(0));
  assert.deepEqual(sampleDance(2), sampleDance(1));
  const middle = sampleDance(.55);
  sampleDance(.9); sampleDance(.2);
  assert.deepEqual(sampleDance(.55), middle);
  for (let i = 0; i <= 200; i++) {
    assert.ok(JSON.stringify(sampleDance(i / 200)).includes('null') === false);
  }
});

test('held hands share an actual world-space endpoint, not separate sprite positions', () => {
  for (let progress = 0; progress <= .73; progress += .005) {
    const { groom, bride, joined } = sampleDance(progress);
    assert.ok(joined);
    const groomWrist = world(solveLimb([19,-98], local(groom.hands[0],groom),67,64,1).end,groom);
    const brideWrist = world(solveLimb([-14*(.35+.65*Math.abs(bride.facing)),-86],local(bride.hands[0],bride),59,57,-1).end,bride);
    assert.ok(Math.hypot(groomWrist[0]-brideWrist[0],groomWrist[1]-brideWrist[1]) < .001);
  }
});

test('final lift raises bride while groom remains grounded', () => {
  const start = sampleDance(0); const end = sampleDance(1);
  assert.ok(end.bride.hip[1] < start.bride.hip[1] - 45);
  assert.ok(end.bride.lean < -0.8);
  assert.ok(end.groom.feet.some((foot) => foot[1] === 490));
});
