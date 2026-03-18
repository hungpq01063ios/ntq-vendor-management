"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AlertSummaryItem } from "@/actions/dashboard.actions";

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
  recentAlerts: AlertSummaryItem[];
  pendingCount: number;
}

export default function AlertSummary({ recentAlerts, pendingCount }: Props) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Recent Alerts</h3>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </div>
        <Link
          href="/alerts"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View all →
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {recentAlerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            ✅ No pending alerts
          </div>
        ) : (
          recentAlerts.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {a.jobType.name} · {a.techStack.name} · {a.level.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(a.triggeredAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-xs font-semibold ${
                    Math.abs(a.driftPct) > 15
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {a.driftPct > 0 ? "+" : ""}
                  {a.driftPct.toFixed(1)}%
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
