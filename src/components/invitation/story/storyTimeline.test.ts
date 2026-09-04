import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  STORY_ASSETS,
  STORY_CANVAS,
  STORY_LAYER_DEFINITIONS,
  getStoryImageCrop,
  getStorySpriteCrop,
} from "./storyAssets";
import * as storyAssets from "./storyAssets";
import * as storyTimeline from "./storyTimeline";
import { CHAPTERS, STORY_SCENES } from "./storyNarrative";
import {
  FULL_CLIP,
  LAYER_TRACKS,
  STORY_TRANSITIONS,
  assertStoryTimeline,
  retimeLegacyStoryProgress,
  sampleLayerState,
  type LayerTrack,
  type LayerState,
} from "./storyTimeline";

function requiredTrack(id: string) {
  const track = LAYER_TRACKS.find((candidate) => candidate.id === id);
  assert.ok(track, `missing timeline track: ${id}`);
  return track;
}

const legacy = retimeLegacyStoryProgress;

function spatialState(state: LayerState) {
  const { opacity: _opacity, ...spatial } = state;
  return spatial;
}

type StoryCompositeContract = {
  stack: number;
  coverage: "opaque-full" | "clipped" | "transparent";
};

function requiredComposite(id: string) {
  const definition = STORY_LAYER_DEFINITIONS.find((candidate) => candidate.id === id) as
    | (typeof STORY_LAYER_DEFINITIONS[number] & { composite?: StoryCompositeContract })
    | undefined;
  assert.ok(definition, `missing layer definition: ${id}`);
  assert.ok(definition.composite, `missing compositing contract: ${id}`);
  return { definition, composite: definition.composite };
}

const DEFAULT_RENDERER_STACK = {
  background: 0,
  scenery: 3,
  character: 8,
  prop: 10,
  transition: 20,
  type: 24,
} as const;

const CSS_STACK_OVERRIDES = new Map<string, number>([
  ["title-shards", 28],
]);

function rendererStack(id: string) {
  const definition = STORY_LAYER_DEFINITIONS.find((candidate) => candidate.id === id);
  assert.ok(definition, `missing layer definition: ${id}`);
  return definition.composite?.stack
    ?? CSS_STACK_OVERRIDES.get(id)
    ?? DEFAULT_RENDERER_STACK[requiredTrack(id).kind];
}

function compositedVisibleOpacity(id: string, progress: number) {
  const targetStack = rendererStack(id);
  return STORY_LAYER_DEFINITIONS.reduce((visibleOpacity, definition) => {
    if (definition.id === id || definition.composite?.coverage !== "opaque-full") {
      return visibleOpacity;
    }
    if (rendererStack(definition.id) <= targetStack) return visibleOpacity;
    return visibleOpacity * (1 - sampleLayerState(requiredTrack(definition.id), progress).opacity);
  }, sampleLayerState(requiredTrack(id), progress).opacity);
}

type StoryLayerNode = {
  track: LayerTrack;
  children: readonly StoryLayerNode[];
};

function transformPointThroughLayer(
  point: { x: number; y: number },
  box: { left: number; top: number; width: number; height: number },
  state: LayerState,
) {
  const origin = {
    x: box.width * state.originX / 100,
    y: box.height * state.originY / 100,
  };
  const scaled = {
    x: (point.x - origin.x) * state.scaleX,
    y: (point.y - origin.y) * state.scaleY,
  };
  const radians = state.rotate * Math.PI / 180;

  return {
    x: box.left + origin.x + state.x + scaled.x * Math.cos(radians) - scaled.y * Math.sin(radians),
    y: box.top + origin.y + state.y + scaled.x * Math.sin(radians) + scaled.y * Math.cos(radians),
  };
}

type Bounds = { left: number; top: number; right: number; bottom: number };

function boundsFromPoints(points: readonly { x: number; y: number }[]): Bounds {
  return {
    left: Math.min(...points.map(({ x }) => x)),
    top: Math.min(...points.map(({ y }) => y)),
    right: Math.max(...points.map(({ x }) => x)),
    bottom: Math.max(...points.map(({ y }) => y)),
  };
}

function boundsCorners(bounds: Bounds) {
  return [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom },
  ] as const;
}

function transformBoundsThroughLayer(bounds: Bounds, box: { left: number; top: number; width: number; height: number }, state: LayerState) {
  return boundsFromPoints(boundsCorners(bounds).map((point) => transformPointThroughLayer(point, box, state)));
}

function transformBoundsWithinBox(bounds: Bounds, box: Bounds, state: LayerState) {
  const origin = {
    x: box.left + (box.right - box.left) * state.originX / 100,
    y: box.top + (box.bottom - box.top) * state.originY / 100,
  };
  const radians = state.rotate * Math.PI / 180;
  return boundsFromPoints(boundsCorners(bounds).map((point) => {
    const x = (point.x - origin.x) * state.scaleX;
    const y = (point.y - origin.y) * state.scaleY;
    return {
      x: origin.x + state.x + x * Math.cos(radians) - y * Math.sin(radians),
      y: origin.y + state.y + x * Math.sin(radians) + y * Math.cos(radians),
    };
  }));
}

