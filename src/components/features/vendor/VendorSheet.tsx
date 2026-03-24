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
import type { Vendor, TechStack, MarketConfig } from "@/types";

// Form-specific schema: dates/numbers as strings for HTML inputs
const VendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  companySize: z.string().optional(),
  languageStrength: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_HOLD"]),
  startDate: z.string().optional(),
  notes: z.string().optional(),
  performanceRating: z.string().optional(),    // CR-03: 1-5
  responseSpeedRating: z.string().optional(),  // CR-03: 1-5
  performanceNote: z.string().optional(),      // CR-03
});

type VendorFormValues = z.infer<typeof VendorFormSchema>;

function toFormValues(vendor: Vendor): VendorFormValues {
  return {
    name: vendor.name,
    contactName: vendor.contactName,
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone ?? "",
    website: (vendor as { website?: string | null }).website ?? "",
    companySize: vendor.companySize?.toString() ?? "",
    languageStrength: vendor.languageStrength,
    status: vendor.status,
    startDate: vendor.startDate
      ? new Date(vendor.startDate).toISOString().split("T")[0]
      : "",
    notes: vendor.notes ?? "",
    performanceRating: (vendor as { performanceRating?: number | null }).performanceRating?.toString() ?? "",
    responseSpeedRating: (vendor as { responseSpeedRating?: number | null }).responseSpeedRating?.toString() ?? "",
    performanceNote: (vendor as { performanceNote?: string | null }).performanceNote ?? "",
  };
}

const emptyValues: VendorFormValues = {
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  companySize: "",
  languageStrength: [],
  status: "ACTIVE",
  startDate: "",
  notes: "",
  performanceRating: "",
  responseSpeedRating: "",
  performanceNote: "",
};

interface VendorSheetProps {
  open: boolean;
  onClose: () => void;
  vendor?: Vendor;
  techStacks: TechStack[];
}

export default function VendorSheet({ open, onClose, vendor, techStacks }: VendorSheetProps) {
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
    }
  }, [open, vendor, reset]);

  function toggleTechStack(name: string) {
    const current = languageStrength;
    if (current.includes(name)) {
      setValue("languageStrength", current.filter((t) => t !== name));
    } else {
      setValue("languageStrength", [...current, name]);
    }
  }

  function removeTechStack(name: string) {
    setValue("languageStrength", languageStrength.filter((t) => t !== name));
  }

  async function onSubmit(data: VendorFormValues) {
    setSubmitting(true);
    const payload = {
      name: data.name,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || undefined,
      website: data.website || undefined,
      companySize:
        data.companySize && data.companySize !== ""
          ? parseInt(data.companySize, 10)
          : undefined,
      languageStrength: data.languageStrength,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      notes: data.notes || undefined,
      performanceRating:
        data.performanceRating && data.performanceRating !== ""
          ? parseInt(data.performanceRating, 10)
          : undefined,
      responseSpeedRating:
        data.responseSpeedRating && data.responseSpeedRating !== ""
          ? parseInt(data.responseSpeedRating, 10)
          : undefined,
      performanceNote: data.performanceNote || undefined,
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

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              {...register("website")}
              type="url"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://vendor.com"
            />
            {errors.website && (
              <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>
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

          {/* Programming Language Strength — multi-select từ TechStack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.languageStrength}
            </label>
            <p className="text-xs text-gray-500 mb-2">{t.vendor.languageHelperText}</p>
            {/* Tags selected */}
            {languageStrength.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {languageStrength.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeTechStack(name)}
                      className="hover:text-blue-600 leading-none"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Dropdown để chọn thêm */}
            <select
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value=""
              onChange={(e) => {
                if (e.target.value) toggleTechStack(e.target.value);
              }}
            >
              <option value="">{t.vendor.languageSelectPlaceholder}</option>
              {techStacks
                .filter((ts) => !languageStrength.includes(ts.name))
                .map((ts) => (
                  <option key={ts.id} value={ts.name}>{ts.name}</option>
                ))}
            </select>
          </div>

          {/* Performance Rating - CR-03 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.performanceRating}
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">{t.vendor.qualityLabel}</label>
                <select
                  {...register("performanceRating")}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.vendor.notRated}</option>
                  <option value="1">★ (1)</option>
                  <option value="2">★★ (2)</option>
                  <option value="3">★★★ (3)</option>
                  <option value="4">★★★★ (4)</option>
                  <option value="5">★★★★★ (5)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">{t.vendor.responseLabel}</label>
                <select
                  {...register("responseSpeedRating")}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.vendor.notRated}</option>
                  <option value="1">★ (1)</option>
                  <option value="2">★★ (2)</option>
                  <option value="3">★★★ (3)</option>
                  <option value="4">★★★★ (4)</option>
                  <option value="5">★★★★★ (5)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Note - CR-03 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.vendor.performanceNote}
            </label>
            <textarea
              {...register("performanceNote")}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="VD: Phản hồi nhanh, chất lượng nhân sự tốt..."
            />
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
