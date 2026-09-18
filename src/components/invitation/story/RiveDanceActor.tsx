"use client";

import { RuntimeLoader, useRive } from "@rive-app/react-canvas";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { DanceActorHandle } from "./DanceActor";
import styles from "./WeddingDance.module.css";

const STATE_MACHINE = "WeddingDance";
const PROGRESS_INPUT = "danceProgress";
// Same-origin WASM avoids a third-party CDN dependency in in-app browsers.
RuntimeLoader.setWasmUrl("/story/wedding-dance/rive.wasm");

export const RiveDanceActor = forwardRef<DanceActorHandle, { src: string; onReady(): void; onFailure(): void }>(
  function RiveDanceActor({ src, onReady, onFailure }, ref) {
    const latestProgress = useRef(0);
    const { rive, RiveComponent } = useRive({
      src,
      stateMachines: STATE_MACHINE,
      autoplay: true,
      autoBind: true,
      shouldDisableRiveListeners: true,
      onLoadError: onFailure,
    }, { customDevicePixelRatio: Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio, 2) });

    useEffect(() => {
      if (!rive) return;
      const input = rive.viewModelInstance?.number(PROGRESS_INPUT);
      if (!input) { onFailure(); return; }
      input.value = latestProgress.current * 100;
      const frame = requestAnimationFrame(onReady);
      const visibility = () => document.hidden ? rive.stopRendering() : rive.startRendering();
      document.addEventListener("visibilitychange", visibility);
      visibility();
      return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener("visibilitychange", visibility);
      };
    }, [rive, onReady, onFailure]);

    useImperativeHandle(ref, () => ({
      setProgress(progress) {
        latestProgress.current = progress;
        const input = rive?.viewModelInstance?.number(PROGRESS_INPUT);
        if (input) input.value = progress * 100;
      },
    }), [rive]);

    return <RiveComponent className={styles.riveCanvas} aria-hidden="true" />;
  },
);
