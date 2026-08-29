import Image from "next/image";
import { STORY_ASSETS, STORY_FALLBACK_PANELS } from "./storyAssets";
import { STORY_SCENES } from "./storyNarrative";
import styles from "./WeddingStory.module.css";

export function StoryFallback() {
  return (
    <div className={styles.motionFallback}>
      {STORY_FALLBACK_PANELS.map((panel, index) => {
        const scene = STORY_SCENES.find(({ id }) => id === panel.sceneId)!;
        const asset = STORY_ASSETS[panel.assetId];
        if (asset.kind !== "image") throw new Error(`${panel.assetId} is not a fallback image`);
        return (
          <article key={scene.id} className={styles.fallbackCard}>
            <Image
              src={asset.src}
              alt=""
              width={asset.width}
              height={asset.height}
              sizes="(max-width: 430px) 100vw, 430px"
              className={styles.fallbackImage}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "low" : undefined}
            />
            <div className={styles.fallbackCopy}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <h2>{scene.title}</h2>
              <p>{scene.narration}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
