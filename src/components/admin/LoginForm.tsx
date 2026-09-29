"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { AdminCredentialFields } from "./AdminCredentialFields";

type LoginResult = { ok: true } | { ok: false; error: string };

type AdminLoginPanelProps = {
  authenticate: (password: string) => Promise<LoginResult>;
  onAuthenticated: () => void;
};

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

  async function authenticate(password: string): Promise<LoginResult> {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error ?? "로그인에 실패했습니다." };
    }
    return { ok: true };
  }

  function onAuthenticated() {
    // next 파라미터는 경로만 허용한다 — 외부 주소로 튕기는 걸 막기 위해.
    const next = searchParams.get("next");
    const target = next?.startsWith("/admin") ? next : "/admin";
    router.replace(target);
    router.refresh();
  }

  return <AdminLoginPanel authenticate={authenticate} onAuthenticated={onAuthenticated} />;
}

export function AdminLoginPanel({ authenticate, onAuthenticated }: AdminLoginPanelProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);

    try {
      const result = await authenticate(password);
      if (!result.ok) {
        setError(result.error);
        submitting.current = false;
        setBusy(false);
        return;
      }
      // router.replace는 Promise를 반환하지 않는다. 성공 후 busy를 풀면 화면이 바뀌기 전에
      // 버튼이 다시 눌릴 수 있으므로 이 컴포넌트가 언마운트될 때까지 잠금을 유지한다.
      onAuthenticated();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      submitting.current = false;
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
        aria-busy={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-sm text-paper disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
            />
            <span aria-hidden="true">확인 중...</span>
            <span role="status" className="sr-only">로그인 확인 중</span>
          </>
        ) : "들어가기"}
      </button>
    </form>
  );
}
