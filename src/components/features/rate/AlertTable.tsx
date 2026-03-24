"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  updateAlertStatus,
  checkAndCreateDriftAlerts,
} from "@/actions/alert.actions";
import type { RateAlert, JobType, TechStack, Level, AlertStatus } from "@/types";
import { useTranslations } from "@/i18n";


type AlertWithRelations = RateAlert & {
  jobType: JobType;
  techStack: TechStack;
  level: Level;
  triggeredBy: { name: string | null; email: string | null };
};

type TabValue = "ALL" | "PENDING" | "FLAGGED_FOR_DU_LEADER" | "RESOLVED" | "DISMISSED";


const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  FLAGGED_FOR_DU_LEADER: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  FLAGGED_FOR_DU_LEADER: "Flagged",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

interface Props {
  alerts: AlertWithRelations[];
  isDULeader: boolean;
}

export default function AlertTable({ alerts, isDULeader }: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>("ALL");
  const [dismissTarget, setDismissTarget] = useState<AlertWithRelations | null>(null);
  const [dismissNote, setDismissNote] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const { t } = useTranslations();

  const TABS: { value: TabValue; label: string }[] = [
    { value: "ALL", label: t.alert.all },
    { value: "PENDING", label: t.alert.pending },
    { value: "FLAGGED_FOR_DU_LEADER", label: t.alert.flagged },
    { value: "RESOLVED", label: t.alert.resolved },
    { value: "DISMISSED", label: t.alert.dismissed },
  ];

  const filtered =
    activeTab === "ALL" ? alerts : alerts.filter((a) => a.status === activeTab);

  async function handleAction(
    id: string,
    status: AlertStatus,
    note?: string
  ) {
    setActioning(id);
    const result = await updateAlertStatus(id, status, note);
    setActioning(null);
    if (result.success) {
      toast.success(`Alert ${status.toLowerCase().replace("_for_du_leader", "")}d`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDismissConfirm() {
    if (!dismissTarget) return;
    if (!dismissNote.trim()) {
      toast.error(t.alert.dismissNoteRequired);
      return;
    }
    setActioning(dismissTarget.id);
    const result = await updateAlertStatus(dismissTarget.id, "DISMISSED", dismissNote);
    setActioning(null);
    if (result.success) {
      toast.success(t.alert.alertDismissed);
      setDismissTarget(null);
      setDismissNote("");
    } else {
      toast.error(result.error);
    }
  }

  async function handleScan() {
    setScanning(true);
    const result = await checkAndCreateDriftAlerts();
    setScanning(false);
    if (result.success) {
      toast.success(
        result.data.created > 0
          ? `${result.data.created} ${t.alert.newAlertsCreated}`
          : t.alert.noNewDrift
      );
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {/* Tabs + Scan button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 border-b w-full">
          <div className="flex items-center gap-1 flex-1">
            {TABS.map((tab) => {
              const count =
                tab.value === "ALL"
                  ? alerts.length
                  : alerts.filter((a) => a.status === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.value
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {isDULeader && (
            <div className="pb-1 pl-4">
              <Button
                variant="outline"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? t.rate.scanning : t.rate.scanForDrift}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[850px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.alert.role}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.alert.normRate}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.alert.avgVendor}</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{t.alert.drift}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.status}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.alert.triggered}</th>
              {isDULeader && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.actions}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isDULeader ? 7 : 6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {t.alert.noAlerts}
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-gray-900 font-medium">{a.jobType.name}</div>
                  <div className="text-xs text-gray-500">
                    {a.techStack.name} · {a.level.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs">
                  ${a.normRate.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs">
                  ${a.actualAvgVendorRate.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <span
                    className={
                      Math.abs(a.driftPct) > 15
                        ? "text-red-600 font-semibold"
                        : "text-yellow-600"
                    }
                  >
                    {a.driftPct > 0 ? "+" : ""}
                    {a.driftPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? ""}`}
                  >
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                  {a.note && (
                    <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">
                      {a.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {format(new Date(a.triggeredAt), "dd MMM yyyy")}
                  <div className="text-gray-400">
                    {a.triggeredBy.name ?? a.triggeredBy.email}
                  </div>
                </td>
                {isDULeader && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              handleAction(a.id, "FLAGGED_FOR_DU_LEADER")
                            }
                            disabled={actioning === a.id}
                            className="text-orange-500 hover:text-orange-700 text-xs"
                          >
                            {t.alert.flag}
                          </button>
                          <button
                            onClick={() => handleAction(a.id, "RESOLVED")}
                            disabled={actioning === a.id}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            {t.alert.resolve}
                          </button>
                          <button
                            onClick={() => {
                              setDismissNote("");
                              setDismissTarget(a);
                            }}
                            disabled={actioning === a.id}
                            className="text-gray-500 hover:text-gray-800 text-xs"
                          >
                            {t.alert.dismiss}
                          </button>
                        </>
                      )}
                      {a.status === "FLAGGED_FOR_DU_LEADER" && (
                        <>
                          <button
                            onClick={() => handleAction(a.id, "RESOLVED")}
                            disabled={actioning === a.id}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            {t.alert.resolve}
                          </button>
                          <button
                            onClick={() => {
                              setDismissNote("");
                              setDismissTarget(a);
                            }}
                            disabled={actioning === a.id}
                            className="text-gray-500 hover:text-gray-800 text-xs"
                          >
                            {t.alert.dismiss}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dismiss Dialog */}
      {dismissTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDismissTarget(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.alert.dismissAlert}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <strong>
                  {dismissTarget.jobType.name} / {dismissTarget.techStack.name} /{" "}
                  {dismissTarget.level.name}
                </strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.alert.dismissNote} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={dismissNote}
                  onChange={(e) => setDismissNote(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t.alert.dismissNotePlaceholder}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDismissTarget(null)}
                  disabled={!!actioning}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={handleDismissConfirm}
                  disabled={!!actioning || !dismissNote.trim()}
                >
                  {actioning ? t.alert.dismissing : t.alert.dismiss}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
