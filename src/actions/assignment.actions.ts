"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { AssignmentSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import { calculateAssignmentRates, type RateConfig, type RateResult } from "@/lib/rate-engine";
import type { ActionResult } from "@/types";
import type { z } from "zod";
import type { AssignmentStatus } from "@prisma/client";

export type AssignmentInput = z.infer<typeof AssignmentSchema>;

export async function getAssignmentsByProject(projectId: string) {
  return db.assignment.findMany({
    where: { projectId },
    include: {
      personnel: {
        include: {
          vendor: true,
          jobType: true,
          techStack: true,
          level: true,
          domain: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getAssignments(filter?: {
  projectId?: string;
  personnelId?: string;
  status?: string;
}) {
  return db.assignment.findMany({
    where: {
      ...(filter?.projectId && { projectId: filter.projectId }),
      ...(filter?.personnelId && { personnelId: filter.personnelId }),
      ...(filter?.status && { status: filter.status as AssignmentStatus }),
    },
    include: {
      personnel: {
        include: {
          vendor: true,
          jobType: true,
          techStack: true,
          level: true,
          domain: true,
        },
      },
      project: true,
    },
    orderBy: { startDate: "desc" },
  });
}

export async function createAssignment(
  data: AssignmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = AssignmentSchema.parse(data);
    const assignment = await db.assignment.create({ data: validated });

    // Update personnel status to ON_PROJECT
    await db.personnel.update({
      where: { id: validated.personnelId },
      data: { status: "ON_PROJECT" },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${validated.projectId}`);
    revalidatePath("/personnel");
    return { success: true, data: { id: assignment.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateAssignment(
  id: string,
  data: AssignmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = AssignmentSchema.parse(data);
    const assignment = await db.assignment.update({
      where: { id },
      data: validated,
    });
    revalidatePath(`/projects/${validated.projectId}`);
    revalidatePath("/personnel");
    return { success: true, data: { id: assignment.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const assignment = await db.assignment.findUnique({ where: { id } });
    if (!assignment) return { success: false, error: "Assignment not found" };

    await db.assignment.delete({ where: { id } });

    // If personnel has no more active assignments → set AVAILABLE
    const activeCount = await db.assignment.count({
      where: { personnelId: assignment.personnelId, status: "ACTIVE" },
    });
    if (activeCount === 0) {
      await db.personnel.update({
        where: { id: assignment.personnelId },
        data: { status: "AVAILABLE" },
      });
    }

    revalidatePath(`/projects/${assignment.projectId}`);
    revalidatePath("/personnel");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function endAssignment(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const assignment = await db.assignment.update({
      where: { id },
      data: { status: "ENDED", endDate: new Date() },
    });

    // If personnel has no more active assignments → set AVAILABLE
    const activeCount = await db.assignment.count({
      where: { personnelId: assignment.personnelId, status: "ACTIVE" },
    });
    if (activeCount === 0) {
      await db.personnel.update({
        where: { id: assignment.personnelId },
        data: { status: "AVAILABLE" },
      });
    }

    revalidatePath(`/projects/${assignment.projectId}`);
    revalidatePath("/personnel");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ─── Project P&L Rate Breakdown ────────────────────────────────────────────────

export interface AssignmentRateRow {
  assignmentId: string;
  personnelId: string;
  personnelName: string;
  vendorName: string;
  roleInProject: string | null;
  status: AssignmentStatus;
  rates: RateResult;
}

export interface ProjectRateBreakdown {
  assignments: AssignmentRateRow[];
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  totalMarginPct: number;
}

export async function getProjectRateBreakdown(
  projectId: string
): Promise<ProjectRateBreakdown> {
  const [assignments, configs, markets] = await Promise.all([
    db.assignment.findMany({
      where: { projectId },
      include: {
        personnel: {
          include: { vendor: true },
        },
        project: true,
      },
      orderBy: { startDate: "desc" },
    }),
    db.systemConfig.findMany(),
    db.marketConfig.findMany({ where: { isActive: true } }),
  ]);

  const configMap = Object.fromEntries(
    configs.map((c) => [c.key, parseFloat(c.value)])
  );
  const marketRateFactors = Object.fromEntries(
    markets.map((m) => [m.code, m.marketRateFactorPct])
  );
  const rateConfig: RateConfig = {
    overheadRatePct: configMap["OVERHEAD_RATE_PCT"] ?? 0.2,
    driftAlertThresholdPct: configMap["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15,
    marketRateFactors,
  };

  // Batch fetch norms + project overrides
  const personnelList = assignments.map((a) => a.personnel);
  const normKeySet = new Set(
    personnelList.map(
      (p) => `${p.jobTypeId}|${p.techStackId}|${p.levelId}|${p.domainId}|${p.vendor.marketCode}`
    )
  );

  const [allNorms, allOverrides] = await Promise.all([
    normKeySet.size > 0
      ? db.rateNorm.findMany({
          where: {
            OR: [...normKeySet].map((k) => {
              const [jobTypeId, techStackId, levelId, domainId, marketCode] = k.split("|");
              return { jobTypeId, techStackId, levelId, domainId, marketCode };
            }),
          },
        })
      : Promise.resolve([]),
    db.projectRateOverride.findMany({ where: { projectId } }),
  ]);

  const normMap = new Map(
    allNorms.map((n) => [
      `${n.jobTypeId}|${n.techStackId}|${n.levelId}|${n.domainId}|${n.marketCode}`,
      n,
    ])
  );
  const overrideMap = new Map(
    allOverrides.map((o) => [
      `${o.jobTypeId}|${o.techStackId}|${o.levelId}|${o.domainId}`,
      o,
    ])
  );

  const rows: AssignmentRateRow[] = assignments.map((a) => {
    const p = a.personnel;
    const normKey = `${p.jobTypeId}|${p.techStackId}|${p.levelId}|${p.domainId}|${p.vendor.marketCode}`;
    const overrideKey = `${p.jobTypeId}|${p.techStackId}|${p.levelId}|${p.domainId}`;

    const norm = normMap.get(normKey);
    const override = overrideMap.get(overrideKey);

    const rates = calculateAssignmentRates(
      {
        personnelVendorRate: p.vendorRateActual,
        normRate: norm?.rateNorm ?? null,
        projectOverrideRate: override?.customBillingRate ?? null,
        memberBillingOverride: a.billingRateOverride,
        vendorRateOverride: a.vendorRateOverride,
      },
      rateConfig
    );

    return {
      assignmentId: a.id,
      personnelId: p.id,
      personnelName: p.fullName,
      vendorName: p.vendor.name,
      roleInProject: a.roleInProject,
      status: a.status,
      rates,
    };
  });

  // Only active assignments count toward P&L
  const activeRows = rows.filter((r) => r.status === "ACTIVE");
  const totalRevenue = activeRows.reduce((s, r) => s + r.rates.billingRate, 0);
  const totalCost = activeRows.reduce((s, r) => s + r.rates.vendorRate, 0);
  const totalMargin = totalRevenue - totalCost;

  return {
    assignments: rows,
    totalRevenue,
    totalCost,
    totalMargin,
    totalMarginPct: totalRevenue > 0 ? totalMargin / totalRevenue : 0,
  };
}
