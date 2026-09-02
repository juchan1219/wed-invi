import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import * as storyAssets from "./storyAssets";
import {
  STORY_COPY_CUES,
  STORY_SCENES,
  getStoryProgressAnnouncement,
  nextStoryProgressAnnouncement,
} from "./storyNarrative";
import * as storyTimeline from "./storyTimeline";

function installCssModuleHook() {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = (module) => {
    const classes = new Proxy({}, { get: (_target, property) => String(property) });
    module.exports = { __esModule: true, default: classes };
  };
}

function installDomEnvironment(
  reducedMotion: boolean,
  options: {
    navigationType?: "navigate" | "reload" | "back_forward";
    historyState?: Record<string, unknown>;
    initialScrollY?: number;
    storyHeight?: number;
  } = {},
) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
  });
  dom.window.history.replaceState(options.historyState ?? null, "", dom.window.location.href);
  Object.defineProperty(dom.window.performance, "getEntriesByType", {
    configurable: true,
    value: (type: string) => type === "navigation"
      ? [{ type: options.navigationType ?? "navigate" }]
      : [],
  });
  const counters = {
    animationFrames: 0,
    intersectionObservers: 0,
    resizeObservers: 0,
    scrollListeners: 0,
  };
  const animationFrameCallbacks = new Map<number, FrameRequestCallback>();
  let animationFrameId = 0;
  let scrollY = options.initialScrollY ?? 0;
  const scrollPositions: number[] = [];

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
    scrollY: { configurable: true, get: () => scrollY },
    innerHeight: { configurable: true, value: 932 },
  });
  Object.defineProperty(dom.window.history, "scrollRestoration", {
    configurable: true,
    writable: true,
    value: "auto",
  });
  dom.window.scrollTo = ((first: number | ScrollToOptions, second?: number) => {
    scrollY = typeof first === "number" ? (second ?? 0) : (first.top ?? scrollY);
    scrollPositions.push(scrollY);
  }) as typeof dom.window.scrollTo;
  Object.defineProperty(dom.window.HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => options.storyHeight ?? 932 * 18.5,
  });
  dom.window.HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const isStoryRoot = this.tagName === "SECTION" && this.hasAttribute("data-motion");
    const height = isStoryRoot ? (options.storyHeight ?? 932 * 18.5) : 932;
    const top = isStoryRoot ? -scrollY : 0;
    return {
      x: 0,
      y: top,
      top,
      right: 430,
      bottom: top + height,
      left: 0,
      width: 430,
      height,
      toJSON() {},
    };
  };

  const requestFrame = ((callback: FrameRequestCallback) => {
    counters.animationFrames += 1;
    animationFrameId += 1;
    animationFrameCallbacks.set(animationFrameId, callback);
    return animationFrameId;
  }) as typeof requestAnimationFrame;
  globalThis.requestAnimationFrame = requestFrame;
  globalThis.cancelAnimationFrame = (id) => { animationFrameCallbacks.delete(id); };
  dom.window.requestAnimationFrame = requestFrame;
  dom.window.cancelAnimationFrame = globalThis.cancelAnimationFrame;

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

  const runAnimationFrame = (time = 16) => {
    const next = animationFrameCallbacks.entries().next().value as [number, FrameRequestCallback] | undefined;
    if (!next) return false;
    animationFrameCallbacks.delete(next[0]);
    next[1](time);
    return true;
  };

  const setScrollY = (value: number) => { scrollY = value; };
  const currentScrollY = () => scrollY;

  return {
    counters,
    currentScrollY,
    dom,
    container: dom.window.document.querySelector("#root")!,
    runAnimationFrame,
    scrollPositions,
    setScrollY,
  };
}

