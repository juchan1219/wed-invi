import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP 드라이버를 쓰는 이유:
 * Vercel Functions는 요청마다 새 인스턴스가 뜨기 때문에 TCP 커넥션 풀을 유지할 수 없다.
 * HTTP 드라이버는 매 질의를 단발 요청으로 보내 커넥션 고갈이 생기지 않는다.
 * (트랜잭션이 필요 없는 이 프로젝트에는 이 방식이 맞다.)
 */

/** docker-compose.dev.yml 의 로컬 프록시를 가리키는 호스트 */
const LOCAL_PROXY_HOST = "db.localtest.me";

/**
 * 로컬 개발용 예외. 로컬 프록시는 평문 HTTP로 서비스하는데
 * Neon 드라이버는 기본이 HTTPS라서 그대로는 붙지 못한다.
 * 배포 환경(*.neon.tech)에서는 이 분기가 절대 타지 않는다.
 */
function configureLocalProxy(url: string): void {
  if (!url.includes(LOCAL_PROXY_HOST)) return;
  neonConfig.fetchEndpoint = (host, port) =>
    host === LOCAL_PROXY_HOST ? `http://${host}:${port}/sql` : `https://${host}/sql`;
}

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL이 없습니다. .env.local에 Neon 연결 문자열을 넣어주세요. (.env.example 참고)",
    );
  }
  configureLocalProxy(url);
  return drizzle(neon(url), { schema });
}

/**
 * 모듈 로드 시점이 아니라 처음 쓸 때 만든다.
 * 그래야 DB가 필요 없는 페이지(기본 청첩장)는 DATABASE_URL 없이도 빌드·렌더된다.
 */
let cached: ReturnType<typeof createDb> | null = null;

export function db() {
  cached ??= createDb();
  return cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
