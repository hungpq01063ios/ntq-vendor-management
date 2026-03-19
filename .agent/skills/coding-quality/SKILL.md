---
name: Coding Quality
description: >
  Coding quality standards for the NTQ Vendor Management project. Covers:
  ActionResult pattern, error handling, TypeScript strict rules, security helpers,
  and quality checklist per layer. Load this skill TOGETHER with ntq-vendor-dev
  for any coding task.
---

# Coding Quality — NTQ Vendor Management

## Purpose

This skill defines **quality gates** that apply to ALL code in this project.
`ntq-vendor-dev` tells you WHAT to build. This skill tells you HOW to build it safely.

> ⚠️ Load `ntq-vendor-dev` first for domain context, then apply these rules on top.

---

## 1. ActionResult Pattern

**Every Server Action mutation** must return a typed result. Never throw raw errors to the client.

```typescript
// src/types/index.ts — add this once
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

**Server Action pattern:**
```typescript
'use server'

export async function createVendor(data: VendorInput): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth()
    const validated = VendorSchema.parse(data)
    const vendor = await db.vendor.create({
      data: { ...validated, createdById: session.user.id },
    })
    revalidatePath('/vendors')
    return { success: true, data: { id: vendor.id } }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
```

**Client-side consumption:**
```typescript
const result = await createVendor(values)
if (result.success) {
  toast.success('Vendor created')
  onSuccess?.()
} else {
  toast.error(result.error)
}
```

---

## 2. Error Handling Convention

### `getErrorMessage` helper

```typescript
// src/lib/utils.ts — add this
export function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ')
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
```

### Rules
- ✅ **Every mutation action**: wrap body in `try/catch`, return `ActionResult`
- ✅ **Read-only actions** (getAll, getById): can throw — let error.tsx catch them
- ❌ **Never** throw `new Error('Unauthorized')` to client — return `{ success: false, error: '...' }`
- ❌ **Never** expose raw Prisma errors — always map to user-friendly messages

---

## 3. Auth & Security Helpers

### `requireAuth` helper (use instead of inline checks)

```typescript
// src/lib/auth-helpers.ts — create this file
import { auth } from '@/lib/auth'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(role: 'DU_LEADER' | 'VENDOR_PIC') {
  const session = await requireAuth()
  const userRole = (session.user as { role?: string }).role
  if (userRole !== role) {
    throw new Error('Forbidden')
  }
  return session
}
```

### Usage in Server Actions
```typescript
// ✅ Clean
const session = await requireAuth()          // any logged-in user
const session = await requireRole('DU_LEADER') // DU Leader only

// ❌ Avoid — repetitive inline code
const session = await auth()
if (!session?.user?.id) throw new Error('Unauthorized')
const role = (session.user as { role?: string }).role
if (role !== 'DU_LEADER') throw new Error('Forbidden')
```

---

## 4. TypeScript Strict Rules

### ❌ BANNED patterns

| Pattern | Why it's bad | Fix |
|---|---|---|
| `as never` | Hides type errors | Use proper Prisma enum import |
| `as any` | Bypasses all type safety | Cast to specific type or fix the source |
| `declare module` workaround | Indicates missing interface field | Add the field to the interface properly |
| `(session.user as { role?: string })` | Fragile, breaks if auth shape changes | Use typed session from NextAuth config |
| `// @ts-ignore` | Silences ALL errors on the line | Fix the root cause |

### ✅ Prisma Enum Handling

```typescript
// ❌ Bad — casting hides errors
filter.market as never
filter.status as any

// ✅ Good — import and use Prisma enums properly
import { Market, VendorStatus } from '@prisma/client'

// In where clauses, use typed variables:
where: {
  ...(filter?.market && { market: filter.market as Market }),
  ...(filter?.status && { status: filter.status as VendorStatus }),
}

// Or better — validate with Zod before querying:
const validated = z.enum(['ENGLISH', 'JAPAN', 'KOREA', 'OTHER']).safeParse(filter.market)
if (validated.success) {
  where.market = validated.data
}
```

### ✅ Interface Completeness

```typescript
// ❌ Bad — field missing then hacked via declare module
export interface RateResolutionInput {
  personnelVendorRate: number | null
  normRate: number | null
  projectOverrideRate: number | null
  memberBillingOverride: number | null
}
// Then later: declare module "./rate-engine" { ... }  ← HACK

// ✅ Good — define all fields upfront
export interface RateResolutionInput {
  personnelVendorRate: number | null
  normRate: number | null
  projectOverrideRate: number | null
  memberBillingOverride: number | null
  vendorRateOverride?: number | null  // ← added properly
}
```

---

## 5. Testing Guidelines

### Setup (one-time)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### What to test (priority order)
1. **Rate Engine** (pure functions) — highest value, easiest to test
2. **Zod schemas** — validate edge cases
3. **Server Actions** — mock `db` and `auth`, test logic flow

