"use client";

import { useEffect, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPersonnel, updatePersonnel } from "@/actions/personnel.actions";
import { addPersonnelCV } from "@/actions/cv.actions";
import type { Personnel, JobType, TechStack, Level, Domain } from "@/types";
import type { PersonnelCVInput } from "@/actions/cv.actions";

// ─── Personnel Form Schema ────────────────────────────────────────────────────

const PersonnelFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  fullName: z.string().min(1, "Full name is required"),
  jobTypeId: z.string().min(1, "Job type is required"),
  techStackId: z.string().nullable().optional(),
  levelId: z.string().min(1, "Level is required"),
  domainId: z.string().nullable().optional(),
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
    techStackId: p.techStackId ?? null,
    levelId: p.levelId,
    domainId: p.domainId ?? null,
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
  techStackId: null,
  levelId: "",
  domainId: null,
  englishLevel: "INTERMEDIATE",
  leadership: false,
  leadershipNote: "",
  vendorRateActual: "",
  status: "AVAILABLE",
  interviewStatus: "NEW",
  notes: "",
};

// ─── CV Draft types ───────────────────────────────────────────────────────────

type CVDraft = {
  _id: string; // local key only
  label: string;
  url: string;
  notes: string;
  isLatest: boolean;
};

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
  const router = useRouter();
  const uid = useId(); // stable prefix for CV draft keys

  // --- Personnel form ---
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

  // --- CV drafts (create mode only) ---
  const [cvDrafts, setCvDrafts] = useState<CVDraft[]>([]);
  const [cvInput, setCvInput] = useState({ label: "", url: "", notes: "", isLatest: true });
  const [cvFormOpen, setCvFormOpen] = useState(false);
  const [cvInputError, setCvInputError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset(personnel ? toFormValues(personnel) : emptyValues);
      setCvDrafts([]);
      setCvInput({ label: "", url: "", notes: "", isLatest: true });
      setCvFormOpen(false);
      setCvInputError(null);
    }
  }, [open, personnel, reset]);

  // --- Add CV draft to list ---
  function handleAddCVDraft() {
    const { label, url } = cvInput;
    if (!label.trim()) { setCvInputError("Label is required"); return; }
    if (!url.trim()) { setCvInputError("URL is required"); return; }
    try { new URL(url); } catch { setCvInputError("Must be a valid URL (https://...)"); return; }

    const draft: CVDraft = {
      _id: `${uid}-${Date.now()}`,
      label: label.trim(),
      url: url.trim(),
      notes: cvInput.notes.trim(),
      isLatest: cvInput.isLatest,
    };

    // If new draft is latest, unset others
    setCvDrafts((prev) =>
      draft.isLatest ? [...prev.map((d) => ({ ...d, isLatest: false })), draft] : [...prev, draft]
    );
    setCvInput({ label: "", url: "", notes: "", isLatest: false });
    setCvInputError(null);
    setCvFormOpen(false);
  }

  function removeCVDraft(id: string) {
    setCvDrafts((prev) => prev.filter((d) => d._id !== id));
  }

  // --- Submit ---
  async function onSubmit(data: PersonnelFormValues) {
    const payload = {
      vendorId: data.vendorId,
      fullName: data.fullName,
      jobTypeId: data.jobTypeId,
      techStackId: data.techStackId || null,
      levelId: data.levelId,
      domainId: data.domainId || null,
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
      const result = await updatePersonnel(personnel.id, payload);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Personnel updated");
    } else {
      const result = await createPersonnel(payload);
      if (!result.success) { toast.error(result.error); return; }

      const personnelId = result.data!.id;

      // Create CV drafts sequentially
      if (cvDrafts.length > 0) {
        for (const draft of cvDrafts) {
          const cvPayload: PersonnelCVInput = {
            label: draft.label,
            url: draft.url,
            notes: draft.notes || undefined,
            isLatest: draft.isLatest,
          };
          const cvResult = await addPersonnelCV(personnelId, cvPayload);
          if (!cvResult.success) {
            toast.error(`CV "${draft.label}": ${cvResult.error}`);
          }
        }
        toast.success(`Personnel created with ${cvDrafts.length} CV${cvDrafts.length > 1 ? "s" : ""}`);
      } else {
        toast.success("Personnel created");
      }
    }

    router.refresh();
    onClose();
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
                Tech Stack
                <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
              </label>
              <select
                {...register("techStackId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Not applicable —</option>
                {techStacks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
                Domain
                <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
              </label>
              <select
                {...register("domainId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Not applicable —</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
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

          {/* ── CV Section — create mode only ───────────────────────────── */}
          {!isEdit && (
            <div className="border rounded-lg overflow-hidden">
              {/* CV header */}
              <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">CV / Resume</span>
                  {cvDrafts.length > 0 && (
                    <span className="inline-flex px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
                      {cvDrafts.length}
                    </span>
                  )}
                </div>
                {!cvFormOpen && (
                  <button
                    type="button"
                    onClick={() => { setCvFormOpen(true); setCvInputError(null); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add CV
                  </button>
                )}
              </div>

              {/* Existing drafts */}
              {cvDrafts.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {cvDrafts.map((d) => (
                    <li key={d._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800 truncate">{d.label}</span>
                          {d.isLatest && (
                            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{d.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCVDraft(d._id)}
                        className="ml-3 text-xs text-red-400 hover:text-red-600 shrink-0"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {cvDrafts.length === 0 && !cvFormOpen && (
                <p className="px-4 py-3 text-xs text-gray-400">
                  No CVs added. Click &quot;+ Add CV&quot; to attach a CV link.
                </p>
              )}

              {/* Inline add-CV form */}
              {cvFormOpen && (
                <div className="px-4 py-3 bg-blue-50 border-t space-y-2.5">
                  {/* Label */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cvInput.label}
                      onChange={(e) => setCvInput((p) => ({ ...p, label: e.target.value }))}
                      className="w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder='e.g. "CV v1 - Backend", "Updated Mar 2026"'
                      autoFocus
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      URL (Google Drive / link download) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={cvInput.url}
                      onChange={(e) => setCvInput((p) => ({ ...p, url: e.target.value }))}
                      className="w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="https://drive.google.com/file/d/..."
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={cvInput.notes}
                      onChange={(e) => setCvInput((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="e.g. Java focused, includes cover letter..."
                    />
                  </div>

                  {/* isLatest */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cvInput.isLatest}
                      onChange={(e) => setCvInput((p) => ({ ...p, isLatest: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">Mark as latest CV</span>
                  </label>

                  {/* Error */}
                  {cvInputError && (
                    <p className="text-xs text-red-500">{cvInputError}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleAddCVDraft}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCvFormOpen(false); setCvInputError(null); }}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
