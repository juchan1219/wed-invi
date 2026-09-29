import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";

function installCssModuleHook() {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = (module) => {
    const classes = new Proxy({}, { get: (_target, property) => String(property) });
    module.exports = { __esModule: true, default: classes };
  };
}

function installDom() {
  const css = readFileSync(new URL("./LetterDialog.module.css", import.meta.url), "utf8");
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body><div id="root"></div></body></html>`,
    { url: "http://localhost/i/test" },
  );
  const animation = {
    cancel() {},
    finish() {},
    finished: Promise.resolve(),
  };
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Element: { configurable: true, writable: true, value: dom.window.Element },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false }),
  });
  Object.defineProperty(dom.window.Element.prototype, "animate", {
    configurable: true,
    value: () => animation,
  });
  Object.defineProperties(dom.window.HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() { this.setAttribute("open", ""); },
    },
    close: {
      configurable: true,
      value() { this.removeAttribute("open"); },
    },
  });
  return { container: dom.window.document.querySelector("#root")!, dom };
}

installCssModuleHook();

test("편지 본문이 나타난 뒤에도 아래 종이 레이어를 제거하지 않아 합성 프레임이 끊기지 않는다", async () => {
  const environment = installDom();
  const { LetterDialog } = await import("./LetterDialog");
  const { createRoot } = await import("react-dom/client");
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(LetterDialog, {
      recipientName: "하객",
      letters: [{ author: "yechan", body: "반가운 편지입니다." }],
      onClosed() {},
    }));
    await Promise.resolve();
  });

  const scene = environment.container.querySelector<HTMLElement>("[data-phase]")!;
  const sheet = environment.container.querySelector<HTMLElement>(".sheet")!;
  const article = environment.container.querySelector<HTMLElement>("article")!;
  assert.equal(scene.dataset.phase, "open");
  assert.equal(environment.dom.window.getComputedStyle(article).visibility, "visible");
  assert.equal(environment.dom.window.getComputedStyle(sheet).visibility, "visible");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});
