"use client";

import { useRouter } from "next/navigation";
import type { ProjectBreakdownItem } from "@/actions/dashboard.actions";

interface Props {
  projectBreakdown: ProjectBreakdownItem[];
  isDULeader: boolean;
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function ProjectBreakdown({ projectBreakdown, isDULeader }: Props) {
  const router = useRouter();

  const totalHeadcount = projectBreakdown.reduce((s, p) => s + p.headcount, 0);
  const totalRevenue = projectBreakdown.reduce((s, p) => s + p.revenue, 0);
  const totalCost = projectBreakdown.reduce((s, p) => s + p.cost, 0);
  const totalMargin = totalRevenue - totalCost;
  const totalMarginPct = totalRevenue > 0 ? totalMargin / totalRevenue : 0;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Project Summary</h3>
        <button
          onClick={() => router.push("/projects")}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View all →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">
                Project
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden sm:table-cell">
                Client
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden md:table-cell">
                Market
              </th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">
                HC
              </th>
              {isDULeader && (
                <>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">
                    Revenue
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">
                    Cost
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">
                    Margin
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">
                    Margin%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projectBreakdown.length === 0 && (
              <tr>
                <td
                  colSpan={isDULeader ? 8 : 4}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No active projects yet.
                </td>
              </tr>
            )}
            {projectBreakdown.map((p) => (
              <tr
                key={p.projectId}
                onClick={() => router.push(`/projects/${p.projectId}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[160px] truncate">
                  {p.projectName}
                </td>
                <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell text-xs">
                  {p.clientName}
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {p.market}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-700 font-medium">
                  {p.headcount}
                </td>
                {isDULeader && (
                  <>
                    <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                      {fmt(p.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                      {fmt(p.cost)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs">
                      {fmt(p.margin)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium">
                      <span
                        className={
                          p.marginPct > 0
                            ? "text-green-600"
                            : p.marginPct < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }
                      >
                        {fmtPct(p.marginPct)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {projectBreakdown.length > 0 && (
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-700 text-sm">
                  Total
                </td>
                <td className="hidden sm:table-cell" />
                <td className="hidden md:table-cell" />
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                  {totalHeadcount}
                </td>
                {isDULeader && (
                  <>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-700 text-xs">
                      {fmt(totalRevenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-700 text-xs">
                      {fmt(totalCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-700 text-xs">
                      {fmt(totalMargin)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-xs">
                      <span
                        className={
                          totalMarginPct > 0
                            ? "text-green-600"
                            : totalMarginPct < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }
                      >
                        {fmtPct(totalMarginPct)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
