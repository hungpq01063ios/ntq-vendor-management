import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getProjectById } from "@/actions/project.actions";
import { getPersonnel } from "@/actions/personnel.actions";
import { getProjectRateBreakdown } from "@/actions/assignment.actions";
import { getMarkets } from "@/actions/market.actions";
import AssignmentSection from "@/components/features/assignment/AssignmentSection";
import ProjectPnLCard from "@/components/features/project/ProjectPnLCard";
import { format } from "date-fns";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  ENDED: "bg-gray-100 text-gray-500",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);

  const [project, { isDULeader }, availablePersonnel, rateBreakdown, markets] = await Promise.all([
    getProjectById(id),
    getSessionWithRole(),
    getPersonnel({ status: ["AVAILABLE", "ON_PROJECT"] }),
    getProjectRateBreakdown(id),
    getMarkets(true),
  ]);

  if (!project) notFound();

  const activeCount = project.assignments.filter(
    (a) => a.status === "ACTIVE"
  ).length;

  // CR-21: Resolve market name
  const marketName = markets.find((m) => m.code === project.marketCode)?.name ?? project.marketCode;

  const PROJECT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: t.common.statusActive,
    ON_HOLD: t.common.statusOnHold,
    ENDED: t.common.statusEnded,
  };

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        {t.project.backToProjects}
      </Link>

      {/* Section 1: Project Info */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] ?? ""}`}
              >
                {PROJECT_STATUS_LABELS[project.status] ?? project.status}
              </span>
              <span className="text-sm text-gray-500">
                {marketName}
              </span>
              <span className="text-sm text-gray-500">
                {activeCount} {t.project.activeMembers}
              </span>
            </div>
          </div>
          {isDULeader && (
            <Link
              href={`/projects/${id}/rates`}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-3 py-1.5"
            >
              {t.project.rateOverrides}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">{t.project.clientName}</span>
            <p className="font-medium text-gray-900">{project.clientName}</p>
          </div>
          <div>
            <span className="text-gray-500">{t.project.startDate}</span>
            <p className="font-medium text-gray-900">
              {format(new Date(project.startDate), "dd MMM yyyy")}
            </p>
          </div>
          {project.endDate && (
            <div>
              <span className="text-gray-500">{t.project.endDate}</span>
              <p className="font-medium text-gray-900">
                {format(new Date(project.endDate), "dd MMM yyyy")}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t.project.created}</span>
            <p className="font-medium text-gray-900">
              {format(new Date(project.createdAt), "dd MMM yyyy")}
            </p>
          </div>
          {/* CR-21: Domain */}
          {project.domain && (
            <div>
              <span className="text-gray-500">{t.rate.domain}</span>
              <p className="font-medium text-gray-900">{project.domain.name}</p>
            </div>
          )}
          {/* CR-21: Tech Stack */}
          {project.techStack && (
            <div>
              <span className="text-gray-500">{t.rate.techStack}</span>
              <p className="font-medium text-gray-900">{project.techStack.name}</p>
            </div>
          )}
          {/* CR-21: Market — display name instead of raw code */}
          <div>
            <span className="text-gray-500">{t.project.market}</span>
            <p className="font-medium text-gray-900">{marketName}</p>
          </div>
          {project.notes && (
            <div className="col-span-2">
              <span className="text-gray-500">{t.common.notes}</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                {project.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: P&L Summary (DU_LEADER only) */}
      {isDULeader && rateBreakdown.totalRevenue > 0 && (
        <ProjectPnLCard breakdown={rateBreakdown} />
      )}

      {/* Section 3: Assignments (with rates) */}
      <AssignmentSection
        projectId={id}
        assignments={project.assignments}
        availablePersonnel={availablePersonnel}
        isDULeader={isDULeader}
        rateRows={rateBreakdown.assignments}
      />
    </div>
  );
}
