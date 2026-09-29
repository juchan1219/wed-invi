"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
// 서버·hydration 때는 false, 그 뒤 브라우저에서는 true. 구독할 변화가 없어 subscribe는 아무것도 하지 않는다.
const subscribeNothing = () => () => {};
function useIsBrowser() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function Guestbook() {
  const toast = useToast();
  const isBrowser = useIsBrowser();
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
        {/* 입력 폼은 브라우저에서만 그린다. 비밀번호 관리자·자동완성 확장이 hydration 전에 <form>·입력칸에
            속성을 끼워 넣어 불일치 경고가 났다(입력칸, 이후 <form>에서 재현). 요소마다 경고를 끄는 대신
            폼을 hydration 비교에서 뺀다. 페이지 맨 아래라 서버 렌더가 필요 없고, 제출은 원래 JS(fetch)로만 된다.
            그리기 전에는 폼 높이(217px)만큼 자리를 잡아 둔다. */}
        {isBrowser ? <GuestbookForm onCreated={handleCreated} /> : <div aria-hidden="true" className="h-[13.5625rem]" />}

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

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,6.5rem)] gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={wedding.guestbook.maxNameLength}
          placeholder="이름"
          aria-label="이름"
          className="min-w-0 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
          style={{ minWidth: 0, width: "100%" }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="비밀번호 4자리"
          aria-label="삭제용 비밀번호 4자리"
          className="min-w-0 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
          style={{ minWidth: 0, width: "100%" }}
        />
      </div>
      <textarea
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
