# Solution Architecture: NTQ Vendor Management System
## Designed for: Vibe Coding · Low Cost · Fast Deploy · Modern Stack

**Architect**: Solution Architect Role
**Date**: 2026-03-17
**Target**: Internal tool — DU8, NTQ Solution (~2 users, ~15 projects, ~80 personnel)
**PRD Reference**: PRD-VendorManagement-Phase1.md v1.1

---

## 1. Architecture Decision Summary

### Guiding Principles
1. **One language end-to-end** → TypeScript everywhere, AI generates consistent code
2. **Minimal moving parts** → ít service = ít bug, ít cost, ít context window
3. **Convention over configuration** → AI quen pattern → ít prompt hơn
4. **Schema-first** → Prisma schema là single source of truth, AI đọc là hiểu ngay
5. **Server-side heavy** → Server Actions thay API Routes → giảm 50% boilerplate

### Stack Decision Matrix

| Criteria | Chosen | Why not alternative |
|----------|--------|---------------------|
| Full-stack framework | **Next.js 15 App Router** | Remix (ít AI training data hơn), SvelteKit (ít ecosystem) |
| Database ORM | **Prisma** | Drizzle (schema syntax lạ hơn với AI), TypeORM (verbose) |
| Database | **PostgreSQL / Supabase** | MySQL (ít feature hơn), SQLite (không scale) |
| UI Components | **shadcn/ui + Tailwind** | MUI (class conflict), Ant Design (quá nặng) |
| Auth | **NextAuth v5 (Auth.js)** | Clerk (paid), custom (tốn thời gian) |
| Validation | **Zod** | Yup (TypeScript support kém hơn) |
| Charts | **Recharts** | Chart.js (cần thêm wrapper), D3 (quá phức tạp) |
| Deployment | **Vercel** | AWS (overkill), Railway (fallback nếu cần server) |
| State/Cache | **TanStack Query** | Redux (quá phức tạp), Zustand (chỉ dùng nếu cần) |

### Cost Estimate

| Service | Free Tier | Paid (nếu cần) |
|---------|-----------|----------------|
| Vercel (hosting) | Free hobby | $20/tháng (pro) |
| Supabase (DB) | 500MB, 2GB bandwidth | $25/tháng |
| **Tổng** | **$0/tháng** | **~$45/tháng** |

> **Internal tool ~2-10 users** → Free tier là đủ dùng 12+ tháng.

---

## 2. Tech Stack (chi tiết)

```
Next.js 15          → Full-stack framework (App Router + Server Actions)
TypeScript 5        → Type safety, AI generates correct types
Prisma 5            → ORM, schema-first, type-safe queries
PostgreSQL          → Database (hosted on Supabase)
shadcn/ui           → Pre-built accessible components
Tailwind CSS 3      → Utility-first styling
NextAuth v5         → Authentication (credentials + optional SSO)
Zod                 → Schema validation (shared client/server)
TanStack Query v5   → Server state, caching, background refetch
Recharts            → Dashboard charts
date-fns            → Date utilities
Vercel              → Deployment, edge functions, preview URLs
```

---

## 3. Project Structure

