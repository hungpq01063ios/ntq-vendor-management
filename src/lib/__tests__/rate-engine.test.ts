/**
 * Rate Engine — Unit Tests
 *
 * Tests all pure functions in src/lib/rate-engine.ts
 * No database calls, no mocking needed — pure input/output.
 *
 * PRD reference: Appendix B — Rate Engine End-to-End examples
 * Formula: VendorTargetRate = (billingRate - billingRate × overheadPct) × marketFactor
 */

import { describe, it, expect } from "vitest";
import {
  calculateVendorTargetRate,
  resolveBillingRate,
  calculateAssignmentRates,
  isDriftAlert,
  formatCurrency,
  formatPct,
  type RateConfig,
  type RateResolutionInput,
} from "@/lib/rate-engine";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: RateConfig = {
  overheadRatePct: 0.2, // 20%
  marketRateFactorPct: 0.8, // 80%
  driftAlertThresholdPct: 0.15, // 15%
};

const BASE_INPUT: RateResolutionInput = {
  memberBillingOverride: null,
  projectOverrideRate: null,
  normRate: 2000,
  personnelVendorRate: 1200,
  vendorRateOverride: null,
};

// ─── calculateVendorTargetRate ────────────────────────────────────────────────

describe("calculateVendorTargetRate", () => {
  it("PRD example: $2,000 × (1-20%) × 80% = $1,280", () => {
    // From PRD Appendix B: ProjectRate=$2000, Overhead=20%, MarketFactor=80%
    expect(calculateVendorTargetRate(2000, DEFAULT_CONFIG)).toBe(1280);
  });

  it("PRD Scenario 3: project override $2,500 → target = $1,600", () => {
    // (2500 - 500) × 80% = $1,600
    expect(calculateVendorTargetRate(2500, DEFAULT_CONFIG)).toBe(1600);
  });

  it("returns 0 when billingRate is 0", () => {
    expect(calculateVendorTargetRate(0, DEFAULT_CONFIG)).toBe(0);
  });

  it("handles 0% overhead correctly", () => {
    const config = { ...DEFAULT_CONFIG, overheadRatePct: 0 };
    // $2,000 × (1-0%) × 80% = $1,600
    expect(calculateVendorTargetRate(2000, config)).toBe(1600);
  });

  it("handles 0% market factor correctly", () => {
    const config = { ...DEFAULT_CONFIG, marketRateFactorPct: 0 };
    expect(calculateVendorTargetRate(2000, config)).toBe(0);
  });

  it("handles 100% market factor (no discount)", () => {
    const config = { ...DEFAULT_CONFIG, marketRateFactorPct: 1 };
    // $2,000 × (1-20%) × 100% = $1,600
    expect(calculateVendorTargetRate(2000, config)).toBe(1600);
  });

  it("handles small billing rates correctly", () => {
    // $500 × 80% × 80% = $320
    expect(calculateVendorTargetRate(500, DEFAULT_CONFIG)).toBe(320);
  });
});

// ─── resolveBillingRate ───────────────────────────────────────────────────────

describe("resolveBillingRate — 3-layer inheritance chain", () => {
  it("Layer 1: member override wins when set", () => {
    const result = resolveBillingRate({
      ...BASE_INPUT,
      memberBillingOverride: 2500,
      projectOverrideRate: 2200,
      normRate: 2000,
    });
    expect(result.rate).toBe(2500);
    expect(result.source).toBe("member_override");
  });

  it("Layer 2: project override when no member override", () => {
    const result = resolveBillingRate({
      ...BASE_INPUT,
      memberBillingOverride: null,
      projectOverrideRate: 2200,
      normRate: 2000,
    });
    expect(result.rate).toBe(2200);
    expect(result.source).toBe("project_override");
  });

  it("Layer 3: norm rate when no overrides set", () => {
    const result = resolveBillingRate({
      ...BASE_INPUT,
      memberBillingOverride: null,
      projectOverrideRate: null,
      normRate: 2000,
    });
    expect(result.rate).toBe(2000);
    expect(result.source).toBe("norm");
  });

  it("Falls to manual (0) when all rates are null", () => {
    const result = resolveBillingRate({
      ...BASE_INPUT,
      memberBillingOverride: null,
      projectOverrideRate: null,
      normRate: null,
    });
    expect(result.rate).toBe(0);
    expect(result.source).toBe("manual");
  });

  it("member override of 0 still wins (explicit zero is valid)", () => {
    const result = resolveBillingRate({
      ...BASE_INPUT,
      memberBillingOverride: 0,
      projectOverrideRate: 2200,
      normRate: 2000,
    });
    expect(result.rate).toBe(0);
    expect(result.source).toBe("member_override");
  });
});

// ─── calculateAssignmentRates ─────────────────────────────────────────────────

