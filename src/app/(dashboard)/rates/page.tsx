import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getRateNorms } from "@/actions/rate.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import { getMarkets } from "@/actions/market.actions";
import RateMatrixGrid from "@/components/features/rate/RateMatrixGrid";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Định mức Rate — NTQ Vendor Mgmt",
};

export default async function RatesPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [{ isDULeader }, rateNorms, lookups, markets] = await Promise.all([
    getSessionWithRole(),
    getRateNorms(),
    getFormLookups(),
    getMarkets(true),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.rate.title}</h1>
      <RateMatrixGrid
        rateNorms={rateNorms}
        isDULeader={isDULeader}
        jobTypes={lookups.jobTypes}
        techStacks={lookups.techStacks}
        levels={lookups.levels}
        domains={lookups.domains}
        markets={markets}
      />
    </div>
  );
}
