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

// ─── Clone rate từ một market sang market khác ────────────────────────────────

export async function cloneRatesFromMarket(
  sourceMarketCode: string,
  targetMarketCode: string,
  overwrite = false
): Promise<ActionResult<{ cloned: number; skipped: number }>> {
  try {
    const session = await requireRole("DU_LEADER");

    const sourceRates = await db.rateNorm.findMany({
      where: { marketCode: sourceMarketCode },
    });

    if (sourceRates.length === 0) {
      return { success: false, error: `Không có dữ liệu rate cho thị trường ${sourceMarketCode}` };
    }

    let cloned = 0;
    let skipped = 0;

    for (const rate of sourceRates) {
      const key = {
        jobTypeId: rate.jobTypeId,
        techStackId: rate.techStackId,
        levelId: rate.levelId,
        domainId: rate.domainId,
        marketCode: targetMarketCode,
      };

      if (overwrite) {
        await db.rateNorm.upsert({
          where: { jobTypeId_techStackId_levelId_domainId_marketCode: key },
          update: { rateMin: rate.rateMin, rateNorm: rate.rateNorm, rateMax: rate.rateMax },
          create: { ...key, rateMin: rate.rateMin, rateNorm: rate.rateNorm, rateMax: rate.rateMax, createdById: session.user.id },
        });
        cloned++;
      } else {
        const existing = await db.rateNorm.findUnique({
          where: { jobTypeId_techStackId_levelId_domainId_marketCode: key },
        });
        if (existing) {
          skipped++;
        } else {
          await db.rateNorm.create({
            data: { ...key, rateMin: rate.rateMin, rateNorm: rate.rateNorm, rateMax: rate.rateMax, createdById: session.user.id },
          });
          cloned++;
        }
      }
    }

    revalidatePath("/rates");
    return { success: true, data: { cloned, skipped } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createRateNorm(
  data: z.infer<typeof RateNormSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("DU_LEADER");
    const validated = RateNormSchema.parse(data);
    const { effectiveDate, ...rest } = validated;

    // Check for existing record with same natural key
    const existing = await db.rateNorm.findUnique({
      where: {
        jobTypeId_techStackId_levelId_domainId_marketCode: {
          jobTypeId: rest.jobTypeId,
          techStackId: rest.techStackId,
          levelId: rest.levelId,
          domainId: rest.domainId,
          marketCode: rest.marketCode,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Định mức rate cho tổ hợp này đã tồn tại. Hãy chỉnh sửa định mức hiện có thay vì tạo mới.",
      };
    }

    const norm = await db.rateNorm.create({
      data: {
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

export async function updateRateNorm(
  id: string,
  data: z.infer<typeof RateNormSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("DU_LEADER");
    const validated = RateNormSchema.parse(data);
    const { effectiveDate, ...rest } = validated;

    const norm = await db.rateNorm.update({
      where: { id },
      data: {
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

// Keep for internal use (cloneRatesFromMarket uses upsert intentionally)
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
    // Sanitize: empty string from form select → null (avoid FK violation)
    const techStackId = data.techStackId || null;
    const domainId = data.domainId || null;
    const override = await db.projectRateOverride.upsert({
      where: {
        projectId_jobTypeId_techStackId_levelId_domainId: {
          projectId,
          jobTypeId: data.jobTypeId,
          techStackId: techStackId,
          levelId: data.levelId,
          domainId: domainId,
        } as Parameters<typeof db.projectRateOverride.upsert>[0]["where"]["projectId_jobTypeId_techStackId_levelId_domainId"],
      },
      update: {
        customBillingRate: data.customBillingRate,
        setById: session.user.id,
        setAt: new Date(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: {
        projectId,
        jobTypeId: data.jobTypeId,
        techStackId: techStackId as any,
        levelId: data.levelId,
        domainId: domainId as any,
        customBillingRate: data.customBillingRate,
        setById: session.user.id,
      } as any,
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
  const [personnel, project, configs, markets] = await Promise.all([
    db.personnel.findUnique({
      where: { id: personnelId },
      include: { vendor: true },
    }),
    db.project.findUnique({ where: { id: projectId } }),
    db.systemConfig.findMany(),
    db.marketConfig.findMany({ where: { isActive: true } }),
  ]);

  if (!personnel || !project) return null;

  // Rule: norm market = project.marketCode
  const marketCode = project.marketCode;

  // Fetch fallback IDs for norm lookup (Phương án 3)
  const [genericStackRow, generalDomainRow] = await Promise.all([
    db.techStack.findFirst({ where: { name: "Generic" }, select: { id: true } }),
    db.domain.findFirst({ where: { name: "General" }, select: { id: true } }),
  ]);
  const GENERIC_STACK_ID = genericStackRow?.id;
  const GENERAL_DOMAIN_ID = generalDomainRow?.id;

  // Null-map: null techStack → Generic, null domain → General
  const ts = personnel.techStackId ?? GENERIC_STACK_ID;
  const dom = personnel.domainId ?? GENERAL_DOMAIN_ID;

  // Build candidate conditions (exact + domain fallback + generic fallback)
  type NormCond = { jobTypeId: string; techStackId: string; levelId: string; domainId: string; marketCode: string };
  const candidates: NormCond[] = [];
  if (ts && dom) {
    candidates.push({ jobTypeId: personnel.jobTypeId, techStackId: ts, levelId: personnel.levelId, domainId: dom, marketCode });
    if (dom !== GENERAL_DOMAIN_ID && GENERAL_DOMAIN_ID) {
      candidates.push({ jobTypeId: personnel.jobTypeId, techStackId: ts, levelId: personnel.levelId, domainId: GENERAL_DOMAIN_ID, marketCode });
    }
    if (ts !== GENERIC_STACK_ID && GENERIC_STACK_ID && GENERAL_DOMAIN_ID) {
      candidates.push({ jobTypeId: personnel.jobTypeId, techStackId: GENERIC_STACK_ID, levelId: personnel.levelId, domainId: GENERAL_DOMAIN_ID, marketCode });
    }
  }

  const [override, candidateNorms] = await Promise.all([
    db.projectRateOverride.findFirst({
      where: {
        projectId,
        jobTypeId: personnel.jobTypeId,
        techStackId: personnel.techStackId ?? undefined,
        levelId: personnel.levelId,
        domainId: personnel.domainId ?? undefined,
      },
    }),
    candidates.length > 0
      ? db.rateNorm.findMany({ where: { OR: candidates } })
      : Promise.resolve([]),
  ]);

  // Priority resolution: exact → General domain → Generic+General
  const normKey = (techStackId: string, domainId: string) =>
    `${personnel.jobTypeId}|${techStackId}|${personnel.levelId}|${domainId}|${marketCode}`;
  const normMap = new Map(candidateNorms.map((n) => [`${n.jobTypeId}|${n.techStackId}|${n.levelId}|${n.domainId}|${n.marketCode}`, n]));

  const rateNorm =
    (ts && dom ? normMap.get(normKey(ts, dom)) : undefined) ??
    (ts && GENERAL_DOMAIN_ID ? normMap.get(normKey(ts, GENERAL_DOMAIN_ID)) : undefined) ??
    (GENERIC_STACK_ID && GENERAL_DOMAIN_ID ? normMap.get(normKey(GENERIC_STACK_ID, GENERAL_DOMAIN_ID)) : undefined);

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
      ? calculateVendorTargetRate(billingRate, rateConfig, marketCode)
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
