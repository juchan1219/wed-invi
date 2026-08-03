import { defineConfig } from "drizzle-kit";

// drizzle-kit은 Next 런타임 밖에서 도므로 .env.local을 직접 읽어야 한다.
process.loadEnvFile?.(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
