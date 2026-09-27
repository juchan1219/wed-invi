/**
 * 마이그레이션 적용.
 *
 *   npm run db:migrate                              .env.local 을 읽는다 (로컬 DB)
 *   npm run db:migrate -- .env.production.local     다른 env 파일을 읽는다
 *   DIRECT_URL=... npm run db:migrate               env 파일 없이 환경변수만으로 (CI)
 *
 * **session pooler(`DIRECT_URL`)로 붙는다.** 앱이 쓰는 transaction pooler(6543)는
 * DDL과 advisory lock이 불안정해서 마이그레이션에 맞지 않는다.
 * `DIRECT_URL`이 없으면 `DATABASE_URL`로 떨어지는데, 로컬 도커에서는 둘이 같은 값이라 문제없다.
 *
 * drizzle-kit push 대신 generate + migrate를 쓰는 이유:
 *   - 마이그레이션 파일이 저장소에 남아 배포 때 무엇이 바뀌는지 눈으로 확인할 수 있다.
 *   - CI(.github/workflows/migrate.yml)가 같은 명령을 그대로 돌린다.
 */
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const envFile = process.argv[2] ?? ".env.local";

/**
 * process.loadEnvFile 은 이미 설정된 값을 덮어쓰지 않는다.
 * 배포용 파일을 명시적으로 넘겼을 때는 그 값이 이겨야 하므로 직접 파싱한다.
 */
function loadEnv(path: string) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    // 양쪽 따옴표만 벗긴다. (tsconfig 타깃이 ES2017이라 정규식 s 플래그 대신 [\s\S])
    process.env[key] = rawValue.trim().replace(/^["']([\s\S]*)["']$/, "$1");
  }
}

function resolveUrl(): string {
  if (existsSync(envFile)) {
    loadEnv(envFile);
    console.log(`  env : ${envFile}`);
  } else if (process.env.DIRECT_URL || process.env.DATABASE_URL) {
    // CI에는 env 파일이 없다. 환경변수가 이미 있으면 그대로 쓴다.
    console.log(`  env : (환경변수)`);
  } else {
    console.error(`✗ ${envFile} 파일도 없고 DIRECT_URL/DATABASE_URL 환경변수도 없습니다.`);
    console.error(`  로컬:   cp .env.example .env.local`);
    console.error(`  배포용: vercel env pull .env.production.local`);
    process.exit(1);
  }

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error(`✗ DIRECT_URL 이 없습니다. (DATABASE_URL 도 없습니다)`);
    process.exit(1);
  }
  return url;
}

function main() {
  const url = resolveUrl();

  // 어느 DB에 적용하는지 눈으로 확인할 수 있게 호스트만 보여준다(비밀번호는 감춘다).
  const host = url.replace(/^[a-z]+:\/\/[^@]*@/, "").split("/")[0];
  console.log(`  대상: ${host}\n`);

  // 마이그레이션은 단발 작업이라 커넥션 하나로 충분하다.
  const client = postgres(url, {
    max: 1,
    connect_timeout: 10,
    // DIRECT_URL에 실수로 transaction pooler(6543)를 넣었을 때 알 수 없는 실패 대신 그냥 돌아가게 한다.
    prepare: false,
    // "schema drizzle already exists, skipping" 같은 NOTICE를 삼킨다.
    // 재실행 때마다 뜨는 정상 안내인데, CI 로그에서는 실패처럼 보인다.
    onnotice: () => {},
  });

  // tsx가 CJS로 변환하므로 top-level await는 쓸 수 없다.
  migrate(drizzle(client), { migrationsFolder: "./drizzle" })
    .then(() => console.log("✓ 마이그레이션 적용 완료"))
    .catch((error) => {
      console.error("✗ 마이그레이션 실패\n", error);
      process.exitCode = 1;
    })
    // postgres.js는 커넥션을 열어둔 채로는 프로세스를 끝내지 않는다.
    .finally(() => client.end());
}

main();
