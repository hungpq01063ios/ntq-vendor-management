# Dependency Map — NTQ Vendor Management

> 🤖 **Agent**: Đọc file này TRƯỚC khi đánh giá impact của bất kỳ code change nào.
> Mỗi section = 1 domain concept. Files liệt kê = files bị ảnh hưởng khi thay đổi concept đó.
> **Last updated**: 2026-03-24 (v1.5)

---

## Vendor (entity + UI)
| Layer | File | Vai trò |
|-------|------|---------|
| Schema | `lib/validations.ts` | `VendorSchema` (không còn `marketCode` — đã xóa 2026-03-24) |
| Action | `actions/vendor.actions.ts` | CRUD + soft delete (không có market filter) |
| Action | `actions/import.actions.ts` | Import Vendor từ Excel (không có marketCode column) |
| Page | `app/(dashboard)/vendors/page.tsx` | List page (không có getMarkets()) |
| Page | `app/(dashboard)/vendors/[id]/page.tsx` | Detail page (không có markets prop) |
| UI | `components/features/vendor/VendorTable.tsx` | Table + filter (không có markets prop) |
| UI | `components/features/vendor/VendorSheet.tsx` | Create/Edit form (không có market dropdown) |
| UI | `components/features/vendor/VendorDetailClient.tsx` | Detail (không hiển marketCode) |

## Personnel (entity + UI)
| Layer | File | Vai trò |
|-------|------|---------|
| Schema | `lib/validations.ts` | `PersonnelSchema` (additionalTechStackIds CR-09) |
| Action | `actions/personnel.actions.ts` | CRUD + updateInterviewStatus (CR-06) |
| Action | `actions/cv.actions.ts` | CV CRUD: add, update, delete, setLatest, getCVsByPersonnel |
| Page | `app/(dashboard)/personnel/page.tsx` | List page |
| Page | `app/(dashboard)/personnel/[id]/page.tsx` | Detail page (includes CV section) |
| Page | `app/(dashboard)/pipeline/page.tsx` | Kanban view (server: fetch data) |
| UI | `components/features/personnel/PersonnelTable.tsx` | Table + inline interview edit (CR-06) + projects col (CR-07) |
| UI | `components/features/personnel/PersonnelSheet.tsx` | Create/Edit form (CV drafts, multi-techstack CR-09, CV required CR-08) |
| UI | `components/features/personnel/PersonnelEditSection.tsx` | Inline edit |
| UI | `components/features/personnel/PersonnelCVSection.tsx` | CV list + add/edit/delete/setLatest |
| UI | `components/features/pipeline/PipelineClient.tsx` | Client-side kanban + project filter (CR-12) |

## Project (entity + UI)
| Layer | File | Vai trò |
|-------|------|---------|
| Schema | `lib/validations.ts` | `ProjectSchema` (đã thêm domainId, techStackId CR-11) |
| Action | `actions/project.actions.ts` | CRUD + soft delete |
| Page | `app/(dashboard)/projects/page.tsx` | List page (fetches markets, domains, techStacks) |
| Page | `app/(dashboard)/projects/[id]/page.tsx` | Detail page |
| Page | `app/(dashboard)/projects/[id]/rates/page.tsx` | Project rate overrides |
| UI | `components/features/project/ProjectTable.tsx` | Table + delete (passes domains/techStacks) |
| UI | `components/features/project/ProjectSheet.tsx` | Create/Edit form (domain/techStack dropdowns CR-11) |

## Assignment (entity + UI)
| Layer | File | Vai trò |
|-------|------|---------|
| Schema | `lib/validations.ts` | `AssignmentSchema` |
| Action | `actions/assignment.actions.ts` | Create + end |
| UI | `components/features/assignment/AssignmentSection.tsx` | List in project detail |
| UI | `components/features/assignment/AssignmentSheet.tsx` | Create form (uses rate.actions) |

