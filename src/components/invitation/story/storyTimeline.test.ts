import assert from "node:assert/strict";
import test from "node:test";

import {
  STORY_ASSETS,
  STORY_CANVAS,
  STORY_LAYER_DEFINITIONS,
  getStoryImageCrop,
  getStorySpriteCrop,
} from "./storyAssets";
import * as storyAssets from "./storyAssets";
import * as storyTimeline from "./storyTimeline";
import {
  CHAPTERS,
  FULL_CLIP,
  LAYER_TRACKS,
  SHOTS,
  STORY_TRANSITIONS,
  assertStoryTimeline,
  sampleLayerState,
  type LayerTrack,
  type LayerState,
} from "./storyTimeline";

function requiredTrack(id: string) {
  const track = LAYER_TRACKS.find((candidate) => candidate.id === id);
  assert.ok(track, `missing timeline track: ${id}`);
  return track;
}

function spatialState(state: LayerState) {
  const { opacity: _opacity, ...spatial } = state;
  return spatial;
}

test("the contained story canvas keeps the 430 by 932 logical layer contract", () => {
  assert.deepEqual(STORY_CANVAS, { width: 430, height: 932 });

  assert.equal(typeof storyTimeline.isStoryLayerRenderable, "function");
  assert.deepEqual(
    LAYER_TRACKS.map(({ id }) => id),
    STORY_LAYER_DEFINITIONS.map(({ id }) => id),
  );
  assert.ok(
    LAYER_TRACKS.every(({ id }) => storyTimeline.isStoryLayerRenderable(id)),
    "every timeline layer needs a DOM renderer inside the fixed canvas",
  );
});

test("every raster layer resolves to a registered asset", () => {
  for (const layer of STORY_LAYER_DEFINITIONS) {
    if (layer.assetId) assert.ok(STORY_ASSETS[layer.assetId], layer.id);
    for (const part of layer.parts ?? []) assert.ok(STORY_ASSETS[part.assetId], layer.id);
  }
});

test("every timeline layer has exactly one non-null renderer definition", () => {
  assert.deepEqual(
    STORY_LAYER_DEFINITIONS.map(({ id }) => id),
    LAYER_TRACKS.map(({ id }) => id),
  );
  assert.equal(new Set(STORY_LAYER_DEFINITIONS.map(({ id }) => id)).size, LAYER_TRACKS.length);

  for (const layer of STORY_LAYER_DEFINITIONS) {
    assert.equal(
      [layer.assetId, layer.text, layer.parts].filter(Boolean).length,
      1,
      `${layer.id} needs one renderer`,
    );
    assert.ok(storyTimeline.isStoryLayerRenderable(layer.id), layer.id);
  }
});

test("sprite crops separate intrinsic pixels from the 256px logical display cell", () => {
  assert.deepEqual(getStorySpriteCrop(STORY_ASSETS.casualJueunTalking), {
    intrinsicCellWidth: 512,
    intrinsicCellHeight: 512,
    viewportWidth: 256,
    viewportHeight: 256,
    atlasWidth: 1024,
    atlasHeight: 512,
    translateX: -512,
    translateY: -256,
  });
});

test("couple layers compose both partners from unique registered sprite assets", () => {
  const casual = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "casual-couple");
  const wedding = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "wedding-couple");

  assert.deepEqual(casual?.parts?.map(({ assetId }) => assetId), [
    "casualYechanNeutral",
    "casualJueunNeutral",
  ]);
  assert.deepEqual(wedding?.parts?.map(({ assetId }) => assetId), [
    "weddingYechanWalking",
    "weddingJueunWalking",
  ]);

  for (const layer of [casual, wedding]) {
    assert.ok(layer?.parts?.length === 2);
    assert.equal(new Set(layer.parts.map(({ assetId }) => assetId)).size, 2);
    assert.ok(layer.parts.every(({ assetId }) => STORY_ASSETS[assetId].kind === "sprite"));
  }
});

test("the opening sidecar composes the vehicle with both casual riders above it", () => {
  const sidecar = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "sidecar");

  assert.deepEqual(sidecar?.parts?.map(({ assetId }) => assetId), [
    "sidecar",
    "casualYechanDriving",
    "casualJueunSidecarPassenger",
  ]);
});

test("the laugh panel is revealed only by its polygon-clipped panel layer", () => {
  const laughBackground = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "bg-laugh");
  const rightPanel = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "panel-right");

  assert.equal(laughBackground?.assetId, "officeBackground");
  assert.equal(rightPanel?.assetId, "laughPanel");
});