async function opaqueBounds(
  src: string,
  region?: { left: number; top: number; width: number; height: number },
) {
  const { data, info } = await sharp(join(process.cwd(), "public", src.slice(1)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const left = region?.left ?? 0;
  const top = region?.top ?? 0;
  const width = region?.width ?? info.width;
  const height = region?.height ?? info.height;
  let minX = left;
  let minY = top;
  let maxX = -1;
  let maxY = -1;

  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 1);
      maxY = Math.max(maxY, y + 1);
    }
  }
  assert.ok(maxX >= minX && maxY >= minY, `${src} has no opaque pixels in the rendered region`);
  return { left: minX, top: minY, right: maxX, bottom: maxY };
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

test("scene 2 keeps the two-rider sidecar visible above the opaque road at its midpoint", () => {
  const sidecar = requiredComposite("sidecar");
  const road = requiredComposite("opening-field");
  const sceneTwoMidpoint = 0.13;

  assert.equal(road.composite.coverage, "opaque-full");
  assert.ok(
    sidecar.composite.stack > road.composite.stack,
    "the renderer must paint the sidecar composition above the opaque road",
  );
  assert.equal(compositedVisibleOpacity("sidecar", sceneTwoMidpoint), 1);
});

test("scene 2 keeps the complete sidecar composition inside the logical canvas at its midpoint", async () => {
  const progress = 0.13;
  const sidecar = requiredTrack("sidecar");
  const sidecarDefinition = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "sidecar");
  const sidecarBox = {
    left: -STORY_CANVAS.width * 0.1,
    top: STORY_CANVAS.height * 0.37,
    width: STORY_CANVAS.width * 1.25,
    height: STORY_CANVAS.height * 0.58,
  };
  const sidecarState = sampleLayerState(sidecar, progress);
  const vehicleAsset = STORY_ASSETS.sidecar;
  const vehicleAlpha = await opaqueBounds(vehicleAsset.src);
  const vehicleScale = Math.min(sidecarBox.width / vehicleAsset.width, sidecarBox.height / vehicleAsset.height);
  const vehicleLocalBounds = {
    left: (sidecarBox.width - vehicleAsset.width * vehicleScale) / 2 + vehicleAlpha.left * vehicleScale,
    top: (sidecarBox.height - vehicleAsset.height * vehicleScale) / 2 + vehicleAlpha.top * vehicleScale,
    right: (sidecarBox.width - vehicleAsset.width * vehicleScale) / 2 + vehicleAlpha.right * vehicleScale,
    bottom: (sidecarBox.height - vehicleAsset.height * vehicleScale) / 2 + vehicleAlpha.bottom * vehicleScale,
  };

  const riderBounds = await Promise.all(([
    "casualYechanDriving",
    "casualJueunSidecarPassenger",
  ] as const).map(async (assetId): Promise<readonly [string, Bounds]> => {
    const asset = STORY_ASSETS[assetId];
    assert.equal(asset.kind, "sprite");
    const part = sidecarDefinition?.parts?.find((candidate) => candidate.assetId === assetId);
    assert.ok(part, `${assetId} is missing from the sidecar composition`);
    const crop = getStorySpriteCrop(asset);
    const cellLeft = asset.cell.column * crop.intrinsicCellWidth;
    const cellTop = asset.cell.row * crop.intrinsicCellHeight;
    const alpha = await opaqueBounds(asset.src, {
      left: cellLeft,
      top: cellTop,
      width: crop.intrinsicCellWidth,
      height: crop.intrinsicCellHeight,
    });
    const scale = crop.viewportWidth / crop.intrinsicCellWidth;
    return [assetId, {
      left: sidecarBox.width / 2 + part.x - crop.viewportWidth / 2 + (alpha.left - cellLeft) * scale,
      top: sidecarBox.height / 2 + part.y - crop.viewportHeight / 2 + (alpha.top - cellTop) * scale,
      right: sidecarBox.width / 2 + part.x - crop.viewportWidth / 2 + (alpha.right - cellLeft) * scale,
      bottom: sidecarBox.height / 2 + part.y - crop.viewportHeight / 2 + (alpha.bottom - cellTop) * scale,
    }];
  }));

  const wheelBounds = await Promise.all((["wheel-front", "wheel-back"] as const).map(async (id): Promise<readonly [string, Bounds]> => {
    const definition = STORY_LAYER_DEFINITIONS.find((candidate) => candidate.id === id);
    assert.ok(definition?.crop, `${id} needs its renderer crop`);
    const alpha = await opaqueBounds(vehicleAsset.src, {
      left: definition.crop.x,
      top: definition.crop.y,
      width: definition.crop.width,
      height: definition.crop.height,
    });
    const crop = getStoryImageCrop(vehicleAsset, definition.crop);
    const scaleX = crop.sourceWidth / vehicleAsset.width;
    const scaleY = crop.sourceHeight / vehicleAsset.height;
    const position = id === "wheel-front"
      ? storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelFront
      : storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelBack;
    const wheelLocalBounds = {
      left: position.left + alpha.left * scaleX + crop.translateX,
      top: position.top + alpha.top * scaleY + crop.translateY,
      right: position.left + alpha.right * scaleX + crop.translateX,
      bottom: position.top + alpha.bottom * scaleY + crop.translateY,
    };
    const wheelViewport = {
      left: position.left,
      top: position.top,
      right: position.left + crop.viewportWidth,
      bottom: position.top + crop.viewportHeight,
    };
    const rotated = transformBoundsWithinBox(wheelLocalBounds, wheelViewport, sampleLayerState(requiredTrack(id), progress));
    return [id, rotated];
  }));

  const compositionBounds = new Map<string, Bounds>([
    ["sidecar", vehicleLocalBounds] as const,
    ...riderBounds,
    ...wheelBounds,
  ].map(([id, bounds]) => [id, transformBoundsThroughLayer(bounds, sidecarBox, sidecarState)]));

  for (const [id, bounds] of compositionBounds) {
    assert.ok(bounds.left >= 0, `${id} left edge ${bounds.left} leaves the canvas`);
    assert.ok(bounds.top >= 0, `${id} top edge ${bounds.top} leaves the canvas`);
    assert.ok(bounds.right <= STORY_CANVAS.width, `${id} right edge ${bounds.right} leaves the canvas`);
    assert.ok(bounds.bottom <= STORY_CANVAS.height, `${id} bottom edge ${bounds.bottom} leaves the canvas`);
  }
});

