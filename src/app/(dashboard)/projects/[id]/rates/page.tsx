import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/actions/project.actions";
import { getRateNorms, getProjectRateOverrides } from "@/actions/rate.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import ProjectRateOverrideTable from "@/components/features/rate/ProjectRateOverrideTable";

export default async function ProjectRatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  if (!isDULeader) redirect(`/projects/${id}`);

  const [project, rateNorms, overrides, lookups] = await Promise.all([
    getProjectById(id),
    getRateNorms(),
    getProjectRateOverrides(id),
    getFormLookups(),
  ]);

  if (!project) notFound();

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        ← Back to {project.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rate Overrides</h1>
        <p className="text-sm text-gray-500 mt-1">
          Project-level billing rate overrides for{" "}
          <span className="font-medium text-gray-700">{project.name}</span>.
          Overrides take precedence over global rate norms.
        </p>
      </div>

      <ProjectRateOverrideTable
        projectId={id}
        overrides={overrides}
        rateNorms={rateNorms}
        jobTypes={lookups.jobTypes}
        techStacks={lookups.techStacks}
        levels={lookups.levels}
        domains={lookups.domains}
      />
    </div>
  );
}
