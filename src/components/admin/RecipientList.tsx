"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ADMINS, adminLabel } from "@/config/admins";
import type { RecipientRow } from "@/lib/admin-letters";
import { useAuthor } from "./AuthorChip";
import { ShareButtons } from "./ShareButtons";

type Filter = "all" | "mine" | "todo";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "mine", label: "내가 쓴" },
  { id: "todo", label: "내가 안 쓴" },
];

/** 직렬화 때문에 서버에서 문자열로 넘어온 날짜를 그대로 받는다. */
export type SerializedRecipient = Omit<RecipientRow, "firstViewedAt" | "updatedAt"> & {
  firstViewedAt: string | null;
  updatedAt: string;
};

export function RecipientList({ recipients }: { recipients: SerializedRecipient[] }) {
  const { author } = useAuthor();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim();
    return recipients.filter((r) => {
      if (filter === "mine" && !r.authors.includes(author)) return false;
      if (filter === "todo" && r.authors.includes(author)) return false;
      if (q && !r.name.includes(q) && !r.phoneLast4.includes(q)) return false;
      return true;
    });
  }, [recipients, filter, author, query]);

  const myCount = recipients.filter((r) => r.authors.includes(author)).length;

  return (
    <div className="pt-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          하객 {recipients.length}명 · {adminLabel(author)}님이 쓴 편지 {myCount}통
        </p>
        <Link
          href="/admin/letters/new"
          className="rounded-full bg-ink px-4 py-2 text-xs text-paper"
        >
          편지 쓰기
        </Link>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 뒷자리로 찾기"
        className="mt-4 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent"
      />

      <div className="mt-3 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              filter === f.id
                ? "bg-ink text-paper"
                : "border border-line text-ink-soft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-faint">
          {recipients.length === 0
            ? "아직 편지가 없습니다. '편지 쓰기'로 시작하세요."
            : "조건에 맞는 하객이 없습니다."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {visible.map((recipient) => (
            <RecipientCard key={recipient.token} recipient={recipient} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RecipientCard({ recipient }: { recipient: SerializedRecipient }) {
  return (
    <li className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">
            {recipient.name}
            <span className="ml-2 text-xs text-ink-faint">···{recipient.phoneLast4}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ADMINS.map((admin) => {
              const written = recipient.authors.includes(admin.id);
              return (
                <Link
                  key={admin.id}
                  href={`/admin/letters/${recipient.token}?author=${admin.id}`}
                  className={`rounded-full px-2.5 py-1 text-[0.7rem] ${
                    written
                      ? "bg-accent/15 text-accent"
                      : "border border-dashed border-line text-ink-faint"
                  }`}
                >
                  {admin.label} {written ? "✓" : "쓰기"}
                </Link>
              );
            })}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] ${
            recipient.firstViewedAt
              ? "bg-paper-deep text-ink-faint"
              : "bg-accent/15 text-accent"
          }`}
        >
          {recipient.firstViewedAt ? `${recipient.viewCount}번 열람` : "아직 안 봤어요"}
        </span>
      </div>

      <div className="mt-3">
        <ShareButtons token={recipient.token} name={recipient.name} />
      </div>
    </li>
  );
}
