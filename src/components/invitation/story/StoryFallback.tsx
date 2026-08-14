import Image from "next/image";
import { STORY_ASSETS, STORY_FALLBACK_PANELS } from "./storyAssets";
import { CHAPTERS, SHOTS } from "./storyTimeline";
import styles from "./WeddingStory.module.css";

export function StoryFallback() {
  return (
    <div className={styles.motionFallback}>
      {STORY_FALLBACK_PANELS.map((panel, index) => {
        const chapter = CHAPTERS.find(({ id }) => id === panel.chapterId)!;
        const shot = SHOTS.find(({ id }) => id === panel.shotId)!;
        const asset = STORY_ASSETS[panel.assetId];
        if (asset.kind !== "image") throw new Error(`${panel.assetId} is not a fallback image`);
        return (
          <article key={chapter.id} className={styles.fallbackCard}>
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
              <h2>{chapter.title}</h2>
              <p>{shot.copy}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
