import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProjects } from "@/actions/project.actions";
import { getMarkets } from "@/actions/market.actions";
import ProjectTable from "@/components/features/project/ProjectTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Dự án — NTQ Vendor Mgmt",
};

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [session, projects, markets] = await Promise.all([auth(), getProjects(), getMarkets(true)]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.project.title}</h1>
      <ProjectTable projects={projects} isDULeader={isDULeader} markets={markets} />
    </div>
  );
}
