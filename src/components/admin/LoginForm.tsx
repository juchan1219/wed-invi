"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminCredentialFields } from "./AdminCredentialFields";

export function LoginForm() {
  // useSearchParams는 Suspense 경계가 필요하다.
  return (
    <Suspense fallback={<div className="mt-8 h-28" />}>
      <Form />
    </Suspense>
  );
}

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      // next 파라미터는 경로만 허용한다 — 외부 주소로 튕기는 걸 막기 위해.
      const next = searchParams.get("next");
      const target = next?.startsWith("/admin") ? next : "/admin";
      router.replace(target);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="mt-8">
      <AdminCredentialFields
        password={password}
        onPasswordChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || password.length === 0}
        className="mt-4 w-full rounded-lg bg-ink py-3 text-sm text-paper disabled:opacity-40"
      >
        {busy ? "확인 중..." : "들어가기"}
      </button>
    </form>
  );
}
