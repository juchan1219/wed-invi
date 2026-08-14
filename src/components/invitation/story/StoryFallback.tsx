import { CHAPTERS, SHOTS } from "./storyTimeline";
import styles from "./WeddingStory.module.css";

export function StoryFallback() {
  return (
    <div className={styles.motionFallback}>
      {CHAPTERS.map((chapter, index) => {
        const shot = SHOTS.find(({ chapterId }) => chapterId === chapter.id)!;
        return (
          <article key={chapter.id} className={styles.fallbackCard}>
            <div className={styles.fallbackDoodle} aria-hidden="true"><i /><i /><span>{index + 1}</span></div>
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