test("fallback panel contract selects seven scene illustrations in order", () => {
  const panels = (storyAssets as unknown as {
    STORY_FALLBACK_PANELS?: readonly {
      assetId: keyof typeof storyAssets.STORY_ASSETS;
      sceneId: string;
    }[];
  }).STORY_FALLBACK_PANELS;

  assert.ok(panels, "storyAssets must export the fallback panel contract");
  assert.deepEqual(
    panels.map(({ assetId, sceneId }) => ({ assetId, sceneId })),
    [
      { assetId: "openingBackground", sceneId: "jeju-opening" },
      { assetId: "sidecarRoad", sceneId: "same-direction" },
      { assetId: "officeBackground", sceneId: "office-coworkers" },
      { assetId: "laughPanel", sceneId: "joke-and-laughter" },
      { assetId: "proposalTriptych", sceneId: "lifelong-partners" },
      { assetId: "venueExterior", sceneId: "seoul-venue" },
      { assetId: "paperVeil", sceneId: "wedding-finale" },
    ],
  );
  for (const panel of panels) {
    assert.equal(storyAssets.STORY_ASSETS[panel.assetId].kind, "image");
    assert.ok(STORY_SCENES.some(({ id }) => id === panel.sceneId));
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

test("progress announcements change at scene boundaries, not within animation frames", () => {
  const withinFirstScene = [0, 0.01, 0.079].map((progress) => getStoryProgressAnnouncement(progress));
  assert.deepEqual(withinFirstScene, [withinFirstScene[0], withinFirstScene[0], withinFirstScene[0]]);
  assert.deepEqual(getStoryProgressAnnouncement(0.08), {
    sceneId: "same-direction",
    value: 2,
    text: "2/7. 사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람",
  });
  assert.deepEqual(getStoryProgressAnnouncement(1), {
    sceneId: "wedding-finale",
    value: 7,
    text: "7/7. 예찬 ♥ 주은, 소중한 분들과 함께 우리 결혼합니다!!",
  });
});

test("announcement throttling returns work only when the active scene changes", () => {
  assert.equal(nextStoryProgressAnnouncement("jeju-opening", 0.01), null);
  assert.equal(nextStoryProgressAnnouncement("jeju-opening", 0.079), null);
  assert.deepEqual(nextStoryProgressAnnouncement("jeju-opening", 0.08), {
    sceneId: "same-direction",
    value: 2,
    text: "2/7. 사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람",
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

test("the visible opening fallback loads eagerly without issuing a duplicate preload", async () => {
  installCssModuleHook();
  const { StoryFallback } = await import("./StoryFallback");

  const html = renderToStaticMarkup(createElement(StoryFallback));
  const dom = new JSDOM(html);
  const images = [...dom.window.document.querySelectorAll("img")];

  assert.equal(images.length, 7);
  assert.equal(images[0]?.getAttribute("loading"), "eager");
  assert.deepEqual(images.slice(1).map((image) => image.getAttribute("loading")), Array(6).fill("lazy"));
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
  assert.equal(dom.window.getComputedStyle(story).overflowAnchor, "none");
  assert.equal(fallback?.querySelectorAll(":scope > article").length, 7);
  const transcript = story.querySelector("ol[aria-label='결혼 이야기 전체 대본']");
  assert.equal(transcript?.children.length, 7);
  assert.deepEqual(
    [...(transcript?.children ?? [])].map((item) => item.textContent),
    [
      "예찬과 주은의 결혼 이야기",
      "사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람",
      "처음엔 회사 동기였던 두 사람",
      "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
      "그렇게 평생 웃겨주고 웃어주는 짝꿍이 되기로 했습니다.",
      "2026.12.19 오후 12시 30분,\n잠실 아펠가모에서요!",
      "예찬 ♥ 주은, 소중한 분들과 함께 우리 결혼합니다!!",
    ],
  );
  const copyCards = [...story.querySelectorAll<HTMLElement>("[data-story-copy]")];
  assert.equal(copyCards.length, 7);
  assert.deepEqual(copyCards.map((card) => card.dataset.storyCopy), STORY_COPY_CUES.map(({ id }) => id));
  assert.deepEqual(
    copyCards.map((card) => card.textContent),
    [
      "예찬과 주은의 결혼 이야기",
      "처음엔 회사 동기였던 두 사람",
      "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
      "그렇게 평생 웃겨주고 웃어주는",
      "짝꿍이 되기로 했습니다.",
      "2026.12.19 오후 12시 30분,\n잠실 아펠가모에서요!",
      "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
    ],
  );
  assert.doesNotMatch(story.innerHTML, /짝꿍이 되기도 했습니다\./);
  assert.equal(story.querySelector("[role='progressbar']")?.getAttribute("aria-valuemax"), "7");
  dom.window.close();
});

test("story stage stylesheet activates every scene navigation step without hiding the finale cue", () => {
  const css = readFileSync(new URL("./WeddingStory.module.css", import.meta.url), "utf8");
  const dom = new JSDOM(`<style>${css}</style>`);
  const selectors = Array.from(dom.window.document.styleSheets[0]!.cssRules)
    .map((rule): string => "selectorText" in rule && typeof rule.selectorText === "string" ? rule.selectorText : "");

  for (const sceneId of [
    "jeju-opening",
    "same-direction",
    "office-coworkers",
    "joke-and-laughter",
    "lifelong-partners",
    "seoul-venue",
    "wedding-finale",
  ]) {
    assert.ok(
      selectors.some((selector) => selector.includes(`[data-chapter="${sceneId}"] [data-chapter-id="${sceneId}"] i::after`)),
      `${sceneId} has no active navigation indicator`,
    );
  }

  assert.ok(!selectors.some((selector) => /data-chapter="(?:beginning|coworkers|laughter|journey|destination|wedding)"/.test(selector)));
  assert.ok(!selectors.some((selector) => selector.includes("data-shot=")), "the finale copy must remain visible");
  dom.window.close();
});

test("WeddingStory reduced-motion mount allocates no sticky timeline runtime", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const environment = installDomEnvironment(true);
  environment.dom.window.document.documentElement.style.overflowAnchor = "auto";
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });

  const story = environment.container.querySelector("section");
  assert.equal(story?.getAttribute("data-motion"), "reduce");
  assert.equal(story?.querySelector(".stageShell")?.getAttribute("aria-hidden"), "true");
  assert.equal(story?.querySelectorAll(".motionFallback > article").length, 7);
  assert.deepEqual(environment.counters, {
    animationFrames: 0,
    intersectionObservers: 0,
    resizeObservers: 0,
    scrollListeners: 0,
  });

  await act(async () => root?.unmount());
  assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "auto");
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
  assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "none");
  assert.equal(environment.counters.intersectionObservers, 1);
  assert.equal(environment.counters.resizeObservers, 1);
  assert.equal(environment.counters.scrollListeners, 1);

  await act(async () => { environment.runAnimationFrame(); });
  assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "none");
  await act(async () => { environment.runAnimationFrame(); });
  assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});

test("reload restores saved story progress only after the full-height layout mounts", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const storyHeight = 932 * 18.5;
  const travel = storyHeight - 932;

  for (const [progress, browserRestoredY, lateDriftY] of [
    [0.42, 4093, 7583],
    [0.82, 7332.5, 3048.5],
  ] as const) {
    const environment = installDomEnvironment(false, {
      navigationType: "reload",
      historyState: {
        __NA: true,
        __wedInviStory: { version: 1, path: "/", progress },
      },
      initialScrollY: 0,
      storyHeight,
    });
    let root: Root | undefined;

    await act(async () => {
      root = createRoot(environment.container);
      root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
    });

    assert.equal(environment.container.querySelector("section")?.getAttribute("data-motion"), "full");
    assert.equal(environment.dom.window.history.scrollRestoration, "manual");
    assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "none");
    environment.setScrollY(browserRestoredY);
    await act(async () => {
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("pageshow"));
      for (let frame = 0; frame < 8; frame += 1) environment.runAnimationFrame(frame * 16);
    });
    assert.ok(Math.abs(environment.currentScrollY() - travel * progress) < 1e-9);
    assert.equal(environment.dom.window.history.state.__wedInviStory.progress, progress);
    assert.equal(
      environment.dom.window.document.documentElement.style.overflowAnchor,
      "none",
      "reload ownership keeps CSS scroll anchoring suspended through late drift",
    );

    environment.setScrollY(lateDriftY);
    await act(async () => {
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
      for (let frame = 0; frame < 4; frame += 1) environment.runAnimationFrame(160 + frame * 16);
    });
    assert.ok(Math.abs(environment.currentScrollY() - travel * progress) < 1e-9);
    assert.equal(environment.dom.window.history.state.__wedInviStory.progress, progress);

    const restoreCount = environment.scrollPositions.length;
    await act(async () => {
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("pageshow"));
      for (let frame = 0; frame < 4; frame += 1) environment.runAnimationFrame(160 + frame * 16);
    });
    assert.equal(environment.scrollPositions.length, restoreCount, "reload progress restores only once");

    await act(async () => {
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("pointerdown"));
    });
    assert.equal(environment.dom.window.history.scrollRestoration, "auto");
    assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "");
    environment.setScrollY(travel * 0.5);
    await act(async () => {
      environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
      for (let frame = 0; frame < 4; frame += 1) environment.runAnimationFrame(240 + frame * 16);
    });
    assert.equal(environment.currentScrollY(), travel * 0.5);
    assert.equal(environment.dom.window.history.state.__wedInviStory.progress, 0.5);

    await act(async () => root?.unmount());
    assert.equal(environment.dom.window.history.scrollRestoration, "auto");
    assert.equal(environment.dom.window.document.documentElement.style.overflowAnchor, "");
    environment.dom.window.close();
  }

  for (const ignored of [
    { navigationType: "navigate" as const, path: "/" },
    { navigationType: "reload" as const, path: "/another-route" },
  ]) {
    const environment = installDomEnvironment(false, {
      navigationType: ignored.navigationType,
      historyState: { __wedInviStory: { version: 1, path: ignored.path, progress: 0.82 } },
      storyHeight,
    });
    let root: Root | undefined;
    await act(async () => {
      root = createRoot(environment.container);
      root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
    });
    assert.equal(environment.dom.window.history.scrollRestoration, "auto");
    assert.deepEqual(environment.scrollPositions, []);
    await act(async () => root?.unmount());
    environment.dom.window.close();
  }

  const reduced = installDomEnvironment(true, {
    navigationType: "reload",
    historyState: { __wedInviStory: { version: 1, path: "/", progress: 0.82 } },
    storyHeight,
  });
  let reducedRoot: Root | undefined;
  await act(async () => {
    reducedRoot = createRoot(reduced.container);
    reducedRoot.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });
  assert.equal(reduced.dom.window.history.scrollRestoration, "auto");
  assert.deepEqual(reduced.scrollPositions, []);
  await act(async () => reducedRoot?.unmount());
  reduced.dom.window.close();
});

