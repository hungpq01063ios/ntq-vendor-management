import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getPersonnel } from "@/actions/personnel.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import PersonnelTable from "@/components/features/personnel/PersonnelTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Nhân sự — NTQ Vendor Mgmt",
};

export default async function PersonnelPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [{ isDULeader }, personnel, lookups] = await Promise.all([
    getSessionWithRole(),
    getPersonnel(),
    getFormLookups(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.personnel.title}</h1>
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
