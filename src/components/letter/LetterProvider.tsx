"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { LetterView } from "@/lib/letters";
import { LetterDialog } from "./LetterDialog";

type LetterContextValue = {
  recipientName: string;
  letters: LetterView[];
  /** 편지 대화상자를 연다. 닫히면 trigger로 포커스를 되돌린다. */
  open(trigger: HTMLElement | null): void;
};

const LetterContext = createContext<LetterContextValue | null>(null);

/** 편지가 있는 청첩장(`/i/<토큰>`)에서만 값이 있다. 없으면 null — 버튼을 그리지 않는다. */
export function useLetter() {
  return useContext(LetterContext);
}

/**
 * 개인화 편지. 춤 마지막 장면의 "{이름}님께 편지가 왔어요" 버튼이 이 컨텍스트로 대화상자를 연다.
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

  const open = useCallback((element: HTMLElement | null) => {
    trigger.current = element;
    setSessionKey((current) => current ?? Date.now());
  }, []);

  const handleClosed = useCallback(() => {
    setSessionKey(null);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  const value = useMemo(() => ({ recipientName, letters, open }), [recipientName, letters, open]);

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
