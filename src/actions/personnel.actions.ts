"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { PersonnelSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { z } from "zod";
import type {
  PersonnelStatus,
  InterviewStatus,
} from "@prisma/client";

export type PersonnelInput = z.infer<typeof PersonnelSchema>;

export async function getPersonnel(filter?: {
  vendorId?: string;
  status?: string | string[]; // CR-22: support array for multi-status filtering
  interviewStatus?: string;
  jobTypeId?: string;
  techStackId?: string;
  levelId?: string;
  search?: string;
}) {
  // CR-22: Build status filter — supports single value or array
  const statusFilter = filter?.status
    ? Array.isArray(filter.status)
      ? { status: { in: filter.status as PersonnelStatus[] } }
      : { status: filter.status as PersonnelStatus }
    : {};

  return db.personnel.findMany({
    where: {
      ...(filter?.vendorId && { vendorId: filter.vendorId }),
      ...statusFilter,
      ...(filter?.interviewStatus && {
        interviewStatus: filter.interviewStatus as InterviewStatus,
      }),
      ...(filter?.jobTypeId && { jobTypeId: filter.jobTypeId }),
      ...(filter?.techStackId && { techStackId: filter.techStackId }),
      ...(filter?.levelId && { levelId: filter.levelId }),
      ...(filter?.search && {
        fullName: { contains: filter.search, mode: "insensitive" },
      }),
    },
    include: {
      vendor: true,
      jobType: true,
      techStack: true,
      level: true,
      domain: true,
      assignments: {
        where: { status: "ACTIVE" },
        include: { project: { select: { id: true, name: true } } },
      },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function getPersonnelById(id: string) {
  return db.personnel.findUnique({
    where: { id },
    include: {
      vendor: true,
      jobType: true,
      techStack: true,
      level: true,
      domain: true,
      assignments: {
        include: { project: true },
        orderBy: { startDate: "desc" },
      },
    },
  });
}

export async function createPersonnel(
  data: PersonnelInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = PersonnelSchema.parse(data);
    const personnel = await db.personnel.create({
      data: { ...validated, createdById: session.user.id },
    });
    revalidatePath("/personnel");
    revalidatePath(`/vendors/${validated.vendorId}`);
    return { success: true, data: { id: personnel.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updatePersonnel(
  id: string,
  data: PersonnelInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = PersonnelSchema.parse(data);
    const personnel = await db.personnel.update({
      where: { id },
      data: validated,
    });
    revalidatePath("/personnel");
    revalidatePath(`/personnel/${id}`);
    return { success: true, data: { id: personnel.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateInterviewStatus(
  id: string,
  status: InterviewStatus
): Promise<ActionResult> {
  try {
    await requireAuth();
    await db.personnel.update({
      where: { id },
      data: { interviewStatus: status },
    });
    revalidatePath("/personnel");
    revalidatePath(`/personnel/${id}`);
    revalidatePath("/pipeline");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function softDeletePersonnel(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    await db.personnel.update({ where: { id }, data: { status: "ENDED" } });
    revalidatePath("/personnel");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