```
vendor-management/
├── prisma/
│   ├── schema.prisma          ← SINGLE SOURCE OF TRUTH — đọc file này trước khi code
│   ├── seed.ts                ← Seed Rate Norm data, System Config defaults
│   └── migrations/
│
├── src/
│   ├── app/                   ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── (dashboard)/       ← Protected routes
│   │       ├── layout.tsx     ← Sidebar + auth guard
│   │       ├── page.tsx       ← DU Dashboard (/)
│   │       ├── vendors/
│   │       │   ├── page.tsx           ← Vendor Directory list
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx       ← Vendor Profile + Personnel tab
│   │       │   └── new/
│   │       │       └── page.tsx
│   │       ├── personnel/
│   │       │   ├── page.tsx           ← All Personnel pool (searchable)
│   │       │   └── [id]/
│   │       │       └── page.tsx       ← Personnel detail
│   │       ├── projects/
│   │       │   ├── page.tsx           ← Project list
│   │       │   ├── [id]/
│   │       │   │   ├── page.tsx       ← Project detail + assignments
│   │       │   │   └── rates/
│   │       │   │       └── page.tsx   ← Project Rate Override
│   │       │   └── new/
│   │       │       └── page.tsx
│   │       ├── pipeline/
│   │       │   └── page.tsx           ← Candidate Pipeline kanban
│   │       ├── rates/
│   │       │   ├── page.tsx           ← Rate Norm Matrix Grid
│   │       │   └── config/
│   │       │       └── page.tsx       ← Global Config (DU Leader only)
│   │       └── alerts/
│   │           └── page.tsx           ← Rate Drift Alert Inbox
│   │
│   ├── actions/               ← Server Actions (thay API routes)
│   │   ├── vendor.actions.ts
│   │   ├── personnel.actions.ts
│   │   ├── project.actions.ts
│   │   ├── assignment.actions.ts
│   │   ├── rate.actions.ts
│   │   └── alert.actions.ts
│   │
│   ├── components/
│   │   ├── ui/                ← shadcn/ui components (auto-generated)
│   │   └── features/          ← Domain-specific components
│   │       ├── vendor/
│   │       ├── personnel/
│   │       ├── project/
│   │       ├── assignment/
│   │       ├── rate/
│   │       │   ├── RateMatrixGrid.tsx
│   │       │   ├── RateSuggestionCard.tsx    ← Show 3 rates on assign
│   │       │   └── RateDeltaBadge.tsx        ← "+10% vs norm" badge
│   │       └── dashboard/
│   │           ├── SummaryCards.tsx
│   │           ├── RevenueByProject.tsx      ← Recharts bar
│   │           └── HeadcountByVendor.tsx     ← Recharts pie
│   │
│   ├── lib/
│   │   ├── db.ts              ← Prisma client singleton
│   │   ├── auth.ts            ← NextAuth config
│   │   ├── rate-engine.ts     ← Pure functions: calculateVendorTargetRate, resolveRate
│   │   ├── validations.ts     ← Zod schemas (shared)
│   │   └── utils.ts           ← cn(), formatCurrency(), formatPercent()
│   │
│   └── types/
│       └── index.ts           ← Shared TypeScript types
│
├── .env.local                 ← DATABASE_URL, NEXTAUTH_SECRET, etc.
├── components.json            ← shadcn/ui config
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 4. Prisma Schema (Complete — Copy vào prisma/schema.prisma)

```prisma
// prisma/schema.prisma
// NTQ Vendor Management System — Phase 1
// Last updated: 2026-03-17

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(VENDOR_PIC)
  password  String   // hashed with bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  createdVendors    Vendor[]
  createdPersonnel  Personnel[]
  createdProjects   Project[]
  rateAlerts        RateAlert[]
  rateNormEdits     RateNorm[]
  configEdits       SystemConfig[]
}

enum UserRole {
  DU_LEADER
  VENDOR_PIC
}

// ─── RATE TAXONOMY (Master lookup tables) ─────────────────────────────────────

model JobType {
  id        String      @id @default(cuid())
  name      String      @unique // "Developer", "Tester", "BA", "DevOps", "Designer", "PM"
  order     Int         @default(0)
  personnel Personnel[]
  rateNorms RateNorm[]
  projectRateOverrides ProjectRateOverride[]
  rateAlerts RateAlert[]
}

model TechStack {
  id        String      @id @default(cuid())
  name      String      @unique // "Java", "Golang", ".NET", "React", "Python", "Generic"
  order     Int         @default(0)
  personnel Personnel[]
  rateNorms RateNorm[]
  projectRateOverrides ProjectRateOverride[]
  rateAlerts RateAlert[]
}

