"use server";

import { db } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResult } from "@/types";
import { MarketConfigSchema } from "@/lib/validations";
import type { MarketConfigInput } from "@/lib/validations";

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getMarkets(activeOnly = false) {
  return db.marketConfig.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { order: "asc" },
  });
}

export async function getMarketByCode(code: string) {
  return db.marketConfig.findUnique({ where: { code } });
}

/**
 * Get market rate factor for a given market code.
 * Falls back to globalFallback if market not found.
 */
export async function getMarketRateFactor(
  marketCode: string,
  globalFallback = 0.8
): Promise<number> {
  const market = await db.marketConfig.findUnique({
    where: { code: marketCode, isActive: true },
    select: { marketRateFactorPct: true },
  });
  return market?.marketRateFactorPct ?? globalFallback;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function createMarket(
  data: MarketConfigInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("DU_LEADER");
    const validated = MarketConfigSchema.parse(data);
    const market = await db.marketConfig.create({ data: validated });
    revalidatePath("/rates/config");
    return { success: true, data: { id: market.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateMarket(
  id: string,
  data: Partial<MarketConfigInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("DU_LEADER");
    const market = await db.marketConfig.update({ where: { id }, data });
    revalidatePath("/rates/config");
    revalidatePath("/rates");
    return { success: true, data: { id: market.id } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateMarketRateFactor(
  id: string,
  marketRateFactorPct: number
): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    if (marketRateFactorPct < 0 || marketRateFactorPct > 1) {
      return { success: false, error: "Rate factor must be between 0% and 100%" };
    }
    await db.marketConfig.update({ where: { id }, data: { marketRateFactorPct } });
    revalidatePath("/rates/config");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleMarketActive(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    const current = await db.marketConfig.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Market not found" };
    await db.marketConfig.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    revalidatePath("/rates/config");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteMarket(id: string): Promise<ActionResult> {
  try {
    await requireRole("DU_LEADER");
    // Check if market is in use
    const market = await db.marketConfig.findUnique({ where: { id } });
    if (!market) return { success: false, error: "Market not found" };

    const [projectCount, normCount] = await Promise.all([
      db.project.count({ where: { marketCode: market.code } }),
      db.rateNorm.count({ where: { marketCode: market.code } }),
    ]);

    if (projectCount + normCount > 0) {
      return {
        success: false,
        error: `Cannot delete: market is used by ${projectCount} project(s), ${normCount} rate norm(s). Deactivate instead.`,
      };
    }

    await db.marketConfig.delete({ where: { id } });
    revalidatePath("/rates/config");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function reorderMarkets(
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    await requireAuth();
    await Promise.all(
      orderedIds.map((id, index) =>
        db.marketConfig.update({ where: { id }, data: { order: index + 1 } })
      )
    );
    revalidatePath("/rates/config");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
