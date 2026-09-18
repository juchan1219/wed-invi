"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/config/wedding";
import type { GuestbookView } from "@/lib/guestbook";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { useToast } from "@/components/ui/Toast";

/**
 * 방명록.
 *
 * 목록을 서버에서 그리지 않고 브라우저에서 받아오는 이유:
 * 그래야 청첩장 본문이 정적 페이지로 남아 CDN에서 바로 나간다.
 * 방명록은 스크롤을 한참 내려야 나오는 자리라 조금 늦게 채워져도 괜찮다.
 */
export function Guestbook() {
  const toast = useToast();
  const [entries, setEntries] = useState<GuestbookView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/guestbook")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCreated(entry: GuestbookView) {
    setEntries((prev) => [entry, ...(prev ?? [])]);
    toast("메시지를 남겼습니다");
  }

  function handleDeleted(id: number) {
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
    toast("메시지를 지웠습니다");
  }

  return (
    <Section label="Guestbook" title="축하 메시지">
      <Reveal>
        <GuestbookForm onCreated={handleCreated} />

        {entries === null ? (
          <p className="py-10 text-center text-sm text-ink-faint">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            첫 번째 축하 메시지를 남겨주세요.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDeleted={handleDeleted} />
            ))}
          </ul>
        )}
      </Reveal>
    </Section>
  );
}

function GuestbookForm({ onCreated }: { onCreated: (entry: GuestbookView) => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onCreated(data.entry);
      setName("");
      setMessage("");
      setPassword("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  // suppressHydrationWarning: 비밀번호 관리자·자동완성·맞춤법 확장이 hydration 전에 입력칸에
  // 속성(data-1p-*, data-lastpass-*, style 등)을 끼워 넣어 개발 모드에 불일치 경고가 뜬다.
  // 이 입력칸들의 속성은 전부 고정값이라 실제 서버/클라이언트 불일치가 생길 수 없다.
  // 이 요소 자신의 속성만 무시하며 자식·다른 요소의 불일치는 그대로 잡힌다.
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-[1fr_6.5rem] gap-2">
        <input
          suppressHydrationWarning
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={wedding.guestbook.maxNameLength}
          placeholder="이름"
          aria-label="이름"
          className="rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
        />
        <input
          suppressHydrationWarning
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="비밀번호 4자리"
          aria-label="삭제용 비밀번호 4자리"
          className="rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
        />
      </div>
      <textarea
        suppressHydrationWarning
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={wedding.guestbook.maxMessageLength}
        rows={3}
        placeholder="축하 메시지를 남겨주세요"
        aria-label="축하 메시지"
        className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2.5 text-base leading-7 outline-none focus:border-accent"
      />

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !name || !message || password.length !== 4}
        className="w-full rounded-lg bg-ink py-3 text-sm text-paper disabled:opacity-40"
      >
        {busy ? "남기는 중..." : "메시지 남기기"}
      </button>
    </form>
  );
}

function EntryCard({
  entry,
  onDeleted,
}: {
  entry: GuestbookView;
  onDeleted: (id: number) => void;
}) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const password = window.prompt("작성할 때 입력한 비밀번호 4자리를 입력해 주세요.");
    if (password === null) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/guestbook?id=${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "삭제에 실패했습니다");
        return;
      }
      onDeleted(entry.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="rounded-lg bg-paper-deep px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink">{entry.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <time dateTime={entry.createdAt} className="text-xs text-ink-faint">
            {formatDate(entry.createdAt)}
          </time>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`${entry.name}님의 메시지 삭제`}
            className="text-xs text-ink-faint underline underline-offset-2 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
      {/* 하객 입력이라 마크다운을 렌더하지 않는다. 줄바꿈만 살린다. */}
      <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-ink-soft">{entry.message}</p>
    </li>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