model Level {
  id        String      @id @default(cuid())
  name      String      @unique // "Junior", "Middle", "Senior", "Leader", "Principal"
  order     Int         // for sorting: 1=Junior, 2=Middle, 3=Senior, 4=Leader, 5=Principal
  personnel Personnel[]
  rateNorms RateNorm[]
  projectRateOverrides ProjectRateOverride[]
  rateAlerts RateAlert[]
}

model Domain {
  id        String      @id @default(cuid())
  name      String      @unique // "Fintech", "Healthcare", "E-commerce", "General"
  order     Int         @default(0)
  personnel Personnel[]
  rateNorms RateNorm[]
  projectRateOverrides ProjectRateOverride[]
}

// ─── RATE ENGINE ──────────────────────────────────────────────────────────────

model RateNorm {
  id          String    @id @default(cuid())
  jobTypeId   String
  techStackId String
  levelId     String
  domainId    String
  market      Market    @default(ENGLISH)

  rateMin     Float     // USD/month
  rateNorm    Float     // USD/month — the standard/midpoint
  rateMax     Float     // USD/month

  effectiveDate DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdById   String

  // Relations
  jobType     JobType   @relation(fields: [jobTypeId], references: [id])
  techStack   TechStack @relation(fields: [techStackId], references: [id])
  level       Level     @relation(fields: [levelId], references: [id])
  domain      Domain    @relation(fields: [domainId], references: [id])
  createdBy   User      @relation(fields: [createdById], references: [id])

  @@unique([jobTypeId, techStackId, levelId, domainId, market])
  @@index([market])
}

model SystemConfig {
  id          String   @id @default(cuid())
  key         ConfigKey @unique
  value       String   // stored as string, parsed in rate-engine.ts
  updatedAt   DateTime @updatedAt
  updatedById String

  updatedBy   User     @relation(fields: [updatedById], references: [id])
}

enum ConfigKey {
  OVERHEAD_RATE_PCT          // e.g. "0.20"
  MARKET_RATE_FACTOR_PCT     // e.g. "0.80"
  DRIFT_ALERT_THRESHOLD_PCT  // e.g. "0.15"
}

model ProjectRateOverride {
  id          String    @id @default(cuid())
  projectId   String
  jobTypeId   String
  techStackId String
  levelId     String
  domainId    String

  customBillingRate Float
  setById     String
  setAt       DateTime  @default(now())

  // Relations
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  jobType     JobType   @relation(fields: [jobTypeId], references: [id])
  techStack   TechStack @relation(fields: [techStackId], references: [id])
  level       Level     @relation(fields: [levelId], references: [id])
  domain      Domain    @relation(fields: [domainId], references: [id])

  @@unique([projectId, jobTypeId, techStackId, levelId, domainId])
}

model RateAlert {
  id          String      @id @default(cuid())
  jobTypeId   String
  techStackId String
  levelId     String

  normRate          Float
  actualAvgVendorRate Float
  driftPct          Float

  triggeredById String
  triggeredAt   DateTime  @default(now())
  status        AlertStatus @default(PENDING)
  note          String?   // required when DISMISSED

  // Relations
  jobType     JobType   @relation(fields: [jobTypeId], references: [id])
  techStack   TechStack @relation(fields: [techStackId], references: [id])
  level       Level     @relation(fields: [levelId], references: [id])
  triggeredBy User      @relation(fields: [triggeredById], references: [id])
}

enum AlertStatus {
  PENDING
  FLAGGED_FOR_DU_LEADER
  RESOLVED
  DISMISSED
}

// ─── CORE ENTITIES ────────────────────────────────────────────────────────────

model Vendor {
  id              String    @id @default(cuid())
  name            String
  contactName     String
  contactEmail    String
  contactPhone    String?
  companySize     Int?      // approximate headcount
  market          Market    @default(ENGLISH)
  languageStrength String[] // ["Vietnamese", "English", "Japanese"]
  status          VendorStatus @default(ACTIVE)
  startDate       DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String

  // Relations
  createdBy       User      @relation(fields: [createdById], references: [id])
  personnel       Personnel[]
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  ON_HOLD
}

enum Market {
  ENGLISH
  JAPAN
  KOREA
  OTHER
}