## Rate Engine (formula + config)
| Layer | File | Vai trò |
|-------|------|---------|
| Core | `lib/rate-engine.ts` | Pure functions: calculateVendorTargetRate, getMarketFactor |
| Test | `lib/__tests__/rate-engine.test.ts` | Unit tests |
| Schema | `lib/validations.ts` | `SystemConfigSchema`, `RateNormSchema`, `MarketConfigSchema` |
| Action | `actions/rate.actions.ts` | RateNorm CRUD + getRateNormForPersonnel (builds rateConfig) |
| Action | `actions/alert.actions.ts` | Drift check (builds rateConfig + marketRateFactors) |
| Action | `actions/dashboard.actions.ts` | Dashboard aggregate (builds rateConfig + marketRateFactors) |
| Action | `actions/market.actions.ts` | MarketConfig CRUD + toggle |
| Page | `app/(dashboard)/rates/page.tsx` | Rate Norm grid |
| Page | `app/(dashboard)/rates/config/page.tsx` | Global Config + Calculator + Market Config |
| UI | `components/features/rate/RateMatrixGrid.tsx` | Norm grid view |
| UI | `components/features/rate/RateNormSheet.tsx` | Norm create/edit |
| UI | `components/features/rate/GlobalConfigForm.tsx` | Overhead + Drift Threshold |
| UI | `components/features/rate/MarketConfigTable.tsx` | Per-market factor CRUD |
| UI | `components/features/rate/RateCalculator.tsx` | 2-way calculator |
| UI | `components/features/rate/RateSuggestionCard.tsx` | Rate suggestion on assignment |
| UI | `components/features/rate/ProjectRateOverrideTable.tsx` | Project rate override list |
| UI | `components/features/rate/RateOverrideSheet.tsx` | Override create/edit |

> ⚠️ **Business Rule (2026-03-24):** Norm rate lookup dùng **`project.marketCode`** (không phải `vendor.marketCode`).
> **Fallback chain (2026-03-24):** `exact → General domain → Generic stack + General` — tự động fallback khi không có exact norm.
> `null` techStack → dùng "Generic" ID; `null` domain → dùng "General" ID trước khi fallback tiếp.
> 4 files ảnh hưởng khi cần sửa rule: `assignment.actions`, `dashboard.actions`, `rate.actions`, `alert.actions`.

## Alert (drift alerts)
| Layer | File | Vai trò |
|-------|------|---------|
| Action | `actions/alert.actions.ts` | CRUD + drift check + getPendingAlertCount |
| Page | `app/(dashboard)/alerts/page.tsx` | Alert list page |
| UI | `components/features/rate/AlertTable.tsx` | Alert table + resolve/dismiss |
| UI | `components/features/dashboard/AlertSummary.tsx` | Dashboard alert widget |
| Layout | `app/(dashboard)/layout.tsx` | Badge count (getPendingAlertCount) |

## Dashboard
| Layer | File | Vai trò |
|-------|------|---------|
| Action | `actions/dashboard.actions.ts` | getDashboardData (uses rate-engine) |
| Page | `app/(dashboard)/page.tsx` | Dashboard page |
| UI | `components/features/dashboard/SummaryCards.tsx` | Metric cards |
| UI | `components/features/dashboard/RevenueByProject.tsx` | Bar chart |
| UI | `components/features/dashboard/HeadcountByVendor.tsx` | Pie chart |
| UI | `components/features/dashboard/ProjectBreakdown.tsx` | Project table |
| UI | `components/features/dashboard/AlertSummary.tsx` | Alert widget |

## Auth & Layout
| Layer | File | Vai trò |
|-------|------|---------|
| Core | `lib/auth.ts` | NextAuth config |
| Core | `lib/auth-helpers.ts` | requireAuth, requireRole |
| Page | `app/(auth)/login/page.tsx` | Login page |
| UI | `components/features/auth/LoginForm.tsx` | Login form |
| UI | `components/features/dashboard/Sidebar.tsx` | Navigation sidebar |
| Layout | `app/(dashboard)/layout.tsx` | Dashboard layout + auth check |

## Shared Utilities
| Layer | File | Vai trò |
|-------|------|---------|
| Core | `lib/db.ts` | Prisma client singleton |
| Core | `lib/utils.ts` | cn(), formatUSD(), formatPct() |
| Core | `lib/validations.ts` | ALL Zod schemas |
| Action | `actions/lookup.actions.ts` | getFormLookups (shared dropdowns) |
| Types | `types/index.ts` | Shared TypeScript types |

---

## Cross-Cutting Dependencies

Khi thay đổi các concept sau, cần check **NHIỀU domain**:

| Concept | Ảnh hưởng |
|---------|----------|
| `RateConfig` interface | rate-engine.ts → rate.actions → alert.actions → dashboard.actions |
| `SystemConfig` keys | validations.ts → rate.actions → GlobalConfigForm |
| `MarketConfig` schema | validations.ts → market.actions → MarketConfigTable → RateCalculator |
| `billingRate` field | assignment.actions → AssignmentSheet → RateSuggestionCard → dashboard.actions |
| `additionalTechStackIds` | schema.prisma → validations.ts → PersonnelSheet → personnel.actions → PersonnelTable (display) |
| `vendorRateActual` | PersonnelSheet (submit) → personnel.actions → PersonnelTable (display) → personnel/[id] (detail) → RateSuggestionCard |
| Prisma schema change | schema.prisma → run `prisma generate` → xóa `.next` cache → check ALL actions using affected model |
| Zod schema change | validations.ts → check ALL actions importing that schema → check ALL forms using it |