test("back-forward restores saved story progress through layout clamping and late browser drift", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const storyHeight = 932 * 18.5;
  const travel = storyHeight - 932;
  const savedProgress = 0.82;
  const environment = installDomEnvironment(false, {
    navigationType: "back_forward",
    historyState: {
      __NA: true,
      __wedInviStory: { version: 1, path: "/", progress: savedProgress },
    },
    initialScrollY: 0,
    storyHeight,
  });
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });

  assert.equal(environment.dom.window.history.scrollRestoration, "manual");
  environment.setScrollY(8367.5);
  await act(async () => {
    environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
    environment.dom.window.dispatchEvent(new environment.dom.window.Event("pageshow"));
    for (let frame = 0; frame < 8; frame += 1) environment.runAnimationFrame(frame * 16);
  });
  assert.equal(environment.currentScrollY(), travel * savedProgress);
  assert.equal(environment.dom.window.history.state.__wedInviStory.progress, savedProgress);

  environment.setScrollY(3048.5);
  await act(async () => {
    environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
    for (let frame = 0; frame < 4; frame += 1) environment.runAnimationFrame(160 + frame * 16);
  });
  assert.equal(environment.currentScrollY(), travel * savedProgress);
  assert.equal(environment.dom.window.history.state.__wedInviStory.progress, savedProgress);

  await act(async () => root?.unmount());
  assert.equal(environment.dom.window.history.scrollRestoration, "auto");
  environment.dom.window.close();
});

