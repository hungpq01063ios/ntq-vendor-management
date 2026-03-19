import type { ProjectRateBreakdown } from "@/actions/assignment.actions";
import { formatCurrency, formatPct } from "@/lib/rate-engine";

interface Props {
  breakdown: ProjectRateBreakdown;
}

export default function ProjectPnLCard({ breakdown }: Props) {
  const { totalRevenue, totalCost, totalMargin, totalMarginPct } = breakdown;

  const marginColor =
    totalMarginPct >= 0.3
      ? "text-green-600"
      : totalMarginPct >= 0.1
        ? "text-yellow-600"
        : "text-red-600";

  const marginBg =
    totalMarginPct >= 0.3
      ? "bg-green-50 border-green-200"
      : totalMarginPct >= 0.1
        ? "bg-yellow-50 border-yellow-200"
        : "bg-red-50 border-red-200";

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Project P&amp;L <span className="text-sm font-normal text-gray-400">(Active members only)</span>
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
            Monthly Revenue
          </p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-blue-500 mt-1">Billing rate total</p>
        </div>

        {/* Cost */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
            Monthly Cost
          </p>
          <p className="text-2xl font-bold text-orange-700">
            {formatCurrency(totalCost)}
          </p>
          <p className="text-xs text-orange-500 mt-1">Vendor rate total</p>
        </div>

        {/* Margin */}
        <div className={`rounded-lg p-4 border ${marginBg}`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${marginColor}`}>
            Gross Margin
          </p>
          <p className={`text-2xl font-bold ${marginColor}`}>
            {formatCurrency(totalMargin)}
          </p>
          <p className={`text-xs mt-1 ${marginColor}`}>
            {formatPct(totalMarginPct)} of revenue
          </p>
        </div>
      </div>
    </div>
  );
}
