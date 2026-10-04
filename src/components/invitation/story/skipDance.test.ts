import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tsx = () => readFileSync(new URL("./WeddingDance.tsx", import.meta.url), "utf8");
const css = () => readFileSync(new URL("./WeddingDance.module.css", import.meta.url), "utf8");

/**
 * 2026-10-05 사용자 요청: 춤을 건너뛰는 버튼을 **좌상단** 에 둔다.
 * 우상단에는 `오시는 길`·음악 토글이 이미 있고, 셋을 나란히 놓으면 320px 에서 빽빽하다.
 */
test("the dance offers a Korean skip control that jumps past it", () => {
  const source = tsx();
  // 한국어 문구 — 'skip' 같은 영문을 쓰지 않는다.
  assert.match(source, /<span>건너뛰기<\/span>/);
  // 춤 다음의 청첩장 본문으로 보낸다.
  assert.match(source, /className=\{styles\.skipDance\}\s+href="#invitation-content"/);
  // 건너뛰기 링크는 탭 순서에서 먼저 와야 한다.
  assert.ok(
    source.indexOf("styles.skipDance") < source.indexOf("styles.skip}"),
    "건너뛰기가 `오시는 길` 보다 먼저 와야 합니다",
  );
});

test("the skip control sits at the bottom right and the existing pill stays on top", () => {
  const rules = css();
  const skipDance = rules.match(/\.skipDance\s*\{([^}]*)\}/)?.[1] ?? "";
  const skipTop = rules.match(/\.skip\s*\{([^}]*)\}/)?.[1] ?? "";

  // 우측 정렬 + 화면 하단. 가운데 "아래로 스크롤" 안내와 같은 높이를 쓴다.
  assert.match(skipDance, /margin-left:\s*auto/, "건너뛰기는 우측 정렬이어야 합니다");
  assert.doesNotMatch(skipDance, /margin-right:\s*auto/);
  assert.match(skipDance, /top:\s*calc\(100svh/, "건너뛰기는 화면 하단에 붙어야 합니다");
  // iOS Safari 하단 툴바는 safe-area 에 잡히지 않아 여유를 둔다 — scrollHint 와 같은 식.
  assert.match(skipDance, /env\(safe-area-inset-bottom\)/);

  // 우상단 pill 은 그대로 — 배치 계산을 건드리지 않았는지 확인한다.
  assert.match(skipTop, /margin-left:\s*auto/);
  assert.match(skipTop, /transform:\s*translateX\(/);
  assert.match(skipTop, /top:\s*max\(0\.8rem,\s*env\(safe-area-inset-top\)\)/);

  for (const rule of [skipDance, skipTop]) {
    assert.match(rule, /position:\s*sticky/);
    assert.match(rule, /margin-bottom:\s*-2\.9rem/);
  }
});

test("the skip control disappears when there is no dance to skip", () => {
  // 동작 줄이기에서는 무대가 display:none 이고 정적 카드가 대신 나온다.
  // 건너뛸 춤이 없으니 버튼도 숨긴다.
  const rules = css();
  assert.match(rules, /\.story\[data-motion="reduce"\][^{]*\.skipDance[^{]*\{[^}]*display:\s*none/);
  assert.match(rules, /\.story\[data-motion="pending"\][^{]*\.skipDance[^{]*\{[^}]*display:\s*none/);
});
