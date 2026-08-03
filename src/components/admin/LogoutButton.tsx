"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    // replace를 쓰는 이유: 뒤로가기로 관리자 화면에 되돌아가지 않게.
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="text-xs text-ink-faint underline underline-offset-4 disabled:opacity-50"
    >
      로그아웃
    </button>
  );
}
