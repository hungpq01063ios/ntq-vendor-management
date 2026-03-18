import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getRateNorms } from "@/actions/rate.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import RateMatrixGrid from "@/components/features/rate/RateMatrixGrid";

export const metadata: Metadata = {
  title: "Rate Norms — NTQ Vendor Mgmt",
};

export default async function RatesPage() {
  const [session, rateNorms, lookups] = await Promise.all([
    auth(),
    getRateNorms(),
    getFormLookups(),
  ]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rate Norms</h1>
      <RateMatrixGrid
        rateNorms={rateNorms}
        isDULeader={isDULeader}
        jobTypes={lookups.jobTypes}
        techStacks={lookups.techStacks}
        levels={lookups.levels}
        domains={lookups.domains}
      />
    </div>
  );
}