test("the joke transition uses clean office panels without baked speech balloons", () => {
  const laughBackground = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "bg-laugh");
  const leftPanel = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "panel-left");
  const rightPanel = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "panel-right");

  assert.equal(laughBackground?.assetId, "officeBackground");
  assert.equal(leftPanel?.assetId, "officeBackground");
  assert.equal(rightPanel?.assetId, "officeBackground");
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
    sidecar: {
      wheelFront: { left: 123.171875, top: 305.26828125 },
      wheelBack: { left: 383.5234375, top: 305.26828125 },
    },
    titleGlyphSize: 68.8,
  });
});

test("the declarative layer tree nests each local wheel exactly once under the sidecar", () => {
  const buildStoryLayerTree = (storyTimeline as unknown as {
    buildStoryLayerTree?: (tracks: readonly LayerTrack[]) => readonly StoryLayerNode[];
  }).buildStoryLayerTree;
  assert.equal(typeof buildStoryLayerTree, "function");

  const roots = buildStoryLayerTree!(LAYER_TRACKS);
  const flattened: StoryLayerNode[] = [];
  const visit = (node: StoryLayerNode) => {
    flattened.push(node);
    node.children.forEach(visit);
  };
  roots.forEach(visit);

  assert.equal(flattened.length, 41);
  assert.deepEqual(flattened.map(({ track }) => track.id), LAYER_TRACKS.map(({ id }) => id));
  assert.equal(new Set(flattened.map(({ track }) => track.id)).size, LAYER_TRACKS.length);
  const sidecarNode = flattened.find(({ track }) => track.id === "sidecar");
  assert.deepEqual(sidecarNode?.children.map(({ track }) => track.id), ["wheel-front", "wheel-back"]);
  for (const wheelId of ["wheel-front", "wheel-back"]) {
    const wheel = requiredTrack(wheelId) as LayerTrack & { parentId?: string };
    assert.equal(wheel.parentId, "sidecar");
  }
});

test("both wheel crops keep a local identity transform except for independent rotation", () => {
  const sidecar = requiredTrack("sidecar");
  const front = requiredTrack("wheel-front");
  const back = requiredTrack("wheel-back");
  const progressSamples = [...new Set([
    0,
    0.02,
    ...[sidecar, front, back].flatMap((track) => [
      ...(track.x ?? []).map(({ at }) => at),
      ...(track.y ?? []).map(({ at }) => at),
    ]),
    0.05,
    0.075,
    0.115,
    0.14,
  ])].sort((left, right) => left - right);

  for (const progress of progressSamples) {
    for (const wheel of [front, back]) {
      const wheelState = sampleLayerState(wheel, progress);
      assert.deepEqual([wheelState.x, wheelState.y], [0, 0], `${wheel.id} is not parent-local at ${progress}`);
      assert.deepEqual(
        [wheelState.scaleX, wheelState.scaleY],
        [1, 1],
        `${wheel.id} locally duplicates the sidecar scale at ${progress}`,
      );
    }
  }

  assert.notStrictEqual(front.x, sidecar.x);
  assert.notStrictEqual(front.y, sidecar.y);
  assert.deepEqual(front.x, back.x);
  assert.deepEqual(front.y, back.y);
  assert.ok(front.rotate && back.rotate);
  assert.notStrictEqual(front.rotate, back.rotate);
});

