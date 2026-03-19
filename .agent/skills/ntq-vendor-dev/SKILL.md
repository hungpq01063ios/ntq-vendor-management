---
name: NTQ Vendor Management
description: >
  Domain context skill for the NTQ Vendor Management project. Use this skill
  for ANY task on this codebase. This project uses Next.js 15 App Router with
  Server Actions — NOT NestJS. Overrides backend-api and frontend-patterns
  for this project. Triggers on: vendor, personnel, project tracker, rate engine,
  assignment, rate norm, drift alert, DU dashboard, or any feature for this app.
---

# NTQ Vendor Management — Domain Context

> 📖 **Đọc `PROJECT_MEMORY.md` trước** — file đó chứa build status, feature map, ADRs, và changelog.
> Đọc `docs/PRD-Index.md` khi cần hiểu nghiệp vụ tổng quan, sau đó đọc module file tương ứng.

## ⚠️ Architecture Override

This project uses **Next.js 15 App Router + Server Actions**.
Do NOT apply `backend-api` (NestJS) or `frontend-patterns` (REST hooks) patterns here.

```
General projects  → backend-api + frontend-patterns
THIS project      → ntq-vendor-dev (this skill) only
```

## Project Snapshot

```
App     : Internal tool — DU8, NTQ Solution (~2 users: DU Leader + Vendor PIC)
Stack   : Next.js 15 App Router · TypeScript · Prisma · PostgreSQL (Supabase)
          shadcn/ui · Tailwind · NextAuth v5 · Zod · Recharts
Deploy  : Vercel
Modules : Vendor Profile Hub · Project-Headcount Tracker · Rate Engine
```

## Non-Negotiable Code Rules

**No API routes — use Server Actions**
```typescript
// ✅ src/actions/vendor.actions.ts
'use server'
export async function createVendor(data: VendorInput) { ... }

// ❌ Never create src/app/api/ routes for CRUD
```

**Server Components fetch data, Client Components render UI**
```typescript
// ✅ page.tsx — Server Component
const vendors = await getVendors()
return <VendorTable data={vendors} />

// ❌ No useEffect + fetch in Client Components
```

**Zod schema — KHÔNG export từ `'use server'` file**
```typescript
// ✅ Schema dùng nội bộ trong action file (không export)
const PersonnelCVSchema = z.object({ ... })  // const, not export

// ✅ Nếu cần dùng ở client, tạo schema cục bộ trong component
const CVFormSchema = z.object({ ... })       // trong PersonnelCVSection.tsx

// ❌ A "use server" file can only export async functions
export const PersonnelCVSchema = z.object({ ... })  // RUNTIME ERROR!
```

**Chia sẻ type thì dùng `export type` (OK trong use server)**
```typescript
// ✅ use server file vẫn có thể export type
export type PersonnelCVInput = { label: string; url: string; ... }
```

**revalidatePath after every mutation**
```typescript
revalidatePath('/vendors')
revalidatePath(`/vendors/${id}`)
```

**i18n — Client vs Server pattern**
```typescript
// ✅ Client Components → import from "@/i18n"
import { useTranslations } from "@/i18n"
"use client"
const { t, locale, setLocale } = useTranslations()
<p>{t.vendor.title}</p>

// ✅ Server Components → import from "@/i18n/server" (NO "use client")
import { getTranslations } from "@/i18n/server"
import { cookies } from "next/headers"
const cookieStore = await cookies()
const t = getTranslations(cookieStore.get('locale')?.value)

// ❌ NEVER import from "@/i18n" in Server Components (causes client boundary error)
// ❌ NEVER use useTranslations() in Server Components
```

**Adding a new locale**
```
1. Create src/i18n/locales/<code>.ts (implement Translations interface)
2. Add '<code>' to Locale union in src/i18n/types.ts
3. Register in LOCALES map in src/i18n/index.tsx AND LOCALES_SERVER in src/i18n/server.ts
4. Update LOCALE_LABELS map in src/i18n/index.tsx
```

**Auth check at top of every Server Action — use auth-helpers**
```typescript
// ✅ Preferred: use auth-helpers
import { requireAuth, requireRole } from '@/lib/auth-helpers'
const session = await requireAuth()          // any logged-in user
const session = await requireRole('DU_LEADER') // DU Leader only

// ❓ Old pattern (still works but verbose):
// const session = await auth()
// if (!session) throw new Error('Unauthorized')
```

## Domain Entities & Relationships

```
Vendor (1) ──── (N) Personnel
                     │
                     ├── (N) Assignment (N) ── (1) Project
                     │         │
                     │         └── billingRate (override or inherit)
                     │             vendorRate  (override or inherit)
                     │
                     └── (N) PersonnelCV      ← v1.5: multi-version CV links
                               (label, url, isLatest, notes)
```

**Rate Resolution Chain (3-layer)**
```
billingRate = memberOverride ?? projectOverride ?? rateNorm.rateNorm
vendorRate  = assignmentOverride ?? personnel.vendorRateActual
```

## Rate Engine Formula

