"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { ProjectSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { z } from "zod";
import type { ProjectStatus } from "@prisma/client";

export type ProjectInput = z.infer<typeof ProjectSchema>;

export async function getProjects(filter?: {
  market?: string;
  status?: string;
  search?: string;
}) {
  return db.project.findMany({
    where: {
      ...(filter?.status && { status: filter.status as ProjectStatus }),
      ...(filter?.market && { marketCode: filter.market }),
      ...(filter?.search && {
        OR: [
          { name: { contains: filter.search, mode: "insensitive" } },
          { clientName: { contains: filter.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      assignments: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      assignments: {
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
      },
    },
  });
}

export async function createProject(
  data: ProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = ProjectSchema.parse(data);
    const project = await db.project.create({
      data: { ...validated, createdById: session.user.id },
    });
    revalidatePath("/projects");
    return { success: true, data: { id: project.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateProject(
  id: string,
  data: ProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = ProjectSchema.parse(data);
    const project = await db.project.update({ where: { id }, data: validated });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true, data: { id: project.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function softDeleteProject(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    await db.project.update({ where: { id }, data: { status: "ENDED" } });
    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
