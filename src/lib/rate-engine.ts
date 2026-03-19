// src/lib/rate-engine.ts
// Pure functions — no DB calls, fully testable

export interface RateConfig {
  overheadRatePct: number;          // e.g. 0.20 — global
  driftAlertThresholdPct: number;    // e.g. 0.15 — global
  /** Per-market rate factors — required, set from MarketConfig table */
  marketRateFactors?: Record<string, number>; // marketCode -> factor
  /** Fallback if market not found in marketRateFactors (default 0.8) */
  marketRateFactorPct?: number;
}

export interface RateResolutionInput {
  personnelVendorRate: number | null;
  normRate: number | null;
  projectOverrideRate: number | null;
  memberBillingOverride: number | null;
  vendorRateOverride?: number | null; // optional per-assignment override
}

export interface RateResult {
  billingRate: number;
  vendorRate: number;
  vendorTargetRate: number;
  grossMargin: number;
  grossMarginPct: number;
  billingRateSource: "member_override" | "project_override" | "norm" | "manual";
  deltaVsNorm: number | null;
  isAboveTarget: boolean;
}

/**
 * Get the effective market rate factor for a given market code.
 * Uses per-market override if available, falls back to global.
 */
export function getMarketFactor(
  marketCode: string | null | undefined,
  config: RateConfig
): number {
  if (marketCode && config.marketRateFactors?.[marketCode] !== undefined) {
    return config.marketRateFactors[marketCode];
  }
  return config.marketRateFactorPct ?? 0.8;
}

/**
 * Core formula:
 * VendorTargetRate = (billingRate - billingRate × overheadPct) × marketFactor
 */
export function calculateVendorTargetRate(
  billingRate: number,
  config: RateConfig,
  marketCode?: string | null
): number {
  const afterOverhead = billingRate - billingRate * config.overheadRatePct;
  const factor = getMarketFactor(marketCode, config);
  return afterOverhead * factor;
}

/**
 * Resolve final billing rate via 3-layer inheritance chain:
 * memberOverride → projectOverride → normRate
 */
export function resolveBillingRate(input: RateResolutionInput): {
  rate: number;
  source: RateResult["billingRateSource"];
} {
  if (input.memberBillingOverride !== null) {
    return { rate: input.memberBillingOverride, source: "member_override" };
  }
  if (input.projectOverrideRate !== null) {
    return { rate: input.projectOverrideRate, source: "project_override" };
  }
  if (input.normRate !== null) {
    return { rate: input.normRate, source: "norm" };
  }
  return { rate: 0, source: "manual" };
}

/**
 * Full rate calculation for an assignment
 */
export function calculateAssignmentRates(
  input: RateResolutionInput,
  config: RateConfig
): RateResult {
  const { rate: billingRate, source } = resolveBillingRate(input);
  const vendorRate =
    input.vendorRateOverride ?? input.personnelVendorRate ?? 0;
  const vendorTargetRate = calculateVendorTargetRate(billingRate, config);
  const grossMargin = billingRate - vendorRate;
  const grossMarginPct = billingRate > 0 ? grossMargin / billingRate : 0;
  const deltaVsNorm = input.normRate
    ? (billingRate - input.normRate) / input.normRate
    : null;
  const isAboveTarget =
    vendorRate > vendorTargetRate * (1 + config.driftAlertThresholdPct);

  return {
    billingRate,
    vendorRate,
    vendorTargetRate,
    grossMargin,
    grossMarginPct,
    billingRateSource: source,
    deltaVsNorm,
    isAboveTarget,
  };
}

/**
 * Check if vendor rate triggers a drift alert
 */
export function isDriftAlert(
  actualVendorRate: number,
  targetVendorRate: number,
  thresholdPct: number
): boolean {
  if (targetVendorRate === 0) return false;
  const drift =
    Math.abs(actualVendorRate - targetVendorRate) / targetVendorRate;
  return drift > thresholdPct;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
