"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import VendorSheet from "./VendorSheet";
import PersonnelSheet from "@/components/features/personnel/PersonnelSheet";
import type {
  Vendor,
  JobType,
  TechStack,
  Level,
  Domain,
} from "@/types";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-600",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
};

const PERSONNEL_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_PROJECT: "bg-blue-100 text-blue-800",
  ENDED: "bg-gray-100 text-gray-600",
};

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  SCREENING: "bg-yellow-100 text-yellow-800",
  TECHNICAL_TEST: "bg-orange-100 text-orange-800",
  INTERVIEW: "bg-blue-100 text-blue-800",
  PASSED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

type VendorWithPersonnel = Vendor & {
  personnel: {
    id: string;
    fullName: string;
    status: string;
    interviewStatus: string;
    jobType: { id: string; name: string };
    techStack: { id: string; name: string } | null;
    level: { id: string; name: string };
    domain: { id: string; name: string } | null;
  }[];
};

interface VendorDetailClientProps {
  vendor: VendorWithPersonnel;
  isDULeader: boolean;
  lookups: {
    jobTypes: JobType[];
    techStacks: TechStack[];
    levels: Level[];
    domains: Domain[];
    vendors: { id: string; name: string }[];
  };
}

export default function VendorDetailClient({
  vendor,
  isDULeader,
  lookups,
}: VendorDetailClientProps) {
  const { t } = useTranslations();

  // CR-19: Edit vendor
  const [vendorSheetOpen, setVendorSheetOpen] = useState(false);
  // CR-20: Add personnel
  const [personnelSheetOpen, setPersonnelSheetOpen] = useState(false);

  const PERSONNEL_STATUS_LABELS: Record<string, string> = {
    AVAILABLE: t.common.statusAvailable,
    ON_PROJECT: t.common.statusOnProject,
    ENDED: t.common.statusEnded,
  };
  const INTERVIEW_STATUS_LABELS: Record<string, string> = {
    NEW: t.common.interviewNew,
    SCREENING: t.common.interviewScreening,
    TECHNICAL_TEST: t.common.interviewTechnicalTest,
    INTERVIEW: t.common.interviewInterview,
    PASSED: t.common.interviewPassed,
    FAILED: t.common.interviewFailed,
  };
  const VENDOR_STATUS_LABELS: Record<string, string> = {
    ACTIVE: t.common.statusActive,
    INACTIVE: t.common.statusInactive,
    ON_HOLD: t.common.statusOnHold,
  };

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        {t.vendor.backToVendors}
      </Link>

      {/* Section 1: Vendor Info */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vendor.status] ?? ""}`}
              >
                {VENDOR_STATUS_LABELS[vendor.status] ?? vendor.status}
              </span>
            </div>
          </div>
          {/* CR-19: Edit button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVendorSheetOpen(true)}
            >
              {t.common.edit}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">{t.vendor.contactName}</span>
            <p className="font-medium text-gray-900">{vendor.contactName}</p>
          </div>
          <div>
            <span className="text-gray-500">{t.vendor.contactEmail}</span>
            <p className="font-medium text-gray-900">{vendor.contactEmail}</p>
          </div>
          {vendor.contactPhone && (
            <div>
              <span className="text-gray-500">{t.vendor.contactPhone}</span>
              <p className="font-medium text-gray-900">{vendor.contactPhone}</p>
            </div>
          )}
          {vendor.companySize && (
            <div>
              <span className="text-gray-500">{t.vendor.companySize}</span>
              <p className="font-medium text-gray-900">{vendor.companySize}</p>
            </div>
          )}
          {vendor.startDate && (
            <div>
              <span className="text-gray-500">{t.vendor.startDate}</span>
              <p className="font-medium text-gray-900">
                {format(new Date(vendor.startDate), "dd MMM yyyy")}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t.vendor.createdAt}</span>
            <p className="font-medium text-gray-900">
              {format(new Date(vendor.createdAt), "dd MMM yyyy")}
            </p>
          </div>
          {vendor.languageStrength.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">{t.vendor.languageStrength}</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {vendor.languageStrength.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
          {vendor.website && (
            <div>
              <span className="text-gray-500">{t.vendor.website}</span>
              <p className="font-medium">
                <a
                  href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {vendor.website}
                </a>
              </p>
            </div>
          )}
          {(vendor.performanceRating != null || vendor.responseSpeedRating != null) && (
            <div className="col-span-2">
              <span className="text-gray-500">{t.vendor.ratingSection}</span>
              <div className="flex flex-wrap gap-6 mt-1">
                <div>
                  <span className="text-xs text-gray-400">{t.vendor.qualityLabel}</span>
                  <p className="font-medium text-gray-900">
                    {vendor.performanceRating != null
                      ? "★".repeat(vendor.performanceRating) + "☆".repeat(5 - vendor.performanceRating) + ` (${vendor.performanceRating}/5)`
                      : t.vendor.notRated}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">{t.vendor.responseLabel}</span>
                  <p className="font-medium text-gray-900">
                    {vendor.responseSpeedRating != null
                      ? "★".repeat(vendor.responseSpeedRating) + "☆".repeat(5 - vendor.responseSpeedRating) + ` (${vendor.responseSpeedRating}/5)`
                      : t.vendor.notRated}
                  </p>
                </div>
              </div>
              {vendor.performanceNote && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{vendor.performanceNote}</p>
              )}
            </div>
          )}
          {vendor.notes && (
            <div className="col-span-2">
              <span className="text-gray-500">{t.common.notes}</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">{vendor.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Personnel List */}
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {t.vendor.personnelSection} ({vendor.personnel.length})
          </h2>
          {/* CR-20: Add Personnel button — pre-locked to this vendor */}
          <Button size="sm" onClick={() => setPersonnelSheetOpen(true)}>
            {t.personnel.addPersonnel}
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.name}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.jobType}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.techStack}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.level}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.common.status}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{t.vendor.interview}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendor.personnel.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {t.vendor.noPersonnel}
                </td>
              </tr>
            )}
            {vendor.personnel.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/personnel/${p.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {p.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.jobType.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.techStack?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.level.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PERSONNEL_STATUS_COLORS[p.status] ?? ""}`}
                  >
                    {PERSONNEL_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${INTERVIEW_STATUS_COLORS[p.interviewStatus] ?? ""}`}
                  >
                    {INTERVIEW_STATUS_LABELS[p.interviewStatus] ?? p.interviewStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CR-19: Edit Vendor Sheet */}
      <VendorSheet
        open={vendorSheetOpen}
        onClose={() => setVendorSheetOpen(false)}
        vendor={vendor}
        techStacks={lookups.techStacks}
      />

      {/* CR-20: Add Personnel Sheet — vendor pre-locked */}
      <PersonnelSheet
        open={personnelSheetOpen}
        onClose={() => setPersonnelSheetOpen(false)}
        vendors={[{ id: vendor.id, name: vendor.name }]}
        jobTypes={lookups.jobTypes}
        techStacks={lookups.techStacks}
        levels={lookups.levels}
        domains={lookups.domains}
        isDULeader={isDULeader}
      />
    </div>
  );
}
