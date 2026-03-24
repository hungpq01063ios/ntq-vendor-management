"use server";

import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

// ─── Vendor Import ──────────────────────────────────────────────────────────────

export async function importVendors(
  formData: FormData
): Promise<ActionResult<ImportResult>> {
  try {
    const session = await requireAuth();
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, 0-indexed

      try {
        const name = String(row["Name*"] ?? "").trim();
        const contactName = String(row["Contact Name*"] ?? "").trim();
        const contactEmail = String(row["Contact Email*"] ?? "").trim();

        if (!name || !contactName || !contactEmail) {
          result.errors.push({ row: rowNum, message: "Missing required fields (Name, Contact Name, Contact Email)" });
          result.skipped++;
          continue;
        }

        // Skip duplicates by email
        const existing = await db.vendor.findFirst({ where: { contactEmail } });
        if (existing) {
          result.skipped++;
          continue;
        }

        const langRaw = String(row["Language Strengths (semicolon-separated)"] ?? "").trim();
        const languageStrength = langRaw ? langRaw.split(";").map((s) => s.trim()).filter(Boolean) : [];
        const statusRaw = String(row["Status"] ?? "ACTIVE").trim();
        const status = ["ACTIVE", "INACTIVE", "ON_HOLD"].includes(statusRaw) ? statusRaw : "ACTIVE";
        const companySize = row["Company Size"] ? parseInt(String(row["Company Size"]), 10) : undefined;
        const perfRating = row["Performance Rating (1-5)"] ? parseInt(String(row["Performance Rating (1-5)"]), 10) : undefined;
        const respRating = row["Response Speed Rating (1-5)"] ? parseInt(String(row["Response Speed Rating (1-5)"]), 10) : undefined;

        await db.vendor.create({
          data: {
            name,
            contactName,
            contactEmail,
            contactPhone: String(row["Contact Phone"] ?? "").trim() || undefined,
            website: String(row["Website"] ?? "").trim() || undefined,
            companySize: companySize && !isNaN(companySize) ? companySize : undefined,
            languageStrength,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: status as any,
            performanceRating: perfRating && perfRating >= 1 && perfRating <= 5 ? perfRating : undefined,
            responseSpeedRating: respRating && respRating >= 1 && respRating <= 5 ? respRating : undefined,
            performanceNote: String(row["Performance Note"] ?? "").trim() || undefined,
            notes: String(row["Notes"] ?? "").trim() || undefined,
            createdById: session.user.id,
          },
        });
        result.imported++;
      } catch (err) {
        result.errors.push({ row: rowNum, message: getErrorMessage(err) });
        result.skipped++;
      }
    }

    revalidatePath("/vendors");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ─── Personnel Import ───────────────────────────────────────────────────────────

export async function importPersonnel(
  formData: FormData
): Promise<ActionResult<ImportResult>> {
  try {
    const session = await requireAuth();
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });

    // Preload lookup tables
    const [vendors, jobTypes, techStacks, levels, domains] = await Promise.all([
      db.vendor.findMany({ select: { id: true, name: true } }),
      db.jobType.findMany({ select: { id: true, name: true } }),
      db.techStack.findMany({ select: { id: true, name: true } }),
      db.level.findMany({ select: { id: true, name: true } }),
      db.domain.findMany({ select: { id: true, name: true } }),
    ]);

    const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id]));
    const jobTypeMap = new Map(jobTypes.map((j) => [j.name.toLowerCase(), j.id]));
    const techStackMap = new Map(techStacks.map((t) => [t.name.toLowerCase(), t.id]));
    const levelMap = new Map(levels.map((l) => [l.name.toLowerCase(), l.id]));
    const domainMap = new Map(domains.map((d) => [d.name.toLowerCase(), d.id]));

    const result: ImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const vendorName = String(row["Vendor Name*"] ?? "").trim();
        const fullName = String(row["Full Name*"] ?? "").trim();
        const jobTypeName = String(row["Job Type*"] ?? "").trim();
        const levelName = String(row["Level*"] ?? "").trim();

        if (!vendorName || !fullName || !jobTypeName || !levelName) {
          result.errors.push({ row: rowNum, message: "Missing required: Vendor Name, Full Name, Job Type, Level" });
          result.skipped++;
          continue;
        }

        const vendorId = vendorMap.get(vendorName.toLowerCase());
        if (!vendorId) {
          result.errors.push({ row: rowNum, message: `Vendor not found: "${vendorName}"` });
          result.skipped++;
          continue;
        }

        const jobTypeId = jobTypeMap.get(jobTypeName.toLowerCase());
        if (!jobTypeId) {
          result.errors.push({ row: rowNum, message: `Job type not found: "${jobTypeName}"` });
          result.skipped++;
          continue;
        }

        const levelId = levelMap.get(levelName.toLowerCase());
        if (!levelId) {
          result.errors.push({ row: rowNum, message: `Level not found: "${levelName}"` });
          result.skipped++;
          continue;
        }

        // Optional lookups
        const primaryStackName = String(row["Tech Stack (Primary)"] ?? "").trim();
        const techStackId = primaryStackName ? techStackMap.get(primaryStackName.toLowerCase()) ?? null : null;

        const additional1 = String(row["Additional Tech Stack 1"] ?? "").trim();
        const additional2 = String(row["Additional Tech Stack 2"] ?? "").trim();
        const additionalTechStackIds: string[] = [];
        if (additional1) {
          const id = techStackMap.get(additional1.toLowerCase());
          if (id) additionalTechStackIds.push(id);
        }
        if (additional2) {
          const id = techStackMap.get(additional2.toLowerCase());
          if (id) additionalTechStackIds.push(id);
        }

        const domainName = String(row["Domain"] ?? "").trim();
        const domainId = domainName ? domainMap.get(domainName.toLowerCase()) ?? null : null;

        const englishLevelRaw = String(row["English Level"] ?? "INTERMEDIATE").trim();
        const englishLevel = ["BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"].includes(englishLevelRaw)
          ? englishLevelRaw
          : "INTERMEDIATE";

        const statusRaw = String(row["Status"] ?? "AVAILABLE").trim();
        const status = ["AVAILABLE", "ON_PROJECT", "ENDED"].includes(statusRaw) ? statusRaw : "AVAILABLE";

        const interviewStatusRaw = String(row["Interview Status"] ?? "NEW").trim();
        const interviewStatus = ["NEW", "SCREENING", "TECHNICAL_TEST", "INTERVIEW", "PASSED", "FAILED"].includes(interviewStatusRaw)
          ? interviewStatusRaw
          : "NEW";

        const leadershipStr = String(row["Leadership (TRUE/FALSE)"] ?? "FALSE").trim().toUpperCase();
        const leadership = leadershipStr === "TRUE";

        const rateStr = String(row["Vendor Rate (USD/mo)"] ?? "").trim();
        const vendorRateActual = rateStr ? Math.round(parseFloat(rateStr)) : undefined;

        const cvUrl = String(row["CV URL"] ?? "").trim() || undefined;

        // Check duplicate (same vendor + fullName)
        const duplicate = await db.personnel.findFirst({
          where: { vendorId, fullName: { equals: fullName, mode: "insensitive" } },
        });
        if (duplicate) {
          result.skipped++;
          continue;
        }

        const newPersonnel = await db.personnel.create({
          data: {
            vendorId,
            fullName,
            jobTypeId,
            techStackId,
            additionalTechStackIds,
            levelId,
            domainId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            englishLevel: englishLevel as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: status as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            interviewStatus: interviewStatus as any,
            leadership,
            vendorRateActual: vendorRateActual && !isNaN(vendorRateActual) ? vendorRateActual : undefined,
            notes: String(row["Notes"] ?? "").trim() || undefined,
            createdById: session.user.id,
          },
        });
        // Create CV separately to avoid nested create type issues
        if (cvUrl) {
          await db.personnelCV.create({
            data: {
              personnelId: newPersonnel.id,
              label: "CV (imported)",
              url: cvUrl,
              isLatest: true,
              uploadedById: session.user.id,
            },
          });
        }
        result.imported++;
      } catch (err) {
        result.errors.push({ row: rowNum, message: getErrorMessage(err) });
        result.skipped++;
      }
    }

    revalidatePath("/personnel");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ─── Rate Norm Import ───────────────────────────────────────────────────────────

