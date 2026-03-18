"use client";

import { useRouter } from "next/navigation";

interface SummaryCardsProps {
  totalActiveHeadcount: number;
  totalActiveProjects: number;
  totalMonthlyRevenue: number;
  totalMonthlyCost: number;
  totalMargin: number;
  totalMarginPct: number;
  pendingAlertCount: number;
  isDULeader: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface CardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "yellow" | "orange";
  onClick?: () => void;
}

function Card({ icon, label, value, sub, accent, onClick }: CardProps) {
  const borderColor = {
    green: "border-l-green-500",
    red: "border-l-red-500",
    yellow: "border-l-yellow-400",
    orange: "border-l-orange-500",
    undefined: "border-l-blue-500",
  }[accent ?? "undefined"];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-l-4 ${borderColor} p-4 shadow-sm ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {sub && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              accent === "green"
                ? "bg-green-100 text-green-700"
                : accent === "red"
                  ? "bg-red-100 text-red-700"
                  : accent === "yellow"
                    ? "bg-yellow-100 text-yellow-700"
                    : accent === "orange"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
            }`}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function SummaryCards({
  totalActiveHeadcount,
  totalActiveProjects,
  totalMonthlyRevenue,
  totalMonthlyCost,
  totalMargin,
  totalMarginPct,
  pendingAlertCount,
  isDULeader,
}: SummaryCardsProps) {
  const router = useRouter();

  const marginAccent =
    totalMargin > 0 ? "green" : totalMargin < 0 ? "red" : undefined;
  const alertAccent =
    pendingAlertCount === 0
      ? "green"
      : pendingAlertCount > 5
        ? "orange"
        : "yellow";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card
        icon="👥"
        label="Active Headcount"
        value={String(totalActiveHeadcount)}
        onClick={() => router.push("/personnel")}
      />
      <Card
        icon="📋"
        label="Active Projects"
        value={String(totalActiveProjects)}
        onClick={() => router.push("/projects")}
      />
      {isDULeader && (
        <>
          <Card
            icon="💰"
            label="Monthly Revenue"
            value={fmt(totalMonthlyRevenue)}
          />
          <Card
            icon="📤"
            label="Monthly Cost"
            value={fmt(totalMonthlyCost)}
          />
          <Card
            icon="📈"
            label="Gross Margin"
            value={fmt(totalMargin)}
            sub={`${(totalMarginPct * 100).toFixed(1)}%`}
            accent={marginAccent}
          />
        </>
      )}
      <Card
        icon="🔔"
        label="Pending Alerts"
        value={String(pendingAlertCount)}
        sub={pendingAlertCount === 0 ? "All clear" : "Need review"}
        accent={alertAccent}
        onClick={() => router.push("/alerts")}
      />
    </div>
  );
}