test("wheel layers crop two distinct bounded sidecar regions instead of shrinking the vehicle", () => {
  const wheelDefinitions = ["wheel-front", "wheel-back"].map((id) => {
    const definition = STORY_LAYER_DEFINITIONS.find((layer) => layer.id === id);
    assert.equal(definition?.assetId, "sidecar");
    assert.ok(definition.crop);
    return definition;
  });
  const crops = wheelDefinitions.map(({ crop }) => crop!);

  assert.notDeepEqual(crops[0], crops[1]);
  for (const crop of crops) {
    assert.ok(crop.x >= 0 && crop.y >= 0);
    assert.ok(crop.x + crop.width <= STORY_ASSETS.sidecar.width);
    assert.ok(crop.y + crop.height <= STORY_ASSETS.sidecar.height);
  }
  assert.deepEqual(getStoryImageCrop(STORY_ASSETS.sidecar, crops[0]), {
    viewportWidth: 56,
    viewportHeight: 56,
    sourceWidth: 256,
    sourceHeight: 192,
    translateX: -44,
    translateY: -98,
  });
  assert.deepEqual(getStoryImageCrop(STORY_ASSETS.sidecar, crops[1]), {
    viewportWidth: 56,
    viewportHeight: 56,
    sourceWidth: 256,
    sourceHeight: 192,
    translateX: -168,
    translateY: -98,
  });
});

test("title layer inline distances are fixed logical pixels", () => {
  assert.equal(typeof storyAssets.titleLetterDropStyle, "function");
  assert.deepEqual(storyAssets.titleLetterDropStyle(0), "633.76px");
  assert.deepEqual(storyAssets.titleLetterDropStyle(4), "1342.08px");
  assert.doesNotMatch(
    storyAssets.titleLetterDropStyle(2),
    /(vw|vh)/,
    "animated inline styles must not depend on the outer viewport",
  );
});

test("canonical mobile canvas keeps the couple, title, and safe-area layout", () => {
  assert.deepEqual(storyAssets.STORY_CANVAS_LAYOUT, {
    casualCouple: { bottom: "1%", left: "27%", width: 249.4 },
    chapterNavMinimumBottom: 17.6,
    titleGlyphSize: 68.8,
  });
});

test("layer state uses stable spatial defaults when a track omits overrides", () => {
  const trackWithoutOverrides = {
    id: "defaults",
    kind: "prop",
  } as LayerTrack;

  assert.deepEqual(sampleLayerState(trackWithoutOverrides, 0.5), {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    opacity: 1,
    originX: 50,
    originY: 50,
    clip: FULL_CLIP,
  });
});

test("layer state interpolates scale and transform origin axes independently", () => {
  const track = {
    id: "independent-spatial-axes",
    kind: "prop",
    scaleX: [{ at: 0, value: 1 }, { at: 1, value: 2 }],
    scaleY: [{ at: 0, value: 1 }, { at: 1, value: 0.5 }],
    originX: [{ at: 0, value: 0 }, { at: 1, value: 40 }],
    originY: [{ at: 0, value: 100 }, { at: 1, value: 60 }],
  } as LayerTrack;

  assert.deepEqual(sampleLayerState(track, 0.5), {
    x: 0,
    y: 0,
    scaleX: 1.5,
    scaleY: 0.75,
    rotate: 0,
    opacity: 1,
    originX: 20,
    originY: 80,
    clip: FULL_CLIP,
  });
});

test("the rebuild has six continuous chapters and sixteen ordered shots", () => {
  assert.equal(CHAPTERS.length, 6);
  assert.equal(CHAPTERS[0]?.start, 0);
  assert.equal(CHAPTERS.at(-1)?.end, 1);
  for (let index = 1; index < CHAPTERS.length; index += 1) {
    assert.equal(CHAPTERS[index - 1]?.end, CHAPTERS[index]?.start);
  }

  assert.equal(SHOTS.length, 16);
  assert.deepEqual([...new Set(SHOTS.map(({ id }) => id))], SHOTS.map(({ id }) => id));
  for (let index = 1; index < SHOTS.length; index += 1) {
    assert.ok(SHOTS[index - 1]!.end <= SHOTS[index]!.start);
  }
});

