import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { letters, recipients } from "@/db/schema";
import { isAdminId } from "@/config/admins";
import { isValidLast4, makeToken, normalizeLast4, normalizeName } from "@/lib/token";

const MAX_NAME_LENGTH = 20;
const MAX_BODY_LENGTH = 20_000;

/**
 * 편지 저장(작성·수정 겸용).
 *
 * 하객은 이름+뒷자리로 식별되고 토큰은 거기서 파생되므로,
 * "새로 쓰기"와 "수정"이 결국 같은 연산이 된다 → upsert 하나로 처리한다.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const name = normalizeName(String(payload.name ?? ""));
  const phoneLast4 = normalizeLast4(String(payload.phoneLast4 ?? ""));
  const author = payload.author;
  const body = String(payload.body ?? "");

  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `이름을 1~${MAX_NAME_LENGTH}자로 입력해 주세요.` },
      { status: 400 },
    );
  }
  if (!isValidLast4(phoneLast4)) {
    return NextResponse.json({ error: "휴대폰 뒷 4자리를 숫자로 입력해 주세요." }, { status: 400 });
  }
  if (!isAdminId(author)) {
    return NextResponse.json({ error: "작성자가 올바르지 않습니다." }, { status: 400 });
  }
  if (body.trim().length === 0) {
    return NextResponse.json({ error: "편지 내용을 입력해 주세요." }, { status: 400 });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `편지가 너무 깁니다. ${MAX_BODY_LENGTH.toLocaleString()}자 이내로 써주세요.` },
      { status: 400 },
    );
  }

  const token = makeToken(name, phoneLast4);
  const now = new Date();

  await db()
    .insert(recipients)
    .values({ token, name, phoneLast4, createdAt: now, updatedAt: now })
    // 이미 있는 하객이면 표기만 최신으로 맞춘다(토큰은 그대로).
    .onConflictDoUpdate({
      target: recipients.token,
      set: { name, phoneLast4, updatedAt: now },
    });

  await db()
    .insert(letters)
    .values({ token, author, body, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [letters.token, letters.author],
      set: { body, updatedAt: now },
    });

  return NextResponse.json({ token });
}

/** 편지 한 통 삭제. 하객 자체는 남긴다(다른 사람이 쓴 편지가 있을 수 있으므로). */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const author = url.searchParams.get("author");

  if (!token || !isAdminId(author)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  await db()
    .delete(letters)
    .where(and(eq(letters.token, token), eq(letters.author, author)));

  // 편지가 하나도 안 남은 하객은 목록에서 지운다 — 빈 껍데기가 쌓이지 않게.
  const remaining = await db()
    .select({ id: letters.id })
    .from(letters)
    .where(eq(letters.token, token))
    .limit(1);

  if (remaining.length === 0) {
    await db().delete(recipients).where(eq(recipients.token, token));
  }

  return NextResponse.json({ ok: true, recipientRemoved: remaining.length === 0 });
}
