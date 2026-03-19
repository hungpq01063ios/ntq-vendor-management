"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createVendor, updateVendor } from "@/actions/vendor.actions";
import { useTranslations } from "@/i18n";
import type { Vendor } from "@/types";

// Form-specific schema: dates/numbers as strings for HTML inputs
const VendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().optional(),
  companySize: z.string().optional(),
  languageStrength: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_HOLD"]),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

type VendorFormValues = z.infer<typeof VendorFormSchema>;

function toFormValues(vendor: Vendor): VendorFormValues {
  return {
    name: vendor.name,
    contactName: vendor.contactName,
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone ?? "",
    companySize: vendor.companySize?.toString() ?? "",
    languageStrength: vendor.languageStrength,
    status: vendor.status,
    startDate: vendor.startDate
      ? new Date(vendor.startDate).toISOString().split("T")[0]
      : "",
    notes: vendor.notes ?? "",
  };
}

const emptyValues: VendorFormValues = {
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  companySize: "",
  languageStrength: [],
  status: "ACTIVE",
  startDate: "",
  notes: "",
};

interface VendorSheetProps {
  open: boolean;
  onClose: () => void;
  vendor?: Vendor;
}

export default function VendorSheet({ open, onClose, vendor }: VendorSheetProps) {
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!vendor;
  const router = useRouter();
  const { t } = useTranslations();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(VendorFormSchema),
    defaultValues: emptyValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const languageStrength = watch("languageStrength") ?? [];

  useEffect(() => {
    if (open) {
      reset(vendor ? toFormValues(vendor) : emptyValues);
      setTagInput("");
    }
  }, [open, vendor, reset]);

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !languageStrength.includes(tag)) {
      setValue("languageStrength", [...languageStrength, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue(
      "languageStrength",
      languageStrength.filter((t) => t !== tag)
    );
  }

  async function onSubmit(data: VendorFormValues) {
    setSubmitting(true);
    const payload = {
      name: data.name,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || undefined,
      companySize:
        data.companySize && data.companySize !== ""
          ? parseInt(data.companySize, 10)
          : undefined,
      marketCode: "ENGLISH",
      languageStrength: data.languageStrength,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      notes: data.notes || undefined,
    };

    const result = isEdit && vendor
      ? await updateVendor(vendor.id, payload)
      : await createVendor(payload);

    setSubmitting(false);

    if (result.success) {
      toast.success(isEdit ? t.vendor.updatedSuccess : t.vendor.createdSuccess);
      router.refresh();
      onClose();
    } else {
      toast.error(result.error ?? t.common.somethingWentWrong);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? t.vendor.editVendor : t.vendor.addVendor}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.companyName} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.contactName} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("contactName")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
            {errors.contactName && (
              <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.contactEmail} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("contactEmail")}
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@vendor.com"
            />
            {errors.contactEmail && (
              <p className="text-xs text-red-500 mt-1">{errors.contactEmail.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.contactPhone}
            </label>
            <input
              {...register("contactPhone")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+84 xxx xxx xxx"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.common.status}
            </label>
            <select
              {...register("status")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">{t.common.statusActive}</option>
              <option value="INACTIVE">{t.common.statusInactive}</option>
              <option value="ON_HOLD">{t.common.statusOnHold}</option>
            </select>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.companySize}
            </label>
            <input
              {...register("companySize")}
              type="number"
              min={1}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.startDate}
            </label>
            <input
              {...register("startDate")}
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Language Strength (tags) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.languageStrength}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.vendor.languagePlaceholder}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                {t.common.add}
              </Button>
            </div>
            {languageStrength.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languageStrength.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.common.notes}
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting
              ? isEdit
                ? t.common.saving
                : t.common.creating
              : isEdit
                ? t.common.save
                : t.common.create}
          </Button>
        </div>
      </div>
    </>
  );
}
