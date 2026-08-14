import assert from "node:assert/strict";
import test from "node:test";

import { formatCeremonyTime, formatKoreanTimeParts } from "./date";

test("formatKoreanTimeParts does not depend on an ICU-translated day period", () => {
  assert.equal(formatKoreanTimeParts(0, 0), "오전 12시");
  assert.equal(formatKoreanTimeParts(9, 5), "오전 9시 5분");
  assert.equal(formatKoreanTimeParts(12, 30), "오후 12시 30분");
  assert.equal(formatKoreanTimeParts(23, 0), "오후 11시");
});

test("formatCeremonyTime is identical on the server and browser", () => {
  assert.equal(formatCeremonyTime(), "오후 12시 30분");
});
