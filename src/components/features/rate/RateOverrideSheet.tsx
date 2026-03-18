"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertProjectRateOverride } from "@/actions/rate.actions";
import type { JobType, TechStack, Level, Domain, RateNorm } from "@/types";

interface FormValues {
  jobTypeId: string;
  techStackId: string;
  levelId: string;
  domainId: string;
  customBillingRate: string;
}

interface OverrideData {
  id: string;
  jobTypeId: string;
  techStackId: string;
  levelId: string;
  domainId: string;
  customBillingRate: number;
  jobType: JobType;
  techStack: TechStack;
  level: Level;
  domain: Domain;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  override?: OverrideData;
  rateNorms: RateNorm[];
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
}

export default function RateOverrideSheet({
  open,
  onClose,
  projectId,
  override,
  rateNorms,
  jobTypes,
  techStacks,
  levels,
  domains,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!override;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const watchedJobTypeId = watch("jobTypeId");
  const watchedTechStackId = watch("techStackId");
  const watchedLevelId = watch("levelId");
  const watchedDomainId = watch("domainId");

  // Find matching norm rate for reference
  const matchingNorm = rateNorms.find(
    (n) =>
      n.jobTypeId === watchedJobTypeId &&
      n.techStackId === watchedTechStackId &&
      n.levelId === watchedLevelId &&
      n.domainId === watchedDomainId
  );

  useEffect(() => {
    if (open) {
      if (override) {
        reset({
          jobTypeId: override.jobTypeId,
          techStackId: override.techStackId,
          levelId: override.levelId,
          domainId: override.domainId,
          customBillingRate: String(override.customBillingRate),
        });
      } else {
        reset({
          jobTypeId: "",
          techStackId: "",
          levelId: "",
          domainId: "",
          customBillingRate: "",
        });
      }
    }
  }, [open, override, reset]);

  async function onSubmit(values: FormValues) {
    const rate = parseFloat(values.customBillingRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Custom billing rate must be a positive number");
      return;
    }

    setSubmitting(true);
    try {
      await upsertProjectRateOverride(projectId, {
        jobTypeId: values.jobTypeId,
        techStackId: values.techStackId,
        levelId: values.levelId,
        domainId: values.domainId,
        customBillingRate: rate,
      });
      toast.success(isEdit ? "Override updated" : "Override created");
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
            {isEdit ? "Edit Rate Override" : "Add Rate Override"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
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

          {/* Norm Rate Reference */}
          {matchingNorm && (
            <div className="bg-blue-50 rounded-md px-4 py-3 text-sm">
              <p className="text-blue-700 font-medium">Rate Norm Reference</p>
              <div className="flex gap-4 mt-1 text-blue-600">
                <span>Min: ${matchingNorm.rateMin.toLocaleString()}</span>
                <span className="font-semibold">
                  Norm: ${matchingNorm.rateNorm.toLocaleString()}
                </span>
                <span>Max: ${matchingNorm.rateMax.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Custom Billing Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Billing Rate (USD/month){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("customBillingRate", { required: "Required" })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {errors.customBillingRate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.customBillingRate.message}
              </p>
            )}
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
