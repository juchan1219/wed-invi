import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guestbook } from "@/db/schema";

/**
 * 방명록 숨김/복구.
 *
 * 삭제가 아니라 숨김을 기본으로 둔 이유: 관리자가 실수로 눌러도 되돌릴 수 있어야 한다.
 * 영구 삭제는 하객용 DELETE /api/guestbook 를 관리자 세션으로 호출하면 된다.
 */
export async function PATCH(request: Request) {
  let payload: { id?: unknown; hidden?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const id = Number(payload.id);
  const hidden = payload.hidden;

  if (!Number.isInteger(id) || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  await db().update(guestbook).set({ hidden }).where(eq(guestbook.id, id));
  return NextResponse.json({ ok: true });
}
