"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateInterviewStatus } from "@/actions/personnel.actions";
import { useTranslations } from "@/i18n";
import type { InterviewStatus } from "@/types";

const PIPELINE_STAGES = [
  {
    key: "NEW",
    label: "Mới",
    headerColor: "bg-gray-100 border-gray-300 text-gray-700",
    cardColor: "bg-gray-50",
  },
  {
    key: "SCREENING",
    label: "Sàng lọc",
    headerColor: "bg-yellow-100 border-yellow-300 text-yellow-800",
    cardColor: "bg-yellow-50",
  },
  {
    key: "TECHNICAL_TEST",
    label: "Test kỹ thuật",
    headerColor: "bg-orange-100 border-orange-300 text-orange-800",
    cardColor: "bg-orange-50",
  },
  {
    key: "INTERVIEW",
    label: "Phỏng vấn",
    headerColor: "bg-blue-100 border-blue-300 text-blue-800",
    cardColor: "bg-blue-50",
  },
  {
    key: "PASSED",
    label: "Đạt",
    headerColor: "bg-green-100 border-green-300 text-green-800",
    cardColor: "bg-green-50",
  },
  {
    key: "FAILED",
    label: "Không đạt",
    headerColor: "bg-red-100 border-red-300 text-red-800",
    cardColor: "bg-red-50",
  },
] as const;

type PersonnelItem = {
  id: string;
  fullName: string;
  leadership: boolean;
  englishLevel: string;
  interviewStatus: string;
  status: string;
  vendor: { id: string; name: string };
  jobType: { id: string; name: string };
  level: { id: string; name: string };
  assignments: { id: string; status: string; project: { id: string; name: string } }[];
};

interface PipelineClientProps {
  personnel: PersonnelItem[];
  projects: { id: string; name: string }[];
}

// CR-27: Quick action menu on pipeline cards
function PipelineCard({
  person,
  stage,
  stageLabels,
}: {
  person: PersonnelItem;
  stage: typeof PIPELINE_STAGES[number];
  stageLabels: Record<string, string>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { t } = useTranslations();
  const router = useRouter();

  const otherStages = PIPELINE_STAGES.filter((s) => s.key !== person.interviewStatus);

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    const result = await updateInterviewStatus(
      person.id,
      newStatus as InterviewStatus
    );
    setUpdating(false);
    setMenuOpen(false);
    if (result.success) {
      toast.success(`${person.fullName} → ${stageLabels[newStatus] ?? newStatus}`);
      router.refresh();
    } else {
      toast.error(result.error ?? t.common.somethingWentWrong);
    }
  }

  return (
    <div
      className={`relative rounded-lg border p-3 transition-shadow ${stage.cardColor} border-gray-200 ${updating ? "opacity-50" : "hover:shadow-sm"}`}
    >
      {/* Card content */}
      <Link href={`/personnel/${person.id}`} className="block">
        <p className="font-medium text-sm text-gray-900 truncate">
          {person.fullName}
          {person.leadership && (
            <span className="ml-1 text-amber-500 text-xs">★</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {person.vendor.name}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs bg-white/70 rounded px-1.5 py-0.5 text-gray-700 border border-gray-200">
            {person.jobType.name}
          </span>
          <span className="text-xs bg-white/70 rounded px-1.5 py-0.5 text-gray-700 border border-gray-200">
            {person.level.name}
          </span>
        </div>
        {person.assignments.length > 0 && (
          <p className="text-xs text-blue-600 mt-1 truncate">
            📁 {person.assignments.map((a) => a.project.name).join(", ")}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          EN: {person.englishLevel.charAt(0) + person.englishLevel.slice(1).toLowerCase()}
        </p>
      </Link>

      {/* CR-27: Quick action button (⋮) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-white/80 hover:text-gray-700 transition-colors"
        title={t.common.actions}
      >
        ⋮
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-8 right-1 z-20 bg-white rounded-lg shadow-lg border py-1 min-w-[160px]">
            <p className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">
              Move to
            </p>
            {otherStages.map((s) => (
              <button
                key={s.key}
                onClick={() => handleStatusChange(s.key)}
                disabled={updating}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${s.headerColor.split(" ")[0]}`} />
                {stageLabels[s.key] ?? s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PipelineClient({ personnel, projects }: PipelineClientProps) {
  const [projectFilter, setProjectFilter] = useState(""); // CR-12
  const { t } = useTranslations();

  const STAGE_LABELS: Record<string, string> = {
    NEW: t.common.interviewNew,
    SCREENING: t.common.interviewScreening,
    TECHNICAL_TEST: t.common.interviewTechnicalTest,
    INTERVIEW: t.common.interviewInterview,
    PASSED: t.common.interviewPassed,
    FAILED: t.common.interviewFailed,
  };

  // Exclude ended personnel
  const pipelinePersonnel = useMemo(() => {
    let list = personnel.filter((p) => p.status !== "ENDED");
    // CR-12: Filter by project if selected
    if (projectFilter) {
      list = list.filter((p) =>
        p.assignments.some((a) => a.project.id === projectFilter)
      );
    }
    return list;
  }, [personnel, projectFilter]);

  const grouped = useMemo(() => {
    return PIPELINE_STAGES.reduce(
      (acc, stage) => {
        acc[stage.key] = pipelinePersonnel.filter(
          (p) => p.interviewStatus === stage.key
        );
        return acc;
      },
      {} as Record<string, PersonnelItem[]>
    );
  }, [pipelinePersonnel]);

  const total = pipelinePersonnel.length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t.personnel.pipeline}</h1>
          <span className="text-sm text-gray-500">{total} {t.personnel.pipelineTotal}</span>
        </div>

        {/* CR-12: Project filter */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">{t.personnel.pipelineFilterByProject}</label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.personnel.pipelineAllProjects}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {projectFilter && (
            <button
              onClick={() => setProjectFilter("")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {t.personnel.pipelineClearFilter}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const cards = grouped[stage.key] ?? [];
            return (
              <div key={stage.key} className="w-60 flex flex-col">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${stage.headerColor} mb-1`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {STAGE_LABELS[stage.key] ?? stage.label}
                  </span>
                  <span className="text-xs font-bold bg-white/60 rounded-full px-1.5 py-0.5">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[200px]">
                  {cards.length === 0 && (
                    <div className="flex-1 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-300">{t.personnel.pipelineEmpty}</span>
                    </div>
                  )}
                  {cards.map((p) => (
                    <PipelineCard
                      key={p.id}
                      person={p}
                      stage={stage}
                      stageLabels={STAGE_LABELS}
                    />
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
