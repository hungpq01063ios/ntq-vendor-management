import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { getSystemConfigs } from "@/actions/rate.actions";
import { getMarkets } from "@/actions/market.actions";
import GlobalConfigForm from "@/components/features/rate/GlobalConfigForm";
import MarketConfigTable from "@/components/features/rate/MarketConfigTable";
import RateCalculator from "@/components/features/rate/RateCalculator";

export const metadata: Metadata = {
  title: "Rate Config — NTQ Vendor Mgmt",
};

export default async function RateConfigPage() {
  const { isDULeader } = await getSessionWithRole();

  if (!isDULeader) redirect("/rates");

  const [configs, markets] = await Promise.all([
    getSystemConfigs(),
    getMarkets(),
  ]);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rate Config</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure global rate parameters and per-market rate factors.
        </p>
      </div>

      {/* Section 1: Global parameters */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Global Parameters
        </h2>
        <GlobalConfigForm configs={configs} />
      </div>

      {/* Section 2: Rate Calculator */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Rate Calculator
        </h2>
        <RateCalculator
          markets={markets}
          overheadRatePct={configs["OVERHEAD_RATE_PCT"] ?? 0.2}
        />
      </div>

      {/* Section 3: Market configuration */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Markets &amp; Rate Factors
        </h2>
        <MarketConfigTable initialMarkets={markets} />
      </div>
    </div>
  );
}
