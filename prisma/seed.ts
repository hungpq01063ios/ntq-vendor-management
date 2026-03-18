import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const JOB_TYPES = [
  { name: "Developer", order: 1 },
  { name: "Tester", order: 2 },
  { name: "BA", order: 3 },
  { name: "DevOps", order: 4 },
  { name: "Designer", order: 5 },
  { name: "PM", order: 6 },
  { name: "QA", order: 7 },
];

const TECH_STACKS = [
  { name: "Java", order: 1 },
  { name: "Golang", order: 2 },
  { name: ".NET", order: 3 },
  { name: "React", order: 4 },
  { name: "Python", order: 5 },
  { name: "Node.js", order: 6 },
  { name: "Generic", order: 99 },
];

const LEVELS = [
  { name: "Junior", order: 1 },
  { name: "Middle", order: 2 },
  { name: "Senior", order: 3 },
  { name: "Leader", order: 4 },
  { name: "Principal", order: 5 },
];

const DOMAINS = [
  { name: "Fintech", order: 1 },
  { name: "Healthcare", order: 2 },
  { name: "E-commerce", order: 3 },
  { name: "General", order: 99 },
];

const SYSTEM_CONFIGS = [
  { key: "OVERHEAD_RATE_PCT" as const, value: "0.20" },
  { key: "MARKET_RATE_FACTOR_PCT" as const, value: "0.80" },
  { key: "DRIFT_ALERT_THRESHOLD_PCT" as const, value: "0.15" },
];

