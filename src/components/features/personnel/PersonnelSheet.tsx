"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPersonnel, updatePersonnel } from "@/actions/personnel.actions";
import type { Personnel, JobType, TechStack, Level, Domain } from "@/types";

const PersonnelFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  fullName: z.string().min(1, "Full name is required"),
  jobTypeId: z.string().min(1, "Job type is required"),
  techStackId: z.string().min(1, "Tech stack is required"),
  levelId: z.string().min(1, "Level is required"),
  domainId: z.string().min(1, "Domain is required"),
  englishLevel: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"]),
  leadership: z.boolean(),
  leadershipNote: z.string().optional(),
  vendorRateActual: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_PROJECT", "ENDED"]),
  interviewStatus: z.enum([
    "NEW",
    "SCREENING",
    "TECHNICAL_TEST",
    "INTERVIEW",
    "PASSED",
    "FAILED",
  ]),
  notes: z.string().optional(),
});

type PersonnelFormValues = z.infer<typeof PersonnelFormSchema>;

function toFormValues(p: Personnel): PersonnelFormValues {
  return {
    vendorId: p.vendorId,
    fullName: p.fullName,
    jobTypeId: p.jobTypeId,
    techStackId: p.techStackId,
    levelId: p.levelId,
    domainId: p.domainId,
    englishLevel: p.englishLevel,
    leadership: p.leadership,
    leadershipNote: p.leadershipNote ?? "",
    vendorRateActual: p.vendorRateActual?.toString() ?? "",
    status: p.status,
    interviewStatus: p.interviewStatus,
    notes: p.notes ?? "",
  };
}

const emptyValues: PersonnelFormValues = {
  vendorId: "",
  fullName: "",
  jobTypeId: "",
  techStackId: "",
  levelId: "",
  domainId: "",
  englishLevel: "INTERMEDIATE",
  leadership: false,
  leadershipNote: "",
  vendorRateActual: "",
  status: "AVAILABLE",
  interviewStatus: "NEW",
  notes: "",
};

interface PersonnelSheetProps {
  open: boolean;
  onClose: () => void;
  personnel?: Personnel;
  vendors: { id: string; name: string }[];
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
  isDULeader: boolean;
}

export default function PersonnelSheet({
  open,
  onClose,
  personnel,
  vendors,
  jobTypes,
  techStacks,
  levels,
  domains,
  isDULeader,
}: PersonnelSheetProps) {
  const isEdit = !!personnel;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonnelFormValues>({
    resolver: zodResolver(PersonnelFormSchema),
    defaultValues: emptyValues,
  });

  const leadership = watch("leadership");

  useEffect(() => {
    if (open) {
      reset(personnel ? toFormValues(personnel) : emptyValues);
    }
  }, [open, personnel, reset]);

  async function onSubmit(data: PersonnelFormValues) {
    try {
      const payload = {
        vendorId: data.vendorId,
        fullName: data.fullName,
        jobTypeId: data.jobTypeId,
        techStackId: data.techStackId,
        levelId: data.levelId,
        domainId: data.domainId,
        englishLevel: data.englishLevel,
        leadership: data.leadership,
        leadershipNote: data.leadershipNote || undefined,
        vendorRateActual:
          data.vendorRateActual && data.vendorRateActual !== ""
            ? parseFloat(data.vendorRateActual)
            : undefined,
        status: data.status,
        interviewStatus: data.interviewStatus,
        notes: data.notes || undefined,
      };

      if (isEdit && personnel) {
        await updatePersonnel(personnel.id, payload);
        toast.success("Personnel updated");
      } else {
        await createPersonnel(payload);
        toast.success("Personnel created");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Personnel" : "Add Personnel"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              {...register("vendorId")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            {errors.vendorId && (
              <p className="text-xs text-red-500 mt-1">{errors.vendorId.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("fullName")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nguyen Van A"
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Job Type + Tech Stack */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("jobTypeId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select —</option>
                {jobTypes.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
              {errors.jobTypeId && (
                <p className="text-xs text-red-500 mt-1">{errors.jobTypeId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tech Stack <span className="text-red-500">*</span>
              </label>
              <select
                {...register("techStackId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select —</option>
                {techStacks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.techStackId && (
                <p className="text-xs text-red-500 mt-1">{errors.techStackId.message}</p>
              )}
            </div>
          </div>

          {/* Level + Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                {...register("levelId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select —</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {errors.levelId && (
                <p className="text-xs text-red-500 mt-1">{errors.levelId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain <span className="text-red-500">*</span>
              </label>
              <select
                {...register("domainId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select —</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.domainId && (
                <p className="text-xs text-red-500 mt-1">{errors.domainId.message}</p>
              )}
            </div>
          </div>

          {/* English Level + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Level
              </label>
              <select
                {...register("englishLevel")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BASIC">Basic</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="FLUENT">Fluent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_PROJECT">On Project</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          </div>

          {/* Interview Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Status
            </label>
            <select
              {...register("interviewStatus")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEW">New</option>
              <option value="SCREENING">Screening</option>
              <option value="TECHNICAL_TEST">Technical Test</option>
              <option value="INTERVIEW">Interview</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Leadership */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("leadership")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Has leadership experience
              </span>
            </label>
          </div>

          {/* Leadership Note (conditional) */}
          {leadership && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leadership Note
              </label>
              <textarea
                {...register("leadershipNote")}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe leadership experience..."
              />
            </div>
          )}

          {/* Vendor Rate — DU_LEADER only */}
          {isDULeader && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Rate (USD/month)
              </label>
              <input
                {...register("vendorRateActual")}
                type="number"
                min={0}
                step={0.01}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1200"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Add Personnel"}
          </Button>
        </div>
      </div>
    </>
  );
}
