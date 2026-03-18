import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getAlerts } from "@/actions/alert.actions";
import AlertTable from "@/components/features/rate/AlertTable";

export const metadata: Metadata = {
  title: "Alerts — NTQ Vendor Mgmt",
};

export default async function AlertsPage() {
  const [session, alerts] = await Promise.all([auth(), getAlerts()]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Rate Drift Alerts
      </h1>
      <AlertTable alerts={alerts} isDULeader={isDULeader} />
    </div>
  );
}