```typescript
// src/lib/rate-engine.ts — pure functions only, no DB calls
VendorTargetRate = (ProjectRate - ProjectRate × OverheadRate%) × MarketFactor%

// Config stored in SystemConfig table (key/value):
// OVERHEAD_RATE_PCT          default: 0.20
// MARKET_RATE_FACTOR_PCT     default: 0.80
// DRIFT_ALERT_THRESHOLD_PCT  default: 0.15

// Example: ProjectRate=$2000, Overhead=20%, MarketFactor=80%
// → VendorTargetRate = (2000 - 400) × 0.80 = $1,280
```

## Roles & Permissions

| Action | DU_LEADER | VENDOR_PIC |
|--------|-----------|------------|
| Edit Rate Norm + Global Config | ✅ | ❌ |
| View Rate Norm + Target Rate | ✅ | ✅ |
| View P&L / Margin % | ✅ | ⚠️ Configurable |
| Resolve Rate Drift Alerts | ✅ | ❌ |
| Flag Rate Drift Alerts | ✅ | ✅ |
| CRUD Vendor / Personnel / Project | ✅ | ✅ |

## File Structure Map

```
src/
├── actions/           ← [entity].actions.ts (Server Actions + Zod schemas)
│   └── cv.actions.ts      ← v1.5: PersonnelCV CRUD (schema NOT exported)
├── i18n/              ← Internationalization (custom, no external lib)
│   ├── index.tsx          ← I18nProvider, useTranslations() — CLIENT only
│   ├── server.ts          ← getTranslations() — SERVER only, no "use client"
│   ├── types.ts           ← Translations interface (type-safe keys)
│   └── locales/
│       ├── vi.ts          ← Tiếng Việt (default locale)
│       └── en.ts          ← English (fallback locale)
├── app/(dashboard)/   ← pages per module (Server Components)
│   ├── page.tsx           ← DU Dashboard
│   ├── vendors/
│   ├── projects/
│   ├── personnel/
│   ├── rates/
│   └── alerts/
├── components/features/   ← domain UI components
│   ├── vendor/
│   ├── personnel/
│   │   ├── PersonnelSheet.tsx      ← Create form (includes CV drafts)
│   │   └── PersonnelCVSection.tsx  ← v1.5: CV list + CRUD in detail page
│   ├── project/
│   │   └── ProjectPnLCard.tsx     ← v1.5: P&L on project detail
│   ├── rate/              ← RateSuggestionCard, RateMatrixGrid, RateDeltaBadge
│   └── dashboard/         ← SummaryCards, charts (Recharts), LanguageSwitcher
└── lib/
    ├── db.ts              ← Prisma client singleton
    ├── auth.ts            ← NextAuth config
    ├── rate-engine.ts     ← Pure functions: calculateVendorTargetRate, resolveRate
    └── utils.ts           ← cn(), formatUSD(), formatPct()
```

## Reference Files

| File | Mục đích |
|---|---|
| `PROJECT_MEMORY.md` | Status dự án, changelog, ADRs — đọc đầu mỗi session |
| `docs/PRD-Index.md` | **Đọc TRƯỚC** — overview nghiệp vụ, version history, module map |
| `docs/PRD-Module1-VendorHub.md` | Vendor/Personnel features & data model |
| `docs/PRD-Module2-ProjectTracker.md` | Project/Assignment/Dashboard features & data model |
| `docs/PRD-Module3-RateEngine.md` | Rate Norm, Config, Market, Calculator, Override, Alert |
| `docs/PRD-Common.md` | RBAC, Tech Notes, Personas, Assumptions |
| `docs/DEPENDENCY_MAP.md` | **Impact assessment** — entity-to-file map, cross-cutting deps |
| `references/schema.prisma` | Full Prisma schema (all entities, enums, relations) |
| `references/patterns.md` | Full code patterns (Server Action template, Rate Norm lookup, Form template) |

> 🤖 **Token tip**: Chỉ đọc module file khi task liên quan trực tiếp. Không cần đọc hết.
> 🔧 **Impact assessment**: Dùng `/impact-assessment` workflow trước khi code thay đổi cross-cutting.

## Prompt Templates

```
# New CRUD feature
Create [entity].actions.ts with Zod schema + CRUD Server Actions.
Follow pattern: references/patterns.md → "Server Action Template".
Then create src/app/(dashboard)/[route]/page.tsx as Server Component.

# New list page
Server Component page at src/app/(dashboard)/[route]/page.tsx.
Fetch via getAll[Entity](). Render shadcn DataTable.
DU_LEADER sees all columns. VENDOR_PIC sees [restricted columns].

# New form
[Entity]Form.tsx: react-hook-form + [Entity]Schema + shadcn Form.
On submit → call create/update[Entity] Server Action.
Show toast on success/error via sonner.

# Rate display on assignment
Show RateSuggestionCard: import calculateAssignmentRates from rate-engine.ts.
Load RateConfig from SystemConfig via getRateConfig().
Display: Billing Rate (source badge) | Vendor Rate | Vendor Target Rate.
Color: green=below target, yellow=≤15% above, red=>15% above.

# DU Dashboard widget
Server Component. Fetch assignments + getRateConfig().
Map through calculateAssignmentRates() per assignment.
Aggregate by project for revenue/cost/margin.
Render via Recharts BarChart or PieChart.
```