model Personnel {
  id              String    @id @default(cuid())
  vendorId        String
  fullName        String
  jobTypeId       String
  techStackId     String
  levelId         String
  domainId        String
  englishLevel    EnglishLevel @default(INTERMEDIATE)
  leadership      Boolean   @default(false)
  leadershipNote  String?
  vendorRateActual Float?   // USD/month — actual rate vendor charges
  status          PersonnelStatus @default(AVAILABLE)
  interviewStatus InterviewStatus @default(NEW)
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String

  // Relations
  vendor          Vendor    @relation(fields: [vendorId], references: [id])
  jobType         JobType   @relation(fields: [jobTypeId], references: [id])
  techStack       TechStack @relation(fields: [techStackId], references: [id])
  level           Level     @relation(fields: [levelId], references: [id])
  domain          Domain    @relation(fields: [domainId], references: [id])
  createdBy       User      @relation(fields: [createdById], references: [id])
  assignments     Assignment[]
}

enum EnglishLevel {
  BASIC
  INTERMEDIATE
  ADVANCED
  FLUENT
}

enum PersonnelStatus {
  AVAILABLE
  ON_PROJECT
  ENDED
}

enum InterviewStatus {
  NEW
  SCREENING
  TECHNICAL_TEST
  INTERVIEW
  PASSED
  FAILED
}

model Project {
  id          String    @id @default(cuid())
  name        String
  market      Market    @default(ENGLISH)
  clientName  String
  startDate   DateTime
  endDate     DateTime?
  status      ProjectStatus @default(ACTIVE)
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdById String

  // Relations
  createdBy   User      @relation(fields: [createdById], references: [id])
  assignments Assignment[]
  rateOverrides ProjectRateOverride[]
}

enum ProjectStatus {
  ACTIVE
  ON_HOLD
  ENDED
}

model Assignment {
  id              String    @id @default(cuid())
  personnelId     String
  projectId       String
  roleInProject   String?

  // Rate fields — nullable = inherit from resolution chain
  billingRateOverride Float?    // if set, overrides project/norm rate
  billingRateNote     String?   // reason for override
  vendorRateOverride  Float?    // if set, overrides personnel.vendorRateActual

  startDate       DateTime
  endDate         DateTime?
  status          AssignmentStatus @default(ACTIVE)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  personnel       Personnel @relation(fields: [personnelId], references: [id])
  project         Project   @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([personnelId])
}

enum AssignmentStatus {
  ACTIVE
  ENDED
}
```

---

## 5. Rate Engine (src/lib/rate-engine.ts)

```typescript
// src/lib/rate-engine.ts
// Pure functions — no DB calls, fully testable, token-efficient

export interface RateConfig {
  overheadRatePct: number      // e.g. 0.20
  marketRateFactorPct: number  // e.g. 0.80
  driftAlertThresholdPct: number // e.g. 0.15
}

export interface RateResolutionInput {
  personnelVendorRate: number | null
  normRate: number | null
  projectOverrideRate: number | null
  memberBillingOverride: number | null
}

export interface RateResult {
  billingRate: number
  vendorRate: number
  vendorTargetRate: number
  grossMargin: number
  grossMarginPct: number
  billingRateSource: 'member_override' | 'project_override' | 'norm' | 'manual'
  deltaVsNorm: number | null       // % difference from norm
  isAboveTarget: boolean
}

/**
 * Core formula:
 * VendorTargetRate = (billingRate - billingRate × overheadPct) × marketFactor
 */
export function calculateVendorTargetRate(
  billingRate: number,
  config: RateConfig
): number {
  const afterOverhead = billingRate - billingRate * config.overheadRatePct
  return afterOverhead * config.marketRateFactorPct
}

/**
 * Resolve final billing rate via 3-layer inheritance chain:
 * memberOverride → projectOverride → normRate
 */
