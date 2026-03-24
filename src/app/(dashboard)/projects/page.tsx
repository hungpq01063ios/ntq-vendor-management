import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getProjects } from "@/actions/project.actions";
import { getMarkets } from "@/actions/market.actions";
import { getDomains, getTechStacks } from "@/actions/lookup.actions";
import ProjectTable from "@/components/features/project/ProjectTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Dự án — NTQ Vendor Mgmt",
};

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [{ isDULeader }, projects, markets, domains, techStacks] = await Promise.all([
    getSessionWithRole(),
    getProjects(),
    getMarkets(true),
    getDomains(),       // CR-11
    getTechStacks(),    // CR-11
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.project.title}</h1>
      <ProjectTable
        projects={projects}
        isDULeader={isDULeader}
        markets={markets}
        domains={domains}
        techStacks={techStacks}
      />
    </div>
  );
}
