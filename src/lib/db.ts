import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Build time: không có DATABASE_URL, trả về client mặc định (sẽ không được dùng)
    return new PrismaClient();
  }

  // Runtime: dùng PrismaPg adapter với pg driver
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");

  // Pool config để tránh stale connection trên Supabase pooler:
  // - connectionTimeoutMillis: timeout sau 10s thay vì treo vô hạn
  // - idleTimeoutMillis: đóng connection idle sau 30s
  // - max: giới hạn connection pool (Supabase free tier có giới hạn)
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  });

  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

