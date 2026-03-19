"use client";

import { useState, useMemo } from "react";
import type { MarketConfig } from "@/types";

interface Props {
  markets: MarketConfig[];
  overheadRatePct: number; // e.g. 0.20
}

type Direction = "billing_to_vendor" | "vendor_to_billing";

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RateCalculator({ markets, overheadRatePct }: Props) {
  const activeMarkets = markets.filter((m) => m.isActive);

  const [direction, setDirection] = useState<Direction>("billing_to_vendor");
  const [selectedMarketCode, setSelectedMarketCode] = useState<string>(
    activeMarkets[0]?.code ?? ""
  );
  const [inputValue, setInputValue] = useState<string>("");

  const selectedMarket = activeMarkets.find((m) => m.code === selectedMarketCode);
  const marketFactor = selectedMarket?.marketRateFactorPct ?? 0.8;
  const overhead = overheadRatePct;

  const result = useMemo(() => {
    const input = parseFloat(inputValue);
    if (!input || input <= 0 || !selectedMarket) return null;

    if (direction === "billing_to_vendor") {
      // VR = BR × Market × (1 - Overhead)
      return input * marketFactor * (1 - overhead);
    } else {
      // BR = (VR + VR/(1-Overhead) × Overhead) / Market
      return (input + (input / (1 - overhead)) * overhead) / marketFactor;
    }
  }, [inputValue, direction, marketFactor, overhead, selectedMarket]);

  // Breakdown values for display
  const breakdown = useMemo(() => {
    const input = parseFloat(inputValue);
    if (!input || input <= 0 || !selectedMarket || result === null) return null;

    if (direction === "billing_to_vendor") {
      const afterOverhead = input * (1 - overhead);
      const vendorRate = afterOverhead * marketFactor;
      return { afterOverhead, vendorRate };
    } else {
      // Reverse: breakdown what billing covers
      const afterOverhead = result * (1 - overhead);
      return { afterOverhead, vendorRate: input };
    }
  }, [inputValue, direction, marketFactor, overhead, selectedMarket, result]);

  const inputLabel =
    direction === "billing_to_vendor" ? "Billing Rate" : "Max Vendor Rate";
  const outputLabel =
    direction === "billing_to_vendor" ? "Max Vendor Rate" : "Billing Rate";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-indigo-500">⇄</span>
              Rate Calculator
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tính nhanh mức giá vendor hoặc billing rate theo thị trường
            </p>
          </div>
          {/* Direction toggle */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 text-xs shadow-sm">
            <button
              onClick={() => {
                setDirection("billing_to_vendor");
                setInputValue("");
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                direction === "billing_to_vendor"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Billing → Vendor
            </button>
            <button
              onClick={() => {
                setDirection("vendor_to_billing");
                setInputValue("");
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                direction === "vendor_to_billing"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Vendor → Billing
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Input section */}
          <div className="space-y-3">
            {/* Market selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Thị trường
              </label>
              <select
                value={selectedMarketCode}
                onChange={(e) => {
                  setSelectedMarketCode(e.target.value);
                  setInputValue("");
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {activeMarkets.length === 0 && (
                  <option value="">No active markets</option>
                )}
                {activeMarkets.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name} ({Math.round(m.marketRateFactorPct * 1000) / 10}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Input value */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {inputLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Config chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Overhead {Math.round(overhead * 100)}%
              </span>
              {selectedMarket && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Market factor {Math.round(marketFactor * 1000) / 10}%
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center items-center text-2xl text-indigo-300 font-thin select-none">
            →
          </div>

          {/* Output section */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {outputLabel}
            </label>
            <div
              className={`rounded-xl border-2 p-4 min-h-[100px] flex flex-col justify-center transition-all ${
                result !== null
                  ? direction === "billing_to_vendor"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-blue-300 bg-blue-50"
                  : "border-dashed border-gray-200 bg-gray-50"
              }`}
            >
              {result !== null && breakdown !== null ? (
                <>
                  <p
                    className={`text-3xl font-bold tabular-nums ${
                      direction === "billing_to_vendor"
                        ? "text-emerald-700"
                        : "text-blue-700"
                    }`}
                  >
                    {formatUSD(result)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">{outputLabel} / tháng</p>

                  {/* Breakdown */}
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    {direction === "billing_to_vendor" ? (
                      <>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Billing Rate</span>
                          <span className="font-mono">{formatUSD(parseFloat(inputValue))}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Sau overhead ({Math.round(overhead * 100)}%)</span>
                          <span className="font-mono">{formatUSD(breakdown.afterOverhead)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-emerald-700">
                          <span>Max Vendor Rate ({Math.round(marketFactor * 100)}%)</span>
                          <span className="font-mono">{formatUSD(breakdown.vendorRate)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Max Vendor Rate</span>
                          <span className="font-mono">{formatUSD(parseFloat(inputValue))}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Sau overhead ({Math.round(overhead * 100)}%)</span>
                          <span className="font-mono">{formatUSD(breakdown.afterOverhead)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-blue-700">
                          <span>Billing Rate cần đạt</span>
                          <span className="font-mono">{formatUSD(result)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center">
                  Nhập {inputLabel.toLowerCase()} để tính
                </p>
              )}
            </div>

            {/* Formula hint */}
            {result !== null && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                {direction === "billing_to_vendor"
                  ? `= BR × ${Math.round(marketFactor * 100)}% × ${Math.round((1 - overhead) * 100)}%`
                  : `= (VR + VR/${Math.round((1 - overhead) * 100)}% × ${Math.round(overhead * 100)}%) / ${Math.round(marketFactor * 100)}%`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
