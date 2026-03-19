"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createMarket,
  updateMarket,
  deleteMarket,
  toggleMarketActive,
} from "@/actions/market.actions";
import type { MarketConfig } from "@/types";

// ─── Inline Form ───────────────────────────────────────────────────────────────

interface FormState {
  code: string;
  name: string;
  marketRateFactorPct: string; // as % string
  order: string;
}

const emptyForm: FormState = { code: "", name: "", marketRateFactorPct: "80", order: "0" };

function toFormState(m: MarketConfig): FormState {
  return {
    code: m.code,
    name: m.name,
    marketRateFactorPct: String(Math.round(m.marketRateFactorPct * 1000) / 10),
    order: String(m.order),
  };
}

// ─── Row Component ─────────────────────────────────────────────────────────────

interface RowProps {
  market: MarketConfig;
  onEdited: () => void;
}

function MarketRow({ market, onEdited }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(toFormState(market));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    const factor = parseFloat(form.marketRateFactorPct);
    if (isNaN(factor) || factor < 0 || factor > 100) {
      toast.error("Rate factor must be 0–100%");
      return;
    }
    setSaving(true);
    const result = await updateMarket(market.id, {
      name: form.name.trim(),
      marketRateFactorPct: factor / 100,
      order: parseInt(form.order) || 0,
    });
    setSaving(false);
    if (result.success) {
      toast.success(`${form.name} updated`);
      setEditing(false);
      onEdited();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle() {
    // Capture intended message BEFORE action (market.isActive = current state)
    const successMsg = market.isActive ? "Market deactivated" : "Market activated";
    const result = await toggleMarketActive(market.id);
    if (result.success) {
      toast.success(successMsg);
      onEdited();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteMarket(market.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Market deleted");
      setConfirmDelete(false);
      onEdited();
    } else {
      toast.error(result.error);
      setConfirmDelete(false);
    }
  }

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <span className="font-mono text-xs font-bold text-gray-500 uppercase">{market.code}</span>
        </td>
        <td className="px-4 py-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1 max-w-[120px]">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.marketRateFactorPct}
              onChange={(e) => setForm({ ...form, marketRateFactorPct: e.target.value })}
              className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            min="0"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            className="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${market.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
            {market.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setForm(toFormState(market)); }}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className={`hover:bg-gray-50 ${!market.isActive ? "opacity-50" : ""}`}>
        <td className="px-4 py-3">
          <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded uppercase">
            {market.code}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{market.name}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[140px] bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all"
                style={{ width: `${Math.round(market.marketRateFactorPct * 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-blue-700 tabular-nums">
              {Math.round(market.marketRateFactorPct * 1000) / 10}%
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">{market.order}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${market.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
            {market.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-gray-900 text-xs">Edit</button>
            <button onClick={handleToggle} className="text-xs text-yellow-600 hover:text-yellow-800">
              {market.isActive ? "Deactivate" : "Activate"}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        </td>
      </tr>
      {confirmDelete && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-red-50 border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">
                Delete <strong>{market.name}</strong>? This cannot be undone if market is not in use.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Add Row ───────────────────────────────────────────────────────────────────

function AddMarketRow({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    const factor = parseFloat(form.marketRateFactorPct);
    if (isNaN(factor) || factor < 0 || factor > 100) {
      toast.error("Rate factor must be 0–100%");
      return;
    }
    setSaving(true);
    const result = await createMarket({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      marketRateFactorPct: factor / 100,
      isActive: true,
      order: parseInt(form.order) || 0,
    });
    setSaving(false);
    if (result.success) {
      toast.success(`Market ${form.code} created`);
      setForm(emptyForm);
      setOpen(false);
      onAdded();
    } else {
      toast.error(result.error);
    }
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <span className="text-lg leading-none">+</span> Add Market
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-green-50">
      <td className="px-4 py-2">
        <input
          placeholder="APAC"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="border rounded px-2 py-1 text-sm w-full font-mono uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
          maxLength={10}
        />
      </td>
      <td className="px-4 py-2">
        <input
          placeholder="Asia Pacific"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 max-w-[120px]">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="80"
            value={form.marketRateFactorPct}
            onChange={(e) => setForm({ ...form, marketRateFactorPct: e.target.value })}
            className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min="0"
          placeholder="0"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: e.target.value })}
          className="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-4 py-2">
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={saving}
            className="text-green-700 hover:text-green-900 text-xs font-medium disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
          <button
            onClick={() => { setOpen(false); setForm(emptyForm); }}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialMarkets: MarketConfig[];
}

export default function MarketConfigTable({ initialMarkets }: Props) {
  const router = useRouter();

  // After every mutation, revalidatePath runs on the server.
  // Call router.refresh() to re-run the Server Component and get fresh data.
  function refresh() {
    router.refresh();
  }

  const activeCount = initialMarkets.filter((m) => m.isActive).length;
  const globalAvg = initialMarkets.length > 0
    ? initialMarkets.reduce((s, m) => s + m.marketRateFactorPct, 0) / initialMarkets.length
    : 0;

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Market Configuration</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeCount} active market{activeCount !== 1 ? "s" : ""} · avg rate factor{" "}
            <span className="font-semibold text-blue-600">
              {Math.round(globalAvg * 1000) / 10}%
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Rate factor = proportion of post-overhead billing allocated to vendor</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-52">Rate Factor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-44">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialMarkets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No markets configured yet. Add one below.
                </td>
              </tr>
            )}
            {initialMarkets.map((m) => (
              <MarketRow key={m.id} market={m} onEdited={refresh} />
            ))}
            <AddMarketRow onAdded={refresh} />
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-400 flex items-center gap-6">
        <span>
          <span className="font-medium text-gray-600">Rate Factor</span>: target = (billing × (1 − overhead)) × factor
        </span>
        <span>Higher factor = vendor earns closer to billing rate</span>
      </div>
    </div>
  );
}
