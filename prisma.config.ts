import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for Prisma CLI (Next.js loads it automatically)
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // Dùng DIRECT_URL (session pooler, port 5432) cho Prisma CLI
    // Transaction pooler (pgbouncer=true) không tương thích với db push/migrate
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
  },
});
