import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getAlerts } from "@/actions/alert.actions";
import AlertTable from "@/components/features/rate/AlertTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Cảnh báo — NTQ Vendor Mgmt",
};

export default async function AlertsPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [{ isDULeader }, alerts] = await Promise.all([
    getSessionWithRole(),
    getAlerts(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t.alert.title}
      </h1>
      <AlertTable alerts={alerts} isDULeader={isDULeader} />
    </div>
  );
}
