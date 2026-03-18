"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { softDeleteVendor } from "@/actions/vendor.actions";
import VendorSheet from "./VendorSheet";
import type { Vendor, PersonnelStatus } from "@/types";

type VendorRow = Vendor & {
  personnel: { id: string; status: PersonnelStatus }[];
};

const MARKET_LABELS: Record<string, string> = {
  ENGLISH: "English",
  JAPAN: "Japan",
  KOREA: "Korea",
  OTHER: "Other",
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
  const [marketFilter, setMarketFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !search || v.name.toLowerCase().includes(search.toLowerCase());
      const matchMarket = !marketFilter || v.market === marketFilter;
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchMarket && matchStatus;
    });
  }, [vendors, search, marketFilter, statusFilter]);

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
    try {
      await softDeleteVendor(deleteTarget.id);
      toast.success(`${deleteTarget.name} marked as inactive`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete vendor");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={marketFilter}
          onChange={(e) => setMarketFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Markets</option>
          <option value="ENGLISH">English</option>
          <option value="JAPAN">Japan</option>
          <option value="KOREA">Korea</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
        <div className="ml-auto">
          <Button onClick={openCreate}>+ Add Vendor</Button>
        </div>
      </div>

      {/* Active filter badges */}
      {(marketFilter || statusFilter) && (
        <div className="flex gap-2 mb-3">
          {marketFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {MARKET_LABELS[marketFilter]}
              <button onClick={() => setMarketFilter("")} className="hover:text-blue-600">✕</button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {statusFilter}
              <button onClick={() => setStatusFilter("")} className="hover:text-blue-600">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Company Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Market</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Headcount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No vendors found.
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
                <td className="px-4 py-3 text-gray-600">
                  {MARKET_LABELS[vendor.market] ?? vendor.market}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vendor.status] ?? ""}`}
                  >
                    {vendor.status}
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
                      View
                    </Link>
                    <button
                      onClick={() => openEdit(vendor)}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      Edit
                    </button>
                    {isDULeader && (
                      <button
                        onClick={() => setDeleteTarget(vendor)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
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
                Deactivate vendor?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{deleteTarget.name}</strong> will be marked as{" "}
                <span className="font-medium text-gray-800">INACTIVE</span>. This action can be
                reversed by editing the vendor.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deactivating..." : "Deactivate"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
