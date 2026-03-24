"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProject, updateProject } from "@/actions/project.actions";
import type { Project, MarketConfig } from "@/types";

type DomainItem = { id: string; name: string };
type TechStackItem = { id: string; name: string };

const ProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  marketCode: z.string().min(1, "Market is required"),
  status: z.enum(["ACTIVE", "ON_HOLD", "ENDED"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  domainId: z.string().optional(),   // CR-11
  techStackId: z.string().optional(), // CR-11
});

type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

function toFormValues(p: Project): ProjectFormValues {
  return {
    name: p.name,
    clientName: p.clientName,
    marketCode: p.marketCode,
    status: p.status,
    startDate: new Date(p.startDate).toISOString().split("T")[0],
    endDate: p.endDate
      ? new Date(p.endDate).toISOString().split("T")[0]
      : "",
    notes: p.notes ?? "",
    domainId: (p as { domainId?: string | null }).domainId ?? "",
    techStackId: (p as { techStackId?: string | null }).techStackId ?? "",
  };
}

const emptyValues: ProjectFormValues = {
  name: "",
  clientName: "",
  marketCode: "ENGLISH",
  status: "ACTIVE",
  startDate: "",
  endDate: "",
  notes: "",
  domainId: "",
  techStackId: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
  markets: MarketConfig[];
  domains: DomainItem[];      // CR-11
  techStacks: TechStackItem[]; // CR-11
}

export default function ProjectSheet({ open, onClose, project, markets, domains, techStacks }: Props) {
  const isEdit = !!project;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(project ? toFormValues(project) : emptyValues);
    }
  }, [open, project, reset]);

  async function onSubmit(data: ProjectFormValues) {
    const payload = {
      name: data.name,
      clientName: data.clientName,
      marketCode: data.marketCode,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes || undefined,
      domainId: data.domainId || null,
      techStackId: data.techStackId || null,
    };

    if (isEdit && project) {
      const result = await updateProject(project.id, payload);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Project updated");
    } else {
      const result = await createProject(payload);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Project created");
    }
    router.refresh();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Project" : "New Project"}
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
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project Alpha"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("clientName")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ACME Inc."
            />
            {errors.clientName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.clientName.message}
              </p>
            )}
          </div>

          {/* Market + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Market
              </label>
              <select
                {...register("marketCode")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {markets.map((m) => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
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
                <option value="ON_HOLD">On Hold</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
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

          {/* Domain + TechStack - CR-11 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain
                <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
              </label>
              <select
                {...register("domainId")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Chọn domain —</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
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
                <option value="">— Chọn tech stack —</option>
                {techStacks.map((ts) => (
                  <option key={ts.id} value={ts.id}>{ts.name}</option>
                ))}
              </select>
            </div>
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
              placeholder="Project description..."
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
                : "Create Project"}
          </Button>
        </div>
      </div>
    </>
  );
}
