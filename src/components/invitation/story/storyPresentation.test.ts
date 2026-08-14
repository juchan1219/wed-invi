import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import * as storyAssets from "./storyAssets";
import * as storyTimeline from "./storyTimeline";

function installCssModuleHook() {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = (module) => {
    const classes = new Proxy({}, { get: (_target, property) => String(property) });
    module.exports = { __esModule: true, default: classes };
  };
}

function installDomEnvironment(reducedMotion: boolean) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
  });
  const counters = {
    animationFrames: 0,
    intersectionObservers: 0,
    resizeObservers: 0,
    scrollListeners: 0,
  };

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Element: { configurable: true, writable: true, value: dom.window.Element },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  dom.window.matchMedia = (() => ({
    matches: reducedMotion,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof dom.window.matchMedia;
  Object.defineProperties(dom.window, {
    scrollY: { configurable: true, value: 0 },
    innerHeight: { configurable: true, value: 932 },
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 18_500,
  });
  dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    top: 0,
    right: 430,
    bottom: 932,
    left: 0,
    width: 430,
    height: 932,
    toJSON() {},
  });

  const requestFrame = (() => {
    counters.animationFrames += 1;
    return counters.animationFrames;
  }) as typeof requestAnimationFrame;
  globalThis.requestAnimationFrame = requestFrame;
  globalThis.cancelAnimationFrame = () => {};
  dom.window.requestAnimationFrame = requestFrame;
  dom.window.cancelAnimationFrame = () => {};

  class FakeIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "100% 0px";
    readonly thresholds = [0];
    constructor() { counters.intersectionObservers += 1; }
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
    unobserve() {}
  }
  class FakeResizeObserver implements ResizeObserver {
    constructor() { counters.resizeObservers += 1; }
    disconnect() {}
    observe() {}
    unobserve() {}
  }
  globalThis.IntersectionObserver = FakeIntersectionObserver;
  globalThis.ResizeObserver = FakeResizeObserver;

  const addEventListener = dom.window.addEventListener.bind(dom.window);
  dom.window.addEventListener = ((type: string, ...args: Parameters<Window["addEventListener"]> extends [string, ...infer Rest] ? Rest : never) => {
    if (type === "scroll") counters.scrollListeners += 1;
    return addEventListener(type, ...args);
  }) as typeof dom.window.addEventListener;

  return { counters, dom, container: dom.window.document.querySelector("#root")! };
}

test("fallback panel contract selects six final registry illustrations and chapter copy in order", () => {
  const panels = (storyAssets as unknown as {
    STORY_FALLBACK_PANELS?: readonly {
      assetId: keyof typeof storyAssets.STORY_ASSETS;
      chapterId: string;
      shotId: string;
    }[];
  }).STORY_FALLBACK_PANELS;

  assert.ok(panels, "storyAssets must export the fallback panel contract");
  assert.deepEqual(
    panels.map(({ assetId, chapterId, shotId }) => ({ assetId, chapterId, shotId })),
    [
      { assetId: "openingBackground", chapterId: "beginning", shotId: "island-opens" },
      { assetId: "officeBackground", chapterId: "coworkers", shotId: "paper-to-tower" },
      { assetId: "laughPanel", chapterId: "laughter", shotId: "joke-panel" },
      { assetId: "proposalTriptych", chapterId: "journey", shotId: "postcards-open" },
      { assetId: "venueExterior", chapterId: "destination", shotId: "venue-approach" },
      { assetId: "paperVeil", chapterId: "wedding", shotId: "invitation-rises" },
    ],
  );
  for (const panel of panels) {
    assert.equal(storyAssets.STORY_ASSETS[panel.assetId].kind, "image");
    assert.ok(storyTimeline.CHAPTERS.some(({ id }) => id === panel.chapterId));
    assert.ok(storyTimeline.SHOTS.some(({ id }) => id === panel.shotId));
  }
});

test("loading policy preloads only the opening background and initial character layer", () => {
  const getLoading = (storyAssets as unknown as {
    getStoryLayerLoading?: (layerId: string) => { preload: boolean; loading?: "lazy" };
  }).getStoryLayerLoading;

  assert.equal(typeof getLoading, "function");
  assert.deepEqual(getLoading!("bg-jeju"), { preload: true });
  assert.deepEqual(getLoading!("sidecar"), { preload: true });
  for (const layerId of ["opening-island", "bg-office", "panel-right", "proposal-triptych", "bg-venue", "bg-finale"]) {
    assert.deepEqual(getLoading!(layerId), { preload: false, loading: "lazy" });
  }
});

test("motion presentation keeps pending and reduced states non-sticky without a timeline", () => {
  const getPresentation = (storyTimeline as unknown as {
    getStoryMotionPresentation?: (mode: "pending" | "full" | "reduce") => {
      showStage: boolean;
      runTimeline: boolean;
    };
  }).getStoryMotionPresentation;

  assert.equal(typeof getPresentation, "function");
  assert.deepEqual(getPresentation!("pending"), { showStage: false, runTimeline: false });
  assert.deepEqual(getPresentation!("reduce"), { showStage: false, runTimeline: false });
  assert.deepEqual(getPresentation!("full"), { showStage: true, runTimeline: true });
});

