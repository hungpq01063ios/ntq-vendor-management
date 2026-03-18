"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertRateNorm } from "@/actions/rate.actions";
import type { RateNormWithRelations, JobType, TechStack, Level, Domain } from "@/types";

const MARKETS = ["ENGLISH", "JAPAN", "KOREA", "OTHER"] as const;

interface FormValues {
  jobTypeId: string;
  techStackId: string;
  levelId: string;
  domainId: string;
  market: string;
  rateMin: string;
  rateNorm: string;
  rateMax: string;
  effectiveDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  rateNorm?: RateNormWithRelations;
  defaultMarket?: string;
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
}

export default function RateNormSheet({
  open,
  onClose,
  rateNorm,
  defaultMarket = "ENGLISH",
  jobTypes,
  techStacks,
  levels,
  domains,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!rateNorm;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (open) {
      if (rateNorm) {
        reset({
          jobTypeId: rateNorm.jobTypeId,
          techStackId: rateNorm.techStackId,
          levelId: rateNorm.levelId,
          domainId: rateNorm.domainId,
          market: rateNorm.market,
          rateMin: String(rateNorm.rateMin),
          rateNorm: String(rateNorm.rateNorm),
          rateMax: String(rateNorm.rateMax),
          effectiveDate: rateNorm.effectiveDate
            ? new Date(rateNorm.effectiveDate).toISOString().split("T")[0]
            : "",
        });
      } else {
        reset({
          jobTypeId: "",
          techStackId: "",
          levelId: "",
          domainId: "",
          market: defaultMarket,
          rateMin: "",
          rateNorm: "",
          rateMax: "",
          effectiveDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, rateNorm, defaultMarket, reset]);

  async function onSubmit(values: FormValues) {
    const rateMin = parseFloat(values.rateMin);
    const rateNormVal = parseFloat(values.rateNorm);
    const rateMax = parseFloat(values.rateMax);

    if (isNaN(rateMin) || rateMin <= 0) {
      setError("rateMin", { message: "Must be a positive number" });
      return;
    }
    if (isNaN(rateNormVal) || rateNormVal <= 0) {
      setError("rateNorm", { message: "Must be a positive number" });
      return;
    }
    if (isNaN(rateMax) || rateMax <= 0) {
      setError("rateMax", { message: "Must be a positive number" });
      return;
    }
    if (rateMin > rateNormVal) {
      setError("rateMin", { message: "Min must be ≤ norm" });
      return;
    }
    if (rateNormVal > rateMax) {
      setError("rateNorm", { message: "Norm must be ≤ max" });
      return;
    }

    setSubmitting(true);
    try {
      await upsertRateNorm({
        jobTypeId: values.jobTypeId,
        techStackId: values.techStackId,
        levelId: values.levelId,
        domainId: values.domainId,
        market: values.market as "ENGLISH" | "JAPAN" | "KOREA" | "OTHER",
        rateMin,
        rateNorm: rateNormVal,
        rateMax,
        effectiveDate: values.effectiveDate ? new Date(values.effectiveDate) : undefined,
      });
      toast.success(isEdit ? "Rate norm updated" : "Rate norm created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Rate Norm" : "Add Rate Norm"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("jobTypeId", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select job type</option>
              {jobTypes.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
            {errors.jobTypeId && (
              <p className="text-xs text-red-500 mt-1">{errors.jobTypeId.message}</p>
            )}
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tech Stack <span className="text-red-500">*</span>
            </label>
            <select
              {...register("techStackId", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select tech stack</option>
              {techStacks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.techStackId && (
              <p className="text-xs text-red-500 mt-1">{errors.techStackId.message}</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              {...register("levelId", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select level</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {errors.levelId && (
              <p className="text-xs text-red-500 mt-1">{errors.levelId.message}</p>
            )}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain <span className="text-red-500">*</span>
            </label>
            <select
              {...register("domainId", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select domain</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.domainId && (
              <p className="text-xs text-red-500 mt-1">{errors.domainId.message}</p>
            )}
          </div>

          {/* Market */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Market <span className="text-red-500">*</span>
            </label>
            <select
              {...register("market", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MARKETS.map((m) => (
                <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          {/* Rate fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("rateMin", { required: "Required" })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.rateMin && (
                <p className="text-xs text-red-500 mt-1">{errors.rateMin.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Norm (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("rateNorm", { required: "Required" })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.rateNorm && (
                <p className="text-xs text-red-500 mt-1">{errors.rateNorm.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("rateMax", { required: "Required" })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.rateMax && (
                <p className="text-xs text-red-500 mt-1">{errors.rateMax.message}</p>
              )}
            </div>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              {...register("effectiveDate")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </>
  );
}
