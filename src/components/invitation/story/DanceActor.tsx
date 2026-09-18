"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import styles from "./WeddingDance.module.css";

const RiveDanceActor = dynamic(
  () => import("./RiveDanceActor").then(({ RiveDanceActor }) => RiveDanceActor),
  { ssr: false },
);

export type DanceActorHandle = {
  setProgress(progress: number): void;
};

export const DanceActor = forwardRef<DanceActorHandle, { riveSrc: string }>(
  function DanceActor({ riveSrc }, ref) {
    const latest = useRef(0);
    const inner = useRef<DanceActorHandle | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
    const onReady = useCallback(() => setState("ready"), []);
    const onFailure = useCallback(() => setState("failed"), []);
    const bind = useCallback((handle: DanceActorHandle | null) => {
      inner.current = handle;
      handle?.setProgress(latest.current);
    }, []);

    useImperativeHandle(ref, () => ({
      setProgress(progress) {
        latest.current = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
        inner.current?.setProgress(latest.current);
      },
    }), []);

    return (
      <div className={styles.poseActor} data-dance-renderer={state} aria-hidden="true">
        {state !== "failed" && <RiveDanceActor ref={bind} src={riveSrc} onReady={onReady} onFailure={onFailure} />}
        {state !== "ready" && <Image
            className={styles.poseImage}
            src="/story/wedding-dance/pose-1.webp"
            alt=""
            fill
            sizes="(max-width: 480px) 86vw, 30rem"
            priority
            draggable={false}
          />}
      </div>
    );
  },
);
