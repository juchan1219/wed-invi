import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DANCE_SCENES,
  getDancePoseOpacities,
  getDanceFrame,
  getDanceProgressAnnouncement,
} from "./danceTimeline";

test("the replacement dance story exposes six contiguous key poses", () => {
  assert.equal(DANCE_SCENES.length, 6);
  assert.deepEqual(DANCE_SCENES.map(({ pose }) => pose), [1, 2, 3, 4, 5, 6]);
  assert.equal(DANCE_SCENES[0]?.start, 0);
  assert.equal(DANCE_SCENES.at(-1)?.end, 1);

  for (let index = 1; index < DANCE_SCENES.length; index += 1) {
    assert.equal(DANCE_SCENES[index - 1]?.end, DANCE_SCENES[index]?.start);
  }
});

test("characters and copy alternate sides before the centered finale", () => {
  assert.deepEqual(
    DANCE_SCENES.map(({ actorSide, copySide }) => [actorSide, copySide]),
    [
      ["left", "right"],
      ["right", "left"],
      ["left", "right"],
      ["right", "left"],
      ["left", "right"],
      ["center", "center"],
    ],
  );
});

test("dance progress clamps and returns scene-local interpolation", () => {
  assert.deepEqual(getDanceFrame(-1), { scene: DANCE_SCENES[0], sceneProgress: 0 });
  assert.deepEqual(getDanceFrame(2), { scene: DANCE_SCENES[5], sceneProgress: 1 });

  const midpoint = getDanceFrame(0.25);
  assert.equal(midpoint.scene.pose, 2);
  assert.ok(midpoint.sceneProgress > 0 && midpoint.sceneProgress < 1);
});

test("announcements update only at the six pose boundaries", () => {
  assert.deepEqual(getDanceProgressAnnouncement(0), {
    sceneId: "holding-hands",
    value: 1,
    text: "1/6. 서로 마주 보고 손을 잡은 두 사람",
  });
  assert.equal(getDanceProgressAnnouncement(1).value, 6);
});

test("the final pose remains fully visible at 100 percent", () => {
  assert.deepEqual(getDancePoseOpacities(1), [0, 0, 0, 0, 0, 1]);
});

test("the public invitation renders WeddingDance instead of the retired WeddingStory", () => {
  const source = readFileSync(new URL("../Invitation.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ WeddingDance \} from "\.\/story\/WeddingDance"/);
  assert.match(source, /<WeddingDance contentTargetId="invitation-content" \/>/);
  assert.doesNotMatch(source, /<WeddingStory/);
});
