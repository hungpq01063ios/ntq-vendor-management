"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { softDeleteProject } from "@/actions/project.actions";
import ProjectSheet from "./ProjectSheet";
import type { Project } from "@/types";

type ProjectRow = Project & {
  assignments: { id: string; status: string }[];
};

const MARKET_LABELS: Record<string, string> = {
  ENGLISH: "English",
  JAPAN: "Japan",
  KOREA: "Korea",
  OTHER: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  ENDED: "bg-gray-100 text-gray-500",
};

interface Props {
  projects: ProjectRow[];
  isDULeader: boolean;
}

export default function ProjectTable({ projects, isDULeader }: Props) {
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q);
      const matchMarket = !marketFilter || p.market === marketFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchMarket && matchStatus;
    });
  }, [projects, search, marketFilter, statusFilter]);

  function openEdit(p: Project) {
    setSelectedProject(p);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await softDeleteProject(deleteTarget.id);
      toast.success(`${deleteTarget.name} marked as ended`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to update project");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={marketFilter}
          onChange={(e) => setMarketFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Markets</option>
          <option value="ENGLISH">English</option>
          <option value="JAPAN">Japan</option>
          <option value="KOREA">Korea</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="ENDED">Ended</option>
        </select>
        <div className="ml-auto">
          <Button
            onClick={() => {
              setSelectedProject(null);
              setSheetOpen(true);
            }}
          >
            + New Project
          </Button>
        </div>
      </div>

      {/* Active filter badges */}
      {(marketFilter || statusFilter) && (
        <div className="flex gap-2 mb-3">
          {marketFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {MARKET_LABELS[marketFilter]}
              <button
                onClick={() => setMarketFilter("")}
                className="hover:text-blue-600"
              >
                ✕
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {statusFilter}
              <button
                onClick={() => setStatusFilter("")}
                className="hover:text-blue-600"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Project Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Client
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Market
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Headcount
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
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No projects found.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const activeCount = p.assignments.filter(
                (a) => a.status === "ACTIVE"
              ).length;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.clientName}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {MARKET_LABELS[p.market] ?? p.market}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{activeCount}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(p.startDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-gray-600 hover:text-gray-900 text-xs"
                      >
                        Edit
                      </button>
                      {isDULeader && (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          End
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

      {/* Project Sheet */}
      <ProjectSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        project={selectedProject ?? undefined}
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
                End project?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{deleteTarget.name}</strong> will be marked as{" "}
                <span className="font-medium">ENDED</span>.
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
                  {deleting ? "Ending..." : "End Project"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
