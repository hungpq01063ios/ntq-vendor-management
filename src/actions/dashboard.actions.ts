"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateAssignmentRates, type RateConfig } from "@/lib/rate-engine";


export interface ProjectBreakdownItem {
  projectId: string;
  projectName: string;
  clientName: string;
  market: string;
  headcount: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number;
}

export interface VendorBreakdownItem {
  vendorId: string;
  vendorName: string;
  headcount: number;
}

export interface AlertSummaryItem {
  id: string;
  jobType: { name: string };
  techStack: { name: string };
  level: { name: string };
  driftPct: number;
  status: string;
  triggeredAt: Date;
}

export interface DashboardData {
  summaryCards: {
    totalActiveHeadcount: number;
    totalActiveProjects: number;
    totalMonthlyRevenue: number;
    totalMonthlyCost: number;
    totalMargin: number;
    totalMarginPct: number;
    pendingAlertCount: number;
  };
  projectBreakdown: ProjectBreakdownItem[];
  vendorBreakdown: VendorBreakdownItem[];
  recentAlerts: AlertSummaryItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Parallel fetches
  const [assignments, configRows, alertCount, recentAlerts] =
    await Promise.all([
      db.assignment.findMany({
        where: { status: "ACTIVE" },
        include: {
          personnel: {
            include: { vendor: true },
          },
          project: true,
        },
      }),
      db.systemConfig.findMany(),
      db.rateAlert.count({
        where: { status: { in: ["PENDING", "FLAGGED_FOR_DU_LEADER"] } },
      }),
      db.rateAlert.findMany({
        orderBy: { triggeredAt: "desc" },
        take: 5,
        include: { jobType: true, techStack: true, level: true },
      }),
    ]);

