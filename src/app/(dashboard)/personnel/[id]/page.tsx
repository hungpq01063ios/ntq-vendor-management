import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPersonnelById } from "@/actions/personnel.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import { getCVsByPersonnel } from "@/actions/cv.actions";
import PersonnelEditSection from "@/components/features/personnel/PersonnelEditSection";
import PersonnelCVSection from "@/components/features/personnel/PersonnelCVSection";
import { format } from "date-fns";

const INTERVIEW_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  SCREENING: "bg-yellow-100 text-yellow-800",
  TECHNICAL_TEST: "bg-orange-100 text-orange-800",
  INTERVIEW: "bg-blue-100 text-blue-800",
  PASSED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const PERSONNEL_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_PROJECT: "bg-blue-100 text-blue-800",
  ENDED: "bg-gray-100 text-gray-500",
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ENDED: "bg-gray-100 text-gray-500",
};

export default async function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [personnel, session, lookups, cvs] = await Promise.all([
    getPersonnelById(id),
    auth(),
    getFormLookups(),
    getCVsByPersonnel(id),
  ]);

  if (!personnel) notFound();

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div className="max-w-5xl">
      {/* Back + Actions row */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/personnel"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to Personnel
        </Link>
        <PersonnelEditSection
          personnel={personnel}
          vendors={lookups.vendors}
          jobTypes={lookups.jobTypes}
          techStacks={lookups.techStacks}
          levels={lookups.levels}
          domains={lookups.domains}
          isDULeader={isDULeader}
        />
      </div>

      {/* Section 1: Personnel Info */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {personnel.fullName}
              </h1>
              {personnel.leadership && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  ★ Leader
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PERSONNEL_STATUS_COLORS[personnel.status] ?? ""}`}
              >
                {personnel.status}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${INTERVIEW_COLORS[personnel.interviewStatus] ?? ""}`}
              >
                {personnel.interviewStatus.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">Vendor</span>
            <p className="font-medium">
              <Link
                href={`/vendors/${personnel.vendorId}`}
                className="text-blue-600 hover:underline"
              >
                {personnel.vendor.name}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-gray-500">Job Type</span>
            <p className="font-medium text-gray-900">{personnel.jobType.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Tech Stack</span>
            <p className="font-medium text-gray-900">
              {personnel.techStack?.name ?? <span className="text-gray-400">—</span>}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Level</span>
            <p className="font-medium text-gray-900">{personnel.level.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Domain</span>
            <p className="font-medium text-gray-900">
              {personnel.domain?.name ?? <span className="text-gray-400">—</span>}
            </p>
          </div>
          <div>
            <span className="text-gray-500">English Level</span>
            <p className="font-medium text-gray-900">{personnel.englishLevel}</p>
          </div>
          {isDULeader && personnel.vendorRateActual != null && (
            <div>
              <span className="text-gray-500">Vendor Rate</span>
              <p className="font-medium text-gray-900">
                ${personnel.vendorRateActual.toLocaleString()}/mo
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Added</span>
            <p className="font-medium text-gray-900">
              {format(new Date(personnel.createdAt), "dd MMM yyyy")}
            </p>
          </div>
          {personnel.leadershipNote && (
            <div className="col-span-2">
              <span className="text-gray-500">Leadership Note</span>
              <p className="text-gray-700 mt-1">{personnel.leadershipNote}</p>
            </div>
          )}
          {personnel.notes && (
            <div className="col-span-2">
              <span className="text-gray-500">Notes</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                {personnel.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Assignment History */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Assignment History ({personnel.assignments.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Project
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Start Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                End Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {personnel.assignments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No assignments yet.
                </td>
              </tr>
            )}
            {personnel.assignments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${a.projectId}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {a.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {a.roleInProject ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(a.startDate), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {a.endDate
                    ? format(new Date(a.endDate), "dd MMM yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ASSIGNMENT_STATUS_COLORS[a.status] ?? ""}`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: CV / Resume */}
      <PersonnelCVSection personnelId={id} cvs={cvs} />
    </div>
  );
}
