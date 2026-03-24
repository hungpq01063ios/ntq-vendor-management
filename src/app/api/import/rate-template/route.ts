import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildRateTemplate, bufferFromWb } from "@/lib/excel-templates";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const marketCode = searchParams.get("market") ?? undefined;

  const [jobTypes, techStacks, levels, domains, markets, existingRates] = await Promise.all([
    db.jobType.findMany({ orderBy: { order: "asc" } }),
    db.techStack.findMany({ orderBy: { order: "asc" } }),
    db.level.findMany({ orderBy: { order: "asc" } }),
    db.domain.findMany({ orderBy: { order: "asc" } }),
    db.marketConfig.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    // Nếu có market, fetch dữ liệu hiện có để pre-fill
    marketCode
      ? db.rateNorm.findMany({
          where: { marketCode },
          include: { jobType: true, techStack: true, level: true, domain: true },
          orderBy: [{ jobType: { order: "asc" } }, { level: { order: "asc" } }],
        })
      : Promise.resolve([]),
  ]);

  const marketLabel = markets.find((m) => m.code === marketCode)?.name ?? marketCode ?? "all";
  const fileName = marketCode
    ? `rate-norm-${marketCode.toLowerCase()}.xlsx`
    : "rate-norm-import-template.xlsx";

  const wb = buildRateTemplate({
    jobTypes,
    techStacks,
    levels,
    domains,
    markets,
    existingRates: existingRates.map((r) => ({
      jobType: r.jobType.name,
      techStack: r.techStack.name,
      level: r.level.name,
      domain: r.domain.name,
      marketCode: r.marketCode,
      rateMin: r.rateMin,
      rateNorm: r.rateNorm,
      rateMax: r.rateMax,
    })),
    marketLabel,
  });
  const buf = bufferFromWb(wb);

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
