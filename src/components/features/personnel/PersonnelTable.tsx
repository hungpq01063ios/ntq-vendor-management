"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  updateInterviewStatus,
  softDeletePersonnel,
} from "@/actions/personnel.actions";
import { useTranslations } from "@/i18n";
import PersonnelSheet from "./PersonnelSheet";
import type {
  Personnel,
  Vendor,
  JobType,
  TechStack,
  Level,
  Domain,
  InterviewStatus,
} from "@/types";


type PersonnelRow = Personnel & {
  vendor: Vendor;
  jobType: JobType;
  techStack: TechStack | null;
  level: Level;
  domain: Domain | null;
};

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

const INTERVIEW_STATUSES = [
  "NEW",
  "SCREENING",
  "TECHNICAL_TEST",
  "INTERVIEW",
  "PASSED",
  "FAILED",
] as const;

function InterviewStatusSelect({
  personnelId,
  currentStatus,
}: {
  personnelId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslations();

  const INTERVIEW_STATUS_LABELS: Record<string, string> = {
    NEW: t.common.interviewNew,
    SCREENING: t.common.interviewScreening,
    TECHNICAL_TEST: t.common.interviewTechnicalTest,
    INTERVIEW: t.common.interviewInterview,
    PASSED: t.common.interviewPassed,
    FAILED: t.common.interviewFailed,
  };

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    const result = await updateInterviewStatus(
      personnelId,
      e.target.value as InterviewStatus
    );
    setLoading(false);
    if (result.success) {
      toast.success(t.personnel.interviewStatus + " updated");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={loading}
      className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      {INTERVIEW_STATUSES.map((s) => (
        <option key={s} value={s}>
          {INTERVIEW_STATUS_LABELS[s] ?? s}
        </option>
      ))}
    </select>
  );
}

interface PersonnelTableProps {
  personnel: PersonnelRow[];
  isDULeader: boolean;
  vendors: { id: string; name: string }[];
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
}

export default function PersonnelTable({
  personnel,
  isDULeader,
  vendors,
  jobTypes,
  techStacks,
  levels,
  domains,
}: PersonnelTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [interviewFilter, setInterviewFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [techStackFilter, setTechStackFilter] = useState("");
  const { t } = useTranslations();

  const PERSONNEL_STATUS_LABELS: Record<string, string> = {
    AVAILABLE: t.common.statusAvailable,
    ON_PROJECT: t.common.statusOnProject,
    ENDED: t.common.statusEnded,
  };
  const INTERVIEW_STATUS_LABELS: Record<string, string> = {
    NEW: t.common.interviewNew,
    SCREENING: t.common.interviewScreening,
    TECHNICAL_TEST: t.common.interviewTechnicalTest,
    INTERVIEW: t.common.interviewInterview,
    PASSED: t.common.interviewPassed,
    FAILED: t.common.interviewFailed,
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<Personnel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonnelRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return personnel.filter((p) => {
      const matchSearch =
        !search || p.fullName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchInterview =
        !interviewFilter || p.interviewStatus === interviewFilter;
      const matchJobType = !jobTypeFilter || p.jobTypeId === jobTypeFilter;
      const matchTechStack =
        !techStackFilter || p.techStackId === techStackFilter;
      return (
        matchSearch &&
        matchStatus &&
        matchInterview &&
        matchJobType &&
        matchTechStack
      );
    });
  }, [personnel, search, statusFilter, interviewFilter, jobTypeFilter, techStackFilter]);

  function openEdit(p: Personnel) {
    setSelectedPersonnel(p);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await softDeletePersonnel(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      toast.success(`${deleteTarget.fullName} ${t.common.statusEnded.toLowerCase()}`);
      setDeleteTarget(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t.personnel.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.common.allStatuses}</option>
          <option value="AVAILABLE">{t.common.statusAvailable}</option>
          <option value="ON_PROJECT">{t.common.statusOnProject}</option>
          <option value="ENDED">{t.common.statusEnded}</option>
        </select>
        <select
          value={interviewFilter}
          onChange={(e) => setInterviewFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.personnel.interviewStatus}</option>
          {INTERVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INTERVIEW_STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={jobTypeFilter}
          onChange={(e) => setJobTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.vendor.jobType}</option>
          {jobTypes.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select>
        <select
          value={techStackFilter}
          onChange={(e) => setTechStackFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.vendor.techStack}</option>
          {techStacks.map((ts) => (
            <option key={ts.id} value={ts.id}>
              {ts.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Button
            onClick={() => {
              setSelectedPersonnel(null);
              setSheetOpen(true);
            }}
          >
            {t.personnel.addPersonnel}
          </Button>
        </div>
      </div>

      {/* Active filter badges */}
      {(statusFilter || interviewFilter || jobTypeFilter || techStackFilter) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { value: statusFilter, clear: () => setStatusFilter(""), label: statusFilter },
            { value: interviewFilter, clear: () => setInterviewFilter(""), label: interviewFilter.replace("_", " ") },
            { value: jobTypeFilter, clear: () => setJobTypeFilter(""), label: jobTypes.find((j) => j.id === jobTypeFilter)?.name },
            { value: techStackFilter, clear: () => setTechStackFilter(""), label: techStacks.find((t) => t.id === techStackFilter)?.name },
          ]
            .filter((b) => b.value)
            .map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {b.label}
                <button onClick={b.clear} className="hover:text-blue-600">
                  ✕
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.personnel.fullName}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.personnel.vendor}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.vendor.jobType}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.vendor.techStack}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.vendor.level}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                English
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.vendor.interview}
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.common.status}
              </th>
              {isDULeader && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t.personnel.vendorRate}
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                {t.common.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isDULeader ? 10 : 9}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {t.personnel.noPersonnel}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-1">
                    {p.fullName}
                    {p.leadership && (
                      <span className="text-xs text-amber-600 font-bold" title="Leadership">
                        ★
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.vendor.name}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.jobType.name}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.techStack?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.level.name}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.englishLevel}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${INTERVIEW_COLORS[p.interviewStatus] ?? ""}`}
                  >
                    {INTERVIEW_STATUS_LABELS[p.interviewStatus] ?? p.interviewStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PERSONNEL_STATUS_COLORS[p.status] ?? ""}`}
                  >
                    {PERSONNEL_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                {isDULeader && (
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {p.vendorRateActual != null
                      ? `$${p.vendorRateActual.toLocaleString()}`
                      : "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/personnel/${p.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {t.common.view}
                    </Link>
                    <button
                      onClick={() => openEdit(p)}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      {t.common.edit}
                    </button>
                    <InterviewStatusSelect
                      personnelId={p.id}
                      currentStatus={p.interviewStatus}
                    />
                    {isDULeader && (
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        {t.common.statusEnded}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Personnel Sheet */}
      <PersonnelSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        personnel={selectedPersonnel ?? undefined}
        vendors={vendors}
        jobTypes={jobTypes}
        techStacks={techStacks}
        levels={levels}
        domains={domains}
        isDULeader={isDULeader}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.vendor.deactivateTitle.replace("vendor", t.personnel.title.toLowerCase())}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{deleteTarget.fullName}</strong> {t.vendor.deactivateBody}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? t.common.saving : t.common.statusEnded}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
