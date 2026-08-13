import assert from "node:assert/strict";
import test from "node:test";

import { STORY_BEATS } from "./storyCopy";

test("the story has exactly eleven concise beats", () => {
  assert.equal(STORY_BEATS.length, 11);
  for (const beat of STORY_BEATS) {
    assert.ok(beat.copy.length <= 62, `${beat.id} copy is too long`);
  }
});

test("the destination beat contains the confirmed ceremony details", () => {
  const destination = STORY_BEATS.find((beat) => beat.id === "destination");
  assert.ok(destination);
  assert.match(destination.copy, /2026\.12\.19/);
  assert.match(destination.copy, /오후 12시 30분/);
  assert.match(destination.copy, /잠실 아펠가모/);
});

test("the finale carries the approved closing line", () => {
  assert.equal(STORY_BEATS.at(-1)?.copy, "우리 결혼합니다!!");
});