test("nested wheel centers inherit sidecar scale and rotation through the retimed sidecar scene", () => {
  const sidecar = requiredTrack("sidecar");
  const sidecarBox = { left: -43, top: 344.84, width: 537.5, height: 540.56 };
  const wheelRadius = 28;
  const wheelCenters = {
    front: {
      x: storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelFront.left + wheelRadius,
      y: storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelFront.top + wheelRadius,
    },
    back: {
      x: storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelBack.left + wheelRadius,
      y: storyAssets.STORY_CANVAS_LAYOUT.sidecar.wheelBack.top + wheelRadius,
    },
  };
  const fixtures = [
    { progress: legacy(0.065), front: [421.839466, 844.587049], back: [666.569934, 844.587049] },
    { progress: legacy(0.1), front: [149.770563, 702.297945], back: [386.6544, 698.163122] },
    { progress: legacy(0.13), front: [212.758359, 760.961834], back: [479.769651, 762.639537] },
    { progress: legacy(0.15), front: [252.597724, 866.9208], back: [533.734587, 871.828062] },
  ] as const;

  for (const fixture of fixtures) {
    const state = sampleLayerState(sidecar, fixture.progress);
    for (const wheel of ["front", "back"] as const) {
      const actual = transformPointThroughLayer(wheelCenters[wheel], sidecarBox, state);
      assert.ok(Math.abs(actual.x - fixture[wheel][0]) < 0.000001, `${wheel} x at ${fixture.progress}`);
      assert.ok(Math.abs(actual.y - fixture[wheel][1]) < 0.000001, `${wheel} y at ${fixture.progress}`);
    }
  }

  const atFinal = sampleLayerState(sidecar, legacy(0.15));
  const nestedFront = transformPointThroughLayer(wheelCenters.front, sidecarBox, atFinal);
  const oldSiblingFront = {
    x: sidecarBox.left + wheelCenters.front.x + atFinal.x,
    y: sidecarBox.top + wheelCenters.front.y + atFinal.y,
  };
  assert.ok(Math.hypot(nestedFront.x - oldSiblingFront.x, nestedFront.y - oldSiblingFront.y) > 10.9);
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

test("the rebuild has seven continuous public scenes", () => {
  assert.equal(CHAPTERS.length, 7);
  assert.equal(CHAPTERS[0]?.start, 0);
  assert.equal(CHAPTERS.at(-1)?.end, 1);
  for (let index = 1; index < CHAPTERS.length; index += 1) {
    assert.equal(CHAPTERS[index - 1]?.end, CHAPTERS[index]?.start);
  }

  assert.equal(STORY_SCENES.length, 7);
  assert.deepEqual([...new Set(STORY_SCENES.map(({ id }) => id))], STORY_SCENES.map(({ id }) => id));
  for (let index = 1; index < STORY_SCENES.length; index += 1) {
    assert.ok(STORY_SCENES[index - 1]!.end <= STORY_SCENES[index]!.start);
  }
});

test("public scenes own visible story layers and contain their copy cues", () => {
  for (const scene of STORY_SCENES) {
    assert.ok(scene.layerIds.length >= 2, `${scene.id} has too few layers`);
    for (const cue of scene.copyCues) {
      assert.ok(cue.start >= scene.start && cue.end <= scene.end, `${cue.id} leaves ${scene.id}`);
    }
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
    sampleLayerState(reveal, legacy(0.165)).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
  assert.deepEqual(
    sampleLayerState(reveal, legacy(0.21)).clip,
    [0, 0, 100, 0, 100, 100, 0, 100],
  );
});

test("all seven public scenes keep visible spatial handoffs across their boundaries", () => {
  const boundaries = [
    { at: 0.08, outgoing: "title-shards", incoming: "opening-field", connector: "opening-field" },
    { at: 0.18, outgoing: "sidecar", incoming: "paper-tear", connector: "paper-tear" },
    { at: 0.34, outgoing: "office-props", incoming: "panel-left", connector: "panel-left" },
    { at: 0.5, outgoing: "laugh-burst", incoming: "proposal-triptych", connector: "laugh-burst" },
    { at: 0.72, outgoing: "proposal-triptych", incoming: "venue-reveal", connector: "venue-reveal" },
    { at: 0.84, outgoing: "wedding-couple", incoming: "bg-finale", connector: "wedding-couple" },
  ] as const;

  for (const [index, boundary] of boundaries.entries()) {
    assert.ok(STORY_SCENES[index]?.layerIds.includes(boundary.outgoing));
    assert.ok(STORY_SCENES[index + 1]?.layerIds.includes(boundary.incoming));
    const intervalStart = boundary.at - 0.0075;
    const intervalEnd = boundary.at + 0.0075;
    for (const progress of [intervalStart, intervalEnd]) {
      assert.ok(
        compositedVisibleOpacity(boundary.outgoing, progress) > 0.25,
        `${boundary.outgoing} must remain visible at ${progress}`,
      );
      assert.ok(
        compositedVisibleOpacity(boundary.incoming, progress) > 0.25,
        `${boundary.incoming} must already be visible at ${progress}`,
      );
      assert.ok(
        compositedVisibleOpacity(boundary.connector, progress) > 0.25,
        `${boundary.connector} must be an unoccluded connector at ${progress}`,
      );
    }

    // The second handoff deliberately uses the spatial paper tear as its bridge.
    const connector = requiredTrack(boundary.connector);
    assert.notDeepEqual(
      spatialState(sampleLayerState(connector, intervalStart)),
      spatialState(sampleLayerState(connector, intervalEnd)),
      `${boundary.connector} must connect the boundary spatially`,
    );
  }
});

test("the paper, tower zoom, and laugh merge use their required transition geometry", () => {
  const paper = requiredTrack("paper-tear");
  const tower = requiredTrack("tower-card");
  const rightPanel = requiredTrack("panel-right");

  assert.ok(paper.techniques?.includes("paperTear"));
  assert.equal(sampleLayerState(paper, legacy(0.135)).scaleX, 0.15);
  assert.equal(sampleLayerState(paper, legacy(0.17)).scaleX, 2.4);
  assert.deepEqual(
    [sampleLayerState(paper, legacy(0.15)).originX, sampleLayerState(paper, legacy(0.15)).originY],
    [84, 78],
  );

  assert.ok(tower.techniques?.includes("cameraZoom"));
  assert.ok(sampleLayerState(tower, legacy(0.245)).scaleX > 2);
  assert.deepEqual(
    [sampleLayerState(tower, legacy(0.21)).originX, sampleLayerState(tower, legacy(0.21)).originY],
    [51, 43],
  );

  assert.ok(rightPanel.techniques?.includes("polygonReveal"));
  assert.notDeepEqual(sampleLayerState(rightPanel, legacy(0.455)).clip, FULL_CLIP);
  assert.deepEqual(sampleLayerState(rightPanel, legacy(0.47)).clip, FULL_CLIP);
});

test("shots 1 through 9 land on the approved spatial anchors", () => {
  assert.deepEqual(
    [sampleLayerState(requiredTrack("bg-jeju"), legacy(0)).x, sampleLayerState(requiredTrack("bg-jeju"), legacy(0.15)).x],
    [0, -36],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("sidecar"), legacy(0.0425)).x, sampleLayerState(requiredTrack("sidecar"), legacy(0.1)).x],
    [520, 30],
  );

  const towerEntry = sampleLayerState(requiredTrack("tower-card"), legacy(0.17));
  const towerSettled = sampleLayerState(requiredTrack("tower-card"), legacy(0.195));
  assert.deepEqual([towerEntry.scaleX, towerEntry.scaleY, towerEntry.rotate], [0.72, 0.58, -5]);
  assert.deepEqual([towerSettled.scaleX, towerSettled.scaleY, towerSettled.rotate], [1, 1, 0]);
  assert.deepEqual(
    [sampleLayerState(requiredTrack("bg-office"), legacy(0.21)).scaleX, sampleLayerState(requiredTrack("bg-office"), legacy(0.255)).scaleX],
    [1.35, 1],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("office-props"), legacy(0.255)).y, sampleLayerState(requiredTrack("office-props"), legacy(0.3375)).y],
    [280, 665],
  );

  assert.deepEqual(
    [sampleLayerState(requiredTrack("panel-left"), legacy(0.315)).x, sampleLayerState(requiredTrack("panel-left"), legacy(0.37)).x],
    [-430, 0],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("panel-left"), legacy(0.49)).scaleX, sampleLayerState(requiredTrack("panel-right"), legacy(0.49)).scaleX],
    [0.5, 0.5],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("laugh-burst"), legacy(0.43)).scaleX, sampleLayerState(requiredTrack("laugh-burst"), legacy(0.52)).scaleX],
    [0.2, 1.6],
  );
  assert.deepEqual(
    [sampleLayerState(requiredTrack("laugh-burst"), legacy(0.52)).x, sampleLayerState(requiredTrack("laugh-burst"), legacy(0.52)).rotate],
    [0, 0],
    "the final burst is centered and unrotated for the triptych handoff",
  );
});

