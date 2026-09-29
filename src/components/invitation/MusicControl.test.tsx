import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
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

function installDom(play: () => Promise<void>, pause: () => void) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
  });
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Element: { configurable: true, writable: true, value: dom.window.Element },
    HTMLMediaElement: { configurable: true, writable: true, value: dom.window.HTMLMediaElement },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });
  Object.defineProperties(dom.window.HTMLMediaElement.prototype, {
    play: { configurable: true, value: play },
    pause: { configurable: true, value: pause },
  });
  return { container: dom.window.document.querySelector("#root")!, dom };
}

installCssModuleHook();

test("페이지 진입 시 최적화된 배경음악을 반복 재생하고 버튼으로 끌 수 있다", async () => {
  let playCalls = 0;
  let pauseCalls = 0;
  const environment = installDom(
    async () => { playCalls += 1; },
    () => { pauseCalls += 1; },
  );
  const { MusicControl } = await import("./MusicControl");
  const { createRoot } = await import("react-dom/client");
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(MusicControl));
  });

  const audio = environment.container.querySelector<HTMLAudioElement>("audio")!;
  const button = environment.container.querySelector<HTMLButtonElement>("button")!;
  assert.equal(audio.getAttribute("src"), "/audio/merry-go-round-49s-128k-v1.m4a");
  assert.equal(audio.loop, true);
  assert.equal(audio.preload, "metadata");
  assert.equal(playCalls, 1, "진입할 때 소리 있는 자동재생을 한 번 시도해야 한다");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(button.getAttribute("aria-label"), "배경음악 끄기");

  await act(async () => button.click());
  assert.equal(pauseCalls, 1);
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(button.getAttribute("aria-label"), "배경음악 켜기");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});

test("자동재생이 차단되면 첫 페이지 상호작용에서 한 번 다시 재생한다", async () => {
  let playCalls = 0;
  const environment = installDom(
    async () => {
      playCalls += 1;
      if (playCalls === 1) throw new environment.dom.window.DOMException("blocked", "NotAllowedError");
    },
    () => {},
  );
  const { MusicControl } = await import("./MusicControl");
  const { createRoot } = await import("react-dom/client");
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(MusicControl));
  });
  const button = environment.container.querySelector<HTMLButtonElement>("button")!;
  assert.equal(button.getAttribute("aria-pressed"), "false");

  await act(async () => {
    environment.dom.window.document.body.dispatchEvent(
      new environment.dom.window.Event("pointerdown", { bubbles: true }),
    );
  });
  assert.equal(playCalls, 2);
  assert.equal(button.getAttribute("aria-pressed"), "true");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});
