// turbo-all
// Workflow: ntq-feature
// Project: NTQ Vendor Management System
// Stack: Next.js 15 App Router · Server Actions · Prisma · PostgreSQL
// Use this workflow for ANY new feature in this project.
// ⚠️ Do NOT use new-feature.md for this project — it assumes NestJS/REST patterns.

---

# NTQ Feature Workflow

## Step 0 — Load Context

Read skills (always load both):
1. `ntq-vendor-dev` — domain patterns
2. `coding-quality` — quality gates (ActionResult, auth helpers, TypeScript rules)

If the task involves Rate Engine logic or complex queries, also read:
- `ntq-vendor-dev/references/patterns.md`

If the task involves schema changes or you need to understand relationships, also read:
- `ntq-vendor-dev/references/schema.prisma`

---

## Step 1 — Understand the Feature

Answer these before writing any code:

1. **What entity is involved?** (Vendor / Personnel / Project / Assignment / RateNorm / RateAlert)
2. **What layer is affected?** (DB only / Server Action only / Page + UI / full stack)
3. **Who can perform this action?** (DU_LEADER only / both roles / configurable)
4. **Does this involve rate calculation?** → Yes → use `calculateAssignmentRates` from `rate-engine.ts`
5. **Does this involve a Rate Drift check?** → Yes → check `isAboveTarget` flag in RateResult

---

## Step 2 — Plan (always write this out)

```
Files to CREATE:
- src/actions/[entity].actions.ts
- src/app/(dashboard)/[route]/page.tsx
- src/components/features/[domain]/[Component].tsx

Files to MODIFY:
- prisma/schema.prisma  (if new table/column)
- src/app/(dashboard)/page.tsx  (if new dashboard widget)

Dependency order:
  1. DB (Prisma schema + push)
  2. Server Actions (Zod schema + CRUD functions)
  3. Page (Server Component — fetch + pass data)
  4. UI Components (Client Components — forms, tables, interactivity)
  5. Verify (typecheck + browser test)
```

---

## Step 3 — Implementation Order

### 3A. Database (if schema change needed)

```
→ Edit prisma/schema.prisma
→ Add new model or field
→ Run: npx prisma db push
→ Run: npx prisma generate
→ Update seed if needed: prisma/seed.ts
```

Rules:
- Use `cuid()` for all IDs
- All entities need `createdAt`, `updatedAt`
- Use soft delete only: `status = INACTIVE`, never `db.[entity].delete()`
- Enum values in UPPER_CASE

---

### 3B. Server Actions

File: `src/actions/[entity].actions.ts`

```typescript
'use server'

import { db } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types'
import { getErrorMessage } from '@/lib/utils'

// 1. Zod schema (export — forms will import this)
export const [Entity]Schema = z.object({ ... })
export type [Entity]Input = z.infer<typeof [Entity]Schema>

// 2. Mutation pattern — ActionResult + try/catch
export async function create[Entity](data: [Entity]Input): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth()      // any user
    // const session = await requireRole('DU_LEADER')  // DU Leader only
    const validated = [Entity]Schema.parse(data)
    const entity = await db.[entity].create({
      data: { ...validated, createdById: session.user.id },
    })
    revalidatePath('/[route]')
    return { success: true, data: { id: entity.id } }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// 3. Read-only actions — can throw (error.tsx catches)
export async function get[Entity]s() {
  return db.[entity].findMany({ ... })
}
```

---

### 3C. Page (Server Component)

File: `src/app/(dashboard)/[route]/page.tsx`

```typescript
// ✅ Server Component — fetch data here
import { get[Entity]s } from '@/actions/[entity].actions'
import { auth } from '@/lib/auth'

export default async function [Entity]Page() {
  const [data, session] = await Promise.all([
    get[Entity]s(),
    auth(),
  ])
  const isDULeader = session?.user.role === 'DU_LEADER'

  return <[Entity]Table data={data} isDULeader={isDULeader} />
}
```

