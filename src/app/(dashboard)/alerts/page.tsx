import type { Metadata } from "next";
import { auth } from "@/lib/auth";
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
  const [session, alerts] = await Promise.all([auth(), getAlerts()]);

  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t.alert.title}
      </h1>
      <AlertTable alerts={alerts} isDULeader={isDULeader} />
    </div>
  );
}
