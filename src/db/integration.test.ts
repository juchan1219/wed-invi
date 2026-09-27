/**
 * 진짜 Postgres에 붙는 통합 테스트.
 *
 *   docker compose -f docker-compose.dev.yml up -d
 *   npm run db:migrate
 *   npm run test:db
 *
 * 드라이버를 Neon HTTP에서 postgres.js로 바꾸면서(2026-09-27) 추가했다.
 * 단위 테스트로는 잡히지 않는 것 — 실제 질의가 도는지, `sql` 템플릿이 그대로 동작하는지,
 * leftJoin 결과 모양이 같은지 — 를 확인한다.
 *
 * DATABASE_URL이 없으면 테스트를 건너뛴다. 실패가 아니라 skip이다.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { eq } from "drizzle-orm";

// tsx --test는 .env.local을 자동으로 읽지 않는다.
// CI에는 이 파일이 없고 loadEnvFile은 없는 파일에 ENOENT를 던지므로, 있을 때만 부른다.
// (CI는 워크플로에서 DATABASE_URL을 환경변수로 직접 넣어준다.)
if (existsSync(".env.local")) process.loadEnvFile?.(".env.local");

const HAS_DB = Boolean(process.env.DATABASE_URL);

/** 테스트가 만든 행만 지우기 위한 표식. 토큰 형식(base64url 12자)을 지켜야 한다. */
const TEST_TOKEN = "zzTESTzz0001";
const TEST_GUEST_NAME = "테스트하객_지워도됨";

describe("DB 통합", { skip: HAS_DB ? false : "DATABASE_URL 없음 — 도커를 띄우고 다시 실행하세요" }, () => {
  let db: typeof import("./index").db;
  let closeDb: typeof import("./index").closeDb;
  let schema: typeof import("./schema");
  let letters: typeof import("../lib/letters");
  let guestbookLib: typeof import("../lib/guestbook");

  before(async () => {
    ({ db, closeDb } = await import("./index"));
    schema = await import("./schema");
    letters = await import("../lib/letters");
    guestbookLib = await import("../lib/guestbook");
    await cleanup();
  });

  after(async () => {
    await cleanup();
    await closeDb();
  });

  async function cleanup() {
    await db().delete(schema.letters).where(eq(schema.letters.token, TEST_TOKEN));
    await db().delete(schema.recipients).where(eq(schema.recipients.token, TEST_TOKEN));
    await db().delete(schema.guestbook).where(eq(schema.guestbook.name, TEST_GUEST_NAME));
  }

  it("편지를 쓰고 토큰으로 읽는다", async () => {
    await db().insert(schema.recipients).values({
      token: TEST_TOKEN,
      name: "테스트",
      phoneLast4: "0000",
    });
    await db().insert(schema.letters).values({
      token: TEST_TOKEN,
      author: "yechan",
      body: "**테스트** 편지",
    });

    const found = await letters.getRecipient(TEST_TOKEN);
    assert.ok(found, "토큰으로 하객을 찾지 못했습니다");
    assert.equal(found.name, "테스트");
    assert.equal(found.letters.length, 1);
    assert.equal(found.letters[0].author, "yechan");
    assert.equal(found.letters[0].body, "**테스트** 편지");
  });

  it("편지가 없는 하객도 null이 아니라 빈 편지 목록으로 온다", async () => {
    // leftJoin이 편지 없는 행을 떨어뜨리지 않는지 — 여기가 깨지면 하객이 404를 본다.
    await db().delete(schema.letters).where(eq(schema.letters.token, TEST_TOKEN));

    const found = await letters.getRecipient(TEST_TOKEN);
    assert.ok(found, "편지가 없다고 하객까지 사라지면 안 됩니다");
    assert.equal(found.letters.length, 0);
  });

  it("열람을 기록하면 viewCount가 오른다", async () => {
    // sql`${col} + 1` 템플릿이 드라이버를 바꾼 뒤에도 도는지 확인한다.
    await letters.recordView(TEST_TOKEN);

    const [row] = await db()
      .select()
      .from(schema.recipients)
      .where(eq(schema.recipients.token, TEST_TOKEN));
    assert.equal(row.viewCount, 1);
    assert.ok(row.firstViewedAt, "최초 열람 시각이 기록되지 않았습니다");
  });

  it("방명록을 남기면 목록에 뜨고, 숨기면 빠진다", async () => {
    const [created] = await db()
      .insert(schema.guestbook)
      .values({
        name: TEST_GUEST_NAME,
        message: "축하합니다",
        passwordHash: await guestbookLib.hashPassword("1234"),
      })
      .returning();

    const visible = await guestbookLib.listVisibleEntries();
    assert.ok(
      visible.some((e) => e.name === TEST_GUEST_NAME),
      "방금 남긴 글이 목록에 없습니다",
    );

    await db()
      .update(schema.guestbook)
      .set({ hidden: true })
      .where(eq(schema.guestbook.id, created.id));

    const afterHide = await guestbookLib.listVisibleEntries();
    assert.ok(
      !afterHide.some((e) => e.name === TEST_GUEST_NAME),
      "숨긴 글이 하객 목록에 그대로 보입니다",
    );
  });

  it("비밀번호는 해시로 저장되고 원문과 대조된다", async () => {
    const hash = await guestbookLib.hashPassword("1234");
    assert.notEqual(hash, "1234");
    assert.equal(await guestbookLib.verifyPassword("1234", hash), true);
    assert.equal(await guestbookLib.verifyPassword("9999", hash), false);
  });
});
