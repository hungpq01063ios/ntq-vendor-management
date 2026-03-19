"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "@/i18n";
import type { VendorBreakdownItem } from "@/actions/dashboard.actions";

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
];

interface TooltipPayload {
  name: string;
  value: number;
  payload: { pct: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const { t } = useTranslations();
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-800">{item.name}</p>
      <p className="text-gray-600">
        {item.value} {t.dashboard.personnel} ({item.payload.pct.toFixed(1)}%)
      </p>
    </div>
  );
}

interface Props {
  vendorBreakdown: VendorBreakdownItem[];
}

export default function HeadcountByVendor({ vendorBreakdown }: Props) {
  const { t } = useTranslations();
  const total = vendorBreakdown.reduce((s, v) => s + v.headcount, 0);

  const data = vendorBreakdown.map((v) => ({
    name: v.vendorName,
    value: v.headcount,
    pct: total > 0 ? (v.headcount / total) * 100 : 0,
  }));

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {t.dashboard.headcountByVendor}
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          {t.dashboard.noActiveAssignments}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              outerRadius={80}
              dataKey="value"
              label={({ percent }) =>
                (percent ?? 0) > 0.08
                  ? `${((percent ?? 0) * 100).toFixed(0)}%`
                  : ""
              }
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconSize={10}
              formatter={(value) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
