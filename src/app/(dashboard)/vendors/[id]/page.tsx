import { notFound } from "next/navigation";
import { getSessionWithRole } from "@/lib/auth-helpers";
import { getVendorById } from "@/actions/vendor.actions";
import { getFormLookups } from "@/actions/lookup.actions";
import VendorDetailClient from "@/components/features/vendor/VendorDetailClient";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [vendor, { isDULeader }, lookups] = await Promise.all([
    getVendorById(id),
    getSessionWithRole(),
    getFormLookups(),
  ]);

  if (!vendor) notFound();

  return (
    <VendorDetailClient
      vendor={vendor}
      isDULeader={isDULeader}
      lookups={lookups}
    />
  );
}
