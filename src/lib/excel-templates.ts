/**
 * Excel template builder for NTQ Vendor Management
 * Uses SheetJS (xlsx) — no server dependency, pure JS.
 */
import * as XLSX from "xlsx";

// ─── Helper ────────────────────────────────────────────────────────────────────

function makeWb(sheets: { name: string; data: (string | number | null)[][] }[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.data);
    // Style first row (header) — basic column widths
    ws["!cols"] = s.data[0].map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  return wb;
}

export function bufferFromWb(wb: XLSX.WorkBook): Uint8Array {
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Uint8Array;
}

// ─── Vendor Import Template ────────────────────────────────────────────────────

export function buildVendorTemplate(): XLSX.WorkBook {
  const data: (string | number | null)[][] = [
    // Header row
    [
      "Name*",
      "Contact Name*",
      "Contact Email*",
      "Contact Phone",
      "Website",
      "Company Size",
      "Market Code*",
      "Language Strengths (semicolon-separated)",
      "Status",
      "Performance Rating (1-5)",
      "Response Speed Rating (1-5)",
      "Performance Note",
      "Notes",
    ],
    // Example rows
    [
      "TechViet Solutions",
      "Nguyen Van A",
      "contact@techviet.vn",
      "+84-901234567",
      "https://techviet.vn",
      50,
      "ENGLISH",
      "English;Japanese",
      "ACTIVE",
      4,
      3,
      "Strong delivery team",
      "",
    ],
    [
      "CodeBase Vietnam",
      "Tran Thi B",
      "hr@codebase.vn",
      "",
      "",
      20,
      "JAPAN",
      "Japanese",
      "ACTIVE",
      null,
      null,
      "",
      "",
    ],
  ];

  const instructions: (string | number | null)[][] = [
    ["HƯỚNG DẪN IMPORT VENDOR"],
    [""],
    ["Trường bắt buộc (*):", "Name, Contact Name, Contact Email, Market Code"],
    ["Market Code:", "ENGLISH | JAPAN | KOREA — phải đúng chính xác (case-sensitive)"],
    ["Language Strengths:", "Nhập tên ngôn ngữ, phân cách bằng dấu chấm phẩy (;). VD: English;Japanese"],
    ["Status:", "ACTIVE | INACTIVE | ON_HOLD (mặc định: ACTIVE)"],
    ["Performance Rating:", "Số nguyên 1–5 (để trống nếu chưa đánh giá)"],
    ["Response Speed Rating:", "Số nguyên 1–5 (để trống nếu chưa đánh giá)"],
    [""],
    ["Lưu ý:", "Xóa các hàng ví dụ trước khi import. Giữ nguyên dòng header."],
    ["", "Nếu vendor đã tồn tại (cùng Email), record sẽ bị bỏ qua."],
  ];

  return makeWb([
    { name: "Vendors", data },
    { name: "Instructions", data: instructions },
  ]);
}

// ─── Personnel Import Template ─────────────────────────────────────────────────

export function buildPersonnelTemplate(
  lookups: {
    vendors: { name: string }[];
    jobTypes: { name: string }[];
    techStacks: { name: string }[];
    levels: { name: string }[];
    domains: { name: string }[];
  }
): XLSX.WorkBook {
  const data: (string | number | null)[][] = [
    [
      "Vendor Name*",
      "Full Name*",
      "Job Type*",
      "Level*",
      "Tech Stack (Primary)",
      "Additional Tech Stack 1",
      "Additional Tech Stack 2",
      "Domain",
      "English Level",
      "Status",
      "Interview Status",
      "Leadership (TRUE/FALSE)",
      "Vendor Rate (USD/mo)",
      "CV URL",
      "Notes",
    ],
    // Example
    [
      "TechViet Solutions",
      "Nguyễn Văn An",
      "Developer",
      "Senior",
      "Java",
      "Spring Boot",
      "",
      "Fintech",
      "INTERMEDIATE",
      "AVAILABLE",
      "PASSED",
      "FALSE",
      3500,
      "https://drive.google.com/file/...",
      "",
    ],
    [
      "CodeBase Vietnam",
      "Trần Thị Bình",
      "BA",
      "Middle",
      "",
      "",
      "",
      "Healthcare",
      "ADVANCED",
      "AVAILABLE",
      "NEW",
      "FALSE",
      null,
      "",
      "",
    ],
  ];

  // Lookup reference sheets
  const vendorList = [["Available Vendors"], ...lookups.vendors.map((v) => [v.name])];
  const jobTypeList = [["Job Types"], ...lookups.jobTypes.map((j) => [j.name])];
  const techStackList = [["Tech Stacks"], ...lookups.techStacks.map((t) => [t.name])];
  const levelList = [["Levels"], ...lookups.levels.map((l) => [l.name])];
  const domainList = [["Domains"], ...lookups.domains.map((d) => [d.name])];

  const lookupData = vendorList.map((_, i) => [
    vendorList[i]?.[0] ?? "",
    jobTypeList[i]?.[0] ?? "",
    techStackList[i]?.[0] ?? "",
    levelList[i]?.[0] ?? "",
    domainList[i]?.[0] ?? "",
  ]);
  lookupData[0] = ["Vendors", "Job Types", "Tech Stacks", "Levels", "Domains"];

  const instructions: (string | number | null)[][] = [
    ["HƯỚNG DẪN IMPORT NHÂN SỰ"],
    [""],
    ["Trường bắt buộc (*):", "Vendor Name, Full Name, Job Type, Level"],
    ["Vendor Name:", "Phải trùng chính xác tên vendor trong hệ thống (xem sheet Lookups)"],
    ["Job Type:", "Phải trùng tên trong hệ thống (xem sheet Lookups)"],
    ["Tech Stack:", "Để trống nếu là BA/PM/Designer. Phải trùng tên trong Lookups."],
    ["English Level:", "BASIC | INTERMEDIATE | ADVANCED | FLUENT (mặc định: INTERMEDIATE)"],
    ["Status:", "AVAILABLE | ON_PROJECT | ENDED (mặc định: AVAILABLE)"],
    ["Interview Status:", "NEW | SCREENING | TECHNICAL_TEST | INTERVIEW | PASSED | FAILED"],
    ["Leadership:", "TRUE hoặc FALSE (mặc định: FALSE)"],
    ["Vendor Rate:", "Số USD/tháng (để trống nếu không biết)"],
    ["CV URL:", "Link Google Drive / OneDrive (không bắt buộc khi import)"],
    [""],
    ["Lưu ý:", "Xem sheet Lookups để biết các giá trị hợp lệ."],
    ["", "Nhân sự trùng tên + vendor sẽ bị bỏ qua (không update)."],
  ];

  return makeWb([
    { name: "Personnel", data },
    { name: "Lookups", data: lookupData },
    { name: "Instructions", data: instructions },
  ]);
}

