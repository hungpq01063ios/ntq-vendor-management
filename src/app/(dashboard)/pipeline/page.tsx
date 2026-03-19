import type { Metadata } from "next";
import Link from "next/link";
import { getPersonnel } from "@/actions/personnel.actions";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Pipeline — NTQ Vendor Mgmt",
};

export default async function PipelinePage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);

  const PIPELINE_STAGES = [
    {
      key: "NEW",
      label: t.common.interviewNew,
      headerColor: "bg-gray-100 border-gray-300 text-gray-700",
      cardColor: "bg-gray-50",
    },
    {
      key: "SCREENING",
      label: t.common.interviewScreening,
      headerColor: "bg-yellow-100 border-yellow-300 text-yellow-800",
      cardColor: "bg-yellow-50",
    },
    {
      key: "TECHNICAL_TEST",
      label: t.common.interviewTechnicalTest,
      headerColor: "bg-orange-100 border-orange-300 text-orange-800",
      cardColor: "bg-orange-50",
    },
    {
      key: "INTERVIEW",
      label: t.common.interviewInterview,
      headerColor: "bg-blue-100 border-blue-300 text-blue-800",
      cardColor: "bg-blue-50",
    },
    {
      key: "PASSED",
      label: t.common.interviewPassed,
      headerColor: "bg-green-100 border-green-300 text-green-800",
      cardColor: "bg-green-50",
    },
    {
      key: "FAILED",
      label: t.common.interviewFailed,
      headerColor: "bg-red-100 border-red-300 text-red-800",
      cardColor: "bg-red-50",
    },
  ] as const;

  const allPersonnel = await getPersonnel();
  // Exclude fully ended personnel (status=ENDED) from pipeline view
  const pipelinePersonnel = allPersonnel.filter((p) => p.status !== "ENDED");

  const grouped = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = pipelinePersonnel.filter(
        (p) => p.interviewStatus === stage.key
      );
      return acc;
    },
    {} as Record<string, typeof pipelinePersonnel>
  );

  const total = pipelinePersonnel.length;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.nav.pipeline}</h1>
        <span className="text-sm text-gray-500">{total} {t.personnel.title.toLowerCase()}</span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const cards = grouped[stage.key] ?? [];
            return (
              <div
                key={stage.key}
                className="w-60 flex flex-col"
              >
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${stage.headerColor} mb-1`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold bg-white/60 rounded-full px-1.5 py-0.5">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[200px]">
                  {cards.length === 0 && (
                    <div className="flex-1 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-300">{t.common.noData}</span>
                    </div>
                  )}
                  {cards.map((p) => (
                    <Link
                      key={p.id}
                      href={`/personnel/${p.id}`}
                      className={`block rounded-lg border p-3 hover:shadow-sm transition-shadow ${stage.cardColor} border-gray-200`}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {p.fullName}
                        {p.leadership && (
                          <span className="ml-1 text-amber-500 text-xs">★</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {p.vendor.name}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs bg-white/70 rounded px-1.5 py-0.5 text-gray-700 border border-gray-200">
                          {p.jobType.name}
                        </span>
                        <span className="text-xs bg-white/70 rounded px-1.5 py-0.5 text-gray-700 border border-gray-200">
                          {p.level.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        EN: {p.englishLevel}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
