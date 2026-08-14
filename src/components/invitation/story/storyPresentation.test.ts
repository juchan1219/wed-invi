import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as storyAssets from "./storyAssets";
import * as storyTimeline from "./storyTimeline";

function installCssModuleHook() {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = (module) => {
    const classes = new Proxy({}, { get: (_target, property) => String(property) });
    module.exports = { __esModule: true, default: classes };
  };
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
      showFallback: boolean;
      runTimeline: boolean;
    };
  }).getStoryMotionPresentation;

  assert.equal(typeof getPresentation, "function");
  assert.deepEqual(getPresentation!("pending"), { showStage: false, showFallback: true, runTimeline: false });
  assert.deepEqual(getPresentation!("reduce"), { showStage: false, showFallback: true, runTimeline: false });
  assert.deepEqual(getPresentation!("full"), { showStage: true, showFallback: false, runTimeline: true });
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
