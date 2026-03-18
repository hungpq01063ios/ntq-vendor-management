"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateSystemConfig } from "@/actions/rate.actions";

interface Props {
  configs: Record<string, number>;
}

export default function GlobalConfigForm({ configs }: Props) {
  const [overhead, setOverhead] = useState(
    String((configs["OVERHEAD_RATE_PCT"] ?? 0.2) * 100)
  );
  const [marketFactor, setMarketFactor] = useState(
    String((configs["MARKET_RATE_FACTOR_PCT"] ?? 0.8) * 100)
  );
  const [driftThreshold, setDriftThreshold] = useState(
    String((configs["DRIFT_ALERT_THRESHOLD_PCT"] ?? 0.15) * 100)
  );
  const [saving, setSaving] = useState(false);

  // Live preview
  const overheadPct = parseFloat(overhead) / 100 || 0;
  const marketFactorPct = parseFloat(marketFactor) / 100 || 0;
  const driftPct = parseFloat(driftThreshold) / 100 || 0;
  const exampleBilling = 2000;
  const vendorTarget = (exampleBilling - exampleBilling * overheadPct) * marketFactorPct;

  async function handleSave() {
    const o = parseFloat(overhead);
    const m = parseFloat(marketFactor);
    const d = parseFloat(driftThreshold);

    if (isNaN(o) || o < 0 || o > 100) {
      toast.error("Overhead rate must be between 0 and 100");
      return;
    }
    if (isNaN(m) || m < 0 || m > 100) {
      toast.error("Market rate factor must be between 0 and 100");
      return;
    }
    if (isNaN(d) || d < 0 || d > 100) {
      toast.error("Drift threshold must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        updateSystemConfig("OVERHEAD_RATE_PCT", o / 100),
        updateSystemConfig("MARKET_RATE_FACTOR_PCT", m / 100),
        updateSystemConfig("DRIFT_ALERT_THRESHOLD_PCT", d / 100),
      ]);
      toast.success("Config saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Overhead Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Overhead Rate (%)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Company overhead deducted from billing rate before calculating vendor target.
        </p>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={overhead}
            onChange={(e) => setOverhead(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>

      {/* Market Rate Factor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Market Rate Factor (%)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Proportion of post-overhead billing rate allocated as vendor target.
        </p>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={marketFactor}
            onChange={(e) => setMarketFactor(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>

      {/* Drift Alert Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Drift Alert Threshold (%)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Trigger an alert when actual vendor rate deviates from target by more than this percentage.
        </p>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={driftThreshold}
            onChange={(e) => setDriftThreshold(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-gray-50 rounded-md p-4 text-sm space-y-1">
        <p className="font-medium text-gray-700 mb-2">Formula Preview</p>
        <p className="text-gray-500">
          Example billing rate: <span className="font-mono text-gray-800">$2,000</span>
        </p>
        <p className="text-gray-500">
          After overhead ({overhead || 0}%):{" "}
          <span className="font-mono text-gray-800">
            ${(exampleBilling - exampleBilling * overheadPct).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </p>
        <p className="text-gray-600 font-medium">
          Vendor target ({marketFactor || 0}%):{" "}
          <span className="font-mono text-blue-700">
            ${vendorTarget.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Alert triggers when actual vendor rate deviates &gt;{driftThreshold || 0}% from target (≥$
          {(vendorTarget * (1 + driftPct)).toLocaleString("en-US", { maximumFractionDigits: 0 })})
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Config"}
        </Button>
      </div>
    </div>
  );
}
