"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ProjectSchema } from "@/lib/validations";
import type { z } from "zod";

export type ProjectInput = z.infer<typeof ProjectSchema>;

export async function getProjects(filter?: {
  market?: string;
  status?: string;
  search?: string;
}) {
  return db.project.findMany({
    where: {
      ...(filter?.status && { status: filter.status as never }),
      ...(filter?.market && { market: filter.market as never }),
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

export async function createProject(data: ProjectInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = ProjectSchema.parse(data);
  const project = await db.project.create({
    data: { ...validated, createdById: session.user.id },
  });

  revalidatePath("/projects");
  return { success: true, project };
}

export async function updateProject(id: string, data: ProjectInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = ProjectSchema.parse(data);
  const project = await db.project.update({ where: { id }, data: validated });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true, project };
}

export async function softDeleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  await db.project.update({ where: { id }, data: { status: "ENDED" } });
  revalidatePath("/projects");
  return { success: true };
}
