import assert from "node:assert/strict";
import test from "node:test";

import { STORY_COPY_CUES, STORY_SCENES, getStoryProgressAnnouncement } from "./storyNarrative";

test("the public story contains the approved seven scenes", () => {
  assert.deepEqual(STORY_SCENES.map(({ id, start, end }) => [id, start, end]), [
    ["jeju-opening", 0, 0.08],
    ["same-direction", 0.08, 0.18],
    ["office-coworkers", 0.18, 0.34],
    ["joke-and-laughter", 0.34, 0.5],
    ["lifelong-partners", 0.5, 0.72],
    ["seoul-venue", 0.72, 0.84],
    ["wedding-finale", 0.84, 1],
  ]);
  assert.equal(STORY_SCENES[1]?.copyCues.length, 0);
  assert.equal(STORY_COPY_CUES.length, 7);
});

test("approved copy and configured ceremony details remain exact", () => {
  assert.deepEqual(STORY_COPY_CUES.map(({ copy }) => copy), [
    "예찬과 주은의 결혼 이야기",
    "처음엔 회사 동기였던 두 사람",
    "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
    "그렇게 평생 웃겨주고 웃어주는",
    "짝꿍이 되기로 했습니다.",
    "2026.12.19 오후 12시 30분,\n잠실 아펠가모에서요!",
    "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
  ]);
  assert.equal(STORY_COPY_CUES.some(({ copy }) => copy.includes("되기도")), false);
  assert.equal(getStoryProgressAnnouncement(0.83).sceneId, "seoul-venue");
  assert.equal(getStoryProgressAnnouncement(1).value, 7);
  assert.equal(
    STORY_SCENES.at(-1)?.narration,
    "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
  );
  assert.equal(
    getStoryProgressAnnouncement(1).text,
    "7/7. 예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
  );
});