// ─── Rate Norm Import Template ─────────────────────────────────────────────────

type RateRow = {
  jobType: string;
  techStack: string;
  level: string;
  domain: string;
  marketCode: string;
  rateMin: number;
  rateNorm: number;
  rateMax: number;
};

export function buildRateTemplate(
  lookups: {
    jobTypes: { name: string }[];
    techStacks: { name: string }[];
    levels: { name: string }[];
    domains: { name: string }[];
    markets: { code: string; name: string }[];
    existingRates?: RateRow[];
    marketLabel?: string;
  }
): XLSX.WorkBook {
  const header = [
    "Job Type*",
    "Tech Stack*",
    "Level*",
    "Domain*",
    "Market Code*",
    "Rate Min (USD)*",
    "Rate Norm (USD)*",
    "Rate Max (USD)*",
  ];

  // Nếu có data hiện có → dùng làm content; nếu không → dùng example
  const dataRows: (string | number | null)[][] =
    lookups.existingRates && lookups.existingRates.length > 0
      ? lookups.existingRates.map((r) => [
          r.jobType,
          r.techStack,
          r.level,
          r.domain,
          r.marketCode,
          r.rateMin,
          r.rateNorm,
          r.rateMax,
        ])
      : [
          ["Developer", "Java", "Senior", "General", "ENGLISH", 3000, 3500, 4500],
          ["Developer", "ReactJS", "Middle", "Fintech", "ENGLISH", 2200, 2800, 3500],
          ["Developer", "Java", "Senior", "General", "JAPAN", 2400, 2800, 3600],
          ["BA", "General", "Senior", "General", "ENGLISH", 2500, 3000, 4000],
          ["Tester", "Manual Testing", "Middle", "General", "ENGLISH", 1500, 1800, 2500],
        ];

  const data: (string | number | null)[][] = [header, ...dataRows];

  const lookupData = (() => {
    const maxLen = Math.max(
      lookups.jobTypes.length,
      lookups.techStacks.length,
      lookups.levels.length,
      lookups.domains.length,
      lookups.markets.length
    );
    const rows: (string | number | null)[][] = [
      ["Job Types", "Tech Stacks", "Levels", "Domains", "Market Codes"],
    ];
    for (let i = 0; i < maxLen; i++) {
      rows.push([
        lookups.jobTypes[i]?.name ?? "",
        lookups.techStacks[i]?.name ?? "",
        lookups.levels[i]?.name ?? "",
        lookups.domains[i]?.name ?? "",
        lookups.markets[i] ? `${lookups.markets[i].code} (${lookups.markets[i].name})` : "",
      ]);
    }
    return rows;
  })();

  const marketNote = lookups.marketLabel
    ? `Dữ liệu rate hiện tại cho thị trường: ${lookups.marketLabel}`
    : "Template mẫu — xóa các hàng ví dụ trước khi import";

  const instructions: (string | number | null)[][] = [
    ["HƯỚNG DẪN IMPORT ĐỊNH MỨC RATE"],
    [""],
    [marketNote],
    [""],
    ["Tất cả trường đều bắt buộc."],
    [""],
    ["Job Type:", "Phải trùng tên trong hệ thống (xem sheet Lookups)"],
    ["Tech Stack:", "Phải trùng tên trong hệ thống"],
    ["Level:", "Phải trùng tên trong hệ thống"],
    ["Domain:", "Phải trùng tên trong hệ thống"],
    ["Market Code:", "Chỉ lấy phần code. VD: ENGLISH, JAPAN, KOREA"],
    ["Rate Min/Norm/Max:", "Số USD nguyên (không dấu phẩy). Min ≤ Norm ≤ Max"],
    [""],
    ["Lưu ý:", "Nếu combo (JobType + TechStack + Level + Domain + Market) đã tồn tại,"],
    ["", "record sẽ được UPDATE (upsert)."],
    ["", "Xem sheet Lookups để biết giá trị hợp lệ."],
  ];

  return makeWb([
    { name: "RateNorm", data },
    { name: "Lookups", data: lookupData },
    { name: "Instructions", data: instructions },
  ]);
}