export function resolveBillingRate(input: RateResolutionInput): {
  rate: number
  source: RateResult['billingRateSource']
} {
  if (input.memberBillingOverride !== null) {
    return { rate: input.memberBillingOverride, source: 'member_override' }
  }
  if (input.projectOverrideRate !== null) {
    return { rate: input.projectOverrideRate, source: 'project_override' }
  }
  if (input.normRate !== null) {
    return { rate: input.normRate, source: 'norm' }
  }
  return { rate: 0, source: 'manual' }
}

/**
 * Full rate calculation for an assignment
 */
export function calculateAssignmentRates(
  input: RateResolutionInput,
  config: RateConfig
): RateResult {
  const { rate: billingRate, source } = resolveBillingRate(input)
  const vendorRate = input.vendorRateOverride ?? input.personnelVendorRate ?? 0
  const vendorTargetRate = calculateVendorTargetRate(billingRate, config)
  const grossMargin = billingRate - vendorRate
  const grossMarginPct = billingRate > 0 ? grossMargin / billingRate : 0
  const deltaVsNorm = input.normRate
    ? (billingRate - input.normRate) / input.normRate
    : null
  const isAboveTarget = vendorRate > vendorTargetRate * (1 + config.driftAlertThresholdPct)

  return {
    billingRate,
    vendorRate,
    vendorTargetRate,
    grossMargin,
    grossMarginPct,
    billingRateSource: source,
    deltaVsNorm,
    isAboveTarget,
  }
}

/**
 * Check if vendor rate triggers a drift alert
 */
export function isDriftAlert(
  actualVendorRate: number,
  targetVendorRate: number,
  thresholdPct: number
): boolean {
  if (targetVendorRate === 0) return false
  const drift = Math.abs(actualVendorRate - targetVendorRate) / targetVendorRate
  return drift > thresholdPct
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
```

---

## 6. Server Actions Pattern (ví dụ — src/actions/vendor.actions.ts)

```typescript
// src/actions/vendor.actions.ts
'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Zod schema — dùng cho cả client validation và server validation
export const VendorSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  companySize: z.number().int().positive().optional(),
  market: z.enum(['ENGLISH', 'JAPAN', 'KOREA', 'OTHER']).default('ENGLISH'),
  languageStrength: z.array(z.string()).default([]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD']).default('ACTIVE'),
  startDate: z.date().optional(),
  notes: z.string().optional(),
})

export async function createVendor(data: z.infer<typeof VendorSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const vendor = await db.vendor.create({
    data: { ...data, createdById: session.user.id },
  })

  revalidatePath('/vendors')
  return { success: true, vendor }
}

export async function updateVendor(id: string, data: z.infer<typeof VendorSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const vendor = await db.vendor.update({ where: { id }, data })
  revalidatePath('/vendors')
  revalidatePath(`/vendors/${id}`)
  return { success: true, vendor }
}

