import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

import { readReloadStoryProgress, writeStoryProgress } from "./storyHistory";

const STORAGE_KEY = "__wedInviStoryProgress";

test("reload progress uses session storage without trusting stale router history state", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  dom.window.history.replaceState({
    __NA: true,
    __wedInviStory: { version: 1, path: "/", progress: 0.24614 },
  }, "", dom.window.location.href);
  dom.window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    path: "/",
    progress: 0.42,
  }));
  Object.defineProperty(dom.window.performance, "getEntriesByType", {
    configurable: true,
    value: (type: string) => type === "navigation" ? [{ type: "reload" }] : [],
  });

  assert.equal(readReloadStoryProgress(dom.window as unknown as Window), 0.42);

  writeStoryProgress(dom.window as unknown as Window, 0.82);
  assert.deepEqual(JSON.parse(dom.window.sessionStorage.getItem(STORAGE_KEY) ?? "null"), {
    version: 1,
    path: "/",
    progress: 0.82,
  });
  assert.equal(dom.window.history.state.__NA, true);
  assert.equal(dom.window.history.state.__wedInviStory.progress, 0.82);

  writeStoryProgress(dom.window as unknown as Window, null);
  assert.equal(dom.window.sessionStorage.getItem(STORAGE_KEY), null);
  assert.equal("__wedInviStory" in dom.window.history.state, false);
  dom.window.close();
});