// Rate norm data: [jobType, techStack, level, rateMin, rateNorm, rateMax]
const RATE_NORMS: [string, string, string, number, number, number][] = [
  ["Developer", "Java", "Junior", 800, 1000, 1200],
  ["Developer", "Java", "Middle", 1200, 1500, 1800],
  ["Developer", "Java", "Senior", 1800, 2200, 2600],
  ["Developer", "Java", "Leader", 2500, 3000, 3500],
  ["Developer", "React", "Junior", 700, 900, 1100],
  ["Developer", "React", "Middle", 1100, 1400, 1700],
  ["Developer", "React", "Senior", 1700, 2100, 2500],
  ["Developer", "Golang", "Junior", 900, 1100, 1300],
  ["Developer", "Golang", "Middle", 1300, 1600, 1900],
  ["Developer", "Golang", "Senior", 1900, 2300, 2700],
  ["Developer", ".NET", "Junior", 800, 1000, 1200],
  ["Developer", ".NET", "Middle", 1200, 1500, 1800],
  ["Developer", ".NET", "Senior", 1800, 2200, 2600],
  ["Tester", "Generic", "Junior", 600, 750, 900],
  ["Tester", "Generic", "Middle", 900, 1100, 1300],
  ["Tester", "Generic", "Senior", 1300, 1600, 1900],
  ["BA", "Generic", "Middle", 1000, 1300, 1600],
  ["BA", "Generic", "Senior", 1500, 1900, 2300],
  ["DevOps", "Generic", "Middle", 1400, 1700, 2000],
  ["DevOps", "Generic", "Senior", 2000, 2500, 3000],
  ["PM", "Generic", "Middle", 1200, 1500, 1800],
  ["PM", "Generic", "Senior", 1800, 2200, 2600],
  ["PM", "Generic", "Leader", 2500, 3000, 3500],
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create lookup tables
  console.log("Creating job types...");
  await db.jobType.createMany({ data: JOB_TYPES, skipDuplicates: true });

  console.log("Creating tech stacks...");
  await db.techStack.createMany({ data: TECH_STACKS, skipDuplicates: true });

  console.log("Creating levels...");
  await db.level.createMany({ data: LEVELS, skipDuplicates: true });

  console.log("Creating domains...");
  await db.domain.createMany({ data: DOMAINS, skipDuplicates: true });

  // 2. Create admin user (DU Leader)
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await db.user.upsert({
    where: { email: "admin@ntq.com.vn" },
    update: {},
    create: {
      email: "admin@ntq.com.vn",
      name: "DU Leader",
      role: "DU_LEADER",
      password: hashedPassword,
    },
  });

  // 3. Create vendor PIC user
  const picPassword = await bcrypt.hash("vendor123", 12);
  await db.user.upsert({
    where: { email: "pic@ntq.com.vn" },
    update: {},
    create: {
      email: "pic@ntq.com.vn",
      name: "Vendor PIC",
      role: "VENDOR_PIC",
      password: picPassword,
    },
  });

  // 4. System config defaults
  console.log("Creating system configs...");
  for (const config of SYSTEM_CONFIGS) {
    await db.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, updatedById: adminUser.id },
      create: { ...config, updatedById: adminUser.id },
    });
  }

  // 5. Seed rate norms (General domain, ENGLISH market)
  console.log("Creating rate norms...");
  const jobTypeMap = Object.fromEntries(
    (await db.jobType.findMany()).map((jt) => [jt.name, jt.id])
  );
  const techStackMap = Object.fromEntries(
    (await db.techStack.findMany()).map((ts) => [ts.name, ts.id])
  );
  const levelMap = Object.fromEntries(
    (await db.level.findMany()).map((l) => [l.name, l.id])
  );
  const domainMap = Object.fromEntries(
    (await db.domain.findMany()).map((d) => [d.name, d.id])
  );

  for (const [jobType, techStack, level, rateMin, rateNorm, rateMax] of RATE_NORMS) {
    const jobTypeId = jobTypeMap[jobType];
    const techStackId = techStackMap[techStack];
    const levelId = levelMap[level];
    const domainId = domainMap["General"];

    if (!jobTypeId || !techStackId || !levelId || !domainId) continue;

    await db.rateNorm.upsert({
      where: {
        jobTypeId_techStackId_levelId_domainId_market: {
          jobTypeId,
          techStackId,
          levelId,
          domainId,
          market: "ENGLISH",
        },
      },
      update: { rateMin, rateNorm, rateMax },
      create: {
        jobTypeId,
        techStackId,
        levelId,
        domainId,
        market: "ENGLISH",
        rateMin,
        rateNorm,
        rateMax,
        createdById: adminUser.id,
      },
    });
  }

  // 6. Sample vendors
  console.log("Creating sample vendors...");
  const vendor1 = await db.vendor.upsert({
    where: { id: "sample-vendor-1" },
    update: {},
    create: {
      id: "sample-vendor-1",
      name: "TechViet Solutions",
      contactName: "Nguyen Van A",
      contactEmail: "contact@techviet.com",
      contactPhone: "+84 901 234 567",
      companySize: 50,
      market: "ENGLISH",
      languageStrength: ["Vietnamese", "English"],
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      createdById: adminUser.id,
    },
  });

  const vendor2 = await db.vendor.upsert({
    where: { id: "sample-vendor-2" },
    update: {},
    create: {
      id: "sample-vendor-2",
      name: "CodeBase Vietnam",
      contactName: "Tran Thi B",
      contactEmail: "hr@codebase.vn",
      contactPhone: "+84 912 345 678",
      companySize: 30,
      market: "JAPAN",
      languageStrength: ["Vietnamese", "Japanese"],
      status: "ACTIVE",
      startDate: new Date("2023-06-01"),
      createdById: adminUser.id,
    },
  });

  // 7. Sample project
  console.log("Creating sample projects...");
  await db.project.upsert({
    where: { id: "sample-project-1" },
    update: {},
    create: {
      id: "sample-project-1",
      name: "FinApp Portal",
      market: "ENGLISH",
      clientName: "FinCorp Inc",
      startDate: new Date("2024-03-01"),
      status: "ACTIVE",
      notes: "Core banking web portal",
      createdById: adminUser.id,
    },
  });

  // 8. Sample personnel
  console.log("Creating sample personnel...");
  await db.personnel.upsert({
    where: { id: "sample-person-1" },
    update: {},
    create: {
      id: "sample-person-1",
      vendorId: vendor1.id,
      fullName: "Le Van C",
      jobTypeId: jobTypeMap["Developer"],
      techStackId: techStackMap["Java"],
      levelId: levelMap["Senior"],
      domainId: domainMap["Fintech"],
      englishLevel: "ADVANCED",
      leadership: false,
      vendorRateActual: 1800,
      status: "AVAILABLE",
      interviewStatus: "PASSED",
      createdById: adminUser.id,
    },
  });

  await db.personnel.upsert({
    where: { id: "sample-person-2" },
    update: {},
    create: {
      id: "sample-person-2",
      vendorId: vendor2.id,
      fullName: "Pham Thi D",
      jobTypeId: jobTypeMap["Tester"],
      techStackId: techStackMap["Generic"],
      levelId: levelMap["Middle"],
      domainId: domainMap["General"],
      englishLevel: "INTERMEDIATE",
      leadership: false,
      vendorRateActual: 1000,
      status: "AVAILABLE",
      interviewStatus: "NEW",
      createdById: adminUser.id,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: admin@ntq.com.vn / admin123");
  console.log("   PIC:   pic@ntq.com.vn / vendor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
