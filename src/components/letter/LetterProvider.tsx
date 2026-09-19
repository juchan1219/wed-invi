"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { LetterView } from "@/lib/letters";
import { LetterDialog } from "./LetterDialog";
import { letterReadStamp } from "./letterSheets";

type LetterContextValue = {
  recipientName: string;
  letters: LetterView[];
  /** 이 기기에서 편지를 한 번이라도 열었는지. 플로팅 버튼의 레드닷·흔들림을 끈다. */
  read: boolean;
  /** 편지 대화상자를 연다. 닫히면 trigger로 포커스를 되돌린다. */
  open(trigger: HTMLElement | null): void;
};

const LetterContext = createContext<LetterContextValue | null>(null);

/** 편지가 있는 청첩장(`/i/<토큰>`)에서만 값이 있다. 없으면 null — 버튼을 그리지 않는다. */
export function useLetter() {
  return useContext(LetterContext);
}

/*
 * 읽음 표시: 편지를 열면 이 기기(localStorage)에 편지 쓴 사람 목록을 적어 둔다. 주소(토큰)마다 따로다.
 * 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 이 방문 동안만 메모리에 기억한다.
 */
const READ_EVENT = "wedinvi:letter-read";
const readInMemory = new Set<string>();

const readKey = () => `wedinvi:letter-read:${window.location.pathname}`;

function subscribeRead(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(READ_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(READ_EVENT, onChange);
  };
}

function isRead(stamp: string) {
  const key = readKey();
  if (readInMemory.has(`${key}|${stamp}`)) return true;
  try {
    return window.localStorage.getItem(key) === stamp;
  } catch {
    return false;
  }
}

function markRead(stamp: string) {
  const key = readKey();
  readInMemory.add(`${key}|${stamp}`);
  try {
    window.localStorage.setItem(key, stamp);
  } catch {
    // 저장이 막혀 있으면 메모리 기록만으로 이 방문 동안 유지한다.
  }
  window.dispatchEvent(new Event(READ_EVENT));
}

/**
 * 개인화 편지. 춤 마지막 장면의 "{이름}님께 편지가 왔어요" 버튼과 플로팅 편지 버튼이 이 컨텍스트로 대화상자를 연다.
 * 대화상자는 여기(춤 무대 밖)에 두어 무대의 containment·26rem 컨테이너와 무관하게 화면 전체를 덮는다.
 */
export function LetterProvider({
  recipientName,
  letters,
  children,
}: {
  recipientName: string;
  letters: LetterView[];
  children: React.ReactNode;
}) {
  // 열 때마다 새 키로 대화상자를 새로 그린다 — 누를 때마다 접힌 편지지부터 다시 펼쳐진다(사용자 요청).
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const stamp = letterReadStamp(letters);
  // 서버와 첫 렌더는 "안 읽음" — 플로팅 버튼은 스크롤해야 보이므로 바로 뒤 갱신이 눈에 띄지 않는다.
  const read = useSyncExternalStore(subscribeRead, () => isRead(stamp), () => false);

  const open = useCallback((element: HTMLElement | null) => {
    trigger.current = element;
    setSessionKey((current) => current ?? Date.now());
    markRead(stamp);
  }, [stamp]);

  const handleClosed = useCallback(() => {
    setSessionKey(null);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  const value = useMemo(() => ({ recipientName, letters, read, open }), [recipientName, letters, read, open]);

  return (
    <LetterContext.Provider value={value}>
      {children}
      {sessionKey !== null && (
        <LetterDialog
          key={sessionKey}
          recipientName={recipientName}
          letters={letters}
          onClosed={handleClosed}
        />
      )}
    </LetterContext.Provider>
  );
}