  const [configs, markets] = await Promise.all([
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

  // Fetch fallback lookup IDs (Generic tech stack + General domain)
  const [genericStackRow, generalDomainRow] = await Promise.all([
    db.techStack.findFirst({ where: { name: "Generic" }, select: { id: true } }),
    db.domain.findFirst({ where: { name: "General" }, select: { id: true } }),
  ]);
  const GENERIC_STACK_ID = genericStackRow?.id ?? null;
  const GENERAL_DOMAIN_ID = generalDomainRow?.id ?? null;

  // Build deduped candidate conditions (Phương án 3: exact → General domain → Generic+General)
  type NormCond = { jobTypeId: string; techStackId: string; levelId: string; domainId: string; marketCode: string };
  const conditionSet = new Map<string, NormCond>();
  const uniqueProjectIds = new Set<string>();

  for (const a of assignments) {
    const p = a.personnel;
    const mc = a.project.marketCode;
    const ts = p.techStackId ?? GENERIC_STACK_ID;
    const dom = p.domainId ?? GENERAL_DOMAIN_ID;
    uniqueProjectIds.add(a.projectId);
    if (!ts || !dom) continue;

    const add = (c: NormCond) =>
      conditionSet.set(`${c.jobTypeId}|${c.techStackId}|${c.levelId}|${c.domainId}|${c.marketCode}`, c);
    add({ jobTypeId: p.jobTypeId, techStackId: ts, levelId: p.levelId, domainId: dom, marketCode: mc });
    if (dom !== GENERAL_DOMAIN_ID && GENERAL_DOMAIN_ID)
      add({ jobTypeId: p.jobTypeId, techStackId: ts, levelId: p.levelId, domainId: GENERAL_DOMAIN_ID, marketCode: mc });
    if (ts !== GENERIC_STACK_ID && GENERIC_STACK_ID && GENERAL_DOMAIN_ID)
      add({ jobTypeId: p.jobTypeId, techStackId: GENERIC_STACK_ID, levelId: p.levelId, domainId: GENERAL_DOMAIN_ID, marketCode: mc });
  }

  // Batch fetch rate norms + project overrides in parallel
  const [allNorms, allOverrides] = await Promise.all([
    conditionSet.size > 0
      ? db.rateNorm.findMany({ where: { OR: [...conditionSet.values()] } })
      : Promise.resolve([]),
    uniqueProjectIds.size > 0
      ? db.projectRateOverride.findMany({
          where: { projectId: { in: [...uniqueProjectIds] } },
        })
      : Promise.resolve([]),
  ]);

  // Build lookup maps
  const normMap = new Map<string, (typeof allNorms)[0]>();
  for (const n of allNorms) {
    normMap.set(`${n.jobTypeId}|${n.techStackId}|${n.levelId}|${n.domainId}|${n.marketCode}`, n);
  }

  const overrideMap = new Map<string, (typeof allOverrides)[0]>();
  for (const o of allOverrides) {
    overrideMap.set(`${o.projectId}|${o.jobTypeId}|${o.techStackId}|${o.levelId}|${o.domainId}`, o);
  }

  // Per-project and per-vendor aggregation
  type ProjectAgg = {
    projectId: string;
    projectName: string;
    clientName: string;
    market: string;
    headcount: number;
    revenue: number;
    cost: number;
  };
  const projectMap = new Map<string, ProjectAgg>();
  const vendorMap = new Map<string, { vendorName: string; headcount: number }>();

  for (const a of assignments) {
    const p = a.personnel;
    const mc = a.project.marketCode;
    const ts = p.techStackId ?? GENERIC_STACK_ID;
    const dom = p.domainId ?? GENERAL_DOMAIN_ID;
    // Fallback chain: exact → General domain → Generic+General
    const norm =
      (ts && dom ? normMap.get(`${p.jobTypeId}|${ts}|${p.levelId}|${dom}|${mc}`) : undefined) ??
      (ts && GENERAL_DOMAIN_ID ? normMap.get(`${p.jobTypeId}|${ts}|${p.levelId}|${GENERAL_DOMAIN_ID}|${mc}`) : undefined) ??
      (GENERIC_STACK_ID && GENERAL_DOMAIN_ID ? normMap.get(`${p.jobTypeId}|${GENERIC_STACK_ID}|${p.levelId}|${GENERAL_DOMAIN_ID}|${mc}`) : undefined);
    // Rule: norm market = project.marketCode
    const overrideKey = `${a.projectId}|${p.jobTypeId}|${p.techStackId}|${p.levelId}|${p.domainId}`;
    const override = overrideMap.get(overrideKey);

    const rateResult = calculateAssignmentRates(
      {
        personnelVendorRate: p.vendorRateActual,
        normRate: norm?.rateNorm ?? null,
        projectOverrideRate: override?.customBillingRate ?? null,
        memberBillingOverride: a.billingRateOverride,
        vendorRateOverride: a.vendorRateOverride,
      },
      rateConfig
    );

    // Project aggregation
    if (!projectMap.has(a.projectId)) {
      projectMap.set(a.projectId, {
        projectId: a.projectId,
        projectName: a.project.name,
        clientName: a.project.clientName,
        market: a.project.marketCode,
        headcount: 0,
        revenue: 0,
        cost: 0,
      });
    }
    const proj = projectMap.get(a.projectId)!;
    proj.headcount += 1;
    proj.revenue += rateResult.billingRate;
    proj.cost += rateResult.vendorRate;

    // Vendor aggregation
    if (!vendorMap.has(p.vendorId)) {
      vendorMap.set(p.vendorId, {
        vendorName: p.vendor.name,
        headcount: 0,
      });
    }
    vendorMap.get(p.vendorId)!.headcount += 1;
  }

  const projectBreakdown: ProjectBreakdownItem[] = [
    ...projectMap.values(),
  ].map((p: ProjectAgg) => ({
    ...p,
    margin: p.revenue - p.cost,
    marginPct: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : 0,
  }));

  const vendorBreakdown: VendorBreakdownItem[] = [
    ...vendorMap.entries(),
  ].map(([vendorId, v]) => ({
    vendorId,
    vendorName: v.vendorName,
    headcount: v.headcount,
  }));

  const totalMonthlyRevenue = projectBreakdown.reduce(
    (s, p) => s + p.revenue,
    0
  );
  const totalMonthlyCost = projectBreakdown.reduce((s, p) => s + p.cost, 0);
  const totalMargin = totalMonthlyRevenue - totalMonthlyCost;

  return {
    summaryCards: {
      totalActiveHeadcount: assignments.length,
      totalActiveProjects: uniqueProjectIds.size,
      totalMonthlyRevenue,
      totalMonthlyCost,
      totalMargin,
      totalMarginPct:
        totalMonthlyRevenue > 0 ? totalMargin / totalMonthlyRevenue : 0,
      pendingAlertCount: alertCount,
    },
    projectBreakdown,
    vendorBreakdown,
    recentAlerts: recentAlerts.map((a: (typeof recentAlerts)[number]) => ({
      id: a.id,
      jobType: { name: a.jobType.name },
      techStack: { name: a.techStack.name },
      level: { name: a.level.name },
      driftPct: a.driftPct,
      status: a.status,
      triggeredAt: a.triggeredAt,
    })),
  };
}
