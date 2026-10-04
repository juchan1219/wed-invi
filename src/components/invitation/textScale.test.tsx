import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");
const globals = () => read("../../app/globals.css");

/** 어르신용 링크(`/big`)의 글자 배율. 바꿀 때는 page.tsx 와 함께 본다. */
const SCALE = "1.25";
const SIZE_TOKENS = ["xs", "sm", "base", "lg", "xl", "2xl"];

test("every text size token is overridden inside the large-type scope", () => {
  const scope = globals().match(/\.large-type\s*\{([^}]*)\}/)?.[1];
  assert.ok(scope, ".large-type 규칙이 globals.css 에 없습니다");
  for (const token of SIZE_TOKENS) {
    const value = scope.match(new RegExp(`--text-${token}:\\s*([^;]+);`))?.[1];
    assert.ok(value, `--text-${token} 을 .large-type 이 덮지 않습니다`);
    assert.match(value, /var\(--text-scale,\s*1\)/, `--text-${token} 이 배율을 안 탑니다: ${value}`);
  }
});

/**
 * 커스텀 속성 안의 `var()` 는 **선언 지점** 에서 치환된다. 토큰을 `@theme`(=`:root`)에
 * 두고 `var(--text-scale, 1)` 을 곱하면 `:root` 에서 이미 1로 치환된 값이 자손에게
 * 내려가, 하위에서 배율을 바꿔도 아무 일도 일어나지 않는다. 실제로 그렇게 짰다가
 * 브라우저 측정에서 전부 ×1.000 이 나왔다. 이 테스트는 그 되돌림을 막는다.
 */
test("the scaled tokens are not hoisted into the theme block, where var() would freeze at 1", () => {
  const theme = globals().match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.ok(theme, "@theme 블록을 찾지 못했습니다");
  assert.doesNotMatch(
    theme,
    /var\(--text-scale/,
    "@theme 안에서 --text-scale 을 곱하면 :root 에서 1로 굳어 배율이 먹지 않습니다",
  );
});

test("the default page keeps the plain sizes", () => {
  const css = globals();
  const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(root, /--text-scale/, ":root 에 --text-scale 을 박으면 기본 청첩장까지 커집니다");
  assert.doesNotMatch(read("../../app/(site)/page.tsx"), /large-type|--text-scale/);
});

test("the large-text page sets the class and the scale on the same element", () => {
  const big = read("../../app/(site)/big/page.tsx");
  // 클래스와 배율이 같은 요소에 있어야 토큰의 var() 가 1.25로 치환된다.
  assert.match(
    big,
    new RegExp(`className="large-type"[^>]*--text-scale["']?\\s*:\\s*["']?${SCALE}`),
    "large-type 클래스와 --text-scale 이 같은 요소에 함께 있어야 합니다",
  );
  // 같은 컴포넌트를 써야 섹션을 추가할 때 한쪽만 빠지는 일이 없다.
  // (변형 prop 은 gallery.test.tsx 가 따로 본다.)
  assert.match(big, /<Invitation\b/);
});

/**
 * 춤을 키우지 않는다는 결정(2026-10-05)을 구조로 고정한다.
 * 춤 문구가 커지면 캐릭터·엔딩 그림·편지 버튼과 겹칠 수 있다.
 */
test("the dance keeps its own sizes and never follows the text scale", () => {
  assert.doesNotMatch(read("./story/WeddingDance.module.css"), /--text-scale/);
});

test("the body copy sizes that were hardcoded now scale too", () => {
  // 임의값 `text-[0.94rem]` 같은 리터럴은 토큰을 거치지 않아 배율을 안 탄다.
  for (const file of ["../ui/Section.tsx", "./CeremonyInfo.tsx", "./Greeting.tsx"]) {
    const literals = read(file).match(/text-\[\d*\.?\d+rem\]/g);
    assert.equal(literals, null, `${file} 에 배율을 안 타는 고정 크기가 남아 있습니다: ${literals?.join(", ")}`);
  }
});
