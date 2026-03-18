import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/actions/dashboard.actions";
import SummaryCards from "@/components/features/dashboard/SummaryCards";
import RevenueByProject from "@/components/features/dashboard/RevenueByProject";
import HeadcountByVendor from "@/components/features/dashboard/HeadcountByVendor";
import ProjectBreakdown from "@/components/features/dashboard/ProjectBreakdown";
import AlertSummary from "@/components/features/dashboard/AlertSummary";

export const metadata: Metadata = {
  title: "Dashboard — NTQ Vendor Mgmt",
};

export default async function DashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);
  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      {/* Row 1: Summary Cards */}
      <SummaryCards
        {...data.summaryCards}
        isDULeader={isDULeader}
      />

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByProject
          projectBreakdown={data.projectBreakdown}
          isDULeader={isDULeader}
        />
        <HeadcountByVendor vendorBreakdown={data.vendorBreakdown} />
      </div>

      {/* Row 3: Project Table + Alert Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectBreakdown
            projectBreakdown={data.projectBreakdown}
            isDULeader={isDULeader}
          />
        </div>
        <AlertSummary
          recentAlerts={data.recentAlerts}
          pendingCount={data.summaryCards.pendingAlertCount}
        />
      </div>
    </div>
  );
}
