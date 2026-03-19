import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const MARKETS = [
  { code: "ENGLISH", name: "English Market",   marketRateFactorPct: 0.80, order: 1 },
  { code: "US",      name: "United States",    marketRateFactorPct: 0.80, order: 2 },
  { code: "EU",      name: "European Union",   marketRateFactorPct: 0.78, order: 3 },
  { code: "APAC",    name: "Asia Pacific",     marketRateFactorPct: 0.75, order: 4 },
  { code: "JAPAN",   name: "Japan",            marketRateFactorPct: 0.72, order: 5 },
  { code: "KOREA",   name: "Korea",            marketRateFactorPct: 0.70, order: 6 },
  { code: "VN",      name: "Vietnam",          marketRateFactorPct: 0.65, order: 7 },
];

async function main() {
  console.log("🌍 Seeding MarketConfig...");
  for (const m of MARKETS) {
    await db.marketConfig.upsert({
      where: { code: m.code },
      update: { name: m.name, marketRateFactorPct: m.marketRateFactorPct, order: m.order },
      create: m,
    });
    console.log(`  ✓ ${m.code} — ${m.name} (factor: ${m.marketRateFactorPct * 100}%)`);
  }
  console.log("✅ MarketConfig seeded!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
