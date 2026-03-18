"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  calculateVendorTargetRate,
  isDriftAlert,
} from "@/lib/rate-engine";

export async function getAlerts(filter?: { status?: string }) {
  return db.rateAlert.findMany({
    where: filter?.status ? { status: filter.status as never } : undefined,
    include: { jobType: true, techStack: true, level: true, triggeredBy: true },
    orderBy: { triggeredAt: "desc" },
  });
}

export async function getPendingAlertCount(): Promise<number> {
  return db.rateAlert.count({ where: { status: "PENDING" } });
}

export async function checkAndCreateDriftAlerts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  // 1. Load system config
  const configs = await db.systemConfig.findMany();
  const configMap = Object.fromEntries(
    configs.map((c: { key: string; value: string }) => [c.key, parseFloat(c.value)])
  );
  const rateConfig = {
    overheadRatePct: configMap["OVERHEAD_RATE_PCT"] ?? 0.2,
    marketRateFactorPct: configMap["MARKET_RATE_FACTOR_PCT"] ?? 0.8,
    driftAlertThresholdPct: configMap["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15,
  };

  // 2. Load all active assignments with personnel
  const assignments = await db.assignment.findMany({
    where: { status: "ACTIVE" },
    include: { personnel: { include: { vendor: true } } },
  });

  // 3. Group by jobTypeId + techStackId + levelId
  type GroupData = {
    jobTypeId: string;
    techStackId: string;
    levelId: string;
    vendorRates: number[];
    normRate: number | null;
  };
  const groups = new Map<string, GroupData>();

  for (const a of assignments) {
    const p = a.personnel;
    const key = `${p.jobTypeId}|${p.techStackId}|${p.levelId}`;

    if (!groups.has(key)) {
      const norm = await db.rateNorm.findFirst({
        where: {
          jobTypeId: p.jobTypeId,
          techStackId: p.techStackId,
          levelId: p.levelId,
          market: p.vendor.market,
        },
      });
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
        techStackId: group.techStackId,
        levelId: group.levelId,
        status: { in: ["PENDING", "FLAGGED_FOR_DU_LEADER"] },
      },
    });

    if (!existing) {
      await db.rateAlert.create({
        data: {
          jobTypeId: group.jobTypeId,
          techStackId: group.techStackId,
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
  return { success: true, created };
}

export async function updateAlertStatus(
  id: string,
  status: string,
  note?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (status === "DISMISSED" && !note?.trim()) {
    throw new Error("A note is required when dismissing an alert");
  }

  await db.rateAlert.update({
    where: { id },
    data: {
      status: status as never,
      ...(note ? { note } : {}),
    },
  });

  revalidatePath("/alerts");
  return { success: true };
}

// Kept for backward compatibility
export async function dismissAlert(id: string, note: string) {
  return updateAlertStatus(id, "DISMISSED", note);
}

export async function resolveAlert(id: string) {
  return updateAlertStatus(id, "RESOLVED");
}
