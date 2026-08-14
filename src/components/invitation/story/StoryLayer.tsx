import Image from "next/image";
import type { CSSProperties } from "react";
import {
  STORY_ASSETS,
  STORY_LAYER_DEFINITIONS,
  getStorySpriteCrop,
  type StoryImageAsset,
  type StoryLayerDefinition,
  type StorySpriteAsset,
} from "./storyAssets";
import { inlineClipPathForTrack } from "./timelineMath";
import { sampleLayerState, type LayerTrack } from "./storyTimeline";
import styles from "./WeddingStory.module.css";

type ImageCSSProperties = CSSProperties & {
  "--story-asset-width": `${number}px`;
  "--story-asset-height": `${number}px`;
  "--story-asset-fit": StoryImageAsset["fit"];
  "--story-focal-x": `${number}%`;
  "--story-focal-y": `${number}%`;
};

type SpriteCSSProperties = CSSProperties & {
  "--story-sprite-cell-width": `${number}px`;
  "--story-sprite-cell-height": `${number}px`;
  "--story-sprite-translate-x": `${number}px`;
  "--story-sprite-translate-y": `${number}px`;
};

const STORY_LAYER_DEFINITION_BY_ID = new Map<string, StoryLayerDefinition>(
  STORY_LAYER_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function StoryLayer({ track }: { track: LayerTrack }) {
  const definition = STORY_LAYER_DEFINITION_BY_ID.get(track.id);
  if (!definition) throw new Error(`${track.id} has no story layer definition`);

  const state = sampleLayerState(track, 0);
  const style = {
    opacity: state.opacity,
    visibility: state.opacity < 0.002 ? "hidden" : "visible",
    transformOrigin: `${state.originX}% ${state.originY}%`,
    transform: `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.rotate}deg) scale(${state.scaleX}, ${state.scaleY})`,
    clipPath: inlineClipPathForTrack(track, state),
  } satisfies CSSProperties;
  const layerClassName = styles[`layer_${track.id.replaceAll("-", "_")}`] ?? "";
  const roleClassName = definition.className ? styles[`asset_${definition.className}`] ?? "" : "";

  return (
    <div
      className={`${styles.layer} ${layerClassName} ${roleClassName}`}
      data-story-layer={track.id}
      data-kind={track.kind}
      aria-hidden="true"
      style={style as CSSProperties}
    >
      <StoryLayerContent definition={definition} />
    </div>
  );
}

function StoryLayerContent({ definition }: { definition: StoryLayerDefinition }) {
  if (definition.assetId) {
    const asset = STORY_ASSETS[definition.assetId];
    return asset.kind === "sprite"
      ? <SpriteLayer asset={asset} />
      : <ImageLayer asset={asset} />;
  }

  if (definition.text) {
    return (
      <span className={`${styles.layerText} ${styles[`layerText_${definition.text.kind}`]}`}>
        {definition.text.value}
      </span>
    );
  }

  throw new Error(`${definition.id} has no renderable content`);
}

function ImageLayer({ asset }: { asset: StoryImageAsset }) {
  const focalPoint = asset.focalPoint ?? { x: 0.5, y: 0.5 };
  const style = {
    "--story-asset-width": `${asset.width}px`,
    "--story-asset-height": `${asset.height}px`,
    "--story-asset-fit": asset.fit,
    "--story-focal-x": `${focalPoint.x * 100}%`,
    "--story-focal-y": `${focalPoint.y * 100}%`,
  } satisfies ImageCSSProperties;

  return (
    <Image
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      loading={asset.eager ? "eager" : "lazy"}
      sizes="430px"
      className={styles.layerImage}
      style={style as CSSProperties}
      aria-hidden="true"
    />
  );
}

function SpriteLayer({ asset }: { asset: StorySpriteAsset }) {
  const crop = getStorySpriteCrop(asset);
  const style = {
    "--story-sprite-cell-width": `${crop.cellWidth}px`,
    "--story-sprite-cell-height": `${crop.cellHeight}px`,
    "--story-sprite-translate-x": `${crop.translateX}px`,
    "--story-sprite-translate-y": `${crop.translateY}px`,
  } satisfies SpriteCSSProperties;

  return (
    <span className={styles.spriteCrop} style={style as CSSProperties} aria-hidden="true">
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        sizes={`${asset.width}px`}
        className={styles.spriteImage}
        aria-hidden="true"
      />
    </span>
  );
}
