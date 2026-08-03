"use client";

import { copyText } from "@/lib/clipboard";
import { useToast } from "./Toast";

/** 주소·계좌번호처럼 "눌러서 복사"가 필요한 모든 곳에서 쓴다. */
export function CopyButton({
  value,
  label = "복사",
  toastMessage = "복사했습니다",
  className = "",
}: {
  value: string;
  label?: string;
  toastMessage?: string;
  className?: string;
}) {
  const toast = useToast();

  async function handleClick() {
    const ok = await copyText(value);
    toast(ok ? toastMessage : "복사에 실패했어요. 길게 눌러 직접 복사해 주세요.");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors active:bg-paper-deep ${className}`}
    >
      {label}
    </button>
  );
}