test("normal story scroll merges and clears namespaced progress in the current history entry", async () => {
  installCssModuleHook();
  const { WeddingStory } = await import("./WeddingStory");
  const storyHeight = 932 * 18.5;
  const travel = storyHeight - 932;
  const environment = installDomEnvironment(false, {
    navigationType: "navigate",
    historyState: { __NA: true, nextInternal: "preserved" },
    storyHeight,
  });
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(WeddingStory, { contentTargetId: "invitation-content" }));
  });

  environment.setScrollY(travel * 0.82);
  await act(async () => { environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll")); });
  assert.deepEqual(environment.dom.window.history.state, {
    __NA: true,
    nextInternal: "preserved",
    __wedInviStory: { version: 1, path: "/", progress: 0.82 },
  });

  environment.setScrollY(storyHeight + 20);
  await act(async () => { environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll")); });
  assert.deepEqual(environment.dom.window.history.state, { __NA: true, nextInternal: "preserved" });

  await act(async () => root?.unmount());
  environment.setScrollY(travel * 0.5);
  environment.dom.window.dispatchEvent(new environment.dom.window.Event("scroll"));
  assert.deepEqual(environment.dom.window.history.state, { __NA: true, nextInternal: "preserved" });
  environment.dom.window.close();
});