test("lifelong partners scene pans one opaque 1290px proposal strip without panel crossfades", () => {
  const proposalScene = STORY_SCENES.find(({ id }) => id === "lifelong-partners");
  assert.ok(proposalScene?.layerIds.includes("proposal-triptych"));

  const proposalDefinition = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "proposal-triptych");
  assert.equal(proposalDefinition?.assetId, "proposalTriptych");
  assert.deepEqual(
    [STORY_ASSETS.proposalTriptych.width, STORY_ASSETS.proposalTriptych.height],
    [1290, 932],
  );

  const triptych = requiredTrack("proposal-triptych");
  assert.equal(sampleLayerState(triptych, legacy(0.5)).opacity, 0, "the strip must not ghost before its entrance");
  assert.deepEqual(
    [0.52, 0.58, 0.64].map((progress) => sampleLayerState(triptych, legacy(progress)).x),
    [0, -430, -860],
  );
  assert.ok(Math.abs(sampleLayerState(triptych, legacy(0.5575)).x - -53.75) < 1e-9, "first proposal pan must easeInOut");
  assert.ok(Math.abs(sampleLayerState(triptych, legacy(0.6175)).x - -483.75) < 1e-9, "second proposal pan must easeInOut");
  for (let step = 520; step <= 700; step += 1) {
    const progress = legacy(step / 1000);
    assert.ok(sampleLayerState(triptych, progress).opacity >= 0.98, `triptych faded at ${progress}`);
  }
});