export async function getVendors(filter?: { market?: string; status?: string }) {
  return db.vendor.findMany({
    where: {
      ...(filter?.market && { market: filter.market as any }),
      ...(filter?.status && { status: filter.status as any }),
    },
    include: {
      personnel: { select: { id: true, status: true } },
    },
    orderBy: { name: 'asc' },
  })
}
```

---

## 7. Key UI Components (Vibe Coding Prompts)

Dùng những prompts này khi vibe coding để AI generate đúng ngay lần đầu:

### RateSuggestionCard
```
Prompt: "Create a React component RateSuggestionCard using shadcn/ui Card.
Show 3 rows: 'Billing Rate (from {source})', 'Vendor Rate (actual)', 'Vendor Target Rate (calculated)'.
Each row has a label, value in USD, and a colored badge.
Badge colors: green=below target, yellow=within 15% above, red=>15% above.
Props: billingRate, vendorRate, vendorTargetRate, billingRateSource, deltaVsNorm."
```

### RateMatrixGrid
```
Prompt: "Create a RateMatrixGrid component.
Rows = Job+Level combinations. Columns = TechStack names.
Each cell shows rate_norm as currency, click to open inline edit popover.
Cell background: green if updated <30 days, yellow if 30-90 days, red if >90 days (stale).
Empty cells show '-' with lighter background.
Use shadcn Table component."
```

### DU Dashboard
```
Prompt: "Create a DU Dashboard page with:
1. 4 SummaryCards in a grid: Total Headcount, Monthly Revenue, Monthly Cost, Avg Margin%
2. RevenueByProject: Recharts BarChart, top 10 projects, horizontal bars
3. HeadcountByVendor: Recharts PieChart with legend
4. ProjectsTable: sortable by margin%, columns: name, client, headcount, revenue, cost, margin%
5. AlertsBadge in header: red badge with count of PENDING+FLAGGED alerts
All data fetched via Server Component (no useEffect)."
```

---

## 8. Database Queries (Vibe Coding Reference)

### DU Dashboard aggregation
```typescript
// Lấy tất cả assignments active để tính P&L
const activeAssignments = await db.assignment.findMany({
  where: { status: 'ACTIVE' },
  include: {
    personnel: {
      include: { jobType: true, techStack: true, level: true, domain: true }
    },
    project: true,
  },
})
// Sau đó map qua calculateAssignmentRates() với config từ SystemConfig
```

### Rate Norm lookup với fallback
```typescript
async function lookupRateNorm(
  jobTypeId: string,
  techStackId: string,
  levelId: string,
  domainId: string,
  market: string
) {
  // Exact match first
  let norm = await db.rateNorm.findFirst({
    where: { jobTypeId, techStackId, levelId, domainId, market: market as any }
  })
  // Fallback to General domain
  if (!norm) {
    const generalDomain = await db.domain.findFirst({ where: { name: 'General' } })
    if (generalDomain) {
      norm = await db.rateNorm.findFirst({
        where: { jobTypeId, techStackId, levelId, domainId: generalDomain.id, market: market as any }
      })
    }
  }
  // Fallback to Generic tech stack
  if (!norm) {
    const genericStack = await db.techStack.findFirst({ where: { name: 'Generic' } })
    if (genericStack) {
      norm = await db.rateNorm.findFirst({
        where: { jobTypeId, techStackId: genericStack.id, levelId, domainId, market: market as any }
      })
    }
  }
  return norm
}
```

---

## 9. Environment Variables (.env.local)

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generate: openssl rand -base64 32]"

# App
NEXT_PUBLIC_APP_NAME="NTQ Vendor Management"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 10. Setup & Deploy (Step-by-step)

### Local Development
```bash
# 1. Clone và install
git clone [repo]
cd vendor-management
npm install

# 2. Setup DB
npx prisma generate
npx prisma db push
npx prisma db seed    # seed Rate Norm + System Config defaults + admin user

# 3. Run
npm run dev           # http://localhost:3000
```

### Supabase Setup (5 phút)
```
1. Tạo project tại supabase.com
2. Vào Settings → Database → Connection string → copy vào DATABASE_URL
3. npx prisma db push → tables tự tạo
4. Xong
```

### Vercel Deploy (3 phút)
```
1. Push code lên GitHub
2. Vào vercel.com → New Project → Import GitHub repo
3. Add Environment Variables (copy từ .env.local)
4. Deploy → tự động
5. Preview URL ngay lập tức
```

---

## 11. Seed Data (prisma/seed.ts)

```typescript
// prisma/seed.ts — chạy một lần khi setup

const JOB_TYPES = ['Developer', 'Tester', 'BA', 'DevOps', 'Designer', 'PM', 'QA']
const TECH_STACKS = ['Java', 'Golang', '.NET', 'React', 'Python', 'Node.js', 'Generic']
const LEVELS = [
  { name: 'Junior', order: 1 },
  { name: 'Middle', order: 2 },
  { name: 'Senior', order: 3 },
  { name: 'Leader', order: 4 },
  { name: 'Principal', order: 5 },
]
const DOMAINS = ['Fintech', 'Healthcare', 'E-commerce', 'General']

