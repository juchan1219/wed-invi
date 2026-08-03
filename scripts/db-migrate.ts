/**
 * 마이그레이션 적용.
 *
 *   npm run db:migrate                              .env.local 을 읽는다 (로컬 DB)
 *   npm run db:migrate -- .env.production.local     다른 env 파일을 읽는다 (배포용 Neon)
 *
 * 배포 DB에 적용할 때는 `vercel env pull .env.production.local` 로 받아온 파일을 넘기면
 * 로컬 설정(.env.local)을 건드리지 않고 그대로 쓸 수 있다.
 *
 * drizzle-kit push 대신 generate + migrate를 쓰는 이유:
 *   - push는 websocket으로 붙는데 앱이 쓰는 건 HTTP 드라이버라, 로컬 프록시 환경에서
 *     연결 방식이 어긋난다. migrate는 앱과 똑같은 드라이버를 쓴다.
 *   - 마이그레이션 파일이 저장소에 남아 배포 때 무엇이 바뀌는지 눈으로 확인할 수 있다.
 */
import { existsSync, readFileSync } from "node:fs";
import { migrate } from "drizzle-orm/neon-http/migrator";
// 앱과 같은 연결 설정(로컬 프록시 예외 포함)을 재사용한다.
import { db } from "../src/db/index";

const envFile = process.argv[2] ?? ".env.local";

/**
 * process.loadEnvFile 은 이미 설정된 값을 덮어쓰지 않는다.
 * 배포용 파일을 명시적으로 넘겼을 때는 그 값이 이겨야 하므로 직접 파싱한다.
 */
function loadEnv(path: string) {
  if (!existsSync(path)) {
    console.error(`✗ ${path} 파일이 없습니다.`);
    console.error(`  로컬:   cp .env.example .env.local`);
    console.error(`  배포용: vercel env pull .env.production.local`);
    process.exit(1);
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    // 양쪽 따옴표만 벗긴다. (tsconfig 타깃이 ES2017이라 정규식 s 플래그 대신 [\s\S])
    process.env[key] = rawValue.trim().replace(/^["']([\s\S]*)["']$/, "$1");
  }
}

function main() {
  loadEnv(envFile);

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(`✗ ${envFile} 에 DATABASE_URL 이 없습니다.`);
    process.exit(1);
  }

  // 어느 DB에 적용하는지 눈으로 확인할 수 있게 호스트만 보여준다(비밀번호는 감춘다).
  const host = url.replace(/^[a-z]+:\/\/[^@]*@/, "").split("/")[0];
  console.log(`  env : ${envFile}`);
  console.log(`  대상: ${host}\n`);

  // tsx가 CJS로 변환하므로 top-level await는 쓸 수 없다.
  migrate(db(), { migrationsFolder: "./drizzle" })
    .then(() => console.log("✓ 마이그레이션 적용 완료"))
    .catch((error) => {
      console.error("✗ 마이그레이션 실패\n", error);
      process.exit(1);
    });
}

main();
