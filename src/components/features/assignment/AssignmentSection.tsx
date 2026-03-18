"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { endAssignment } from "@/actions/assignment.actions";
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

type AssignmentRow = Assignment & {
  personnel: Personnel & {
    vendor: Vendor;
    jobType: JobType;
    techStack: TechStack;
    level: Level;
    domain: Domain;
  };
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ENDED: "bg-gray-100 text-gray-500",
};

interface Props {
  projectId: string;
  assignments: AssignmentRow[];
  availablePersonnel: PersonnelWithRelations[];
  isDULeader: boolean;
}

export default function AssignmentSection({
  projectId,
  assignments,
  availablePersonnel,
  isDULeader,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  async function handleEnd(id: string) {
    setEndingId(id);
    try {
      await endAssignment(id);
      toast.success("Assignment ended");
    } catch {
      toast.error("Failed to end assignment");
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Assignments ({assignments.length})
        </h2>
        <Button onClick={() => setSheetOpen(true)} size="sm">
          + Add Assignment
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Personnel
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Vendor
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Job Type
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Level
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Role
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Start Date
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Status
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-8 text-center text-gray-400"
              >
                No assignments yet. Click "+ Add Assignment" to get started.
              </td>
            </tr>
          )}
          {assignments.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  href={`/personnel/${a.personnelId}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {a.personnel.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {a.personnel.vendor.name}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {a.personnel.jobType.name}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {a.personnel.level.name}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {a.roleInProject ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {format(new Date(a.startDate), "dd MMM yyyy")}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ASSIGNMENT_STATUS_COLORS[a.status] ?? ""}`}
                >
                  {a.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {a.status === "ACTIVE" && (
                  <button
                    onClick={() => handleEnd(a.id)}
                    disabled={endingId === a.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {endingId === a.id ? "Ending..." : "End"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AssignmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        projectId={projectId}
        availablePersonnel={availablePersonnel}
        isDULeader={isDULeader}
      />
    </div>
  );
}