// System Config defaults
const SYSTEM_CONFIGS = [
  { key: 'OVERHEAD_RATE_PCT', value: '0.20' },
  { key: 'MARKET_RATE_FACTOR_PCT', value: '0.80' },
  { key: 'DRIFT_ALERT_THRESHOLD_PCT', value: '0.15' },
]

// Seed function runs all of the above + creates default DU Leader user
```

---

## 12. Naming Conventions (quan trọng cho AI consistency)

```
Files:          PascalCase cho components (VendorCard.tsx)
                camelCase cho utils (rateEngine.ts)
                kebab-case cho routes (rate-config/)

Server Actions: [entity].actions.ts
                Verb + Entity: createVendor, updatePersonnel, deleteAssignment

DB queries:     Always include trong Server Components hoặc Server Actions
                KHÔNG fetch từ Client Components (trừ khi cần real-time)

Zod schemas:    [Entity]Schema — export từ actions file
                Dùng cho cả form validation và server validation

Component props: Luôn dùng interface, không dùng type
                 VendorCardProps, RateSuggestionCardProps

CSS classes:    Tailwind utility-first
                Dùng cn() từ lib/utils.ts để merge classes
```

---

## 13. Vibe Coding Tips (Token-Efficient Prompts)

### Context block — paste vào đầu mỗi session AI
```
Project: NTQ Vendor Management System (internal tool)
Stack: Next.js 15 App Router, TypeScript, Prisma, PostgreSQL, shadcn/ui, Tailwind
Users: DU Leader (admin) + Vendor PIC (operator)
Key file: prisma/schema.prisma (source of truth)
Key lib: src/lib/rate-engine.ts (pure functions, no DB)
Pattern: Server Components + Server Actions (no API routes)
Style: shadcn/ui components + Tailwind cn()
```

### Prompt templates
```
// Tạo CRUD mới:
"Using the [Entity] model from prisma/schema.prisma,
create Server Actions in src/actions/[entity].actions.ts
with create, update, delete, getAll, getById.
Follow the same pattern as vendor.actions.ts."

// Tạo page mới:
"Create a Next.js Server Component page at src/app/(dashboard)/[path]/page.tsx.
Fetch data using Server Actions. Use shadcn/ui DataTable with columns: [list columns].
Add search filter for [field]. DU Leader sees all columns, Vendor PIC sees [restricted columns]."

// Tạo form mới:
"Create a form component using react-hook-form + Zod schema [EntitySchema] from [entity].actions.ts.
Use shadcn/ui Form, Input, Select components.
On submit, call [createEntity] Server Action. Show toast on success/error."
```

---

## 14. Security Checklist

- [ ] `NEXTAUTH_SECRET` mạnh (≥32 chars)
- [ ] Supabase Row Level Security OFF (internal tool, dùng app-level auth)
- [ ] Rate và P&L columns: check `session.user.role === 'DU_LEADER'` trước khi expose
- [ ] Server Actions: validate session ở đầu mỗi action
- [ ] `DATABASE_URL` không commit vào git (đã trong .gitignore)
- [ ] Vercel: set environment variables qua dashboard, không hardcode

---

## 15. Phase 2 Extensions (thiết kế sẵn, không code vội)

```
Phase 2 additions (không cần thay đổi core schema):
  + FollowupTask table (personnelId, type: W1/W3/W4/W8, dueDate, completedAt)
  + Contract table (assignmentId, startDate, endDate, renewalAlertDate)
  + Scheduled job: Cron via Vercel Cron Jobs (free) — rate drift scan daily
  + Email notification: Resend.com (free 3000/month) — alert emails

Phase 3 additions:
  + VendorScore table (vendorId, period, criteria scores)
  + Analytics views (PostgreSQL materialized views for heavy aggregation)
  + CV parsing: OpenAI API — parse CV text → auto-fill Personnel fields
```

---

*ARCHITECTURE v1.0 — 2026-03-17 | NTQ Vendor Management System — Phase 1*
*Stack: Next.js 15 · Prisma · Supabase · shadcn/ui · Vercel | Cost: $0–$45/month*
