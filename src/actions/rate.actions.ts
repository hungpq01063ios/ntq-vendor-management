"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { RateNormSchema } from "@/lib/validations";
import { calculateVendorTargetRate } from "@/lib/rate-engine";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { z } from "zod";
import type { ConfigKey, AlertStatus } from "@prisma/client";

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
      ...(filter?.market && { marketCode: filter.market }),
    },
    include: { jobType: true, techStack: true, level: true, domain: true },
    orderBy: [{ jobType: { order: "asc" } }, { level: { order: "asc" } }],
  });
}

export async function upsertRateNorm(
  data: z.infer<typeof RateNormSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("DU_LEADER");
    const validated = RateNormSchema.parse(data);
    const { effectiveDate, ...rest } = validated;

    const norm = await db.rateNorm.upsert({
      where: {
        jobTypeId_techStackId_levelId_domainId_marketCode: {
          jobTypeId: rest.jobTypeId,
          techStackId: rest.techStackId,
          levelId: rest.levelId,
          domainId: rest.domainId,
          marketCode: rest.marketCode,
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
    return { success: true, data: { id: norm.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteRateNorm(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    await db.rateNorm.delete({ where: { id } });
    revalidatePath("/rates");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ─── System Config ─────────────────────────────────────────────────────────────

export async function getSystemConfigs(): Promise<Record<string, number>> {
  const rows = await db.systemConfig.findMany();
  return Object.fromEntries(
    rows.map((r: { key: string; value: string }) => [r.key, parseFloat(r.value)])
  );
}

export async function updateSystemConfig(
  key: ConfigKey,
  value: number
): Promise<ActionResult> {
  try {
    const session = await requireRole("DU_LEADER");
    await db.systemConfig.upsert({
      where: { key },
      update: { value: value.toString(), updatedById: session.user.id },
      create: { key, value: value.toString(), updatedById: session.user.id },
    });
    revalidatePath("/rates/config");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
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
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
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
    return { success: true, data: { id: override.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteProjectRateOverride(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    const override = await db.projectRateOverride.delete({ where: { id } });
    revalidatePath(`/projects/${override.projectId}/rates`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ─── Rate Norm For Personnel (assignment suggestion) ───────────────────────────

export async function getRateNormForPersonnel(
  personnelId: string,
  projectId: string
) {
  const [personnel, configs, markets] = await Promise.all([
    db.personnel.findUnique({
      where: { id: personnelId },
      include: { vendor: true },
    }),
    db.systemConfig.findMany(),
    db.marketConfig.findMany({ where: { isActive: true } }),
  ]);

  if (!personnel) return null;

  const [override, rateNorm] = await Promise.all([
    db.projectRateOverride.findFirst({
      where: {
        projectId,
        jobTypeId: personnel.jobTypeId,
        techStackId: personnel.techStackId ?? undefined,
        levelId: personnel.levelId,
        domainId: personnel.domainId ?? undefined,
      },
    }),
    db.rateNorm.findFirst({
      where: {
        jobTypeId: personnel.jobTypeId,
        techStackId: personnel.techStackId ?? undefined,
        levelId: personnel.levelId,
        domainId: personnel.domainId ?? undefined,
        marketCode: personnel.vendor.marketCode,
      },
    }),
  ]);

  const configMap = Object.fromEntries(
    configs.map((c: { key: string; value: string }) => [c.key, parseFloat(c.value)])
  );
  const marketRateFactors = Object.fromEntries(
    markets.map((m) => [m.code, m.marketRateFactorPct])
  );
  const rateConfig = {
    overheadRatePct: configMap["OVERHEAD_RATE_PCT"] ?? 0.2,
    driftAlertThresholdPct: configMap["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15,
    marketRateFactors,
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
      ? calculateVendorTargetRate(billingRate, rateConfig, personnel.vendor.marketCode)
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

// ─── Alert status ──────────────────────────────────────────────────────────────

export async function updateAlertStatusFromRate(
  id: string,
  status: AlertStatus,
  note?: string
): Promise<ActionResult> {
  try {
    await requireAuth();
    if (status === "DISMISSED" && !note?.trim()) {
      return {
        success: false,
        error: "A note is required when dismissing an alert",
      };
    }
    await db.rateAlert.update({
      where: { id },
      data: { status, ...(note ? { note } : {}) },
    });
    revalidatePath("/alerts");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
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
