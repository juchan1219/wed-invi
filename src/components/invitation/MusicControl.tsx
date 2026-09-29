"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./MusicControl.module.css";

const MUSIC_SRC = "/audio/merry-go-round-49s-128k-v1.m4a";
const MUTED_KEY = "wed-invi:music-muted";

type PlaybackState = "pending" | "playing" | "paused";

export function MusicControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playback, setPlayback] = useState<PlaybackState>("pending");

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      await audio.play();
      setPlayback("playing");
      return true;
    } catch {
      setPlayback("paused");
      return false;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.52;

    if (window.sessionStorage.getItem(MUTED_KEY) === "1") {
      setPlayback("paused");
      return;
    }

    let disposed = false;
    const removeRetryListeners = () => {
      document.removeEventListener("pointerdown", retryAfterInteraction, true);
      document.removeEventListener("keydown", retryAfterInteraction, true);
    };
    const retryAfterInteraction = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-music-control]")) return;
      removeRetryListeners();
      void play();
    };

    void play().then((started) => {
      if (disposed || started) return;
      document.addEventListener("pointerdown", retryAfterInteraction, true);
      document.addEventListener("keydown", retryAfterInteraction, true);
    });

    return () => {
      disposed = true;
      removeRetryListeners();
    };
  }, [play]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playback === "playing") {
      audio.pause();
      window.sessionStorage.setItem(MUTED_KEY, "1");
      setPlayback("paused");
      return;
    }
    window.sessionStorage.removeItem(MUTED_KEY);
    await play();
  };

  const playing = playback === "playing";

  return (
    <>
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="metadata" />
      <button
        type="button"
        className={styles.fab}
        data-music-control
        data-state={playback}
        aria-label={playing ? "배경음악 끄기" : "배경음악 켜기"}
        aria-pressed={playing}
        onClick={toggle}
      >
        <MusicIcon playing={playing} />
        <span className={styles.srOnly} aria-live="polite">
          {playing ? "배경음악 재생 중" : "배경음악 꺼짐"}
        </span>
      </button>
    </>
  );
}

function MusicIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9.5h3.2L13 5.7v12.6l-4.8-3.8H5z" />
      {playing ? (
        <>
          <path className={styles.wave} d="M16 9.1c1.1 1.6 1.1 4.2 0 5.8" />
          <path className={styles.wave} d="M18.6 6.6c2.5 3 2.5 7.8 0 10.8" />
        </>
      ) : (
        <path className={styles.slash} d="m16 9 5 5m0-5-5 5" />
      )}
    </svg>
  );
}