test("copy intervals never overlap and every shot owns visible story layers", () => {
  for (let index = 0; index < SHOTS.length; index += 1) {
    const shot = SHOTS[index]!;
    assert.ok(shot.copyStart >= shot.start && shot.copyEnd <= shot.end);
    assert.ok(shot.layerIds.length >= 2, `${shot.id} has too few layers`);
    if (index > 0) assert.ok(SHOTS[index - 1]!.copyEnd <= shot.copyStart);
  }
});

test("the timeline contains independently animated depth, character, and transition layers", () => {
  assert.ok(LAYER_TRACKS.length >= 24);
  assert.ok(
    LAYER_TRACKS.reduce((sum, track) => sum + (track.x?.length ?? 0), 0) >= 100,
    "the timeline needs at least 100 intentional keyframes",
  );
  assert.deepEqual(
    [...new Set(LAYER_TRACKS.map(({ id }) => id))],
    LAYER_TRACKS.map(({ id }) => id),
  );
  assert.ok(LAYER_TRACKS.every((track) => track.scaleX && track.scaleY));
});

test("an opaque background covers every sampled point of the scroll", () => {
  const backgrounds = LAYER_TRACKS.filter(({ kind }) => kind === "background");
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const opacity = backgrounds.reduce(
      (sum, track) => sum + sampleLayerState(track, progress).opacity,
      0,
    );
    assert.ok(opacity >= 0.99, `background gap at ${progress}`);
  }
});

test("all five non-crossfade transition techniques are represented", () => {
  const implemented = LAYER_TRACKS.flatMap(({ techniques = [] }) => techniques);
  assert.deepEqual(new Set(STORY_TRANSITIONS), new Set([
    "paperTear",
    "polygonReveal",
    "cameraZoom",
    "panelExpansion",
    "matchCut",
  ]));
  assert.deepEqual(new Set(implemented), new Set(STORY_TRANSITIONS));
});