describe("calculateAssignmentRates", () => {
  describe("billing rate resolution", () => {
    it("uses member override for billing rate", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, memberBillingOverride: 2500 },
        DEFAULT_CONFIG
      );
      expect(result.billingRate).toBe(2500);
      expect(result.billingRateSource).toBe("member_override");
    });

    it("uses project override when no member override", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, projectOverrideRate: 2200 },
        DEFAULT_CONFIG
      );
      expect(result.billingRate).toBe(2200);
      expect(result.billingRateSource).toBe("project_override");
    });

    it("uses norm rate when no overrides", () => {
      const result = calculateAssignmentRates(BASE_INPUT, DEFAULT_CONFIG);
      expect(result.billingRate).toBe(2000);
      expect(result.billingRateSource).toBe("norm");
    });
  });

  describe("vendor rate resolution", () => {
    it("uses vendorRateOverride when provided", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, vendorRateOverride: 1500 },
        DEFAULT_CONFIG
      );
      expect(result.vendorRate).toBe(1500);
    });

    it("falls back to personnelVendorRate when no override", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, vendorRateOverride: null },
        DEFAULT_CONFIG
      );
      expect(result.vendorRate).toBe(1200); // from BASE_INPUT
    });

    it("returns 0 vendor rate when both rates are null", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, personnelVendorRate: null, vendorRateOverride: null },
        DEFAULT_CONFIG
      );
      expect(result.vendorRate).toBe(0);
    });
  });

  describe("margin calculation", () => {
    it("PRD base case: billing $2,000, vendor $1,200 → margin $800 (40%)", () => {
      const result = calculateAssignmentRates(BASE_INPUT, DEFAULT_CONFIG);
      expect(result.grossMargin).toBe(800);
      expect(result.grossMarginPct).toBeCloseTo(0.4, 5); // 40%
    });

    it("grossMarginPct is 0 when billingRate is 0 (no division by zero)", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, normRate: null, memberBillingOverride: null, projectOverrideRate: null },
        DEFAULT_CONFIG
      );
      expect(result.grossMarginPct).toBe(0);
    });

    it("negative margin when vendor rate exceeds billing rate", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, personnelVendorRate: 2500 },
        DEFAULT_CONFIG
      );
      expect(result.grossMargin).toBe(-500); // $2,000 - $2,500
      expect(result.grossMarginPct).toBeCloseTo(-0.25, 5); // -25%
    });
  });

  describe("vendor target rate and drift detection", () => {
    it("PRD Scenario 1: vendor $1,200 below target $1,280 → NOT above target", () => {
      const result = calculateAssignmentRates(BASE_INPUT, DEFAULT_CONFIG);
      expect(result.vendorTargetRate).toBe(1280);
      expect(result.isAboveTarget).toBe(false);
    });

    it("PRD Scenario 2: vendor $1,500 above target $1,280 by 17.2% > 15% → IS above target", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, personnelVendorRate: 1500 },
        DEFAULT_CONFIG
      );
      expect(result.vendorTargetRate).toBe(1280);
      expect(result.isAboveTarget).toBe(true);
    });

    it("vendor exactly at threshold boundary is NOT above target", () => {
      // target = $1,280, threshold = 15% → boundary = $1,280 × 1.15 = $1,472
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, personnelVendorRate: 1472 },
        DEFAULT_CONFIG
      );
      expect(result.isAboveTarget).toBe(false); // exactly at boundary = not above
    });

    it("vendor 1 cent above threshold IS above target", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, personnelVendorRate: 1472.01 },
        DEFAULT_CONFIG
      );
      expect(result.isAboveTarget).toBe(true);
    });
  });

  describe("deltaVsNorm (billing rate delta vs standard norm)", () => {
    it("shows 0 delta when billing rate equals norm", () => {
      const result = calculateAssignmentRates(BASE_INPUT, DEFAULT_CONFIG);
      expect(result.deltaVsNorm).toBe(0);
    });

    it("shows positive delta when billing rate exceeds norm (member override)", () => {
      // override = $2,200, norm = $2,000 → delta = +10%
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, memberBillingOverride: 2200 },
        DEFAULT_CONFIG
      );
      expect(result.deltaVsNorm).toBeCloseTo(0.1, 5); // +10%
    });

    it("shows negative delta when billing rate is below norm", () => {
      // override = $1,800, norm = $2,000 → delta = -10%
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, memberBillingOverride: 1800 },
        DEFAULT_CONFIG
      );
      expect(result.deltaVsNorm).toBeCloseTo(-0.1, 5); // -10%
    });

    it("returns null deltaVsNorm when normRate is null", () => {
      const result = calculateAssignmentRates(
        { ...BASE_INPUT, normRate: null },
        DEFAULT_CONFIG
      );
      expect(result.deltaVsNorm).toBeNull();
    });
  });
});

// ─── isDriftAlert ─────────────────────────────────────────────────────────────