Rules:
- No `useEffect`, no `useState` in pages
- Pass `isDULeader` as prop to control column visibility
- Add `loading.tsx` and `error.tsx` siblings

---

### 3D. UI Components (Client Components)

Location: `src/components/features/[domain]/`

```typescript
'use client'
// Only use for: forms, interactive tables, modals, dropdowns
// Receive data as props from Server Component page
```

Component naming:
- `[Entity]Table.tsx` — shadcn DataTable with TanStack Table
- `[Entity]Form.tsx` — react-hook-form + Zod + shadcn Form
- `[Entity]Sheet.tsx` — side panel (shadcn Sheet) for create/edit
- `[Entity]DeleteDialog.tsx` — confirmation dialog (shadcn AlertDialog)

Form pattern:
```typescript
const form = useForm<FormValues>({
  resolver: zodResolver([Entity]Schema),
  defaultValues: { ... },
})

async function onSubmit(values: FormValues) {
  const result = await create[Entity](values)   // ActionResult
  if (result.success) {
    toast.success('[Entity] created')
    onSuccess?.()
  } else {
    toast.error(result.error)   // show actual error from server
  }
}
```

---

### 3E. Rate Display (if feature involves assignment rates)

```typescript
// In Server Component — load config + calculate
import { calculateAssignmentRates, getRateConfig, lookupRateNorm } from '@/lib/rate-engine'

const config = await getRateConfig()
const norm = await lookupRateNorm(jobTypeId, techStackId, levelId, domainId, market)
const rates = calculateAssignmentRates({
  memberBillingOverride: assignment.billingRateOverride,
  projectOverrideRate: null,
  normRate: norm?.rateNorm ?? null,
  personnelVendorRate: personnel.vendorRateActual,
  vendorRateOverride: assignment.vendorRateOverride,
}, config)

// Pass rates to RateSuggestionCard:
// rates.billingRate         → display with billingRateSource badge
// rates.vendorRate          → actual vendor cost
// rates.vendorTargetRate    → formula result
// rates.isAboveTarget       → true = show drift warning
// rates.grossMarginPct      → show only to DU_LEADER
```

Rate badge colors:
- `green`  → `vendorRate < vendorTargetRate`
- `yellow` → `vendorRate` within 15% above target
- `red`    → `vendorRate > vendorTargetRate × 1.15`

---

## Step 4 — Checklist Before Done

```
□ No TypeScript errors (npm run typecheck)
□ All mutations return ActionResult<T> with try/catch
□ Auth via requireAuth() or requireRole() — not inline
□ No 'as never', 'as any', 'declare module' hacks
□ revalidatePath called after every mutation
□ Soft delete used (status = INACTIVE), not hard delete
□ Loading / error / empty states handled in UI
□ Toast shows result.error from ActionResult — not generic string
□ Rate Engine functions remain pure (no DB calls in rate-engine.ts)
□ DU_LEADER-only columns/fields hidden from VENDOR_PIC
□ Tests added if Rate Engine or Zod schema changed
```

---

## Quick Cheat Sheet

| Task | Where |
|------|-------|
| Add a new DB table | `prisma/schema.prisma` → `db push` |
| CRUD logic | `src/actions/[entity].actions.ts` |
| Fetch + render page | `src/app/(dashboard)/[route]/page.tsx` |
| Form with validation | `src/components/features/[domain]/[Entity]Form.tsx` |
| Rate calculation | `src/lib/rate-engine.ts` → `calculateAssignmentRates()` |
| Rate Norm lookup | `lookupRateNorm()` in `rate-engine.ts` |
| Global rate config | `getRateConfig()` → reads SystemConfig table |
| Auth check | `const session = await auth()` |
| Role guard | `if (session.user.role !== 'DU_LEADER') throw` |
| Invalidate cache | `revalidatePath('/route')` |
| Show toast | `import { toast } from 'sonner'` |
| Conditional column | `isDULeader && <MarginColumn />` |
