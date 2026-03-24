"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProjectRateOverride } from "@/actions/rate.actions";
import RateOverrideSheet from "./RateOverrideSheet";
import type { JobType, TechStack, Level, Domain, RateNorm } from "@/types";

interface Override {
  id: string;
  jobTypeId: string;
  techStackId: string;
  levelId: string;
  domainId: string;
  customBillingRate: number;
  setAt: Date;
  jobType: JobType;
  techStack: TechStack | null; // null when techStackId is ""
  level: Level;
  domain: Domain | null;       // null when domainId is ""
}

interface Props {
  projectId: string;
  overrides: Override[];
  rateNorms: RateNorm[];
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProjectRateOverrideTable({
  projectId,
  overrides,
  rateNorms,
  jobTypes,
  techStacks,
  levels,
  domains,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<Override | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Override | null>(null);
  const [deleting, setDeleting] = useState(false);

  function getNormRate(override: Override): number | null {
    const norm = rateNorms.find(
      (n) =>
        n.jobTypeId === override.jobTypeId &&
        n.techStackId === override.techStackId &&
        n.levelId === override.levelId &&
        n.domainId === override.domainId
    );
    return norm?.rateNorm ?? null;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProjectRateOverride(deleteTarget.id);
      toast.success("Override deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {overrides.length} override{overrides.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => {
            setEditingOverride(null);
            setSheetOpen(true);
          }}
        >
          + Add Override
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tech Stack</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Level</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Norm Rate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Custom Rate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Delta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Set At</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {overrides.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  No rate overrides. Assignments will use the rate norm.
                </td>
              </tr>
            )}
            {overrides.map((o) => {
              const normRate = getNormRate(o);
              const delta =
                normRate !== null
                  ? ((o.customBillingRate - normRate) / normRate) * 100
                  : null;

              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{o.jobType.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.techStack?.name ?? <span className="text-gray-400">Any</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{o.level.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.domain?.name ?? <span className="text-gray-400">Any</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {normRate !== null ? fmt(normRate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {fmt(o.customBillingRate)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {delta !== null ? (
                      <span
                        className={
                          delta > 0
                            ? "text-green-600"
                            : delta < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(o.setAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingOverride(o);
                          setSheetOpen(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(o)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rate Override Sheet */}
      <RateOverrideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        projectId={projectId}
        override={editingOverride ?? undefined}
        rateNorms={rateNorms}
        jobTypes={jobTypes}
        techStacks={techStacks}
        levels={levels}
        domains={domains}
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
                Delete rate override?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>
                  {deleteTarget.jobType.name}{deleteTarget.techStack ? ` / ${deleteTarget.techStack.name}` : ""} /{" "}
                  {deleteTarget.level.name}
                </strong>{" "}
                override will be removed. Assignments will fall back to the rate norm.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
