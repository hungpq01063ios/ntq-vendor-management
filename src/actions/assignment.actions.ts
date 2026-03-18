"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AssignmentSchema } from "@/lib/validations";
import type { z } from "zod";

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
      ...(filter?.status && { status: filter.status as never }),
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

export async function createAssignment(data: AssignmentInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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
  return { success: true, assignment };
}

export async function updateAssignment(id: string, data: AssignmentInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = AssignmentSchema.parse(data);
  const assignment = await db.assignment.update({
    where: { id },
    data: validated,
  });

  revalidatePath(`/projects/${validated.projectId}`);
  revalidatePath("/personnel");
  return { success: true, assignment };
}

export async function endAssignment(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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
  return { success: true };
}
