"use client";

interface Props {
  normRate: number | null;
  projectOverrideRate: number | null;
  billingRate: number | null;
  vendorTargetRate: number | null;
  vendorRateActual: number | null;
  billingRateSource: "norm" | "project_override" | "manual";
  isDULeader: boolean;
}

function fmt(n: number | null): string {
  if (n === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const SOURCE_BADGES: Record<string, { label: string; cls: string }> = {
  norm: { label: "Norm Rate", cls: "bg-gray-100 text-gray-600" },
  project_override: {
    label: "Project Override",
    cls: "bg-blue-100 text-blue-700",
  },
  manual: { label: "Manual", cls: "bg-orange-100 text-orange-700" },
};

export default function RateSuggestionCard({
  billingRate,
  vendorTargetRate,
  vendorRateActual,
  billingRateSource,
  isDULeader,
}: Props) {
  const sourceBadge = SOURCE_BADGES[billingRateSource];

  let deltaLabel = "";
  let deltaCls = "";

  if (vendorRateActual !== null && vendorTargetRate !== null) {
    if (vendorRateActual > vendorTargetRate * 1.15) {
      const pct = (
        ((vendorRateActual - vendorTargetRate) / vendorTargetRate) *
        100
      ).toFixed(1);
      deltaLabel = `+${pct}% above target`;
      deltaCls = "bg-red-100 text-red-700";
    } else if (vendorRateActual > vendorTargetRate) {
      const pct = (
        ((vendorRateActual - vendorTargetRate) / vendorTargetRate) *
        100
      ).toFixed(1);
      deltaLabel = `+${pct}% above`;
      deltaCls = "bg-yellow-100 text-yellow-700";
    } else {
      const pct = (
        ((vendorTargetRate - vendorRateActual) / vendorTargetRate) *
        100
      ).toFixed(1);
      deltaLabel = `${pct}% below target`;
      deltaCls = "bg-green-100 text-green-700";
    }
  }

  return (
    <div className="rounded-lg border bg-gray-50 p-4 space-y-3 mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Rate Suggestion
      </p>

      {/* Row 1: Billing Rate */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Billing Rate</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{fmt(billingRate)}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${sourceBadge.cls}`}
          >
            {sourceBadge.label}
          </span>
        </div>
      </div>

      {isDULeader && (
        <>
          {/* Row 2: Vendor Target Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-700">Vendor Target Rate</span>
              <span
                className="text-xs text-gray-400 cursor-help"
                title="= (Billing × (1 − Overhead%)) × MarketFactor%"
              >
                ⓘ
              </span>
            </div>
            <span className="font-semibold text-gray-900">
              {fmt(vendorTargetRate)}
            </span>
          </div>

          {/* Row 3: Actual Vendor Rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Actual Vendor Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {fmt(vendorRateActual)}
              </span>
              {deltaLabel && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${deltaCls}`}>
                  {deltaLabel}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
