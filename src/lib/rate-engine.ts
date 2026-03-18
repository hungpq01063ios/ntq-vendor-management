// src/lib/rate-engine.ts
// Pure functions — no DB calls, fully testable

export interface RateConfig {
  overheadRatePct: number; // e.g. 0.20
  marketRateFactorPct: number; // e.g. 0.80
  driftAlertThresholdPct: number; // e.g. 0.15
}

export interface RateResolutionInput {
  personnelVendorRate: number | null;
  normRate: number | null;
  projectOverrideRate: number | null;
  memberBillingOverride: number | null;
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
 * Core formula:
 * VendorTargetRate = (billingRate - billingRate × overheadPct) × marketFactor
 */
export function calculateVendorTargetRate(
  billingRate: number,
  config: RateConfig
): number {
  const afterOverhead = billingRate - billingRate * config.overheadRatePct;
  return afterOverhead * config.marketRateFactorPct;
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

// Workaround for RateResolutionInput missing vendorRateOverride
declare module "./rate-engine" {
  interface RateResolutionInput {
    vendorRateOverride?: number | null;
  }
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
