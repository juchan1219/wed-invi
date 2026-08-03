import { and, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db, isDatabaseConfigured } from "@/db";
import { letters, recipients } from "@/db/schema";
import { ADMIN_IDS, isAdminId, type AdminId } from "@/config/admins";
import { isTokenShaped } from "./token";

export type LetterView = { author: AdminId; body: string };

export type RecipientView = {
  token: string;
  name: string;
  letters: LetterView[];
};

/**
 * 토큰으로 하객과 편지를 찾는다. 없으면 null.
 *
 * generateMetadata와 페이지 본문이 같은 데이터를 쓰므로 React cache로 감싸
 * 요청당 한 번만 질의한다.
 */
export const getRecipient = cache(async (token: string): Promise<RecipientView | null> => {
  // DB를 안 붙인 상태에서도 기본 청첩장은 떠야 한다.
  if (!isDatabaseConfigured()) return null;
  // 형식이 안 맞으면 질의할 필요도 없다.
  if (!isTokenShaped(token)) return null;

  const rows = await db()
    .select({
      token: recipients.token,
      name: recipients.name,
      author: letters.author,
      body: letters.body,
    })
    .from(recipients)
    .leftJoin(letters, eq(letters.token, recipients.token))
    .where(eq(recipients.token, token));

  if (rows.length === 0) return null;

  return {
    token: rows[0].token,
    name: rows[0].name,
    letters: rows
      // leftJoin이라 편지가 없으면 author/body가 null로 온다.
      .filter((r): r is typeof r & { author: string; body: string } =>
        Boolean(r.author && r.body),
      )
      .filter((r) => isAdminId(r.author))
      .map((r) => ({ author: r.author as AdminId, body: r.body }))
      // 편지 순서는 admins.ts의 선언 순서를 따른다(예찬 → 주은).
      .sort((a, b) => ADMIN_IDS.indexOf(a.author) - ADMIN_IDS.indexOf(b.author)),
  };
});

/**
 * 열람 기록. 관리자 목록에서 "아직 안 봤어요"를 보여주기 위한 것이라
 * 실패해도 페이지 렌더를 막지 않는다.
 */
export async function recordView(token: string): Promise<void> {
  if (!isDatabaseConfigured() || !isTokenShaped(token)) return;

  try {
    await db()
      .update(recipients)
      .set({
        viewCount: sql`${recipients.viewCount} + 1`,
        // 최초 열람 시각만 남긴다 — 이미 값이 있으면 그대로 둔다.
        firstViewedAt: sql`coalesce(${recipients.firstViewedAt}, now())`,
      })
      .where(eq(recipients.token, token));
  } catch (error) {
    console.error("[letters] 열람 기록 실패", error);
  }
}

/** 관리자 화면에서 특정 하객의 특정 작성자 편지를 불러올 때 */
export async function getLetter(token: string, author: AdminId) {
  const [row] = await db()
    .select()
    .from(letters)
    .where(and(eq(letters.token, token), eq(letters.author, author)))
    .limit(1);
  return row ?? null;
}
