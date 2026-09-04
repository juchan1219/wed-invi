import { StoryStaticLayer } from "./StoryLayer";
import { STORY_FALLBACK_PANELS } from "./storyAssets";
import { STORY_SCENES } from "./storyNarrative";
import styles from "./WeddingStory.module.css";

export function StoryFallback() {
  return (
    <div className={styles.motionFallback}>
      {STORY_FALLBACK_PANELS.map((panel, index) => {
        const scene = STORY_SCENES.find(({ id }) => id === panel.sceneId)!;
        const cueCopy = scene.copyCues.map(({ copy }) => copy).join("\n");
        return (
          <article key={scene.id} className={styles.fallbackCard} data-fallback-scene={scene.id}>
            <div className={styles.fallbackArtwork} aria-hidden="true">
              {panel.layerIds.map((layerId) => (
                <StoryStaticLayer key={layerId} layerId={layerId} eager={index === 0} />
              ))}
            </div>
            <div className={styles.fallbackCopy}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              {cueCopy ? <p>{cueCopy}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
