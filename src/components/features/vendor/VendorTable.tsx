"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { softDeleteVendor } from "@/actions/vendor.actions";
import { useTranslations } from "@/i18n";
import VendorSheet from "./VendorSheet";
import type { Vendor, PersonnelStatus } from "@/types";

type VendorRow = Vendor & {
  personnel: { id: string; status: PersonnelStatus }[];
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-600",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
};

interface VendorTableProps {
  vendors: VendorRow[];
  isDULeader: boolean;
}

export default function VendorTable({ vendors, isDULeader }: VendorTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslations();

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: t.common.statusActive,
    INACTIVE: t.common.statusInactive,
    ON_HOLD: t.common.statusOnHold,
  };

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !search || v.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vendors, search, statusFilter]);

  function openCreate() {
    setSelectedVendor(null);
    setSheetOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setSelectedVendor(vendor);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await softDeleteVendor(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      toast.success(`${deleteTarget.name} ${t.vendor.deactivatedSuccess}`);
      setDeleteTarget(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t.vendor.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.common.allStatuses}</option>
          <option value="ACTIVE">{t.common.statusActive}</option>
          <option value="INACTIVE">{t.common.statusInactive}</option>
          <option value="ON_HOLD">{t.common.statusOnHold}</option>
        </select>
        <div className="ml-auto">
          <Button onClick={openCreate}>{t.vendor.addVendor}</Button>
        </div>
      </div>

      {/* Active filter badges */}
      {statusFilter && (
        <div className="flex gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            {STATUS_LABELS[statusFilter] ?? statusFilter}
            <button onClick={() => setStatusFilter("")} className="hover:text-blue-600">✕</button>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.companyName}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.contact}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.status}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.headcount}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {t.vendor.noVendors}
                </td>
              </tr>
            )}
            {filtered.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div>{vendor.contactName}</div>
                  <div className="text-xs text-gray-400">{vendor.contactEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vendor.status] ?? ""}`}
                  >
                    {STATUS_LABELS[vendor.status] ?? vendor.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {vendor.personnel.length}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {t.common.view}
                    </Link>
                    <button
                      onClick={() => openEdit(vendor)}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      {t.common.edit}
                    </button>
                    {isDULeader && (
                      <button
                        onClick={() => setDeleteTarget(vendor)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        {t.common.delete}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Sheet */}
      <VendorSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vendor={selectedVendor ?? undefined}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.vendor.deactivateTitle}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{deleteTarget.name}</strong>{" "}
                {t.vendor.deactivateBody}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? t.vendor.deactivating : t.vendor.deactivate}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
