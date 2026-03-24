import type { Metadata } from "next";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getVendors } from "@/actions/vendor.actions";
import { getTechStacks } from "@/actions/lookup.actions";
import VendorTable from "@/components/features/vendor/VendorTable";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Vendors — NTQ Vendor Mgmt",
};

export default async function VendorsPage() {
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);
  const [{ isDULeader }, vendors, techStacks] = await Promise.all([
    getSessionWithRole(),
    getVendors(),
    getTechStacks(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.vendor.title}</h1>
      <VendorTable vendors={vendors} isDULeader={isDULeader} techStacks={techStacks} />
    </div>
  );
}
