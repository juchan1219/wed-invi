import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { describeLetterSheet, letterButtonLabel, letterReadStamp } from "./letterSheets";

test("a single letter has no counter and ends with close", () => {
  assert.deepEqual(describeLetterSheet([{ author: "yechan" }], 0), {
    author: "예찬", counter: null, next: null,
  });
});

test("two letters read in order with a next-letter action on the first sheet", () => {
  const letters = [{ author: "yechan" }, { author: "jueun" }] as const;
  assert.deepEqual(describeLetterSheet(letters, 0), { author: "예찬", counter: "1 / 2", next: "다음 편지 · 주은" });
  assert.deepEqual(describeLetterSheet(letters, 1), { author: "주은", counter: "2 / 2", next: null });
});

test("the letter button names the recipient", () => {
  assert.deepEqual(letterButtonLabel("홍길동"), { to: "홍길동님께", message: "편지가 왔어요" });
});

test("the read stamp changes when a new letter arrives, so the red dot comes back", () => {
  assert.equal(letterReadStamp([{ author: "yechan" }]), "yechan");
  assert.equal(letterReadStamp([{ author: "yechan" }, { author: "jueun" }]), "yechan,jueun");
  assert.notEqual(letterReadStamp([{ author: "yechan" }]), letterReadStamp([{ author: "yechan" }, { author: "jueun" }]));
});

test("the floating letter button exists only on the with-letter path", () => {
  const source = readFileSync(new URL("../invitation/Invitation.tsx", import.meta.url), "utf8");
  const withLetter = source.slice(source.indexOf("if (!letter) return invitation;"));
  assert.match(withLetter, /<LetterFab startId="invitation-content" \/>/);
  assert.equal(source.match(/<LetterFab/g)?.length, 1);
});

test("the floating letter button scrolls to the letter button instead of opening the letter", () => {
  const source = readFileSync(new URL("./LetterFab.tsx", import.meta.url), "utf8");
  assert.match(source, /DANCE_ENDING_ID/);
  assert.match(source, /DANCE_ENDING_CARD_ID/);
  assert.match(source, /scrollIntoView/);
  // 바로 여는 것은 춤 장면을 못 찾았을 때의 대비책뿐이다.
  assert.equal(source.match(/letter\.open\(/g)?.length, 1);
  assert.doesNotMatch(source, /aria-haspopup/);
});

test("the invitation wraps everything in LetterProvider only when a letter is passed", () => {
  const source = readFileSync(new URL("../invitation/Invitation.tsx", import.meta.url), "utf8");
  assert.match(source, /<LetterProvider/);
  // 본문 편지 섹션은 두지 않는다(2026-09-19 사용자 요청). 버튼은 춤 마지막 장면에만 있다.
  assert.doesNotMatch(source, /LetterInvite|letterSlot/);
});
