"use server";

import { db } from "@/lib/db";

export async function getJobTypes() {
  return db.jobType.findMany({ orderBy: { order: "asc" } });
}

export async function getTechStacks() {
  return db.techStack.findMany({ orderBy: { order: "asc" } });
}

export async function getLevels() {
  return db.level.findMany({ orderBy: { order: "asc" } });
}

export async function getDomains() {
  return db.domain.findMany({ orderBy: { order: "asc" } });
}

export async function getVendorOptions() {
  return db.vendor.findMany({
    where: { status: { not: "INACTIVE" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getFormLookups() {
  const [jobTypes, techStacks, levels, domains, vendors] = await Promise.all([
    db.jobType.findMany({ orderBy: { order: "asc" } }),
    db.techStack.findMany({ orderBy: { order: "asc" } }),
    db.level.findMany({ orderBy: { order: "asc" } }),
    db.domain.findMany({ orderBy: { order: "asc" } }),
    db.vendor.findMany({
      where: { status: { not: "INACTIVE" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { jobTypes, techStacks, levels, domains, vendors };
}
