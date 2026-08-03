import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { guestbook } from "@/db/schema";
import { wedding } from "@/config/wedding";
import { SESSION_COOKIE, isSessionTokenValid } from "@/lib/auth";
import {
  hashPassword,
  isValidationError,
  listVisibleEntries,
  validateEntry,
  verifyPassword,
} from "@/lib/guestbook";

/** 연속 작성 제한(초). 쿠키 기반이라 우회는 가능하지만 실수·장난 반복은 막아준다. */
const COOLDOWN_SECONDS = 30;
const COOLDOWN_COOKIE = "wedinvi_gb";

export async function GET() {
  if (!wedding.guestbook.enabled || !isDatabaseConfigured()) {
    return NextResponse.json({ entries: [] });
  }
  try {
    return NextResponse.json({ entries: await listVisibleEntries() });
  } catch (error) {
    console.error("[guestbook] 목록 조회 실패", error);
    // 방명록이 죽어도 청첩장 본문은 멀쩡해야 한다.
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(request: Request) {
  if (!wedding.guestbook.enabled) {
    return NextResponse.json({ error: "방명록이 닫혀 있습니다." }, { status: 403 });
  }

  const cookie = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${COOLDOWN_COOKIE}=`));
  if (cookie) {
    return NextResponse.json(
      { error: `잠시 후에 다시 남겨주세요. (${COOLDOWN_SECONDS}초)` },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const validated = validateEntry(payload as Record<string, string>);
  if (isValidationError(validated)) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const [created] = await db()
    .insert(guestbook)
    .values({
      name: validated.name,
      message: validated.message,
      passwordHash: await hashPassword(validated.password),
    })
    .returning();

  const response = NextResponse.json({
    entry: {
      id: created.id,
      name: created.name,
      message: created.message,
      createdAt: created.createdAt.toISOString(),
    },
  });
  response.cookies.set(COOLDOWN_COOKIE, "1", {
    maxAge: COOLDOWN_SECONDS,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

/**
 * 삭제. 관리자는 비밀번호 없이, 하객은 작성 때 정한 4자리로.
 */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const isAdmin = isSessionTokenValid(
    request.headers
      .get("cookie")
      ?.split("; ")
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1),
  );

  const [entry] = await db().select().from(guestbook).where(eq(guestbook.id, id)).limit(1);
  if (!entry) {
    return NextResponse.json({ error: "이미 지워진 글입니다." }, { status: 404 });
  }

  if (!isAdmin) {
    let password = "";
    try {
      ({ password } = await request.json());
    } catch {
      // 아래 검증에서 걸린다.
    }
    if (!(await verifyPassword(String(password), entry.passwordHash))) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 403 });
    }
  }

  await db().delete(guestbook).where(eq(guestbook.id, id));
  return NextResponse.json({ ok: true });
}
