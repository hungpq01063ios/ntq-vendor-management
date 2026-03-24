"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { endAssignment, deleteAssignment } from "@/actions/assignment.actions";
import { useTranslations } from "@/i18n";
import AssignmentSheet from "./AssignmentSheet";
import type {
  Assignment,
  Personnel,
  Vendor,
  JobType,
  TechStack,
  Level,
  Domain,
  PersonnelWithRelations,
} from "@/types";
import type { AssignmentRateRow } from "@/actions/assignment.actions";

type AssignmentRow = Assignment & {
  personnel: Personnel & {
    vendor: Vendor;
    jobType: JobType;
    techStack: TechStack | null;
    level: Level;
    domain: Domain | null;
  };
};

type AssignmentRowWithPersonnelRelations = AssignmentRow & {
  personnel: PersonnelWithRelations;
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ENDED: "bg-gray-100 text-gray-500",
};

const RATE_SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  member_override: { label: "Override", color: "bg-purple-100 text-purple-700" },
  project_override: { label: "Project", color: "bg-blue-100 text-blue-700" },
  norm: { label: "Norm", color: "bg-gray-100 text-gray-600" },
  manual: { label: "—", color: "bg-gray-100 text-gray-400" },
};

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  projectId: string;
  assignments: AssignmentRow[];
  availablePersonnel: PersonnelWithRelations[];
  isDULeader: boolean;
  /** Rate breakdown per assignment — from Server */
  rateRows: AssignmentRateRow[];
}

export default function AssignmentSection({
  projectId,
  assignments,
  availablePersonnel,
  isDULeader,
  rateRows,
}: Props) {
  const router = useRouter();
  const { t } = useTranslations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRowWithPersonnelRelations | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build rate map for O(1) lookup
  const rateMap = new Map(rateRows.map((r) => [r.assignmentId, r]));

  function openCreate() {
    setEditingAssignment(null);
    setSheetOpen(true);
  }

  function openEdit(a: AssignmentRowWithPersonnelRelations) {
    setEditingAssignment(a);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingAssignment(null);
  }

  async function handleEnd(id: string) {
    setEndingId(id);
    const result = await endAssignment(id);
    setEndingId(null);
    if (result.success) {
      toast.success(t.project.assignmentEnded);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.rate.deleteRateNormConfirm)) return;
    setDeletingId(id);
    const result = await deleteAssignment(id);
    setDeletingId(null);
    if (result.success) {
      toast.success(t.project.assignmentDeleted);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {t.project.assignments} ({assignments.length})
        </h2>
        <Button onClick={openCreate} size="sm">
          {t.project.addAssignment}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.personnel.vendor}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.personnel.vendor}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.project.roleInProject}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.project.startDate}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.project.billingRate}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.project.vendorRate}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.project.margin}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.status}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {t.project.noAssignments} {t.project.noAssignmentsHint}
                </td>
              </tr>
            )}
            {assignments.map((a) => {
              const rateRow = rateMap.get(a.id);
              const rates = rateRow?.rates;
              const sourceInfo = rates
                ? RATE_SOURCE_BADGE[rates.billingRateSource] ?? RATE_SOURCE_BADGE["manual"]
                : null;

              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/personnel/${a.personnelId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {a.personnel.fullName}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {a.personnel.jobType.name} / {a.personnel.level.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {a.personnel.vendor.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {a.roleInProject ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(a.startDate), "dd MMM yyyy")}
                  </td>

                  {/* Billing Rate */}
                  <td className="px-4 py-3 text-right">
                    {rates ? (
                      <div>
                        <span className="font-medium text-gray-900">
                          {formatUSD(rates.billingRate)}
                        </span>
                        {sourceInfo && (
                          <span
                            className={`ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${sourceInfo.color}`}
                          >
                            {sourceInfo.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Vendor Rate */}
                  <td className="px-4 py-3 text-right">
                    {rates ? (
                      <span
                        className={`font-medium ${
                          rates.isAboveTarget ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {formatUSD(rates.vendorRate)}
                        {rates.isAboveTarget && (
                          <span className="ml-1 text-[10px] text-red-500">⚠</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Margin */}
                  <td className="px-4 py-3 text-right">
                    {rates ? (
                      <div>
                        <span
                          className={`font-medium ${
                            rates.grossMarginPct >= 0.3
                              ? "text-green-600"
                              : rates.grossMarginPct >= 0.1
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {(rates.grossMarginPct * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        ASSIGNMENT_STATUS_COLORS[a.status] ?? ""
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(a as AssignmentRowWithPersonnelRelations)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>

                      {/* End (soft delete) */}
                      {a.status === "ACTIVE" && (
                        <button
                          onClick={() => handleEnd(a.id)}
                          disabled={endingId === a.id}
                          className="text-xs text-orange-500 hover:text-orange-700 disabled:opacity-50"
                        >
                          {endingId === a.id ? t.project.ending : t.project.end}
                        </button>
                      )}

                      {/* Delete (hard delete) — DU_LEADER only */}
                      {isDULeader && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === a.id ? t.common.loading : t.common.delete}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AssignmentSheet
        open={sheetOpen}
        onClose={closeSheet}
        projectId={projectId}
        availablePersonnel={availablePersonnel}
        isDULeader={isDULeader}
        assignment={editingAssignment ?? undefined}
      />
    </div>
  );
}