test("polygon reveal is sampled from a real production layer", () => {
  const reveal = LAYER_TRACKS.find(({ id }) => id === "tower-card");
  assert.ok(reveal?.clip);
  assert.notDeepEqual(
    sampleLayerState(reveal, 0.165).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
  assert.deepEqual(
    sampleLayerState(reveal, 0.21).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
});

test("shots 1 through 9 keep spatial incoming and outgoing layers overlapped for 1.5 percent", () => {
  const boundaries = [
    { at: 0.05, outgoing: "bg-jeju", incoming: "opening-field", connector: "opening-field" },
    { at: 0.1, outgoing: "opening-field", incoming: "opening-clouds", connector: "sidecar" },
    { at: 0.15, outgoing: "bg-jeju", incoming: "paper-tear", connector: "paper-tear" },
    { at: 0.21, outgoing: "tower-card", incoming: "bg-office", connector: "tower-card" },
    { at: 0.27, outgoing: "bg-office", incoming: "office-props", connector: "office-props" },
    { at: 0.33, outgoing: "office-props", incoming: "bg-laugh", connector: "panel-left" },
    { at: 0.39, outgoing: "panel-left", incoming: "panel-right", connector: "panel-right" },
    { at: 0.455, outgoing: "panel-right", incoming: "laugh-burst", connector: "panel-right" },
    { at: 0.52, outgoing: "laugh-burst", incoming: "proposal-triptych", connector: "laugh-burst" },
  ] as const;
  const overlapOffsets = [-0.0075, -0.005, -0.0025, 0, 0.0025, 0.005, 0.0075] as const;

  for (const boundary of boundaries) {
    const outgoing = requiredTrack(boundary.outgoing);
    const incoming = requiredTrack(boundary.incoming);
    for (const offset of overlapOffsets) {
      const progress = boundary.at + offset;
      assert.ok(
        sampleLayerState(outgoing, progress).opacity > 0.25,
        `${boundary.outgoing} must remain visible at ${progress}`,
      );
      assert.ok(
        sampleLayerState(incoming, progress).opacity > 0.25,
        `${boundary.incoming} must already be visible at ${progress}`,
      );
    }

    const connector = requiredTrack(boundary.connector);
    assert.notDeepEqual(
      spatialState(sampleLayerState(connector, boundary.at - 0.0075)),
      spatialState(sampleLayerState(connector, boundary.at + 0.0075)),
      `${boundary.connector} must connect the boundary spatially`,
    );
  }
});

test("the paper, tower zoom, and laugh merge use their required transition geometry", () => {
  const paper = requiredTrack("paper-tear");
  const tower = requiredTrack("tower-card");
  const rightPanel = requiredTrack("panel-right");

  assert.ok(paper.techniques?.includes("paperTear"));
  assert.equal(sampleLayerState(paper, 0.135).scaleX, 0.15);
  assert.equal(sampleLayerState(paper, 0.17).scaleX, 2.4);
  assert.deepEqual(
    [sampleLayerState(paper, 0.15).originX, sampleLayerState(paper, 0.15).originY],
    [84, 78],
  );

  assert.ok(tower.techniques?.includes("cameraZoom"));
  assert.ok(sampleLayerState(tower, 0.245).scaleX > 2);
  assert.deepEqual(
    [sampleLayerState(tower, 0.21).originX, sampleLayerState(tower, 0.21).originY],
    [51, 43],
  );

  assert.ok(rightPanel.techniques?.includes("polygonReveal"));
  assert.notDeepEqual(sampleLayerState(rightPanel, 0.455).clip, FULL_CLIP);
  assert.deepEqual(sampleLayerState(rightPanel, 0.47).clip, FULL_CLIP);
});

test("shots 1 through 9 land on the approved spatial anchors", () => {
  assert.deepEqual(
    [sampleLayerState(requiredTrack("bg-jeju"), 0).x, sampleLayerState(requiredTrack("bg-jeju"), 0.15).x],
    [0, -36],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("sidecar"), 0.0425).x, sampleLayerState(requiredTrack("sidecar"), 0.1).x],
    [520, 70],
  );

  const towerEntry = sampleLayerState(requiredTrack("tower-card"), 0.17);
  const towerSettled = sampleLayerState(requiredTrack("tower-card"), 0.195);
  assert.deepEqual([towerEntry.scaleX, towerEntry.scaleY, towerEntry.rotate], [0.72, 0.58, -5]);
  assert.deepEqual([towerSettled.scaleX, towerSettled.scaleY, towerSettled.rotate], [1, 1, 0]);
  assert.deepEqual(
    [sampleLayerState(requiredTrack("bg-office"), 0.21).scaleX, sampleLayerState(requiredTrack("bg-office"), 0.255).scaleX],
    [1.35, 1],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("office-props"), 0.255).y, sampleLayerState(requiredTrack("office-props"), 0.3375).y],
    [280, 665],
  );

  assert.deepEqual(
    [sampleLayerState(requiredTrack("panel-left"), 0.315).x, sampleLayerState(requiredTrack("panel-left"), 0.37).x],
    [-430, 0],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("panel-left"), 0.49).scaleX, sampleLayerState(requiredTrack("panel-right"), 0.49).scaleX],
    [0.5, 0.5],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("laugh-burst"), 0.43).scaleX, sampleLayerState(requiredTrack("laugh-burst"), 0.52).scaleX],
    [0.2, 1.6],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("laugh-burst"), 0.52).x, sampleLayerState(requiredTrack("laugh-burst"), 0.52).rotate],
    [0, 0],
    "the centered final burst keeps its black rays on the triptych divider axes",
  );
});

test("boundary samples, reverse calls, and large direct jumps are deterministic", () => {
  const samples = [
    ...SHOTS.slice(1, 10).flatMap(({ start }) => [start - 0.002, start, start + 0.002]),
    0.02,
    0.58,
  ];
  const trackIds = [
    "bg-jeju",
    "sidecar",
    "paper-tear",
    "tower-card",
    "office-props",
    "panel-left",
    "panel-right",
    "laugh-burst",
    "proposal-triptych",
  ];
  const capture = (progresses: readonly number[]) => new Map(
    progresses.map((progress) => [
      progress,
      trackIds.map((id) => sampleLayerState(requiredTrack(id), progress)),
    ]),
  );

  const forward = capture(samples);
  const reverse = capture([...samples].reverse());
  for (const progress of samples) assert.deepEqual(reverse.get(progress), forward.get(progress));

  const lowBeforeJump = capture([0.02]).get(0.02);
  capture([0.58, 0.02]);
  assert.deepEqual(capture([0.02]).get(0.02), lowBeforeJump);
  const highBeforeJump = capture([0.58]).get(0.58);
  capture([0.02, 0.58]);
  assert.deepEqual(capture([0.58]).get(0.58), highBeforeJump);
});

test("the complete timeline passes its runtime invariant audit", () => {
  assert.doesNotThrow(() => assertStoryTimeline());
});
