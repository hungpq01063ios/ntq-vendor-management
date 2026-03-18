import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProjects } from "@/actions/project.actions";
import ProjectTable from "@/components/features/project/ProjectTable";

export const metadata: Metadata = {
  title: "Projects — NTQ Vendor Mgmt",
};

export default async function ProjectsPage() {
  const [session, projects] = await Promise.all([auth(), getProjects()]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Projects</h1>
      <ProjectTable projects={projects} isDULeader={isDULeader} />
    </div>
  );
}
