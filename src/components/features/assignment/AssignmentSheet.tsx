"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAssignment } from "@/actions/assignment.actions";
import { getRateNormForPersonnel } from "@/actions/rate.actions";
import RateSuggestionCard from "@/components/features/rate/RateSuggestionCard";
import type { PersonnelWithRelations } from "@/types";

const AssignmentFormSchema = z.object({
  personnelId: z.string().min(1, "Personnel is required"),
  roleInProject: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  billingRateOverride: z.string().optional(),
  billingRateNote: z.string().optional(),
  vendorRateOverride: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof AssignmentFormSchema>;

type RateData = Awaited<ReturnType<typeof getRateNormForPersonnel>>;

const emptyValues: AssignmentFormValues = {
  personnelId: "",
  roleInProject: "",
  startDate: "",
  endDate: "",
  billingRateOverride: "",
  billingRateNote: "",
  vendorRateOverride: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  availablePersonnel: PersonnelWithRelations[];
  isDULeader: boolean;
}

export default function AssignmentSheet({
  open,
  onClose,
  projectId,
  availablePersonnel,
  isDULeader,
}: Props) {
  const [rateData, setRateData] = useState<RateData>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: emptyValues,
  });

  const billingRateOverride = watch("billingRateOverride");

  useEffect(() => {
    if (open) {
      reset(emptyValues);
      setRateData(null);
    }
  }, [open, reset]);

  async function handlePersonnelChange(personnelId: string) {
    if (!personnelId) {
      setRateData(null);
      return;
    }
    setRateLoading(true);
    try {
      const result = await getRateNormForPersonnel(personnelId, projectId);
      setRateData(result);
    } catch {
      setRateData(null);
    } finally {
      setRateLoading(false);
    }
  }

  async function onSubmit(data: AssignmentFormValues) {
    try {
      await createAssignment({
        personnelId: data.personnelId,
        projectId,
        roleInProject: data.roleInProject || undefined,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        billingRateOverride:
          data.billingRateOverride && data.billingRateOverride !== ""
            ? parseFloat(data.billingRateOverride)
            : undefined,
        billingRateNote: data.billingRateNote || undefined,
        vendorRateOverride:
          data.vendorRateOverride && data.vendorRateOverride !== ""
            ? parseFloat(data.vendorRateOverride)
            : undefined,
        status: "ACTIVE",
      });
      toast.success("Assignment created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!open) return null;

  const { onChange: rhfOnChange, ...personnelRest } = register("personnelId");

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Assignment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Personnel Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personnel <span className="text-red-500">*</span>
            </label>
            <select
              {...personnelRest}
              onChange={async (e) => {
                rhfOnChange(e);
                await handlePersonnelChange(e.target.value);
              }}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select personnel —</option>
              {availablePersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — {p.jobType.name} / {p.level.name} (
                  {p.vendor.name})
                </option>
              ))}
            </select>
            {errors.personnelId && (
              <p className="text-xs text-red-500 mt-1">
                {errors.personnelId.message}
              </p>
            )}
          </div>

          {/* Rate Suggestion Card */}
          {rateLoading && (
            <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-400 text-center">
              Loading rate data...
            </div>
          )}
          {!rateLoading && rateData && (
            <RateSuggestionCard
              normRate={rateData.normRate}
              projectOverrideRate={rateData.projectOverrideRate}
              billingRate={rateData.billingRate}
              vendorTargetRate={rateData.vendorTargetRate}
              vendorRateActual={rateData.vendorRateActual}
              billingRateSource={rateData.billingRateSource}
              isDULeader={isDULeader}
            />
          )}

          {/* Role in Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role in Project
            </label>
            <input
              {...register("roleInProject")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Backend Developer"
            />
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register("startDate")}
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                {...register("endDate")}
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Billing Rate Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Rate Override (USD/mo)
            </label>
            <input
              {...register("billingRateOverride")}
              type="number"
              min={0}
              step={0.01}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave blank to use norm rate"
            />
          </div>

          {/* Billing Rate Note — only if override is set */}
          {billingRateOverride && billingRateOverride !== "" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Rate Note
              </label>
              <input
                {...register("billingRateNote")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for override..."
              />
            </div>
          )}

          {/* Vendor Rate Override — DU_LEADER only */}
          {isDULeader && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Rate Override (USD/mo)
              </label>
              <input
                {...register("vendorRateOverride")}
                type="number"
                min={0}
                step={0.01}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to use vendor actual rate"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </div>
    </>
  );
}
