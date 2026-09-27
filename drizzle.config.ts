import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit은 Next 런타임 밖에서 도므로 .env.local을 직접 읽어야 한다.
// loadEnvFile은 없는 파일에 ENOENT를 던진다. 환경변수만 있는 환경(CI)도 있으므로 존재할 때만 부른다.
if (existsSync(".env.local")) process.loadEnvFile?.(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit은 스키마를 읽고 쓰므로 앱과 달리 session pooler(DIRECT_URL)로 붙어야 한다.
    // 로컬 도커에서는 DATABASE_URL과 같은 값이다.
    url: (process.env.DIRECT_URL || process.env.DATABASE_URL)!,
  },
});
