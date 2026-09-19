"use client";

import { useState } from "react";
import { LetterIcon } from "./LetterIcon";
import { useLetter } from "./LetterProvider";
import { letterButtonLabel } from "./letterSheets";
import styles from "./LetterButton.module.css";

/**
 * "{이름}님께 편지가 왔어요". 편지가 있는 청첩장에서만 그려진다
 * (춤 마지막 장면, 동작 줄이기에서는 정적 카드 마지막 장).
 */
export function LetterButton() {
  const letter = useLetter();
  const [opened, setOpened] = useState(false);
  if (!letter) return null;
  const label = letterButtonLabel(letter.recipientName);

  return (
    <button
      type="button"
      className={styles.button}
      aria-haspopup="dialog"
      onClick={(event) => {
        setOpened(true);
        letter.open(event.currentTarget);
      }}
    >
      <span className={styles.icon}><LetterIcon open={opened} /></span>
      <span className={styles.label}>
        {label.to} <span className={styles.message}>{label.message}</span>
      </span>
    </button>
  );
}
