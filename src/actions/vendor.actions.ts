"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { VendorSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { z } from "zod";
import type { VendorStatus } from "@prisma/client";

export type VendorInput = z.infer<typeof VendorSchema>;

export async function getVendors(filter?: {
  market?: string;
  status?: string;
  search?: string;
}) {
  return db.vendor.findMany({
    where: {
      ...(filter?.status && { status: filter.status as VendorStatus }),
      ...(filter?.search && {
        name: { contains: filter.search, mode: "insensitive" },
      }),
    },
    include: {
      personnel: { select: { id: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getVendorById(id: string) {
  return db.vendor.findUnique({
    where: { id },
    include: {
      personnel: {
        include: { jobType: true, techStack: true, level: true, domain: true },
        orderBy: { fullName: "asc" },
      },
    },
  });
}

export async function createVendor(
  data: VendorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = VendorSchema.parse(data);
    const vendor = await db.vendor.create({
      data: { ...validated, createdById: session.user.id },
    });
    revalidatePath("/vendors");
    return { success: true, data: { id: vendor.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateVendor(
  id: string,
  data: VendorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = VendorSchema.parse(data);
    const vendor = await db.vendor.update({ where: { id }, data: validated });
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return { success: true, data: { id: vendor.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function softDeleteVendor(
  id: string
): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    await db.vendor.update({ where: { id }, data: { status: "INACTIVE" } });
    revalidatePath("/vendors");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
