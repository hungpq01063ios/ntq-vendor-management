# PROJECT MEMORY — NTQ Vendor Management
> **Mục đích:** Bộ nhớ dự án. Session AI mới PHẢI đọc Section 1–3 trước (~60 dòng).
> Chỉ đọc section 4–8 khi cần chi tiết. **Last updated:** 2026-03-24 (v5.1 — Rate Override Fully Fixed)

---

## § 1 — Snapshot (đọc ngay)

```
App   : NTQ Vendor Management — Internal Tool DU8 (~2 users)
Stack : Next.js 16 App Router · TypeScript · Prisma · PostgreSQL (Supabase)
        NextAuth v5 · Zod · Tailwind · Recharts
Deploy: Vercel (prod) + localhost:3000 (dev)
Phase : Phase 1 — SHIPPED ✅
PRD   : docs/PRD-Index.md (v1.5) → module files trong docs/
Skills: .agent/skills/ (ntq-vendor-dev, coding-quality, vibe-coding-workflow)
```

**Login (dev + prod seed):** `admin@ntq.com.vn / admin123` (DU_LEADER) · `pic@ntq.com.vn / vendor123` (VENDOR_PIC)

---

## § 2 — Build Status (đọc ngay)

```
TypeScript : ✅ 0 errors (npx tsc --noEmit)
Tests      : ✅ 50/50 PASS · Rate Engine 100% coverage (npm test)
Seed       : npx tsx prisma/seed.ts
All CRs    : ✅ 14/14 Done
```

---

## § 3 — Feature Status (đọc ngay)