test("opaque opening scenery cannot cover the proposal strip during the tower zoom", () => {
  const openingField = requiredTrack("opening-field");
  const triptych = requiredTrack("proposal-triptych");
  const openingComposite = requiredComposite("opening-field").composite;
  const proposalComposite = requiredComposite("proposal-triptych").composite;

  assert.equal(openingComposite.coverage, "opaque-full");
  assert.equal(proposalComposite.coverage, "opaque-full");
  assert.ok(openingComposite.stack > proposalComposite.stack, "test fixture must model the actual foreground order");
  assert.ok(!STORY_SCENES[4]?.layerIds.includes("opening-field"), "proposal scene must not claim opaque opening scenery");
  for (const progress of [0.64, 0.65, 0.66, 0.68, 0.7]) {
    const retimed = legacy(progress);
    assert.equal(sampleLayerState(openingField, retimed).opacity, 0, `opening field covers proposal at ${retimed}`);
    assert.ok(sampleLayerState(triptych, retimed).opacity >= 0.98, `proposal missing at ${retimed}`);
  }
});

test("the ring answer is a clipped duplicate that pulses 0.8 to 1.12 to 1", () => {
  const ringDefinition = STORY_LAYER_DEFINITIONS.find(({ id }) => id === "ring-glint");
  assert.equal(ringDefinition?.assetId, "proposalTriptych");
  assert.deepEqual(ringDefinition?.crop, {
    x: 464,
    y: 340,
    width: 248,
    height: 300,
    display: { width: 248, height: 300 },
  });

  const ring = requiredTrack("ring-glint");
  assert.deepEqual(
    [0.58, 0.61, 0.64].map((progress) => sampleLayerState(ring, legacy(progress)).scaleX),
    [0.8, 1.12, 1],
  );
  assert.deepEqual(
    [sampleLayerState(ring, legacy(0.61)).originX, sampleLayerState(ring, legacy(0.61)).originY],
    [50, 50],
  );
  const proposalComposite = requiredComposite("proposal-triptych").composite;
  const ringComposite = requiredComposite("ring-glint").composite;
  assert.equal(ringComposite.coverage, "clipped");
  assert.ok(ringComposite.stack > proposalComposite.stack, "ring pulse must paint above the opaque strip");
});

test("the Tokyo tower zoom and venue reveal meet on the same coral line for two percent", () => {
  const triptych = requiredTrack("proposal-triptych");
  const exterior = requiredTrack("bg-venue");
  const reveal = requiredTrack("venue-reveal");
  const triptychComposite = requiredComposite("proposal-triptych").composite;
  const revealComposite = requiredComposite("venue-reveal").composite;
  const revealDefinition = requiredComposite("venue-reveal").definition;

  assert.deepEqual(
    [sampleLayerState(triptych, legacy(0.64)).scaleX, sampleLayerState(triptych, legacy(0.7)).scaleX],
    [1, 1.8],
  );
  assert.equal(sampleLayerState(exterior, legacy(0.69)).scaleX, 1.35);
  assert.ok(exterior.techniques?.includes("polygonReveal"));
  assert.notDeepEqual(sampleLayerState(exterior, legacy(0.69)).clip, FULL_CLIP);
  assert.deepEqual(sampleLayerState(exterior, legacy(0.72)).clip, FULL_CLIP);
  assert.equal(revealDefinition.assetId, "venueExterior");
  assert.equal(revealComposite.coverage, "clipped");
  assert.ok(revealComposite.stack > triptychComposite.stack, "venue wipe must paint above Tokyo");

  for (let step = 690; step <= 710; step += 1) {
    const progress = legacy(step / 1000);
    assert.ok(sampleLayerState(triptych, progress).opacity >= 0.98, `Tokyo left overlap at ${progress}`);
    assert.ok(sampleLayerState(exterior, progress).opacity >= 0.98, `venue left overlap at ${progress}`);
    assert.ok(sampleLayerState(reveal, progress).opacity >= 0.98, `visible diagonal wipe missing at ${progress}`);
    assert.notDeepEqual(sampleLayerState(reveal, progress).clip, FULL_CLIP, `wipe finished too early at ${progress}`);
  }
  assert.deepEqual(sampleLayerState(reveal, legacy(0.72)).clip, FULL_CLIP);
  assert.ok(sampleLayerState(reveal, legacy(0.72)).opacity >= 0.98);
  assert.equal(sampleLayerState(reveal, legacy(0.721)).opacity, 0, "opaque reveal duplicate bypasses the later door hierarchy");
  assert.equal(sampleLayerState(triptych, legacy(0.721)).opacity, 0);
  assert.equal(sampleLayerState(exterior, legacy(0.721)).opacity, 1);

  // The authored source anchors are x=1055 for the right-panel tower and
  // x=210 for the venue arch. Project both through their independent handoff
  // transforms; the comparison is their resulting difference, not a claim
  // that 210px itself is the tolerance.
  const tower = sampleLayerState(triptych, legacy(0.7));
  const towerLineX = tower.x + (1290 * tower.originX / 100)
    + (1055 - 1290 * tower.originX / 100) * tower.scaleX;
  const venue = sampleLayerState(exterior, legacy(0.7));
  const venueOriginX = 430 * venue.originX / 100;
  const venueArchX = venue.x + venueOriginX + (210 - venueOriginX) * venue.scaleX;
  const handoffDifference = Math.abs(towerLineX - venueArchX);
  assert.ok(handoffDifference <= 12, `${handoffDifference}px tower/arch handoff drift`);
});

