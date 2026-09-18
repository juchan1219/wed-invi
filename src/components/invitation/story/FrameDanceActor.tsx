"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { DanceActorHandle } from "./DanceActor";
import { DANCE_FRAME_SIZE, frameAtlasRect, sampleFrameSequence } from "./frameSequence";
import styles from "./WeddingDance.module.css";

export const FrameDanceActor = forwardRef<DanceActorHandle>(function FrameDanceActor(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const paintRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  useImperativeHandle(ref, () => ({ setProgress(value) {
    progress.current = value;
    paintRef.current();
  } }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    let disposed = false;
    let scheduled = 0;
    let shown = false;
    const pages = new Map<number, HTMLImageElement>();
    const loading = new Set<number>();
    const failed = new Set<number>();
    const load = (page: number) => {
      if (page < 0 || page > 4 || pages.has(page) || loading.has(page) || failed.has(page)) return;
      loading.add(page);
      const image = new window.Image();
      image.onload = () => {
        loading.delete(page);
        if (disposed) return;
        pages.set(page, image);
        paint();
      };
      image.onerror = () => { loading.delete(page); failed.add(page); };
      image.src = `/story/wedding-dance/frames/dance-${page + 1}.webp`;
    };
    const paint = () => {
      if (disposed) return;
      const frame = sampleFrameSequence(progress.current);
      const selected = frame.blend < .5 ? frame.first : frame.second;
      const a = frameAtlasRect(selected);
      load(a.page); load(Math.min(4, a.page + 1));
      const first = pages.get(a.page);
      if (!first) return; // Keep the previous valid frame while decoding.
      for (const page of pages.keys()) if (Math.abs(page - a.page) > 1) pages.delete(page);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      context.drawImage(first, a.x, a.y, DANCE_FRAME_SIZE, DANCE_FRAME_SIZE, 0, 0, canvas.width, canvas.height);
      // Ink drawings must remain single-exposure: dissolving adjacent heads
      // creates visible double faces. Scroll scrub smooths timing, not pixels.
      canvas.dataset.frame = String(selected);
      if (!shown) { shown = true; setReady(true); }
    };
    paintRef.current = () => {
      if (!scheduled) scheduled = requestAnimationFrame(() => { scheduled = 0; paint(); });
    };
    const resize = new ResizeObserver(() => {
      const size = Math.max(1, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio, 2)));
      canvas.width = size; canvas.height = size;
      paint();
    });
    resize.observe(canvas);
    paint();
    return () => {
      disposed = true;
      resize.disconnect();
      cancelAnimationFrame(scheduled);
      paintRef.current = () => {};
      pages.clear();
    };
  }, []);

  return <div className={styles.poseActor} data-dance-renderer={ready ? "frames" : "loading"} aria-hidden="true">
    <canvas ref={canvasRef} className={styles.riveCanvas} />
    {!ready && <Image src="/story/wedding-dance/pose-1.webp" alt="" fill sizes="86vw" priority className={styles.poseImage} />}
  </div>;
});
