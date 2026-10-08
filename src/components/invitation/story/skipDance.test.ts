import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tsx = () => readFileSync(new URL("./WeddingDance.tsx", import.meta.url), "utf8");
const css = () => readFileSync(new URL("./WeddingDance.module.css", import.meta.url), "utf8");

/**
 * 2026-10-05 사용자 요청: 춤을 건너뛰는 버튼을 우측 하단에 둔다.
 * 2026-10-08 사용자 보고로 위치 방식을 바꿨다 — 아래 "무대 안" 테스트 참고.
 */
test("the dance offers a Korean skip control that jumps past it", () => {
  const source = tsx();
  // 한국어 문구 — 'skip' 같은 영문을 쓰지 않는다.
  assert.match(source, /<span>건너뛰기<\/span>/);
  // 춤 다음의 청첩장 본문으로 보낸다.
  assert.match(source, /className=\{styles\.skipDance\}\s+href="#invitation-content"/);
});

/**
 * 핵심 회귀: 건너뛰기는 **무대(`.stage`) 안**에 있어야 한다.
 *
 * `.skip`(오시는 길)처럼 형제 sticky 로 두면 컨테이닝 블록(`.story`, 500svh) 바닥에
 * 주차된다. 춤이 끝나는 지점이 곧 캘린더 최상단이라, 캘린더가 보이는 순간 버튼이
 * `오시는 길` 뒤에 겹쳐 남았다(2026-10-08 사용자 스크린샷).
 * 무대 안 absolute 면 무대의 `overflow: hidden` 에 잘리고 함께 사라진다.
 */
test("the skip control lives inside the stage so it leaves with it", () => {
  const source = tsx();
  const stageStart = source.indexOf("className={styles.stage}");
  const fallbackStart = source.indexOf("className={styles.fallback}");
  const skip = source.indexOf("styles.skipDance");

  assert.ok(stageStart > 0 && fallbackStart > stageStart, "무대/폴백 마크업을 찾지 못했습니다");
  assert.ok(
    skip > stageStart && skip < fallbackStart,
    "건너뛰기가 무대 밖에 있습니다 — 캘린더 최상단에 남게 됩니다",
  );

  const rule = css().match(/\.skipDance\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(rule, /position:\s*absolute/, "무대 안에서는 absolute 여야 합니다");
  assert.doesNotMatch(rule, /position:\s*sticky/);
  // sticky 시절의 흔적이 남아 있으면 안 된다.
  assert.doesNotMatch(rule, /margin-bottom:\s*-2\.9rem/);
  assert.doesNotMatch(rule, /100svh/);
});

test("the skip control sits at the bottom right, clear of the scroll hint", () => {
  const rule = css().match(/\.skipDance\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(rule, /right:\s*max\(0\.8rem/);
  // iOS Safari 하단 툴바는 safe-area 에 잡히지 않아 여유를 둔다 — scrollHint 와 같은 식.
  assert.match(rule, /bottom:\s*max\(2\.75rem,\s*calc\(env\(safe-area-inset-bottom\)\s*\+\s*1\.75rem\)\)/);

  // 우상단 pill 은 그대로여야 한다 — 배치 계산을 건드리지 않았는지 확인한다.
  const skipTop = css().match(/^\.skip\s*\{([^}]*)\}/m)?.[1] ?? "";
  assert.match(skipTop, /position:\s*sticky/);
  assert.match(skipTop, /top:\s*max\(0\.8rem,\s*env\(safe-area-inset-top\)\)/);
  assert.match(skipTop, /transform:\s*translateX\(/);
});

/**
 * 2026-10-08 사용자 보고: 캘린더가 보이는데도 버튼이 `오시는 길` 뒤에 남아 있었다.
 * 무대 안으로 옮겨 함께 밀려 올라가게 했지만, 그 사이 약 150px 동안 둘이 같이 보였다.
 * `--dance-exit` 트윈의 트리거가 `start: "bottom bottom"` — 캘린더가 보이기 시작하는
 * 바로 그 순간이라, 같은 타이밍에 세팅되는 `data-exiting` 으로 감춘다.
 */
test("both floating pills hide the moment the stage starts leaving", () => {
  // `오시는 길` 도 같은 이유로 캘린더 최상단에 붙어 따라왔다(2026-10-08 두 번째 보고).
  assert.match(
    css(),
    /\.story\[data-exiting="yes"\]\s*\.skipDance,\s*\n\s*\.story\[data-exiting="yes"\]\s*\.skip\s*\{/,
    "오시는 길 pill 도 함께 숨겨야 합니다",
  );
  assert.match(
    css(),
    /\.story\[data-exiting="yes"\][\s\S]{0,80}visibility:\s*hidden/,
    "data-exiting 일 때 건너뛰기를 숨기는 규칙이 없습니다",
  );
  const rule = css().match(/\.story\[data-exiting="yes"\][^{]*\{([^}]*)\}/)?.[1] ?? "";
  // opacity 만으로는 초점·클릭이 남는다.
  assert.match(rule, /opacity:\s*0/);
  assert.match(rule, /pointer-events:\s*none/);

  // 플래그를 세우는 쪽도 함께 고정한다 — 한쪽만 지우면 조용히 깨진다.
  const hook = readFileSync(new URL("./useDanceTimeline.ts", import.meta.url), "utf8");
  assert.match(hook, /rootElement\.dataset\.exiting\s*=/, "useDanceTimeline 이 루트에 data-exiting 을 세우지 않습니다 — .skip 은 무대 밖이라 루트여야 합니다");
});

test("the skip control is absent when there is no dance to skip", () => {
  const rules = css();
  // 동작 줄이기: 무대 자체가 display:none 이라 자식인 건너뛰기도 함께 사라진다.
  assert.match(rules, /\.story\[data-motion="reduce"\]\s*\.stage[\s\S]{0,80}display:\s*none/);
  // 하이드레이션 전: 무대가 aria-hidden 이므로 포커스 가능한 링크를 그 안에 두지 않는다.
  assert.match(rules, /\.story\[data-motion="pending"\]\s*\.skipDance\s*\{[^}]*display:\s*none/);
});
