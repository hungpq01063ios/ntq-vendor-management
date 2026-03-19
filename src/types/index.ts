// ─── ActionResult ─────────────────────────────────────────────────────────────
// Standard return type for all Server Action mutations.
// Mutations should never throw to client — always return this type.
// Read-only actions (getAll, getById) may throw — error.tsx handles them.
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

import type {
  User,
  Vendor,
  Personnel,
  Project,
  Assignment,
  RateNorm,
  MarketConfig,
  JobType,
  TechStack,
  Level,
  Domain,
  RateAlert,
  SystemConfig,
  UserRole,
  VendorStatus,
  PersonnelStatus,
  InterviewStatus,
  EnglishLevel,
  ProjectStatus,
  AssignmentStatus,
  AlertStatus,
  ConfigKey,
} from "@prisma/client";

export type {
  User,
  Vendor,
  Personnel,
  Project,
  Assignment,
  RateNorm,
  MarketConfig,
  JobType,
  TechStack,
  Level,
  Domain,
  RateAlert,
  SystemConfig,
  UserRole,
  VendorStatus,
  PersonnelStatus,
  InterviewStatus,
  EnglishLevel,
  ProjectStatus,
  AssignmentStatus,
  AlertStatus,
  ConfigKey,
};

// Extended types with relations
export type VendorWithPersonnel = Vendor & {
  personnel: Personnel[];
  _count?: { personnel: number };
};

export type PersonnelWithRelations = Personnel & {
  vendor: Vendor;
  jobType: JobType;
  techStack: TechStack | null;
  level: Level;
  domain: Domain | null;
};

export type AssignmentWithRelations = Assignment & {
  personnel: PersonnelWithRelations;
  project: Project;
};

export type ProjectWithAssignments = Project & {
  assignments: AssignmentWithRelations[];
  _count?: { assignments: number };
};

export type RateNormWithRelations = RateNorm & {
  jobType: JobType;
  techStack: TechStack;
  level: Level;
  domain: Domain;
};
