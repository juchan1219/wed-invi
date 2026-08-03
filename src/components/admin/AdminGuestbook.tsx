"use client";

import { useState } from "react";
import type { GuestbookView } from "@/lib/guestbook";
import { useToast } from "@/components/ui/Toast";

type Entry = GuestbookView & { hidden: boolean };

export function AdminGuestbook({ entries: initial }: { entries: Entry[] }) {
  const toast = useToast();
  const [entries, setEntries] = useState(initial);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleHidden(entry: Entry) {
    setBusyId(entry.id);
    try {
      const res = await fetch("/api/admin/guestbook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, hidden: !entry.hidden }),
      });
      if (!res.ok) {
        toast("변경에 실패했습니다");
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, hidden: !e.hidden } : e)),
      );
      toast(entry.hidden ? "다시 보이게 했습니다" : "숨겼습니다");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(entry: Entry) {
    if (!window.confirm(`${entry.name}님의 메시지를 완전히 지울까요? 되돌릴 수 없습니다.`)) return;

    setBusyId(entry.id);
    try {
      // 관리자 세션이면 비밀번호 없이 지워진다.
      const res = await fetch(`/api/guestbook?id=${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("삭제에 실패했습니다");
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast("삭제했습니다");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="pt-5">
      <p className="text-sm text-ink-soft">
        방명록 {entries.length}개 · 숨김 {entries.filter((e) => e.hidden).length}개
      </p>

      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-faint">아직 남겨진 메시지가 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`rounded-lg border border-line p-4 ${entry.hidden ? "opacity-50" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-ink">
                  {entry.name}
                  {entry.hidden && <span className="ml-2 text-xs text-ink-faint">숨김</span>}
                </p>
                <time dateTime={entry.createdAt} className="shrink-0 text-xs text-ink-faint">
                  {new Intl.DateTimeFormat("ko-KR", {
                    timeZone: "Asia/Seoul",
                    dateStyle: "short",
                  }).format(new Date(entry.createdAt))}
                </time>
              </div>
              <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-ink-soft">
                {entry.message}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleHidden(entry)}
                  disabled={busyId === entry.id}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft disabled:opacity-50"
                >
                  {entry.hidden ? "다시 보이기" : "숨기기"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  disabled={busyId === entry.id}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
