import { notFound } from "next/navigation";
import Link from "next/link";
import { getVendorById } from "@/actions/vendor.actions";
import { getMarkets } from "@/actions/market.actions";
import { format } from "date-fns";
import { getTranslations } from "@/i18n/server";
import { cookies } from "next/headers";

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

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const t = getTranslations(cookieStore.get("locale")?.value);

  const [vendor, markets] = await Promise.all([
    getVendorById(id),
    getMarkets(true),
  ]);
  if (!vendor) notFound();

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
              <span className="text-sm text-gray-500">
                {markets.find((m) => m.code === vendor.marketCode)?.name ?? vendor.marketCode}
              </span>
            </div>
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
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {t.vendor.personnelSection} ({vendor.personnel.length})
          </h2>
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
    </div>
  );
}
