import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { letters, recipients } from "@/db/schema";
import { ADMIN_IDS, isAdminId, type AdminId } from "@/config/admins";

export type RecipientRow = {
  token: string;
  name: string;
  phoneLast4: string;
  viewCount: number;
  firstViewedAt: Date | null;
  updatedAt: Date;
  /** 이 하객에게 편지를 쓴 사람들 (예찬 → 주은 순) */
  authors: AdminId[];
};

/**
 * 관리자 목록용 하객 전체.
 * 하객 수가 많아야 수백 명이라 페이지네이션 없이 한 번에 가져온다.
 */
export async function listRecipients(): Promise<RecipientRow[]> {
  const rows = await db()
    .select({
      token: recipients.token,
      name: recipients.name,
      phoneLast4: recipients.phoneLast4,
      viewCount: recipients.viewCount,
      firstViewedAt: recipients.firstViewedAt,
      updatedAt: recipients.updatedAt,
      author: letters.author,
    })
    .from(recipients)
    .leftJoin(letters, eq(letters.token, recipients.token))
    .orderBy(desc(recipients.updatedAt));

  // leftJoin이라 편지 수만큼 행이 늘어난다 → 하객 단위로 접는다.
  const byToken = new Map<string, RecipientRow>();

  for (const row of rows) {
    let entry = byToken.get(row.token);
    if (!entry) {
      entry = {
        token: row.token,
        name: row.name,
        phoneLast4: row.phoneLast4,
        viewCount: row.viewCount,
        firstViewedAt: row.firstViewedAt,
        updatedAt: row.updatedAt,
        authors: [],
      };
      byToken.set(row.token, entry);
    }
    if (isAdminId(row.author)) entry.authors.push(row.author);
  }

  for (const entry of byToken.values()) {
    entry.authors.sort((a, b) => ADMIN_IDS.indexOf(a) - ADMIN_IDS.indexOf(b));
  }

  return [...byToken.values()];
}
