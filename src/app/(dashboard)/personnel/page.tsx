import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getPersonnel } from "@/actions/personnel.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import PersonnelTable from "@/components/features/personnel/PersonnelTable";

export const metadata: Metadata = {
  title: "Personnel — NTQ Vendor Mgmt",
};

export default async function PersonnelPage() {
  const [session, personnel, lookups] = await Promise.all([
    auth(),
    getPersonnel(),
    getFormLookups(),
  ]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Personnel</h1>
      <PersonnelTable
        personnel={personnel}
        isDULeader={isDULeader}
        vendors={lookups.vendors}
        jobTypes={lookups.jobTypes}
        techStacks={lookups.techStacks}
        levels={lookups.levels}
        domains={lookups.domains}
      />
    </div>
  );
}
