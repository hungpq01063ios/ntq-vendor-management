"use client";

import { useState, useMemo, useCallback } from "react";

/**
 * CR-28: Reusable client-side sorting hook for tables
 * Usage:
 *   const { sorted, sortKey, sortDir, toggleSort, SortHeader } = useTableSort(data, defaultKey);
 */

export type SortDirection = "asc" | "desc" | null;

interface UseSortResult<T> {
  sorted: T[];
  sortKey: string | null;
  sortDir: SortDirection;
  toggleSort: (key: string) => void;
}

/**
 * Generic getValue helper that extracts a nested value from an object by dot-separated key.
 * e.g. getValue(obj, "vendor.name") => obj.vendor.name
 */
function getValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function useTableSort<T extends Record<string, unknown>>(
  data: T[],
  defaultSortKey: string | null = null,
  defaultSortDir: SortDirection = null
): UseSortResult<T> {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        // Cycle: asc → desc → null
        if (sortDir === "asc") setSortDir("desc");
        else if (sortDir === "desc") {
          setSortKey(null);
          setSortDir(null);
        } else {
          setSortDir("asc");
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortDir]
  );

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;

    return [...data].sort((a, b) => {
      const valA = getValue(a, sortKey);
      const valB = getValue(b, sortKey);

      // Handle nulls/undefined — push to end
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else if (typeof valA === "string" && typeof valB === "string") {
        cmp = valA.localeCompare(valB, undefined, { sensitivity: "base" });
      } else if (valA instanceof Date && valB instanceof Date) {
        cmp = valA.getTime() - valB.getTime();
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }

      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}

/**
 * Sortable table header component
 */
export function SortableHeader({
  label,
  sortKey: key,
  currentSortKey,
  currentSortDir,
  onToggle,
  className = "",
}: {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDir: SortDirection;
  onToggle: (key: string) => void;
  className?: string;
}) {
  const isActive = currentSortKey === key;
  const arrow = isActive
    ? currentSortDir === "asc"
      ? " ↑"
      : currentSortDir === "desc"
        ? " ↓"
        : ""
    : "";

  return (
    <th
      className={`text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors ${className}`}
      onClick={() => onToggle(key)}
    >
      {label}
      <span className="text-blue-500 ml-0.5">{arrow}</span>
    </th>
  );
}
