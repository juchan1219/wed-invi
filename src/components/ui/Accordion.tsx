"use client";

import { useId, useState } from "react";

/**
 * 계좌·연락처·교통편처럼 "필요한 사람만 펼쳐 보는" 정보를 담는다.
 * <details>를 쓰지 않는 이유는 열림 애니메이션과 아이콘 회전을 붙이기 위해서.
 */
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm text-ink">{title}</span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-ink-faint transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2 4.5 6 8.5 10 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* grid-template-rows 트릭 — 내용 높이를 몰라도 부드럽게 펼쳐진다. */}
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
