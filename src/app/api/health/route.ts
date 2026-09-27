import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

/**
 * DB가 살아있는지 확인하는 전용 라우트. GitHub Actions의 keepalive가 이걸 두드린다.
 *
 * **`/api/guestbook`을 대신 쓰면 안 된다.** 그 라우트는 DB 조회가 실패해도
 * 빈 배열과 200을 돌려준다(하객에게 에러를 보이지 않으려는 의도적 설계).
 * 그래서 DB가 정지돼도 200이 나오고, keepalive는 영원히 성공으로 보인다.
 *
 * 여기서는 반대로, **DB에 닿지 못하면 반드시 실패(503)해야 한다.**
 */

// 캐시된 응답이 대신 나가면 DB를 건드리지 않아 keepalive의 목적이 깨진다.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
  }

  try {
    await db().execute(sql`select 1`);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    // 로그에는 남기되 응답 본문에는 담지 않는다 — 공개 주소라 내부 정보가 새면 안 된다.
    console.error("[health] DB 연결 실패", error);
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
  }
}