export async function importRateNorms(
  formData: FormData
): Promise<ActionResult<ImportResult>> {
  try {
    const session = await requireRole("DU_LEADER");
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: true,
    });

    // Preload lookups
    const [jobTypes, techStacks, levels, domains] = await Promise.all([
      db.jobType.findMany({ select: { id: true, name: true } }),
      db.techStack.findMany({ select: { id: true, name: true } }),
      db.level.findMany({ select: { id: true, name: true } }),
      db.domain.findMany({ select: { id: true, name: true } }),
    ]);

    const jobTypeMap = new Map(jobTypes.map((j) => [j.name.toLowerCase(), j.id]));
    const techStackMap = new Map(techStacks.map((t) => [t.name.toLowerCase(), t.id]));
    const levelMap = new Map(levels.map((l) => [l.name.toLowerCase(), l.id]));
    const domainMap = new Map(domains.map((d) => [d.name.toLowerCase(), d.id]));

    const result: ImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const jobTypeName = String(row["Job Type*"] ?? "").trim();
        const techStackName = String(row["Tech Stack*"] ?? "").trim();
        const levelName = String(row["Level*"] ?? "").trim();
        const domainName = String(row["Domain*"] ?? "").trim();
        const marketCode = String(row["Market Code*"] ?? "").trim();
        const rateMin = Number(row["Rate Min (USD)*"]);
        const rateNorm = Number(row["Rate Norm (USD)*"]);
        const rateMax = Number(row["Rate Max (USD)*"]);

        if (!jobTypeName || !techStackName || !levelName || !domainName || !marketCode) {
          result.errors.push({ row: rowNum, message: "Missing required fields" });
          result.skipped++;
          continue;
        }

        if (isNaN(rateMin) || isNaN(rateNorm) || isNaN(rateMax) || rateMin <= 0 || rateNorm <= 0 || rateMax <= 0) {
          result.errors.push({ row: rowNum, message: "Invalid rate values (must be positive numbers)" });
          result.skipped++;
          continue;
        }

        if (rateMin > rateNorm || rateNorm > rateMax) {
          result.errors.push({ row: rowNum, message: `Rate order invalid: Min (${rateMin}) ≤ Norm (${rateNorm}) ≤ Max (${rateMax})` });
          result.skipped++;
          continue;
        }

        const jobTypeId = jobTypeMap.get(jobTypeName.toLowerCase());
        const techStackId = techStackMap.get(techStackName.toLowerCase());
        const levelId = levelMap.get(levelName.toLowerCase());
        const domainId = domainMap.get(domainName.toLowerCase());

        if (!jobTypeId) { result.errors.push({ row: rowNum, message: `Job type not found: "${jobTypeName}"` }); result.skipped++; continue; }
        if (!techStackId) { result.errors.push({ row: rowNum, message: `Tech stack not found: "${techStackName}"` }); result.skipped++; continue; }
        if (!levelId) { result.errors.push({ row: rowNum, message: `Level not found: "${levelName}"` }); result.skipped++; continue; }
        if (!domainId) { result.errors.push({ row: rowNum, message: `Domain not found: "${domainName}"` }); result.skipped++; continue; }

        await db.rateNorm.upsert({
          where: {
            jobTypeId_techStackId_levelId_domainId_marketCode: {
              jobTypeId,
              techStackId,
              levelId,
              domainId,
              marketCode,
            },
          },
          update: { rateMin, rateNorm, rateMax },
          create: { jobTypeId, techStackId, levelId, domainId, marketCode, rateMin, rateNorm, rateMax, createdById: session.user.id },
        });
        result.imported++;
      } catch (err) {
        result.errors.push({ row: rowNum, message: getErrorMessage(err) });
        result.skipped++;
      }
    }

    revalidatePath("/rates");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
