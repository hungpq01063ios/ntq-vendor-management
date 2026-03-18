import { z } from "zod";

// ─── Vendor ────────────────────────────────────────────────────────────────────
export const VendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().optional(),
  companySize: z.number().int().positive().optional(),
  market: z.enum(["ENGLISH", "JAPAN", "KOREA", "OTHER"]).default("ENGLISH"),
  languageStrength: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_HOLD"]).default("ACTIVE"),
  startDate: z.date().optional(),
  notes: z.string().optional(),
});

// ─── Personnel ────────────────────────────────────────────────────────────────
export const PersonnelSchema = z.object({
  vendorId: z.string().min(1),
  fullName: z.string().min(1, "Full name is required"),
  jobTypeId: z.string().min(1, "Job type is required"),
  techStackId: z.string().min(1, "Tech stack is required"),
  levelId: z.string().min(1, "Level is required"),
  domainId: z.string().min(1, "Domain is required"),
  englishLevel: z
    .enum(["BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"])
    .default("INTERMEDIATE"),
  leadership: z.boolean().default(false),
  leadershipNote: z.string().optional(),
  vendorRateActual: z.number().positive().optional(),
  status: z
    .enum(["AVAILABLE", "ON_PROJECT", "ENDED"])
    .default("AVAILABLE"),
  interviewStatus: z
    .enum(["NEW", "SCREENING", "TECHNICAL_TEST", "INTERVIEW", "PASSED", "FAILED"])
    .default("NEW"),
  notes: z.string().optional(),
});

// ─── Project ──────────────────────────────────────────────────────────────────
export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  market: z.enum(["ENGLISH", "JAPAN", "KOREA", "OTHER"]).default("ENGLISH"),
  clientName: z.string().min(1, "Client name is required"),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "ENDED"]).default("ACTIVE"),
  notes: z.string().optional(),
});

// ─── Assignment ────────────────────────────────────────────────────────────────
export const AssignmentSchema = z.object({
  personnelId: z.string().min(1),
  projectId: z.string().min(1),
  roleInProject: z.string().optional(),
  billingRateOverride: z.number().positive().optional(),
  billingRateNote: z.string().optional(),
  vendorRateOverride: z.number().positive().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(["ACTIVE", "ENDED"]).default("ACTIVE"),
});

// ─── RateNorm ──────────────────────────────────────────────────────────────────
export const RateNormSchema = z.object({
  jobTypeId: z.string().min(1),
  techStackId: z.string().min(1),
  levelId: z.string().min(1),
  domainId: z.string().min(1),
  market: z.enum(["ENGLISH", "JAPAN", "KOREA", "OTHER"]).default("ENGLISH"),
  rateMin: z.number().positive(),
  rateNorm: z.number().positive(),
  rateMax: z.number().positive(),
  effectiveDate: z.date().optional(),
});

// ─── SystemConfig ──────────────────────────────────────────────────────────────
export const SystemConfigSchema = z.object({
  key: z.enum([
    "OVERHEAD_RATE_PCT",
    "MARKET_RATE_FACTOR_PCT",
    "DRIFT_ALERT_THRESHOLD_PCT",
  ]),
  value: z.string().min(1),
});