test("progress announcements change at shot boundaries, not within animation frames", () => {
  const getAnnouncement = (storyTimeline as unknown as {
    getStoryProgressAnnouncement?: (progress: number) => { shotId: string; value: number; text: string };
  }).getStoryProgressAnnouncement;

  assert.equal(typeof getAnnouncement, "function");
  const withinFirstShot = [0, 0.01, 0.049].map((progress) => getAnnouncement!(progress));
  assert.deepEqual(withinFirstShot, [withinFirstShot[0], withinFirstShot[0], withinFirstShot[0]]);
  assert.deepEqual(getAnnouncement!(0.05), {
    shotId: "sidecar-arrives",
    value: 2,
    text: "2/16. 제주에서 시작된 우리의 여행",
  });
  assert.deepEqual(getAnnouncement!(1), {
    shotId: "invitation-rises",
    value: 16,
    text: "16/16. 우리 결혼합니다!!",
  });
});

test("announcement throttling returns work only when the active shot changes", () => {
  const nextAnnouncement = (storyTimeline as unknown as {
    nextStoryProgressAnnouncement?: (
      previousShotId: string,
      progress: number,
    ) => ReturnType<typeof storyTimeline.getStoryProgressAnnouncement> | null;
  }).nextStoryProgressAnnouncement;

  assert.equal(typeof nextAnnouncement, "function");
  assert.equal(nextAnnouncement!("island-opens", 0.01), null);
  assert.equal(nextAnnouncement!("island-opens", 0.049), null);
  assert.deepEqual(nextAnnouncement!("island-opens", 0.05), {
    shotId: "sidecar-arrives",
    value: 2,
    text: "2/16. 제주에서 시작된 우리의 여행",
  });
});

test("real animated image markup is decorative, hidden from AT, and unfocusable", async () => {
  installCssModuleHook();
  const { StoryLayer } = await import("./StoryLayer");
  const proposal = storyTimeline.LAYER_TRACKS.find(({ id }) => id === "proposal-triptych");
  assert.ok(proposal);

  const html = renderToStaticMarkup(createElement(StoryLayer, { track: proposal }));
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /alt=""/);
  assert.match(html, /tabindex="-1"/);
  assert.doesNotMatch(html, /href=|role="button"/);
});

test("fallback reuses the globally preloaded opening source without issuing duplicate preloads", async () => {
  installCssModuleHook();
  const { StoryFallback } = await import("./StoryFallback");

  const html = renderToStaticMarkup(createElement(StoryFallback));
  assert.equal((html.match(/<article/g) ?? []).length, 6);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /rel="preload"[^>]+as="image"/);
});

test("WeddingStory SSR starts with a complete non-blank fallback and a valid first skip target", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const html = renderToStaticMarkup(createElement("div", null,
    createElement(WeddingStory, { contentTargetId: "invitation-content" }),
    createElement("main", { id: "invitation-content" }, createElement("button", null, "청첩장 첫 컨트롤")),
  ));
  const css = readFileSync(new URL("./WeddingStory.module.css", import.meta.url), "utf8");
  const dom = new JSDOM(`<style>${css}</style>${html}`, { pretendToBeVisual: true });
  const { document } = dom.window;
  const story = document.querySelector("section[data-motion='pending']");
  assert.ok(story);

  const skip = story.firstElementChild;
  assert.equal(skip?.tagName, "A");
  assert.equal(skip?.getAttribute("href"), "#invitation-content");
  const target = document.querySelector("#invitation-content");
  assert.ok(target);
  assert.ok((skip!.compareDocumentPosition(target) & document.defaultView!.Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
  assert.equal(target.querySelector("button")?.textContent, "청첩장 첫 컨트롤");

  const stage = story.querySelector(".stageShell");
  const fallback = story.querySelector(".motionFallback");
  assert.equal(stage?.getAttribute("aria-hidden"), "true");
  assert.equal(dom.window.getComputedStyle(stage!).display, "none");
  assert.equal(dom.window.getComputedStyle(fallback!).display, "grid");
  assert.equal(fallback?.querySelectorAll(":scope > article").length, 6);
  assert.equal(story.querySelector("ol[aria-label='결혼 이야기 전체 대본']")?.children.length, 16);
  dom.window.close();
});

test("WeddingStory reduced-motion mount allocates no sticky timeline runtime", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const environment = installDomEnvironment(true);
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });

  const story = environment.container.querySelector("section");
  assert.equal(story?.getAttribute("data-motion"), "reduce");
  assert.equal(story?.querySelector(".stageShell")?.getAttribute("aria-hidden"), "true");
  assert.equal(story?.querySelectorAll(".motionFallback > article").length, 6);
  assert.deepEqual(environment.counters, {
    animationFrames: 0,
    intersectionObservers: 0,
    resizeObservers: 0,
    scrollListeners: 0,
  });

  await act(async () => root?.unmount());
  environment.dom.window.close();
});

test("WeddingStory allowed-motion mount activates containment and timeline observers", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const environment = installDomEnvironment(false);
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });

  const story = environment.container.querySelector("section");
  assert.equal(story?.getAttribute("data-motion"), "full");
  assert.equal(story?.querySelector(".stageShell")?.getAttribute("aria-hidden"), "false");
  assert.equal(environment.counters.intersectionObservers, 1);
  assert.equal(environment.counters.resizeObservers, 1);
  assert.equal(environment.counters.scrollListeners, 1);

  await act(async () => root?.unmount());
  environment.dom.window.close();
});
