import Image from "next/image";
import { CHAPTERS, SHOTS } from "./storyTimeline";
import styles from "./WeddingStory.module.css";

const images = [
  "/story/jeju-sidecar-v2.webp",
  "/story/tower-coworkers-v2.webp",
  "/story/joke-laugh-v2.webp",
  "/story/proposal-triptych-v3.webp",
  "/story/venue-arrival-v2.webp",
  "/story/wedding-finale-v2.webp",
] as const;

export function StoryFallback() {
  return (
    <div className={styles.motionFallback}>
      {CHAPTERS.map((chapter, index) => {
        const shot = SHOTS.find(({ chapterId }) => chapterId === chapter.id)!;
        return (
          <article key={chapter.id} className={styles.fallbackCard}>
            <Image src={images[index]} alt="" width={1536} height={1024} sizes="(max-width: 700px) 100vw, 700px" />
            <div>
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
