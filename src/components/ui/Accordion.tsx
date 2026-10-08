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
  mountOnOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /**
   * 한 번 열기 전까지 내용을 DOM에 올리지 않는다. 전화번호·계좌번호처럼
   * **초기 HTML에 남기고 싶지 않은** 내용에만 켠다 — 이 사이트는 공개라
   * `curl | grep` 한 번에 평문으로 수집됐다(2026-10-08).
   *
   * 어차피 탭해야 열리는 구조라 하객 UX는 그대로다. 닫아도 다시 숨기지는
   * 않는다(이미 받아 간 뒤라 의미가 없고, 접을 때마다 깜빡이게 된다).
   *
   * ⚠️ JS 청크에는 값이 남는다. 막는 것은 HTML만 긁는 대량 수집기다.
   */
  mountOnOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpened, setEverOpened] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setEverOpened(true);
        }}
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
          <div className="border-t border-line px-5 py-4">
            {mountOnOpen && !everOpened ? null : children}
          </div>
        </div>
      </div>
    </div>
  );
}
