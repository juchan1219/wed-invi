import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { clipToPolygon } from "./timelineMath";
import { sampleLayerState, type LayerTrack } from "./storyTimeline";
import styles from "./WeddingStory.module.css";

const BACKGROUNDS: Partial<Record<string, string>> = {
  "bg-jeju": "/story/jeju-background-v3.webp",
  "bg-office": "/story/office-background-v3.webp",
  "bg-laugh": "/story/joke-laugh-v2.webp",
  "bg-venue": "/story/venue-background-v3.webp",
  "bg-finale": "/story/finale-background-v3.webp",
  "opening-island": "/story/jeju-background-v3.webp",
  "opening-field": "/story/jeju-background-v3.webp",
  "tower-card": "/story/office-background-v3.webp",
  "proposal-triptych": "/story/proposal-triptych-v3.webp",
};

const SPRITES: Partial<Record<string, string>> = {
  "office-yechan": "0% 0%",
  "office-jueun": "33.333% 0%",
  "joke-yechan": "66.666% 0%",
  "jueun-expression": "100% 0%",
  "casual-couple": "33.333% 100%",
};

export function StoryLayer({ track }: { track: LayerTrack }) {
  const state = sampleLayerState(track, 0, "desktop");
  const style = {
    opacity: state.opacity,
    visibility: state.opacity < 0.002 ? "hidden" : "visible",
    transform: `translate3d(${state.x}vw, ${state.y}svh, 0) rotate(${state.rotate}deg) scale(${state.scale})`,
    clipPath: state.clip ? clipToPolygon(state.clip) : undefined,
  } satisfies CSSProperties;
  const background = BACKGROUNDS[track.id];
  const spritePosition = SPRITES[track.id];

  return (
    <div
      className={`${styles.layer} ${styles[`layer_${track.id.replaceAll("-", "_")}`] ?? ""}`}
      data-story-layer={track.id}
      data-kind={track.kind}
      aria-hidden="true"
      style={style}
    >
      {background && <ImageLayer id={track.id} src={background} />}
      {spritePosition && <Sprite position={spritePosition} />}
      {!background && !spritePosition && renderGraphic(track.id)}
    </div>
  );
}

function ImageLayer({ id, src }: { id: string; src: string }) {
  const sizes = id === "tower-card"
    ? "(max-width: 700px) 82vw, 56vw"
    : id === "proposal-triptych"
      ? "(max-width: 700px) 94vw, 90vw"
      : "100vw";
  return (
    <Image
      src={src}
      alt=""
      fill
      loading={id === "bg-jeju" || id === "opening-island" || id === "opening-field" ? "eager" : undefined}
      sizes={sizes}
      className={styles.layerImage}
    />
  );
}

function Sprite({ position }: { position: string }) {
  return (
    <span
      className={styles.sprite}
      style={{ backgroundPosition: position }}
    />
  );
}

function renderGraphic(id: string): ReactNode {
  switch (id) {
    case "bg-journey":
      return <span className={styles.paperTexture} />;
    case "opening-clouds":
      return <><i /><i /><i /></>;
    case "title-shards":
      return (
        <span className={styles.titleLockup}>
          <span className={styles.titleNames}>
            {["예", "찬", "과", "주", "은"].map((letter, index) => (
              <i
                key={letter}
                style={{
                  "--letter-drop": `${68 + index * 19}svh`,
                  "--letter-rotate": `${[-9, 5, -2, 8, -6][index]}deg`,
                } as CSSProperties}
              >{letter}</i>
            ))}
          </span>
          <small>의 결혼 이야기</small>
        </span>
      );
    case "sidecar":
      return <Image src="/story/sidecar-couple-v3.webp" alt="" fill sizes="(max-width: 700px) 94vw, 62vw" className={styles.containImage} />;
    case "wheel-front":
    case "wheel-back":
      return <span className={styles.wheelShine} />;
    case "name-labels":
      return <><span>예찬 ↘</span><span>↙ 주은</span></>;
    case "paper-tear":
    case "matchcut-strip":
    case "invitation-paper":
      return <span className={styles.tornPaper} />;
    case "tower-wall-left":
    case "tower-wall-right":
      return <span className={styles.glassWall} />;
    case "office-props":
      return <><span className={styles.laptop}>⌨</span><span className={styles.coffee}>☕</span></>;
    case "panel-left":
    case "panel-right":
      return <span className={styles.comicPanel} />;
    case "speech-bubble":
      return <span className={styles.speechBubble}>오늘 퇴근하고<br />맛있는 거 어때요?</span>;
    case "laugh-burst":
      return <span className={styles.laughBurst}>푸핫!</span>;
    case "travel-route":
      return <TravelRoute />;
    case "ring-glint":
      return <span className={styles.ringGlint}>✦</span>;
    case "venue-doors":
      return <><span className={styles.doorLeft} /><span className={styles.doorRight} /></>;
    case "wedding-couple":
      return <span className={styles.weddingPair}><Sprite position="66.666% 100%" /><Sprite position="100% 100%" /></span>;
    case "crowd-left":
    case "crowd-right":
      return <Crowd />;
    case "confetti-back":
    case "confetti":
    case "confetti-front":
      return <Confetti seed={id === "confetti-back" ? 7 : id === "confetti-front" ? 19 : 0} />;
    case "final-title":
      return <span className={styles.finalTitle}><small>예찬 ♥ 주은</small>우리 결혼합니다!!</span>;
    default:
      return null;
  }
}

function TravelRoute() {
  return (
    <svg viewBox="0 0 1000 400" preserveAspectRatio="none">
      <path d="M70 290 C220 70 360 350 510 170 S780 50 930 220" pathLength="1" />
      <circle cx="70" cy="290" r="12" />
      <circle cx="510" cy="170" r="12" />
      <circle cx="930" cy="220" r="12" />
    </svg>
  );
}

function Crowd() {
  return <span className={styles.crowd}>{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</span>;
}

function Confetti({ seed }: { seed: number }) {
  return (
    <span className={styles.confetti}>
      {Array.from({ length: 18 }, (_, index) => (
        <i
          key={index}
          style={{
            "--particle-x": `${(index * 37 + seed * 11) % 100}%`,
            "--particle-y": `${((index * 13 + seed) % 9) * 3 - 10}%`,
            "--particle-rotate": `${(index * 29 + seed * 17) % 360}deg`,
          } as CSSProperties}
        />
      ))}
    </span>
  );
}
