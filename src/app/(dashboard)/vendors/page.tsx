import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getVendors } from "@/actions/vendor.actions";
import VendorTable from "@/components/features/vendor/VendorTable";

export const metadata: Metadata = {
  title: "Vendors — NTQ Vendor Mgmt",
};

export default async function VendorsPage() {
  const [session, vendors] = await Promise.all([auth(), getVendors()]);
  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendors</h1>
      <VendorTable vendors={vendors} isDULeader={isDULeader} />
    </div>
  );
}
