"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  addPersonnelCV,
  updatePersonnelCV,
  deletePersonnelCV,
  setLatestCV,
} from "@/actions/cv.actions";
import type { PersonnelCVInput } from "@/actions/cv.actions";

// Local schema for the form (mirrors server-side schema)
const CVFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  url: z.string().url("Must be a valid URL"),
  notes: z.string().optional(),
  isLatest: z.boolean(),
});

type CVFormValues = z.infer<typeof CVFormSchema>;

type CVItem = {
  id: string;
  label: string;
  url: string;
  isLatest: boolean;
  notes: string | null;
  uploadedAt: Date;
  uploadedBy: { id: string; name: string };
};

interface Props {
  personnelId: string;
  cvs: CVItem[];
}

const emptyValues: CVFormValues = {
  label: "",
  url: "",
  notes: "",
  isLatest: false,
};

export default function PersonnelCVSection({ personnelId, cvs }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCV, setEditingCV] = useState<CVItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingLatestId, setSettingLatestId] = useState<string | null>(null);

  const isEditMode = !!editingCV;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CVFormValues>({
    resolver: zodResolver(CVFormSchema),
    defaultValues: emptyValues,
  });

  function openCreate() {
    setEditingCV(null);
    reset(emptyValues);
    setFormOpen(true);
  }

  function openEdit(cv: CVItem) {
    setEditingCV(cv);
    reset({
      label: cv.label,
      url: cv.url,
      notes: cv.notes ?? "",
      isLatest: cv.isLatest,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCV(null);
    reset(emptyValues);
  }

  async function onSubmit(data: CVFormValues) {
    const payload: PersonnelCVInput = {
      label: data.label,
      url: data.url,
      notes: data.notes || undefined,
      isLatest: data.isLatest,
    };

    let result;
    if (isEditMode && editingCV) {
      result = await updatePersonnelCV(editingCV.id, personnelId, payload);
    } else {
      result = await addPersonnelCV(personnelId, payload);
    }

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditMode ? "CV updated" : "CV added");
    router.refresh();
    closeForm();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa CV version này?")) return;
    setDeletingId(id);
    const result = await deletePersonnelCV(id, personnelId);
    setDeletingId(null);
    if (result.success) {
      toast.success("CV deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleSetLatest(id: string) {
    setSettingLatestId(id);
    const result = await setLatestCV(id, personnelId);
    setSettingLatestId(null);
    if (result.success) {
      toast.success("Marked as latest CV");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="bg-white rounded-lg border mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CV / Resume</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {cvs.length} version{cvs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add CV
        </Button>
      </div>

      {/* Inline form */}
      {formOpen && (
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isEditMode ? "Edit CV Version" : "Add New CV Version"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                {...register("label")}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "CV v2 - Updated Mar 2026" or "Backend Focus"'
              />
              {errors.label && (
                <p className="text-xs text-red-500 mt-1">{errors.label.message}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                URL (Google Drive / OneDrive / link download){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("url")}
                type="url"
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://drive.google.com/file/d/..."
              />
              {errors.url && (
                <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                {...register("notes")}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Focused on Java Backend, includes cover letter..."
              />
            </div>

            {/* Is Latest */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isLatest")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Mark as latest/current CV version
              </span>
            </label>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Adding..."
                  : isEditMode
                    ? "Save Changes"
                    : "Add CV"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* CV list */}
      {cvs.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">
          No CV versions uploaded yet. Click &quot;+ Add CV&quot; to add one.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {cvs.map((cv) => (
            <li
              key={cv.id}
              className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 group"
            >
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={cv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline text-sm truncate"
                  >
                    {cv.label}
                  </a>
                  {cv.isLatest && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                      ✓ Latest
                    </span>
                  )}
                </div>
                {cv.notes && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{cv.notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded {format(new Date(cv.uploadedAt), "dd MMM yyyy")} by{" "}
                  <span className="text-gray-500">{cv.uploadedBy.name}</span>
                </p>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Preview link */}
                <a
                  href={cv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600"
                  title="Open CV link"
                >
                  ↗
                </a>

                {/* Set latest */}
                {!cv.isLatest && (
                  <button
                    onClick={() => handleSetLatest(cv.id)}
                    disabled={settingLatestId === cv.id}
                    className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  >
                    {settingLatestId === cv.id ? "…" : "Set Latest"}
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => openEdit(cv)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(cv.id)}
                  disabled={deletingId === cv.id}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === cv.id ? "…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
