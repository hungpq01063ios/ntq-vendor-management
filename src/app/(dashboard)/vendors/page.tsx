import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getVendors } from "@/actions/vendor.actions";
import VendorTable from "@/components/features/vendor/VendorTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Nhà cung cấp — NTQ Vendor Mgmt",
};

export default async function VendorsPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [session, vendors] = await Promise.all([auth(), getVendors()]);
  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.vendor.title}</h1>
      <VendorTable vendors={vendors} isDULeader={isDULeader} />
    </div>
  );
}
