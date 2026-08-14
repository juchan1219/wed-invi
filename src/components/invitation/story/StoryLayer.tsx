import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  STORY_ASSETS,
  STORY_LAYER_DEFINITIONS,
  getStoryImageCrop,
  getStorySpriteCrop,
  type StoryImageCrop,
  type StoryImageAsset,
  type StoryLayerDefinition,
  type StoryLayerPart,
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
  "--story-sprite-viewport-width": `${number}px`;
  "--story-sprite-viewport-height": `${number}px`;
  "--story-sprite-atlas-width": `${number}px`;
  "--story-sprite-atlas-height": `${number}px`;
  "--story-sprite-translate-x": `${number}px`;
  "--story-sprite-translate-y": `${number}px`;
};

type ImageCropCSSProperties = CSSProperties & {
  "--story-image-crop-width": `${number}px`;
  "--story-image-crop-height": `${number}px`;
  "--story-image-source-width": `${number}px`;
  "--story-image-source-height": `${number}px`;
  "--story-image-translate-x": `${number}px`;
  "--story-image-translate-y": `${number}px`;
};

type CompositionPartCSSProperties = CSSProperties & {
  "--story-part-x": `${number}px`;
  "--story-part-y": `${number}px`;
};

const STORY_LAYER_DEFINITION_BY_ID = new Map<string, StoryLayerDefinition>(
  STORY_LAYER_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function StoryLayer({ track, children }: { track: LayerTrack; children?: ReactNode }) {
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
      {children}
    </div>
  );
}

function StoryLayerContent({ definition }: { definition: StoryLayerDefinition }) {
  if (definition.assetId) {
    const asset = STORY_ASSETS[definition.assetId];
    return <AssetLayer asset={asset} crop={definition.crop} />;
  }

  if (definition.parts) {
    return <CompositionLayer parts={definition.parts} />;
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

function AssetLayer({
  asset,
  crop,
}: {
  asset: StoryImageAsset | StorySpriteAsset;
  crop?: StoryImageCrop;
}) {
  if (asset.kind === "sprite") {
    if (crop) throw new Error("sprite assets cannot use an image crop");
    return <SpriteLayer asset={asset} />;
  }

  return crop ? <CroppedImageLayer asset={asset} crop={crop} /> : <ImageLayer asset={asset} />;
}

function CompositionLayer({ parts }: { parts: readonly StoryLayerPart[] }) {
  return (
    <span className={styles.layerComposition} aria-hidden="true">
      {parts.map((part) => {
        const style = {
          "--story-part-x": `${part.x}px`,
          "--story-part-y": `${part.y}px`,
        } satisfies CompositionPartCSSProperties;

        return (
          <span
            key={part.assetId}
            className={styles.layerCompositionPart}
            style={style as CSSProperties}
            aria-hidden="true"
          >
            <AssetLayer asset={STORY_ASSETS[part.assetId]} />
          </span>
        );
      })}
    </span>
  );
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
    "--story-sprite-viewport-width": `${crop.viewportWidth}px`,
    "--story-sprite-viewport-height": `${crop.viewportHeight}px`,
    "--story-sprite-atlas-width": `${crop.atlasWidth}px`,
    "--story-sprite-atlas-height": `${crop.atlasHeight}px`,
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

function CroppedImageLayer({
  asset,
  crop,
}: {
  asset: StoryImageAsset;
  crop: StoryImageCrop;
}) {
  const layout = getStoryImageCrop(asset, crop);
  const style = {
    "--story-image-crop-width": `${layout.viewportWidth}px`,
    "--story-image-crop-height": `${layout.viewportHeight}px`,
    "--story-image-source-width": `${layout.sourceWidth}px`,
    "--story-image-source-height": `${layout.sourceHeight}px`,
    "--story-image-translate-x": `${layout.translateX}px`,
    "--story-image-translate-y": `${layout.translateY}px`,
  } satisfies ImageCropCSSProperties;

  return (
    <span className={styles.imageCrop} style={style as CSSProperties} aria-hidden="true">
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        loading={asset.eager ? "eager" : "lazy"}
        sizes={`${layout.sourceWidth}px`}
        className={styles.imageCropSource}
        aria-hidden="true"
      />
    </span>
  );
}
