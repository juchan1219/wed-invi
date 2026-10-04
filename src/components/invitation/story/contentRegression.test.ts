import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import { wedding } from "@/config/wedding";
import { Greeting } from "../Greeting";
import { Guestbook } from "../Guestbook";
import { ShareFooter } from "../ShareFooter";
import { ToastProvider } from "@/components/ui/Toast";

function installImageModuleHook() {
  const require = createRequire(import.meta.url);
  const loadImage = (module: NodeModule) => {
    module.exports = {
      __esModule: true,
      default: {
        src: "/test.jpg",
        width: 1200,
        height: 800,
        blurDataURL: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      },
    };
  };
  require.extensions[".jpg"] = loadImage;
  require.extensions[".webp"] = loadImage;
}

test("the invitation shows the requested parents and child relations", () => {
  const text = new JSDOM(renderToStaticMarkup(createElement(Greeting))).window.document.body.textContent
    ?.replace(/\s+/g, " ")
    .trim();

  assert.match(text ?? "", /김종웅\s*·\s*권순주\s*의 차남\s*김예찬/);
  assert.match(text ?? "", /이병석\s*·\s*박윤경\s*의 장녀\s*이주은/);
  assert.equal(wedding.groom.father.name, "김종웅");
  assert.equal(wedding.bride.father.name, "이병석");
});

test("the greeting keeps the wording the couple chose", () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(Greeting)));
  // 섹션 라벨·제목도 <p> 라서 본문 첫 줄을 찾아 거기서부터 본다.
  const paragraphs = Array.from(dom.window.document.querySelectorAll("p")).map((p) =>
    p.textContent?.trim(),
  );
  const start = paragraphs.indexOf("귀하게 만난 두 사람이");

  assert.notEqual(start, -1, "인사말 첫 줄을 찾지 못했습니다");
  assert.deepEqual(paragraphs.slice(start, start + 7), [
    "귀하게 만난 두 사람이",
    "여러 계절을 함께했습니다.",
    "운명처럼 시작된 인연을",
    "주어진 사랑으로 잘 가꾸고",
    "은은한 행복을 나누며",
    "이제 평생을 함께하려 합니다.",
    "소중한 분들과 이 기쁨을 나누고 싶습니다.",
  ]);
  // 빈 문자열 두 개가 문단 사이 여백 → 세 문단으로 끊어 읽힌다.
  assert.equal(wedding.greeting.body.filter((line) => line === "").length, 2);

  dom.window.close();
});

/** 2026-10-04 사용자 요청으로 '축하 메시지'(방명록)를 청첩장에서 뺐다. */
test("the invitation leaves the guestbook section out", async () => {
  assert.equal(wedding.guestbook.enabled, false);

  // 섹션이 플래그 뒤에서만 렌더되는지 — 플래그를 무시한 직접 렌더가 끼어들면 잡힌다.
  const source = readFileSync(new URL("../Invitation.tsx", import.meta.url), "utf8");
  assert.match(source, /\{wedding\.guestbook\.enabled && <Guestbook \/>\}/);
  assert.equal(source.match(/<Guestbook\s*\/>/g)?.length, 1);
});

test("the account section explains itself in the requested two lines", async () => {
  const { AccountSection } = await import("../AccountSection");
  const dom = new JSDOM(
    renderToStaticMarkup(createElement(ToastProvider, null, createElement(AccountSection))),
  );
  // 섹션 라벨·제목도 <p> 라서 안내문만 집어낸다.
  const intro = Array.from(dom.window.document.querySelectorAll("p")).find((p) =>
    p.textContent?.includes("참석이 어려우신"),
  )?.innerHTML;

  assert.equal(
    intro,
    "참석이 어려우신 분들을 위해 계좌번호를 남깁니다.<br>너그러운 마음으로 양해 부탁드립니다.",
  );
  dom.window.close();
});

test("the location section exposes the dance shortcut target", async () => {
  installImageModuleHook();
  const { MapSection } = await import("../MapSection");
  const dom = new JSDOM(renderToStaticMarkup(
    createElement(ToastProvider, null, createElement(MapSection)),
  ));
  assert.equal(dom.window.document.querySelector("section#location h2")?.textContent, "오시는 길");
  dom.window.close();
});

test("the footer wraps narrow share controls and credits the couple", () => {
  const html = renderToStaticMarkup(
    createElement(ToastProvider, null, createElement(ShareFooter)),
  );
  const dom = new JSDOM(html);
  const controls = dom.window.document.querySelector<HTMLElement>("[aria-label='청첩장 공유']");

  assert.equal(controls?.style.flexWrap, "wrap");
  assert.equal(dom.window.document.querySelector("footer")?.textContent?.includes("created by 김예찬 이주은"), true);
  dom.window.close();
});

test("guestbook identity inputs can shrink inside a 320px mobile sheet", async () => {
  const dom = new JSDOM("<div id='root'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const testGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;
  const previousActEnvironment = testGlobal.IS_REACT_ACT_ENVIRONMENT;
  Object.assign(testGlobal, {
    window: dom.window,
    document: dom.window.document,
    fetch: async () => ({ json: async () => ({ entries: [] }) }),
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const root = createRoot(dom.window.document.querySelector("#root")!);

  try {
    await act(async () => {
      root.render(createElement(ToastProvider, null, createElement(Guestbook)));
    });
    const name = dom.window.document.querySelector<HTMLInputElement>("input[aria-label='이름']");
    const password = dom.window.document.querySelector<HTMLInputElement>("input[aria-label='삭제용 비밀번호 4자리']");
    assert.equal(name?.style.minWidth, "0");
    assert.equal(name?.style.width, "100%");
    assert.equal(password?.style.minWidth, "0");
    assert.equal(password?.style.width, "100%");
  } finally {
    await act(async () => root.unmount());
    Object.assign(testGlobal, {
      window: previousWindow,
      document: previousDocument,
      fetch: previousFetch,
      IS_REACT_ACT_ENVIRONMENT: previousActEnvironment,
    });
    dom.window.close();
  }
});

test("the invitation document clips accidental horizontal overflow", () => {
  const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");
  const standardCss = css.slice(css.indexOf("html {"));
  const dom = new JSDOM(`<style>${standardCss}</style>`);
  const rules = Array.from(dom.window.document.styleSheets[0]!.cssRules);
  const clipped = rules.some((rule) => {
    if (!(rule instanceof dom.window.CSSStyleRule)) return false;
    return rule.selectorText.includes("html") && rule.selectorText.includes("body") && rule.style.getPropertyValue("overflow-x") === "clip";
  });
  assert.equal(clipped, true);
  dom.window.close();
});

test("the dance shortcut shares the music control's top row", () => {
  const css = readFileSync(new URL("./WeddingDance.module.css", import.meta.url), "utf8");
  const skipRule = css.match(/\.skip\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  assert.match(skipRule, /top:\s*max\(0\.8rem,\s*env\(safe-area-inset-top\)\)/);
  assert.match(skipRule, /transform:\s*translateX\(/);
  assert.doesNotMatch(skipRule, /transform:[^;]*safe-area-inset-top/);
});
