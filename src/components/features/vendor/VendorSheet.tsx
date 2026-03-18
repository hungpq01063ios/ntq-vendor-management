"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createVendor, updateVendor } from "@/actions/vendor.actions";
import type { Vendor } from "@/types";

// Form-specific schema: dates/numbers as strings for HTML inputs
const VendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().optional(),
  companySize: z.string().optional(),
  market: z.enum(["ENGLISH", "JAPAN", "KOREA", "OTHER"]),
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
    market: vendor.market,
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
  market: "ENGLISH",
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
    try {
      const payload = {
        name: data.name,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || undefined,
        companySize:
          data.companySize && data.companySize !== ""
            ? parseInt(data.companySize, 10)
            : undefined,
        market: data.market,
        languageStrength: data.languageStrength,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        notes: data.notes || undefined,
      };

      if (isEdit && vendor) {
        await updateVendor(vendor.id, payload);
        toast.success("Vendor updated successfully");
      } else {
        await createVendor(payload);
        toast.success("Vendor created successfully");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
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
            {isEdit ? "Edit Vendor" : "Add Vendor"}
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
              Company Name <span className="text-red-500">*</span>
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
              Contact Name <span className="text-red-500">*</span>
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
              Contact Email <span className="text-red-500">*</span>
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
              Contact Phone
            </label>
            <input
              {...register("contactPhone")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+84 xxx xxx xxx"
            />
          </div>

          {/* Market + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Market
              </label>
              <select
                {...register("market")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ENGLISH">English</option>
                <option value="JAPAN">Japan</option>
                <option value="KOREA">Korea</option>
                <option value="OTHER">Other</option>
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
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
              Start Date
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
              Language Strength
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
                placeholder="e.g. English, Japanese"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
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
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Vendor"}
          </Button>
        </div>
      </div>
    </>
  );
}