| Module | Status | Route |
|---|---|---|
| Vendor CRUD + detail | ✅ Done | `/vendors`, `/vendors/[id]` |
| Vendor filter theo ngôn ngữ lập trình (programming language) | ✅ Done (CR-01 updated) | `/vendors` |
| Vendor website + ratings | ✅ Done (CR-02/03) | `/vendors` |
| Vendor Import Excel template | ✅ Done (CR-04) | `/vendors` → Import dialog |
| Vendor ngôn ngữ lập trình: dropdown từ TechStack DB | ✅ Done (2026-03-22) | VendorSheet |
| Personnel CRUD + interview pipeline | ✅ Done | `/personnel`, `/pipeline` |
| Personnel CV management (multi-version) | ✅ Done | `/personnel/[id]` + create sheet |
| Personnel multi-techstack (primary + 2 add'l) | ✅ Done (CR-09) | `/personnel` create/edit |
| Personnel inline interview edit + projects col | ✅ Done (CR-06/07) | `/personnel` |
| Personnel Import Excel template | ✅ Done (CR-10) | `/personnel` → Import dialog |
| Project CRUD + assignments | ✅ Done | `/projects`, `/projects/[id]` |
| Project Domain + TechStack fields | ✅ Done (CR-11) | `/projects` create/edit |
| Assignment edit/delete + rate columns | ✅ Done | `/projects/[id]` |
| Project P&L card (detail page) | ✅ Done | `/projects/[id]` — DU_LEADER only |
| Rate Norm matrix + market context banner | ✅ Done (CR-13) | `/rates` |
| Rate Override (project-level, sentinel ID approach) | ✅ Done + Fixed | `/projects/[id]/rates` |
| Rate Override — Norm Rate & Delta hiển thị đúng | ✅ Done | `/projects/[id]/rates` table |
| Rate Override — Priority đúng (override > norm trong assignment) | ✅ Done | `assignment.actions`, `rate.actions` |
| Rate Config (Overhead/MarketFactor/Drift) | ✅ Done | `/rates/config` — DU_LEADER only |
| Rate Import Excel (pre-fill data thị trường hiện có) | ✅ Done (CR-14) | `/rates` → Import dialog |
| Rate Clone từ English → thị trường khác | ✅ Done (2026-03-22) | `/rates` → Clone button |
| Drift Alert (Flag/Resolve/Dismiss) | ✅ Done | `/alerts` |
| Pipeline project filter | ✅ Done (CR-12) | `/pipeline` |
| Dashboard (cards + charts + P&L) | ✅ Done | `/` |
| Auth + RBAC (DU_LEADER / VENDOR_PIC) | ✅ Done | layout.tsx + auth-helpers.ts |
| i18n (Tiếng Việt mặc định, multi-locale ready) | ✅ Done | `src/i18n/` — vi + en |

**Known tech debt:** _(none — tất cả đã được giải quyết)_

**Business rules confirmed (2026-03-24):**
- Norm rate tra cứu theo **`project.marketCode`** (không phải vendor.marketCode)
- Vendor **không có marketCode** — market thuộc về Project
- Norm lookup: **fallback chain** (exact → General domain → Generic+General) — 4 files bị ảnh hưởng: `assignment.actions`, `dashboard.actions`, `rate.actions`, `alert.actions`
- `null` techStack → tra cứu bằng "Generic"; `null` domain → tra cứu bằng "General" before falling back further
- **Rate Override sentinel pattern:** khi chọn "Any" trong form override → lưu `Generic`/`General` ID (không dùng null/empty string). Nhất quán với fallback chain.
- **Override priority:** `billingRate = projectOverrideRate ?? normRate ?? null` — override luôn ưu tiên hơn norm khi match
- **Override key lookup** phải dùng null-mapped IDs (ts/dom) chứ không phải raw `personnel.techStackId`

---

## § 4 — Architecture Decisions [đọc khi cần]

| ADR | Quyết định |
|---|---|
| ADR-1 | Server Actions thay REST API — không tạo `src/app/api/` cho CRUD |
| ADR-2 | `ActionResult<T>` cho mọi mutation — defined in `src/types/index.ts` |
| ADR-3 | Rate Engine = pure functions only — `src/lib/rate-engine.ts` không có DB call |
| ADR-4 | Soft delete only — Vendor→`INACTIVE`, Personnel→`ENDED`, Project/Assignment→`ENDED` |
| ADR-5 | Auth helpers — `requireAuth()` / `requireRole()` từ `src/lib/auth-helpers.ts` |

---

## § 5 — Key Files [đọc khi cần]

```
src/types/index.ts              ← ActionResult<T>, shared types
src/lib/auth-helpers.ts         ← requireAuth(), requireRole(), getSessionWithRole()
src/lib/rate-engine.ts          ← Pure functions: calculateVendorTargetRate, calculateAssignmentRates
src/lib/utils.ts                ← cn(), formatCurrency(), formatPercent(), getErrorMessage()
src/lib/validations.ts          ← Zod schemas cho tất cả entities
src/lib/__tests__/rate-engine.test.ts ← 50 tests, 100% coverage
src/actions/[entity].actions.ts ← Toàn bộ Server Actions
src/app/(dashboard)/            ← Auth-guarded routes + Sidebar layout
prisma/schema.prisma            ← DB schema source of truth
prisma/seed.ts                  ← Sample data + admin user
```

---

## § 6 — Phase 2 Backlog [đọc khi plan]

| Item | Priority |
|---|---|
| Pipeline drag-and-drop (hiện là read-only kanban) | Medium |
| User management UI (hiện tạo qua seed) | Medium |
| Password reset flow | Low |
| Export CSV tổng hợp (Personnel / Vendor) | Low |
| Email notifications drift alerts | Low |

---

## § 7 — Seed Data [đọc khi cần]

| Entity | Data |
|---|---|
| Vendors | TechViet Solutions (ENGLISH) · CodeBase Vietnam (JAPAN) |
| Project | FinApp Portal (ENGLISH, FinCorp Inc, ACTIVE) |
| Personnel | Le Van C (Java Senior, PASSED) · Pham Thi D (Tester Middle, NEW) |
| Rate Norms | 22 norms — Dev (Java/React/Golang/.NET) · Tester/BA/DevOps/PM · General domain · ENGLISH market |
| System Config | Overhead=20% · MarketFactor=80% · DriftThreshold=15% |

---

## § 8 — Changelog [cập nhật sau mỗi thay đổi]

| Date | Change | Type |
|---|---|---|
| 2026-03-24 | **Rate Override — Full Fix (4 commits)**: (1) Schema `String?`→`String`, sentinel approach. (2) Upsert → `findFirst+create/update` (Prisma null issue). (3) Final fix: map `""` → Generic/General IDs trước upsert — nhất quán với fallback chain. (4) Fix override key mismatch trong assignment.actions (`p.techStackId` null → dùng `ts` sentinel). (5) Fix `getNormRate()` thiếu `marketCode` filter → Norm Rate và Delta hiển thị đúng trong bảng Rate Overrides. Toàn bộ: TSC 0 errors, 50/50 tests. | Bug fix |
| 2026-03-24 | **Norm Fallback Lookup**: khi không tìm được exact norm → fallback `General domain` → fallback `Generic stack + General`. Fix null mismatch (null vs Generic/General string). Sửa 4 files: assignment.actions, dashboard.actions, rate.actions, alert.actions. Bonus: alert.actions loại bỏ N+1 query | Bug fix + Perf |
| 2026-03-24 | **Hydration fix**: `suppressHydrationWarning` vào `<body>` tag (browser extension inject className) | Bug fix |
| 2026-03-24 | **Rule fix**: Norm rate lookup dùng `project.marketCode` thay `vendor.marketCode`. Sửa 4 files: assignment.actions, dashboard.actions, rate.actions, alert.actions | Business Rule |
| 2026-03-24 | **Schema**: Xóa `marketCode` khỏi `Vendor` model — vendor không gắn thị trường. `prisma db push`. Sửa 9 files: schema, validations, vendor.actions, market.actions, import.actions, VendorSheet, VendorTable, VendorDetailClient, vendors/[id]/page | Schema + Cleanup |
| 2026-03-24 | **Tech debt**: Refactor 11 page files dùng `getSessionWithRole()` thay inline `auth()` + role cast. TypeScript 0 errors. | Refactor |
| 2026-03-22 | **Rate Clone**: `cloneRatesFromMarket()` action — copy rate từ English → thị trường khác (skip exist). Nút "Clone từ English" xuất hiện khi xem tab thị trường khác | Feature |
| 2026-03-22 | **Rate Template pre-fill**: API `/api/import/rate-template?market=X` trả Excel chứa sẵn data hiện tại của thị trường, thay vì example rows. File name theo market | Feature |
| 2026-03-22 | **ImportDialog fix download**: thay `<a download>` bằng fetch+Blob+createObjectURL → browser lưu đúng `.xlsx` filename từ Content-Disposition header | Bug fix |
| 2026-03-21 | CR Phase C: CR-04/10/14 — Import Vendor/Personnel/Rate từ Excel. Reusable ImportDialog, 3 API routes template, server actions parse+validate+bulk insert | Feature |
| 2026-03-21 | Fix floating point: vendorRateActual 4000 → hiển thị 3999.95. Thêm Math.round tại submit + display | Bug fix |
| 2026-03-23 | BUG-05 Fix: Tách `createRateNorm` (unique check, reject duplicate) + `updateRateNorm` trong `rate.actions.ts`. RateNormSheet gọi đúng action theo isEdit flag | Bug fix |
| 2026-03-23 | BUG-04 Fix: Thêm `personnel.deactivateTitle/deactivateBody` vào i18n (vi/en/types). PersonnelTable dùng key riêng, không hack .replace() từ vendor | Bug fix |
| 2026-03-23 | BUG-01 Fix: `LoginForm.tsx` thêm inline red error box `loginError` state sau khi `signIn()` trả về error. Error clear khi user sửa input | Bug fix |
| 2026-03-22 | Testing: 99/99 test cases executed (2 sessions). Test Report v2.1. 4 bugs found + fixed. Final verdict: PASS | QA |
| 2026-03-21 | DB schema: Vendor +website/ratings, Personnel +additionalTechStackIds, Project +domainId/techStackId | Schema |
| 2026-03-19 | i18n: Việt hóa toàn bộ website — custom i18n engine (vi/en), I18nProvider, useTranslations, getTranslations, LanguageSwitcher | Feature |
| 2026-03-19 | Personnel CV management — nhiều version CV, label/url/notes, isLatest flag, Set Latest, Edit, Delete | Feature |
| 2026-03-19 | Project detail: thêm Rate columns (Billing+Vendor+Margin) vào bảng Assignments, Edit/Delete assignment, Project P&L card | Feature |
| 2026-03-18 | Personnel Tech Stack và Domain → optional (nullable DB). BA/PM/Designer có thể bỏ trống. PRD-Module1 v1.4 | Feature |
| 2026-03-18 | Tách PRD thành docs/PRD-Index + 4 module files — tiết kiệm ~60-75% token khi đọc | Improvement |
| 2026-03-18 | Thêm Rate Calculator 2 chiều (Billing ↔ Max Vendor Rate) vào Rate Config | Feature |
| 2026-03-18 | Xóa Market khỏi Vendor (filter, cột, form, detail) — market thuộc Project | Feature |
| 2026-03-18 | Xóa Market Rate Factor khỏi Global Parameters — rate lấy theo thị trường từng dự án (MarketConfig) | Feature |
| 2026-03-18 | Fix MarketConfigTable: dùng router.refresh() thay refreshKey trick — table cập nhật ngay sau mutation | Bug fix |
| 2026-03-18 | Fix MarketConfigTable toggle toast: capture message trước action, không phải sau | Bug fix |
| 2026-03-18 | Fix VendorSheet: check ActionResult từ create/updateVendor, toast error + giữ sheet mở khi fail | Bug fix |
| 2026-03-18 | Fix Vendor detail page: hiển thị market name từ DB thay vì raw code | Bug fix |
| 2026-03-18 | Xóa dead code `MARKET_LABELS` trong VendorTable + VendorDetail | Tech debt |
| 2026-03-18 | Fix root `app/page.tsx` — xóa Next.js default template | Bug fix |
| 2026-03-18 | `ActionResult<T>` type + refactor 5 action files | Coding standard |
| 2026-03-18 | `auth-helpers.ts` — requireAuth, requireRole, getSessionWithRole | Coding standard |
| 2026-03-18 | Xóa `declare module` hack trong `rate-engine.ts` | Tech debt |
| 2026-03-18 | Vitest setup + 50 tests Rate Engine (100% coverage) | Quality |
| 2026-03-18 | Add `PROJECT_MEMORY.md` + PRD sync workflow vào skills | Process |
| 2026-03-17 | Phase 1 feature complete — deploy Vercel | Feature |

---

## § 9 — Update Guide

**Cập nhật file này khi:** implement xong tính năng, sửa bug quan trọng, thay đổi ADR, thêm dependency.
**Không cập nhật khi:** sửa CSS/typo, refactor không đổi behavior, update package minor version.

**Cập nhật PRD** (`PRD-VendorManagement-Phase1.md`) **khi:** thêm/bỏ tính năng user-facing, thay đổi business rule, thêm field nghiệp vụ mới. Bump version table ở đầu PRD.
