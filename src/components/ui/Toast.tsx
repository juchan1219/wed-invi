"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastContextValue = (message: string) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

type Toast = { id: number; text: string };

/** "복사했습니다" 같은 짧은 확인 메시지. 화면 하단에 잠깐 떴다 사라진다. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const show = useCallback((text: string) => {
    // id를 매번 새로 매겨 <span key>가 바뀌게 한다.
    // 같은 문구를 연달아 눌러도 리마운트되면서 애니메이션이 다시 돈다.
    // (requestAnimationFrame으로 재트리거하면 rAF가 지연되는 상황에서 토스트가 아예 안 뜬다.)
    setToast({ id: nextId.current++, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        // 스크린리더가 변경을 읽도록 항상 DOM에 두고, 내용만 바꾼다.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-6"
      >
        {toast && (
          <span
            key={toast.id}
            className="animate-[toast-in_0.2s_ease-out] rounded-full bg-ink/90 px-5 py-2.5 text-sm text-paper shadow-lg"
          >
            {toast.text}
          </span>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast는 ToastProvider 안에서만 쓸 수 있습니다.");
  return show;
}
