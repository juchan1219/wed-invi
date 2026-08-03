"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ADMINS, isAdminId, type AdminId } from "@/config/admins";

const STORAGE_KEY = "wedinvi_author";

type AuthorContextValue = {
  /** 지금 로그인해 쓰고 있는 사람. 목록 필터와 편지 작성자 기본값을 함께 결정한다. */
  author: AdminId;
  setAuthor: (next: AdminId) => void;
  /** localStorage를 읽기 전(첫 렌더)인지. 깜빡임을 막는 데 쓴다. */
  ready: boolean;
};

const AuthorContext = createContext<AuthorContextValue | null>(null);

/**
 * "나는 예찬" / "나는 주은"을 브라우저에 기억시킨다.
 * 목록 → 작성 → 수정 화면을 오갈 때마다 다시 고르지 않아도 되게 하는 것이 목적.
 */
export function AuthorProvider({ children }: { children: React.ReactNode }) {
  const [author, setAuthorState] = useState<AdminId>(ADMINS[0].id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isAdminId(saved)) setAuthorState(saved);
    setReady(true);
  }, []);

  function setAuthor(next: AdminId) {
    setAuthorState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <AuthorContext.Provider value={{ author, setAuthor, ready }}>
      {children}
    </AuthorContext.Provider>
  );
}

export function useAuthor(): AuthorContextValue {
  const value = useContext(AuthorContext);
  if (!value) throw new Error("useAuthor는 AuthorProvider 안에서만 쓸 수 있습니다.");
  return value;
}

/** 예찬 / 주은 선택 chip. 관리자 화면 어디서나 같은 값을 가리킨다. */
export function AuthorChip({ className = "" }: { className?: string }) {
  const { author, setAuthor, ready } = useAuthor();

  return (
    <div
      role="radiogroup"
      aria-label="작성자"
      className={`inline-flex rounded-full bg-paper-deep p-1 ${className}`}
    >
      {ADMINS.map((admin) => {
        const selected = ready && author === admin.id;
        return (
          <button
            key={admin.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setAuthor(admin.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              selected ? "bg-ink text-paper" : "text-ink-soft"
            }`}
          >
            {admin.label}
          </button>
        );
      })}
    </div>
  );
}
