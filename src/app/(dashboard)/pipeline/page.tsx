import type { Metadata } from "next";
import { getPersonnel } from "@/actions/personnel.actions";
import { getProjects } from "@/actions/project.actions";
import PipelineClient from "@/components/features/pipeline/PipelineClient";

export const metadata: Metadata = {
  title: "Pipeline — NTQ Vendor Mgmt",
};

export default async function PipelinePage() {
  const [allPersonnel, projects] = await Promise.all([
    getPersonnel(),
    getProjects(),
  ]);

  // Pass all data to client component (includes assignments for project filter)
  const pipelinePersonnel = allPersonnel.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    leadership: p.leadership,
    englishLevel: p.englishLevel,
    interviewStatus: p.interviewStatus,
    status: p.status,
    vendor: { id: p.vendor.id, name: p.vendor.name },
    jobType: { id: p.jobType.id, name: p.jobType.name },
    level: { id: p.level.id, name: p.level.name },
    assignments: (p.assignments ?? []).map((a) => ({
      id: a.id,
      status: a.status,
      project: { id: a.project.id, name: a.project.name },
    })),
  }));

  const projectList = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <PipelineClient personnel={pipelinePersonnel} projects={projectList} />
  );
}