test("venue doors reveal the interior and casual clothes match cut at identical geometry", () => {
  const exterior = requiredTrack("bg-venue");
  const interior = requiredTrack("venue-doors");
  const casual = requiredTrack("casual-couple");
  const weddingCouple = requiredTrack("wedding-couple");

  assert.equal(sampleLayerState(exterior, legacy(0.74)).opacity, 1);
  assert.ok(interior.techniques?.includes("polygonReveal"));
  assert.notDeepEqual(sampleLayerState(interior, legacy(0.78)).clip, FULL_CLIP);
  assert.deepEqual(sampleLayerState(interior, legacy(0.84)).clip, FULL_CLIP);

  const finale = requiredTrack("bg-finale");
  const finaleComposite = requiredComposite("bg-finale").composite;
  const exteriorComposite = requiredComposite("bg-venue").composite;
  const doorComposite = requiredComposite("venue-doors").composite;
  assert.deepEqual(
    [finaleComposite.stack, exteriorComposite.stack, doorComposite.stack],
    [0, 1, 2],
    "interior underlay, exterior hold, and clipped doorway need explicit stacking",
  );
  assert.deepEqual(
    [finaleComposite.coverage, exteriorComposite.coverage, doorComposite.coverage],
    ["opaque-full", "opaque-full", "clipped"],
  );
  for (const progress of [0.7725, 0.775, 0.779]) {
    const retimed = legacy(progress);
    assert.equal(sampleLayerState(finale, retimed).opacity, 0, `full interior bypasses door clip at ${retimed}`);
    assert.equal(sampleLayerState(exterior, retimed).opacity, 1, `exterior does not hold at ${retimed}`);
    assert.notDeepEqual(sampleLayerState(interior, retimed).clip, FULL_CLIP);
  }

  assert.notEqual(sampleLayerState(casual, legacy(0.72)).y, sampleLayerState(casual, legacy(0.8175)).y, "casual couple never walks");
  assert.equal(sampleLayerState(weddingCouple, legacy(0.817499)).opacity, 0);
  assert.ok(sampleLayerState(casual, legacy(0.817499)).opacity > 0);

  for (const progress of [0.8175, 0.82, 0.822499]) {
    const retimed = legacy(progress);
    const before = sampleLayerState(casual, retimed);
    const after = sampleLayerState(weddingCouple, retimed);
    assert.ok(before.opacity > 0 && after.opacity > 0, `missing retimed wardrobe overlap at ${retimed}`);
    assert.deepEqual([before.x, before.y], [after.x, after.y]);
    assert.ok(Math.abs(before.scaleY - after.scaleY) <= 0.005, `body height drift at ${progress}`);
  }
  assert.equal(sampleLayerState(casual, legacy(0.8225)).opacity, 0);
  assert.ok(sampleLayerState(weddingCouple, legacy(0.822501)).opacity > 0);
});

test("the casual walk reaches its exact retimed wardrobe overlap", () => {
  const casual = requiredTrack("casual-couple");
  const weddingCouple = requiredTrack("wedding-couple");
  assert.notEqual(sampleLayerState(casual, legacy(0.72)).y, sampleLayerState(casual, legacy(0.8175)).y);
  assert.equal(sampleLayerState(weddingCouple, legacy(0.817499)).opacity, 0);
  assert.ok(sampleLayerState(casual, legacy(0.817499)).opacity > 0);
  assert.ok(sampleLayerState(casual, legacy(0.8175)).opacity > 0);
  assert.ok(sampleLayerState(weddingCouple, legacy(0.8175)).opacity > 0);
  assert.ok(sampleLayerState(casual, legacy(0.822499)).opacity > 0);
  assert.ok(sampleLayerState(weddingCouple, legacy(0.822499)).opacity > 0);
  assert.equal(sampleLayerState(casual, legacy(0.8225)).opacity, 0);
  assert.ok(sampleLayerState(weddingCouple, legacy(0.822501)).opacity > 0);
});

