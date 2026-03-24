"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  calculateVendorTargetRate,
  isDriftAlert,
} from "@/lib/rate-engine";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { AlertStatus } from "@prisma/client";

export async function getAlerts(filter?: { status?: string }) {
  return db.rateAlert.findMany({
    where: filter?.status
      ? { status: filter.status as AlertStatus }
      : undefined,
    include: { jobType: true, techStack: true, level: true, triggeredBy: true },
    orderBy: { triggeredAt: "desc" },
  });
}

export async function getPendingAlertCount(): Promise<number> {
  return db.rateAlert.count({ where: { status: "PENDING" } });
}

export async function checkAndCreateDriftAlerts(): Promise<
  ActionResult<{ created: number }>
> {
  try {
    const session = await requireRole("DU_LEADER");

    // 1. Load system config + market factors
    const [configs, markets] = await Promise.all([
      db.systemConfig.findMany(),
      db.marketConfig.findMany({ where: { isActive: true } }),
    ]);
    const configMap = Object.fromEntries(
      configs.map((c: { key: string; value: string }) => [
        c.key,
        parseFloat(c.value),
      ])
    );
    const marketRateFactors = Object.fromEntries(
      markets.map((m) => [m.code, m.marketRateFactorPct])
    );
    const rateConfig = {
      overheadRatePct: configMap["OVERHEAD_RATE_PCT"] ?? 0.2,
      driftAlertThresholdPct: configMap["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15,
      marketRateFactors,
    };

    // 2. Load all active assignments with personnel
    const assignments = await db.assignment.findMany({
      where: { status: "ACTIVE" },
      include: { personnel: { include: { vendor: true } }, project: true },
    });

    // Fetch fallback IDs (Phương án 3)
    const [genericStackRow, generalDomainRow] = await Promise.all([
      db.techStack.findFirst({ where: { name: "Generic" }, select: { id: true } }),
      db.domain.findFirst({ where: { name: "General" }, select: { id: true } }),
    ]);
    const GENERIC_STACK_ID = genericStackRow?.id ?? null;
    const GENERAL_DOMAIN_ID = generalDomainRow?.id ?? null;

    // Build candidate norm conditions for batch fetch
    type NormCond = { jobTypeId: string; techStackId: string; levelId: string; domainId: string; marketCode: string };
    const conditionSet = new Map<string, NormCond>();
    for (const a of assignments) {
      const p = a.personnel;
      const mc = a.project.marketCode;
      const ts = p.techStackId ?? GENERIC_STACK_ID;
      const dom = p.domainId ?? GENERAL_DOMAIN_ID;
      if (!ts || !dom) continue;
      const add = (c: NormCond) =>
        conditionSet.set(`${c.jobTypeId}|${c.techStackId}|${c.levelId}|${c.domainId}|${c.marketCode}`, c);
      add({ jobTypeId: p.jobTypeId, techStackId: ts, levelId: p.levelId, domainId: dom, marketCode: mc });
      if (dom !== GENERAL_DOMAIN_ID && GENERAL_DOMAIN_ID)
        add({ jobTypeId: p.jobTypeId, techStackId: ts, levelId: p.levelId, domainId: GENERAL_DOMAIN_ID, marketCode: mc });
      if (ts !== GENERIC_STACK_ID && GENERIC_STACK_ID && GENERAL_DOMAIN_ID)
        add({ jobTypeId: p.jobTypeId, techStackId: GENERIC_STACK_ID, levelId: p.levelId, domainId: GENERAL_DOMAIN_ID, marketCode: mc });
    }
    const allNorms = conditionSet.size > 0
      ? await db.rateNorm.findMany({ where: { OR: [...conditionSet.values()] } })
      : [];
    const normMap = new Map(allNorms.map((n) => [`${n.jobTypeId}|${n.techStackId}|${n.levelId}|${n.domainId}|${n.marketCode}`, n]));

    // 3. Group by jobTypeId + techStackId + levelId + domainId + market
    type GroupData = {
      jobTypeId: string;
      techStackId: string | null;
      levelId: string;
      vendorRates: number[];
      normRate: number | null;
    };
    const groups = new Map<string, GroupData>();

    for (const a of assignments) {
      const p = a.personnel;
      const mc = a.project.marketCode;
      const key = `${p.jobTypeId}|${p.techStackId}|${p.levelId}|${p.domainId}|${mc}`;

      if (!groups.has(key)) {
        const ts = p.techStackId ?? GENERIC_STACK_ID;
        const dom = p.domainId ?? GENERAL_DOMAIN_ID;
        // Fallback chain: exact → General domain → Generic+General
        const norm =
          (ts && dom ? normMap.get(`${p.jobTypeId}|${ts}|${p.levelId}|${dom}|${mc}`) : undefined) ??
          (ts && GENERAL_DOMAIN_ID ? normMap.get(`${p.jobTypeId}|${ts}|${p.levelId}|${GENERAL_DOMAIN_ID}|${mc}`) : undefined) ??
          (GENERIC_STACK_ID && GENERAL_DOMAIN_ID ? normMap.get(`${p.jobTypeId}|${GENERIC_STACK_ID}|${p.levelId}|${GENERAL_DOMAIN_ID}|${mc}`) : undefined);
        groups.set(key, {
          jobTypeId: p.jobTypeId,
          techStackId: p.techStackId,
          levelId: p.levelId,
          vendorRates: [],
          normRate: norm?.rateNorm ?? null,
        });
      }

      const vendorRate = a.vendorRateOverride ?? p.vendorRateActual;
      if (vendorRate !== null && vendorRate !== undefined) {
        groups.get(key)!.vendorRates.push(vendorRate);
      }
    }

    // 4. Check and create alerts
    let created = 0;
    for (const group of groups.values()) {
      if (!group.normRate || group.vendorRates.length === 0) continue;

      const avgVendorRate =
        group.vendorRates.reduce((a, b) => a + b, 0) / group.vendorRates.length;
      const vendorTargetRate = calculateVendorTargetRate(
        group.normRate,
        rateConfig
      );

      if (
        !isDriftAlert(
          avgVendorRate,
          vendorTargetRate,
          rateConfig.driftAlertThresholdPct
        )
      )
        continue;

      const driftPct =
        ((avgVendorRate - vendorTargetRate) / vendorTargetRate) * 100;

      // Check for existing open alert
      const existing = await db.rateAlert.findFirst({
        where: {
          jobTypeId: group.jobTypeId,
          techStackId: group.techStackId ?? undefined,
          levelId: group.levelId,
          status: { in: ["PENDING", "FLAGGED_FOR_DU_LEADER"] },
        },
      });

      if (!existing) {
        await db.rateAlert.create({
          data: {
            jobTypeId: group.jobTypeId,
            techStackId: group.techStackId ?? "UNKNOWN",  // RateAlert requires string; skip null stacks
            levelId: group.levelId,
            normRate: group.normRate,
            actualAvgVendorRate: avgVendorRate,
            driftPct,
            triggeredById: session.user.id,
            status: "PENDING",
          },
        });
        created++;
      }
    }

    revalidatePath("/alerts");
    return { success: true, data: { created } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateAlertStatus(
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

export async function dismissAlert(
  id: string,
  note: string
): Promise<ActionResult> {
  return updateAlertStatus(id, "DISMISSED", note);
}

export async function resolveAlert(id: string): Promise<ActionResult> {
  return updateAlertStatus(id, "RESOLVED");
}