### Rate Engine test example
```typescript
// src/lib/__tests__/rate-engine.test.ts
import { describe, it, expect } from 'vitest'
import { calculateVendorTargetRate, calculateAssignmentRates, isDriftAlert } from '../rate-engine'

const defaultConfig = {
  overheadRatePct: 0.20,
  marketRateFactorPct: 0.80,
  driftAlertThresholdPct: 0.15,
}

describe('calculateVendorTargetRate', () => {
  it('correctly applies overhead and market factor', () => {
    // $2000 - 20% overhead = $1600, × 80% = $1280
    expect(calculateVendorTargetRate(2000, defaultConfig)).toBe(1280)
  })

  it('returns 0 for 0 billing rate', () => {
    expect(calculateVendorTargetRate(0, defaultConfig)).toBe(0)
  })
})

describe('calculateAssignmentRates', () => {
  it('resolves member override first', () => {
    const result = calculateAssignmentRates({
      memberBillingOverride: 2500,
      projectOverrideRate: 2200,
      normRate: 2000,
      personnelVendorRate: 1200,
      vendorRateOverride: null,
    }, defaultConfig)
    expect(result.billingRate).toBe(2500)
    expect(result.billingRateSource).toBe('member_override')
  })

  it('falls back to project override', () => {
    const result = calculateAssignmentRates({
      memberBillingOverride: null,
      projectOverrideRate: 2200,
      normRate: 2000,
      personnelVendorRate: 1200,
      vendorRateOverride: null,
    }, defaultConfig)
    expect(result.billingRate).toBe(2200)
    expect(result.billingRateSource).toBe('project_override')
  })

  it('calculates correct margin', () => {
    const result = calculateAssignmentRates({
      memberBillingOverride: null,
      projectOverrideRate: null,
      normRate: 2000,
      personnelVendorRate: 1200,
      vendorRateOverride: null,
    }, defaultConfig)
    expect(result.grossMargin).toBe(800)
    expect(result.grossMarginPct).toBe(0.4) // 40%
  })
})

describe('isDriftAlert', () => {
  it('triggers when drift exceeds threshold', () => {
    expect(isDriftAlert(1500, 1280, 0.15)).toBe(true) // 17.2% > 15%
  })
  it('does not trigger when within threshold', () => {
    expect(isDriftAlert(1400, 1280, 0.15)).toBe(false) // 9.4% < 15%
  })
})
```

### Test config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

---

## 6. Quality Checklist Per Layer

### Database Layer (Prisma)
- [ ] All IDs use `@id @default(cuid())`
- [ ] All entities have `createdAt DateTime @default(now())`
- [ ] All entities have `updatedAt DateTime @updatedAt`
- [ ] `@@unique` and `@@index` defined for query patterns
- [ ] Enum values are UPPER_CASE
- [ ] Soft delete via status field — never `db.[entity].delete()`

### Server Actions Layer
- [ ] `'use server'` directive at top of file
- [ ] Auth check via `requireAuth()` or `requireRole()`
- [ ] Input validated with Zod `.parse()`
- [ ] Returns `ActionResult<T>` for mutations
- [ ] `revalidatePath()` after every mutation
- [ ] No raw Prisma errors exposed to client
- [ ] No `as never`, `as any`, or `// @ts-ignore`

### Page Layer (Server Components)
- [ ] No `'use client'` — page must be a Server Component
- [ ] Data fetched via Server Actions or direct Prisma calls
- [ ] No `useEffect`, `useState`, `useCallback` in page files
- [ ] `isDULeader` prop passed to child components for RBAC
- [ ] `loading.tsx` sibling file created
- [ ] Suspense boundaries around heavy data fetches

### UI Component Layer (Client Components)
- [ ] `'use client'` directive where needed
- [ ] `react-hook-form` + `zodResolver` for forms
- [ ] `toast.success()` on action success
- [ ] `toast.error(result.error)` on action failure (reads from ActionResult)
- [ ] Loading state (`isSubmitting`) on buttons
- [ ] Empty state shown when no data
- [ ] shadcn/ui components used for consistency

### Rate Engine Layer
- [ ] Pure functions only — NO database imports, NO `auth()` calls
- [ ] All exported functions have explicit return types
- [ ] Edge cases handled: division by zero, null rates, empty configs
- [ ] Interface fields are complete — NO `declare module` hacks

---

## Quick Fix Map (Common Issues)

| Error / Smell | Root Cause | Fix |
|---|---|---|
| `as never` in Prisma query | Enum type mismatch | Import enum from `@prisma/client` |
| `declare module` in rate-engine | Missing interface field | Add field to interface |
| `session.user as { role? }` | Untyped session | Use `requireRole()` helper |
| Action throws to client | Missing try/catch | Wrap in try/catch + ActionResult |
| `toast.error('Failed')` generic | Not reading error from server | Use `result.error` from ActionResult |
| Stale data after mutation | Missing revalidatePath | Add `revalidatePath()` calls |
| `'use server' file can only export async functions` | Exporting non-function (Zod schema, constant) from `'use server'` file | Use `const` (not `export`), define schema locally in component, or `export type` only |