test("the finale uses differential crowd parallax, a 610 to 470 couple walk, and veil sweep", () => {
  const crowdLeft = requiredTrack("crowd-left");
  const crowdRight = requiredTrack("crowd-right");
  assert.deepEqual(
    [sampleLayerState(crowdLeft, legacy(0.8)).opacity, sampleLayerState(crowdRight, legacy(0.8)).opacity],
    [0, 0],
    "crowds must not ghost over the venue approach",
  );
  assert.deepEqual(
    [sampleLayerState(crowdLeft, legacy(0.86)).x, sampleLayerState(crowdRight, legacy(0.86)).x],
    [-180, 180],
  );
  assert.deepEqual(
    [sampleLayerState(crowdLeft, legacy(0.9)).x, sampleLayerState(crowdRight, legacy(0.9)).x],
    [0, 20],
  );

  const couple = requiredTrack("wedding-couple");
  assert.deepEqual(
    [sampleLayerState(couple, legacy(0.86)).y, sampleLayerState(couple, legacy(0.93)).y],
    [610, 470],
  );

  const veil = requiredTrack("invitation-paper");
  assert.equal(sampleLayerState(veil, legacy(0.9)).opacity, 0, "the veil must not ghost over the crowd entrance");
  const veilStart = sampleLayerState(veil, legacy(0.93));
  const veilEnd = sampleLayerState(veil, 1);
  assert.deepEqual([veilStart.x, veilStart.y, veilStart.scaleX], [390, -180, 0.35]);
  assert.deepEqual([veilEnd.x, veilEnd.y, veilEnd.scaleX], [-40, -20, 2.2]);

  const finalBackground = sampleLayerState(requiredTrack("bg-finale"), 1);
  assert.deepEqual(
    finalBackground.clip,
    [50, 50, 50, 50, 50, 50, 50, 50],
    "the venue must spatially close away so the cream canvas remains behind the veil",
  );
});

test("the final exposed canvas resolves through the last CSS cascade rule to invitation paper", () => {
  const storyCss = readFileSync(new URL("./WeddingStory.module.css", import.meta.url), "utf8");
  const globalCss = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");
  const paperToken = globalCss.match(/--color-paper:\s*(#[0-9a-fA-F]{6})\s*;/)?.[1];
  assert.equal(paperToken, "#fdfbf7");

  const canvasBackgrounds = [...storyCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => selector.includes(".canvasPlane") && !selector.includes("::"))
    .flatMap(([, , declarations]) => [...declarations.matchAll(/(?:^|;)\s*background:\s*([^;]+);/g)])
    .map((match) => match[1].trim());
  assert.ok(canvasBackgrounds.length > 0);
  assert.equal(canvasBackgrounds.at(-1), "var(--color-paper)");
});

test("second-half boundary, reverse, and direct-jump samples are deterministic", () => {
  const samples = [
    ...STORY_SCENES.slice(4).flatMap(({ start }) => [start - 0.002, start, start + 0.002]),
    0.521,
    0.999,
  ];
  const ids = [
    "proposal-triptych",
    "ring-glint",
    "bg-venue",
    "venue-doors",
    "casual-couple",
    "wedding-couple",
    "crowd-left",
    "crowd-right",
    "invitation-paper",
  ];
  const captureState = (progress: number) => ids.map(
    (id) => sampleLayerState(requiredTrack(id), progress),
  );
  const forward = new Map(samples.map((progress) => [progress, captureState(progress)]));
  const reverse = new Map([...samples].reverse().map((progress) => [progress, captureState(progress)]));
  for (const progress of samples) assert.deepEqual(reverse.get(progress), forward.get(progress));

  const low = captureState(0.521);
  const high = captureState(0.999);
  assert.deepEqual([0.521, 0.999].map(captureState), [low, high]);
  assert.deepEqual([0.999, 0.521].map(captureState), [high, low]);
});

test("boundary samples, reverse calls, and large direct jumps are deterministic", () => {
  const samples = [
    ...STORY_SCENES.slice(1, 5).flatMap(({ start }) => [start - 0.002, start, start + 0.002]),
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
  const captureState = (progress: number) => trackIds.map(
    (id) => sampleLayerState(requiredTrack(id), progress),
  );
  const capture = (progresses: readonly number[]) => new Map(
    progresses.map((progress) => [progress, captureState(progress)]),
  );

  const forward = capture(samples);
  const reverse = capture([...samples].reverse());
  for (const progress of samples) assert.deepEqual(reverse.get(progress), forward.get(progress));

  const lowBaseline = captureState(0.02);
  const highBaseline = captureState(0.58);
  const lowToHigh = [0.02, 0.58].map(captureState);
  const highToLow = [0.58, 0.02].map(captureState);
  assert.deepEqual(lowToHigh[0], lowBaseline);
  assert.deepEqual(lowToHigh[1], highBaseline, "0.02→0.58 must return the direct destination state");
  assert.deepEqual(highToLow[0], highBaseline);
  assert.deepEqual(highToLow[1], lowBaseline, "0.58→0.02 must return the direct destination state");
});

test("the complete timeline passes its runtime invariant audit", () => {
  assert.doesNotThrow(() => assertStoryTimeline());
});
