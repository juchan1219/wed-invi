import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import {
  ACTOR_SCALE_ORIGIN,
  ENDING_INK,
  getLetterRoom,
  LETTER_ROOM_GAP,
  LETTER_ROOM_MIN_SCALE,
  DANCE_ENDING_CARD_ID,
  DANCE_ENDING_ID,
  DANCE_SCENES,
  getDanceSkipTarget,
  getDancePoseOpacities,
  getDanceFrame,
  getDanceProgressAnnouncement,
  getScrollHintState,
  isLetterButtonShown,
  LETTER_BUTTON_START,
  SCROLL_HINT_END,
} from "./danceTimeline";

function installCssModuleHook() {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = (module) => {
    const classes = new Proxy({}, { get: (_target, property) => String(property) });
    module.exports = { __esModule: true, default: classes };
  };
}

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

test("the server-rendered opening already uses the stable animated stage and matching first frame", async () => {
  installCssModuleHook();
  const { WeddingDance } = await import("./WeddingDance");
  const html = renderToStaticMarkup(createElement(WeddingDance, { contentTargetId: "invitation-content" }));
  const css = readFileSync(new URL("./WeddingDance.module.css", import.meta.url), "utf8");
  const dom = new JSDOM(`<style>${css}</style>${html}`, { pretendToBeVisual: true });
  const story = dom.window.document.querySelector("section[data-motion='pending']");
  const stage = story?.querySelector<HTMLElement>(".stage");
  const fallback = story?.querySelector<HTMLElement>(".fallback");
  const placeholder = stage?.querySelector<HTMLImageElement>('img[src*="first-frame.webp"]');

  assert.ok(story);
  assert.ok(stage);
  assert.ok(placeholder, "the first paint must use the same padded frame as the canvas");
  assert.notEqual(dom.window.getComputedStyle(stage).display, "none");
  assert.equal(dom.window.getComputedStyle(fallback!).display, "none");
  dom.window.close();
});

test("the scroll hint stays until the stage is about to release, dimming only while moving", () => {
  assert.equal(getScrollHintState(0, false), "resting");
  assert.equal(getScrollHintState(0.3, true), "moving");
  assert.equal(getScrollHintState(0.3, false), "resting");
  // 마지막 장면(0.84~)에서도 아직 고정 구간이므로 안내가 남아 있어야 한다.
  assert.equal(getScrollHintState(0.9, false), "resting");
  assert.ok(SCROLL_HINT_END > DANCE_SCENES.at(-1)!.start);
  assert.equal(getScrollHintState(SCROLL_HINT_END, false), "done");
  assert.equal(getScrollHintState(1, true), "done");
});

test("the letter button appears only near the end of the final scene", () => {
  // 엔딩 그림(0.84~)이 나온 뒤, 스크롤이 끝나기 직전에만 보인다.
  assert.ok(LETTER_BUTTON_START > DANCE_SCENES.at(-1)!.start);
  assert.equal(isLetterButtonShown(0.84), false);
  assert.equal(isLetterButtonShown(0.899), false);
  assert.equal(isLetterButtonShown(LETTER_BUTTON_START), true);
  assert.equal(isLetterButtonShown(1), true);
});

test("skipping the dance still reaches the letter button when the guest has a letter", () => {
  assert.equal(getDanceSkipTarget("invitation-content", false, true), "invitation-content");
  assert.equal(getDanceSkipTarget("invitation-content", false, false), "invitation-content");
  // 본문에 편지 자리가 없으므로 편지 버튼이 있는 마지막 장면으로 간다.
  assert.equal(getDanceSkipTarget("invitation-content", true, true), DANCE_ENDING_ID);
  assert.equal(getDanceSkipTarget("invitation-content", true, false), DANCE_ENDING_CARD_ID);

  // 동작 줄이기(정적 카드)에서도 버튼이 있어야 한다: 춤 무대 + 마지막 카드, 두 곳.
  const source = readFileSync(new URL("./WeddingDance.tsx", import.meta.url), "utf8");
  assert.equal(source.match(/<LetterButton \/>/g)?.length, 2);
  assert.match(source, /id=\{DANCE_ENDING_ID\}/);
  assert.match(source, /DANCE_ENDING_CARD_ID/);
});

test("the ending picture makes room for the letter button only when the screen is short", () => {
  const actorTop = 300;
  const actorSize = 400;
  const inkTop = actorTop + ENDING_INK.top * actorSize;
  const feet = actorTop + ENDING_INK.bottom * actorSize;
  // 비켜 준 뒤 그림 잉크 윗끝의 위치(발 기준으로 줄이고 아래로 민다).
  const inkTopAfter = ({ shift, scale }: { shift: number; scale: number }) => {
    const origin = actorTop + ACTOR_SCALE_ORIGIN * actorSize;
    return origin - scale * (origin - inkTop) + shift;
  };

  // 넉넉한 화면: 그림이 움직이지 않는다.
  assert.deepEqual(getLetterRoom({ buttonBottom: inkTop - 40, actorTop, actorSize, floor: 2000 }), { shift: 0, scale: 1 });

  // 조금 모자라면 크기는 그대로 두고 아래로만 비켜 준다.
  const shiftOnly = getLetterRoom({ buttonBottom: inkTop + 10, actorTop, actorSize, floor: 2000 });
  assert.equal(shiftOnly.scale, 1);
  assert.ok(Math.abs(inkTopAfter(shiftOnly) - (inkTop + 10 + LETTER_ROOM_GAP)) < 1e-6);

  // 발끝 아래 여유가 부족하면 내릴 수 있는 만큼 내리고, 나머지는 줄여서 정확히 간격을 맞춘다.
  const both = getLetterRoom({ buttonBottom: inkTop + 40, actorTop, actorSize, floor: feet + 12 });
  assert.equal(both.shift, 12);
  assert.ok(both.scale < 1 && both.scale > LETTER_ROOM_MIN_SCALE);
  assert.ok(Math.abs(inkTopAfter(both) - (inkTop + 40 + LETTER_ROOM_GAP)) < 1e-6);

  // 발끝이 이미 한계 아래면 내리지 않고 줄이기만 한다.
  assert.equal(getLetterRoom({ buttonBottom: inkTop + 20, actorTop, actorSize, floor: feet - 5 }).shift, 0);

  // 아주 짧은 화면: 25% 넘게 줄이지는 않는다.
  assert.equal(getLetterRoom({ buttonBottom: inkTop + 400, actorTop, actorSize, floor: feet }).scale, LETTER_ROOM_MIN_SCALE);
});
