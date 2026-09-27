import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/**
 * Supabase의 **transaction pooler**(6543)에 붙는다.
 *
 * Vercel Functions는 요청마다 새 인스턴스가 뜨기 때문에 TCP 커넥션 풀을 유지할 수 없다.
 * pooler가 연결을 다중화해 주므로 인스턴스가 몇 개 뜨든 DB 커넥션이 고갈되지 않는다.
 *
 * Supabase의 direct 연결(5432)은 IPv6 전용이라 Vercel 함수에서 아예 붙지 못한다.
 * 마이그레이션처럼 DDL이 필요한 작업은 session pooler(`DIRECT_URL`)를 쓴다 — scripts/db-migrate.ts.
 */
function createClient(url: string) {
  return postgres(url, {
    // transaction 모드 pooler는 prepared statement를 지원하지 않는다. 켜두면 질의가 실패한다.
    prepare: false,
    // 서버리스 인스턴스 하나가 커넥션을 하나만 쥐게 한다.
    max: 1,
    // 인스턴스가 얼어붙은(frozen) 뒤 커넥션이 서버 쪽에 남지 않도록 짧게 끊는다.
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function requireUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL이 없습니다. .env.local에 Supabase 연결 문자열을 넣어주세요. (.env.example 참고)",
    );
  }
  return url;
}

function createDb() {
  const client = createClient(requireUrl());
  return { client, orm: drizzle(client, { schema }) };
}

/**
 * 모듈 로드 시점이 아니라 처음 쓸 때 만든다.
 * 그래야 DB가 필요 없는 페이지(기본 청첩장)는 DATABASE_URL 없이도 빌드·렌더된다.
 */
let cached: ReturnType<typeof createDb> | null = null;

export function db() {
  cached ??= createDb();
  return cached.orm;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * 커넥션을 닫는다. **테스트·스크립트 전용.**
 * postgres.js는 커넥션이 열려 있는 동안 프로세스를 끝내지 않는다.
 * 서버리스 런타임에서는 부를 일이 없다 — 인스턴스가 통째로 사라진다.
 */
export async function closeDb(): Promise<void> {
  if (!cached) return;
  const { client } = cached;
  cached = null;
  await client.end();
}
