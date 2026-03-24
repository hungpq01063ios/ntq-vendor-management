"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteRateNorm, cloneRatesFromMarket } from "@/actions/rate.actions";
import { importRateNorms } from "@/actions/import.actions";
import RateNormSheet from "./RateNormSheet";
import ImportDialog from "@/components/features/import/ImportDialog";
import type { RateNormWithRelations, JobType, TechStack, Level, Domain, MarketConfig } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  rateNorms: RateNormWithRelations[];
  isDULeader: boolean;
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
  markets: MarketConfig[];
}

export default function RateMatrixGrid({
  rateNorms,
  isDULeader,
  jobTypes,
  techStacks,
  levels,
  domains,
  markets,
}: Props) {
  const [marketTab, setMarketTab] = useState<string>(markets[0]?.code ?? "ENGLISH");
  const [domainFilter, setDomainFilter] = useState("");
  const [techStackFilter, setTechStackFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNorm, setEditingNorm] = useState<RateNormWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RateNormWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);

  const filtered = useMemo(() => {
    return rateNorms.filter((n) => {
      const matchMarket = n.marketCode === marketTab;
      const matchDomain = !domainFilter || n.domainId === domainFilter;
      const matchTech = !techStackFilter || n.techStackId === techStackFilter;
      return matchMarket && matchDomain && matchTech;
    });
  }, [rateNorms, marketTab, domainFilter, techStackFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRateNorm(deleteTarget.id);
      toast.success("Rate norm deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCloneFromEnglish() {
    if (marketTab === "ENGLISH") return;
    setCloning(true);
    const res = await cloneRatesFromMarket("ENGLISH", marketTab, false);
    setCloning(false);
    if (res.success) {
      toast.success(`Clone thành công: ${res.data.cloned} records | Bỏ qua: ${res.data.skipped} đã tồn tại`);
    } else {
      toast.error(res.error ?? "Clone thất bại");
    }
  }

  return (
    <>
      {/* Market tabs */}
      <div className="flex items-center gap-1 mb-4 border-b">
        {markets.map((m) => (
          <button
            key={m.code}
            onClick={() => setMarketTab(m.code)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              marketTab === m.code
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* CR-13: Market context banner */}
      {(() => {
        const currentMarket = markets.find((m) => m.code === marketTab);
        return (
          <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-sm text-blue-800 font-medium">
                📊 Đang xem định mức rate cho thị trường:{" "}
                <strong>{currentMarket?.name ?? marketTab}</strong>
              </span>
              {currentMarket && (
                <span className="ml-3 text-xs text-blue-600">
                  Market Factor: {(currentMarket.marketRateFactorPct * 100).toFixed(0)}%
                </span>
              )}
            </div>
            {filtered.length > 0 && (
              <span className="text-xs text-blue-500">{filtered.length} norms</span>
            )}
          </div>
        );
      })()}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={techStackFilter}
          onChange={(e) => setTechStackFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tech Stacks</option>
          {techStacks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {isDULeader && (
          <div className="ml-auto flex items-center gap-2">
            {/* Clone from English — chỉ hiện khi đang xem tab khác ENGLISH */}
            {marketTab !== "ENGLISH" && (
              <Button
                variant="outline"
                onClick={handleCloneFromEnglish}
                disabled={cloning}
                className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                {cloning ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {cloning ? "Cloning..." : "Clone từ English"}
              </Button>
            )}
            <ImportDialog
              label="Import Excel"
              templateUrl={`/api/import/rate-template?market=${marketTab}`}
              importAction={importRateNorms}
            />
            <Button
              onClick={() => {
                setEditingNorm(null);
                setSheetOpen(true);
              }}
            >
              + Add Rate Norm
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[850px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tech Stack</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Level</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Min</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Norm</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Max</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Effective</th>
              {isDULeader && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isDULeader ? 9 : 8}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No rate norms found for {markets.find(m => m.code === marketTab)?.name ?? marketTab} market.
                  {isDULeader && (
                    <button
                      onClick={() => {
                        setEditingNorm(null);
                        setSheetOpen(true);
                      }}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Add one
                    </button>
                  )}
                </td>
              </tr>
            )}
            {filtered.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{n.jobType.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{n.techStack.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{n.level.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{n.domain.name}</td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs">{fmt(n.rateMin)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(n.rateNorm)}</td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs">{fmt(n.rateMax)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(n.effectiveDate), "dd MMM yyyy")}
                </td>
                {isDULeader && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingNorm(n);
                          setSheetOpen(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(n)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rate Norm Sheet */}
      <RateNormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        rateNorm={editingNorm ?? undefined}
        defaultMarket={marketTab}
        jobTypes={jobTypes}
        techStacks={techStacks}
        levels={levels}
        domains={domains}
        markets={markets}
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
                Delete rate norm?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>
                  {deleteTarget.jobType.name} / {deleteTarget.techStack.name} /{" "}
                  {deleteTarget.level.name}
                </strong>{" "}
                norm rate will be permanently deleted.
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
