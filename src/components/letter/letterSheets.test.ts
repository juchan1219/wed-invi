import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { describeLetterSheet, letterButtonLabel } from "./letterSheets";

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

test("the invitation wraps everything in LetterProvider only when a letter is passed", () => {
  const source = readFileSync(new URL("../invitation/Invitation.tsx", import.meta.url), "utf8");
  assert.match(source, /<LetterProvider/);
  // 본문 편지 섹션은 두지 않는다(2026-09-19 사용자 요청). 버튼은 춤 마지막 장면에만 있다.
  assert.doesNotMatch(source, /LetterInvite|letterSlot/);
});
