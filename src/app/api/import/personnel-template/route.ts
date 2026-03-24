import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPersonnelTemplate, bufferFromWb } from "@/lib/excel-templates";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [jobTypes, techStacks, levels, domains, vendors] = await Promise.all([
    db.jobType.findMany({ orderBy: { order: "asc" } }),
    db.techStack.findMany({ orderBy: { order: "asc" } }),
    db.level.findMany({ orderBy: { order: "asc" } }),
    db.domain.findMany({ orderBy: { order: "asc" } }),
    db.vendor.findMany({ where: { status: "ACTIVE" }, select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const wb = buildPersonnelTemplate({ vendors, jobTypes, techStacks, levels, domains });
  const buf = bufferFromWb(wb);

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="personnel-import-template.xlsx"',
    },
  });
}
