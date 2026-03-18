"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { RateNormSchema } from "@/lib/validations";
import { calculateVendorTargetRate } from "@/lib/rate-engine";
import type { z } from "zod";

// ─── Rate Norms ────────────────────────────────────────────────────────────────

export async function getRateNorms(filter?: {
  jobTypeId?: string;
  techStackId?: string;
  levelId?: string;
  domainId?: string;
  market?: string;
}) {
  return db.rateNorm.findMany({
    where: {
      ...(filter?.jobTypeId && { jobTypeId: filter.jobTypeId }),
      ...(filter?.techStackId && { techStackId: filter.techStackId }),
      ...(filter?.levelId && { levelId: filter.levelId }),
      ...(filter?.domainId && { domainId: filter.domainId }),
      ...(filter?.market && { market: filter.market as never }),
    },
    include: { jobType: true, techStack: true, level: true, domain: true },
    orderBy: [{ jobType: { order: "asc" } }, { level: { order: "asc" } }],
  });
}

export async function upsertRateNorm(data: z.infer<typeof RateNormSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  const validated = RateNormSchema.parse(data);
  const { effectiveDate, ...rest } = validated;

  const norm = await db.rateNorm.upsert({
    where: {
      jobTypeId_techStackId_levelId_domainId_market: {
        jobTypeId: rest.jobTypeId,
        techStackId: rest.techStackId,
        levelId: rest.levelId,
        domainId: rest.domainId,
        market: rest.market,
      },
    },
    update: {
      ...rest,
      effectiveDate: effectiveDate ?? new Date(),
      createdById: session.user.id,
    },
    create: {
      ...rest,
      effectiveDate: effectiveDate ?? new Date(),
      createdById: session.user.id,
    },
  });

  revalidatePath("/rates");
  return { success: true, norm };
}

export async function deleteRateNorm(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  await db.rateNorm.delete({ where: { id } });
  revalidatePath("/rates");
  return { success: true };
}

// ─── System Config ─────────────────────────────────────────────────────────────

export async function getSystemConfigs(): Promise<Record<string, number>> {
  const rows = await db.systemConfig.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));
}

export async function updateSystemConfig(key: string, value: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  await db.systemConfig.upsert({
    where: { key: key as never },
    update: { value: value.toString(), updatedById: session.user.id },
    create: {
      key: key as never,
      value: value.toString(),
      updatedById: session.user.id,
    },
  });

  revalidatePath("/rates/config");
  return { success: true };
}

// ─── Project Rate Overrides ────────────────────────────────────────────────────

export async function getProjectRateOverrides(projectId: string) {
  return db.projectRateOverride.findMany({
    where: { projectId },
    include: { jobType: true, techStack: true, level: true, domain: true },
    orderBy: { setAt: "desc" },
  });
}

export async function upsertProjectRateOverride(
  projectId: string,
  data: {
    jobTypeId: string;
    techStackId: string;
    levelId: string;
    domainId: string;
    customBillingRate: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const override = await db.projectRateOverride.upsert({
    where: {
      projectId_jobTypeId_techStackId_levelId_domainId: {
        projectId,
        jobTypeId: data.jobTypeId,
        techStackId: data.techStackId,
        levelId: data.levelId,
        domainId: data.domainId,
      },
    },
    update: {
      customBillingRate: data.customBillingRate,
      setById: session.user.id,
      setAt: new Date(),
    },
    create: { projectId, ...data, setById: session.user.id },
  });

  revalidatePath(`/projects/${projectId}/rates`);
  revalidatePath(`/projects/${projectId}`);
  return { success: true, override };
}

export async function deleteProjectRateOverride(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  const override = await db.projectRateOverride.delete({ where: { id } });
  revalidatePath(`/projects/${override.projectId}/rates`);
  return { success: true };
}

// ─── Rate Norm For Personnel (assignment suggestion) ───────────────────────────

export async function getRateNormForPersonnel(
  personnelId: string,
  projectId: string
) {
  const [personnel, configs] = await Promise.all([
    db.personnel.findUnique({
      where: { id: personnelId },
      include: { vendor: true },
    }),
    db.systemConfig.findMany(),
  ]);

  if (!personnel) return null;

  const [override, rateNorm] = await Promise.all([
    db.projectRateOverride.findFirst({
      where: {
        projectId,
        jobTypeId: personnel.jobTypeId,
        techStackId: personnel.techStackId,
        levelId: personnel.levelId,
        domainId: personnel.domainId,
      },
    }),
    db.rateNorm.findFirst({
      where: {
        jobTypeId: personnel.jobTypeId,
        techStackId: personnel.techStackId,
        levelId: personnel.levelId,
        domainId: personnel.domainId,
        market: personnel.vendor.market,
      },
    }),
  ]);

  const configMap = Object.fromEntries(
    configs.map((c) => [c.key, parseFloat(c.value)])
  );
  const rateConfig = {
    overheadRatePct: configMap["OVERHEAD_RATE_PCT"] ?? 0.2,
    marketRateFactorPct: configMap["MARKET_RATE_FACTOR_PCT"] ?? 0.8,
    driftAlertThresholdPct: configMap["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15,
  };

  const normRate = rateNorm?.rateNorm ?? null;
  const projectOverrideRate = override?.customBillingRate ?? null;
  const billingRate = projectOverrideRate ?? normRate;
  const billingRateSource: "norm" | "project_override" | "manual" =
    projectOverrideRate !== null
      ? "project_override"
      : normRate !== null
        ? "norm"
        : "manual";

  const vendorTargetRate =
    billingRate !== null
      ? calculateVendorTargetRate(billingRate, rateConfig)
      : null;

  return {
    normRate,
    projectOverrideRate,
    billingRate,
    vendorTargetRate,
    vendorRateActual: personnel.vendorRateActual ?? null,
    billingRateSource,
    config: rateConfig,
  };
}

// ─── Lookup (kept for backward compat) ────────────────────────────────────────

export async function getLookupData() {
  const [jobTypes, techStacks, levels, domains] = await Promise.all([
    db.jobType.findMany({ orderBy: { order: "asc" } }),
    db.techStack.findMany({ orderBy: { order: "asc" } }),
    db.level.findMany({ orderBy: { order: "asc" } }),
    db.domain.findMany({ orderBy: { order: "asc" } }),
  ]);
  return { jobTypes, techStacks, levels, domains };
}
