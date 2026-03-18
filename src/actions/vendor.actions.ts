"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { VendorSchema } from "@/lib/validations";
import type { z } from "zod";

export type VendorInput = z.infer<typeof VendorSchema>;

export async function getVendors(filter?: {
  market?: string;
  status?: string;
  search?: string;
}) {
  return db.vendor.findMany({
    where: {
      ...(filter?.market && { market: filter.market as never }),
      ...(filter?.status && { status: filter.status as never }),
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

export async function createVendor(data: VendorInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = VendorSchema.parse(data);
  const vendor = await db.vendor.create({
    data: { ...validated, createdById: session.user.id },
  });

  revalidatePath("/vendors");
  return { success: true, vendor };
}

export async function updateVendor(id: string, data: VendorInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = VendorSchema.parse(data);
  const vendor = await db.vendor.update({ where: { id }, data: validated });

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { success: true, vendor };
}

export async function softDeleteVendor(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session.user as { role?: string }).role;
  if (role !== "DU_LEADER") throw new Error("Forbidden");

  await db.vendor.update({ where: { id }, data: { status: "INACTIVE" } });
  revalidatePath("/vendors");
  return { success: true };
}
