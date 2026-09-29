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
