"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import { z } from "zod";

// ─── Internal schema (not exported from use server file) ─────────────────────

const PersonnelCVSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  url: z.string().url("Must be a valid URL"),
  notes: z.string().max(500).optional(),
  isLatest: z.boolean(),
});

export type PersonnelCVInput = {
  label: string;
  url: string;
  notes?: string;
  isLatest: boolean;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCVsByPersonnel(personnelId: string) {
  return db.personnelCV.findMany({
    where: { personnelId },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: [{ isLatest: "desc" }, { uploadedAt: "desc" }],
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addPersonnelCV(
  personnelId: string,
  data: PersonnelCVInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const validated = PersonnelCVSchema.parse(data);

    // If marking as latest, unset existing latest first
    if (validated.isLatest) {
      await db.personnelCV.updateMany({
        where: { personnelId, isLatest: true },
        data: { isLatest: false },
      });
    }

    const cv = await db.personnelCV.create({
      data: {
        personnelId,
        label: validated.label,
        url: validated.url,
        notes: validated.notes,
        isLatest: validated.isLatest,
        uploadedById: session.user.id,
      },
    });

    revalidatePath(`/personnel/${personnelId}`);
    return { success: true, data: { id: cv.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updatePersonnelCV(
  id: string,
  personnelId: string,
  data: PersonnelCVInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const validated = PersonnelCVSchema.parse(data);

    // If marking as latest, unset others first
    if (validated.isLatest) {
      await db.personnelCV.updateMany({
        where: { personnelId, isLatest: true, NOT: { id } },
        data: { isLatest: false },
      });
    }

    const cv = await db.personnelCV.update({
      where: { id },
      data: {
        label: validated.label,
        url: validated.url,
        notes: validated.notes,
        isLatest: validated.isLatest,
      },
    });

    revalidatePath(`/personnel/${personnelId}`);
    return { success: true, data: { id: cv.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deletePersonnelCV(
  id: string,
  personnelId: string
): Promise<ActionResult> {
  try {
    await requireAuth();
    await db.personnelCV.delete({ where: { id } });
    revalidatePath(`/personnel/${personnelId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function setLatestCV(
  id: string,
  personnelId: string
): Promise<ActionResult> {
  try {
    await requireAuth();
    // Unset all, then set this one
    await db.personnelCV.updateMany({
      where: { personnelId },
      data: { isLatest: false },
    });
    await db.personnelCV.update({ where: { id }, data: { isLatest: true } });
    revalidatePath(`/personnel/${personnelId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