describe("isDriftAlert", () => {
  it("PRD Scenario 2: vendor $1,500 vs target $1,280 → drift 17.2% > 15% → ALERT", () => {
    expect(isDriftAlert(1500, 1280, 0.15)).toBe(true);
  });

  it("PRD Scenario 1: vendor $1,200 vs target $1,280 → drift 6.25% < 15% → no alert", () => {
    expect(isDriftAlert(1200, 1280, 0.15)).toBe(false);
  });

  it("drift below threshold → no alert", () => {
    expect(isDriftAlert(1400, 1280, 0.15)).toBe(false); // 9.4% < 15%
  });

  it("drift exactly at threshold → no alert (strict >)", () => {
    // target = 1000, threshold = 15% → boundary = 1150
    expect(isDriftAlert(1150, 1000, 0.15)).toBe(false);
  });

  it("drift just above threshold → alert", () => {
    expect(isDriftAlert(1150.01, 1000, 0.15)).toBe(true);
  });

  it("no alert when target rate is 0 (no division by zero)", () => {
    expect(isDriftAlert(1500, 0, 0.15)).toBe(false);
  });

  it("works symmetrically for rates BELOW target (under-pricing)", () => {
    // actual $800 vs target $1,000 → drift 20% > 15% → ALERT
    expect(isDriftAlert(800, 1000, 0.15)).toBe(true);
  });

  it("uses custom threshold correctly", () => {
    // 10% custom threshold
    expect(isDriftAlert(1200, 1000, 0.1)).toBe(true);  // 20% > 10%
    expect(isDriftAlert(1080, 1000, 0.1)).toBe(false); // 8% < 10%
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats whole dollar amounts", () => {
    expect(formatCurrency(1280)).toBe("$1,280");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("rounds decimals (maximumFractionDigits: 0)", () => {
    expect(formatCurrency(1280.7)).toBe("$1,281");
    expect(formatCurrency(1280.4)).toBe("$1,280");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(100000)).toBe("$100,000");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$500");
  });
});

// ─── formatPct ────────────────────────────────────────────────────────────────

describe("formatPct", () => {
  it("formats 40% margin correctly", () => {
    expect(formatPct(0.4)).toBe("40.0%");
  });

  it("formats 0%", () => {
    expect(formatPct(0)).toBe("0.0%");
  });

  it("formats 100%", () => {
    expect(formatPct(1)).toBe("100.0%");
  });

  it("formats negative percentage (loss)", () => {
    expect(formatPct(-0.25)).toBe("-25.0%");
  });

  it("formats to 1 decimal place", () => {
    expect(formatPct(0.333)).toBe("33.3%");
    expect(formatPct(0.666)).toBe("66.6%");
  });
});

// ─── PRD End-to-End Scenarios ─────────────────────────────────────────────────

describe("PRD Appendix B — End-to-End Scenarios", () => {
  const prdConfig: RateConfig = {
    overheadRatePct: 0.2,    // 20%
    marketRateFactorPct: 0.8, // 80%
    driftAlertThresholdPct: 0.15,
  };

  it("Scenario 1: Java Senior $1,200 actual vs $1,280 target → good deal", () => {
    const result = calculateAssignmentRates(
      {
        memberBillingOverride: null,
        projectOverrideRate: null,
        normRate: 2000,           // Java Senior Fintech norm = $2,000
        personnelVendorRate: 1200, // Vendor A offer = $1,200
        vendorRateOverride: null,
      },
      prdConfig
    );

    expect(result.billingRate).toBe(2000);
    expect(result.vendorTargetRate).toBe(1280);
    expect(result.vendorRate).toBe(1200);
    expect(result.grossMargin).toBe(800);
    expect(result.isAboveTarget).toBe(false); // good deal ✅
  });

  it("Scenario 2: Java Senior $1,500 actual vs $1,280 target → rate drift alert", () => {
    const result = calculateAssignmentRates(
      {
        memberBillingOverride: null,
        projectOverrideRate: null,
        normRate: 2000,
        personnelVendorRate: 1500, // Vendor B offer = $1,500
        vendorRateOverride: null,
      },
      prdConfig
    );

    expect(result.vendorTargetRate).toBe(1280);
    expect(result.vendorRate).toBe(1500);
    expect(result.isAboveTarget).toBe(true); // drift alert ⚠️

    // Verify drift: (1500 - 1280) / 1280 ≈ 17.2%
    const driftPct = (1500 - 1280) / 1280;
    expect(driftPct).toBeCloseTo(0.172, 2);
    expect(isDriftAlert(1500, 1280, prdConfig.driftAlertThresholdPct)).toBe(true);
  });

  it("Scenario 3: Project override $2,500 → higher target = $1,600 → PIC can offer more", () => {
    const result = calculateAssignmentRates(
      {
        memberBillingOverride: null,
        projectOverrideRate: 2500,  // project-specific billing rate
        normRate: 2000,
        personnelVendorRate: 1500,
        vendorRateOverride: null,
      },
      prdConfig
    );

    expect(result.billingRate).toBe(2500);
    expect(result.billingRateSource).toBe("project_override");
    expect(result.vendorTargetRate).toBe(1600); // (2500 - 500) × 80% = $1,600
    expect(result.isAboveTarget).toBe(false); // $1,500 < $1,600 target ✅
  });
});
