/**
 * 마이그레이션 적용.  npm run db:migrate
 *
 * drizzle-kit push 대신 generate + migrate를 쓰는 이유:
 *   - push는 websocket으로 붙는데 앱이 쓰는 건 HTTP 드라이버라, 로컬 프록시 환경에서
 *     연결 방식이 어긋난다. migrate는 앱과 똑같은 드라이버를 쓴다.
 *   - 마이그레이션 파일이 저장소에 남아 배포 때 무엇이 바뀌는지 눈으로 확인할 수 있다.
 */
import { migrate } from "drizzle-orm/neon-http/migrator";
// 앱과 같은 연결 설정(로컬 프록시 예외 포함)을 재사용한다.
import { db } from "../src/db/index";

process.loadEnvFile?.(".env.local");

function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL이 없습니다. .env.local을 확인하세요. (.env.example 참고)");
    process.exit(1);
  }

  // tsx가 CJS로 변환하므로 top-level await는 쓸 수 없다.
  migrate(db(), { migrationsFolder: "./drizzle" })
    .then(() => console.log("✓ 마이그레이션 적용 완료"))
    .catch((error) => {
      console.error("✗ 마이그레이션 실패\n", error);
      process.exit(1);
    });
}

main();
