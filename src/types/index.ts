import type {
  User,
  Vendor,
  Personnel,
  Project,
  Assignment,
  RateNorm,
  JobType,
  TechStack,
  Level,
  Domain,
  RateAlert,
  SystemConfig,
  UserRole,
  Market,
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
  JobType,
  TechStack,
  Level,
  Domain,
  RateAlert,
  SystemConfig,
  UserRole,
  Market,
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
  techStack: TechStack;
  level: Level;
  domain: Domain;
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
