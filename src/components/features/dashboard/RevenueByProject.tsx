"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ProjectBreakdownItem } from "@/actions/dashboard.actions";

interface Props {
  projectBreakdown: ProjectBreakdownItem[];
  isDULeader: boolean;
}

function truncate(s: string, n = 15) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function fmtUSD(v: number) {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface TooltipPayload {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.name === "Revenue")?.value ?? 0;
  const cost = payload.find((p) => p.name === "Cost")?.value ?? 0;
  const margin = revenue - cost;
  const marginPct = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-blue-600">Revenue: {fmtUSD(revenue)}</p>
      <p className="text-orange-500">Cost: {fmtUSD(cost)}</p>
      <p className={margin >= 0 ? "text-green-600" : "text-red-600"}>
        Margin: {fmtUSD(margin)} ({marginPct}%)
      </p>
    </div>
  );
}

// Headcount-only variant for VENDOR_PIC
function HeadcountByProject({
  projectBreakdown,
}: {
  projectBreakdown: ProjectBreakdownItem[];
}) {
  const data = projectBreakdown.map((p) => ({
    name: truncate(p.projectName),
    Headcount: p.headcount,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No active assignments
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Headcount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function RevenueByProject({
  projectBreakdown,
  isDULeader,
}: Props) {
  if (!isDULeader) {
    return (
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Headcount by Project
        </h3>
        <HeadcountByProject projectBreakdown={projectBreakdown} />
      </div>
    );
  }

  const data = projectBreakdown.map((p) => ({
    name: truncate(p.projectName),
    Revenue: p.revenue,
    Cost: p.cost,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Revenue by Project
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No active assignments
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Revenue vs Cost by Project
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Cost" fill="#f97316" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
