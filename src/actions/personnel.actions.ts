"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PersonnelSchema } from "@/lib/validations";
import type { z } from "zod";

export type PersonnelInput = z.infer<typeof PersonnelSchema>;

export async function getPersonnel(filter?: {
  vendorId?: string;
  status?: string;
  interviewStatus?: string;
  jobTypeId?: string;
  techStackId?: string;
  levelId?: string;
  search?: string;
}) {
  return db.personnel.findMany({
    where: {
      ...(filter?.vendorId && { vendorId: filter.vendorId }),
      ...(filter?.status && { status: filter.status as never }),
      ...(filter?.interviewStatus && {
        interviewStatus: filter.interviewStatus as never,
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

export async function createPersonnel(data: PersonnelInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = PersonnelSchema.parse(data);
  const personnel = await db.personnel.create({
    data: { ...validated, createdById: session.user.id },
  });

  revalidatePath("/personnel");
  revalidatePath(`/vendors/${validated.vendorId}`);
  return { success: true, personnel };
}

export async function updatePersonnel(id: string, data: PersonnelInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = PersonnelSchema.parse(data);
  const personnel = await db.personnel.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/personnel");
  revalidatePath(`/personnel/${id}`);
  return { success: true, personnel };
}

export async function updateInterviewStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.personnel.update({
    where: { id },
    data: { interviewStatus: status as never },
  });

  revalidatePath("/personnel");
  revalidatePath(`/personnel/${id}`);
  revalidatePath("/pipeline");
  return { success: true };
}

export async function softDeletePersonnel(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  await db.personnel.update({ where: { id }, data: { status: "ENDED" } });
  revalidatePath("/personnel");
  return { success: true };
}
