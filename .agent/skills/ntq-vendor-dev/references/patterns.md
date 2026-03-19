# Code Patterns Reference
# Load this file when you need full implementation examples.

## Table of Contents
1. Server Action Template (full)
2. Rate Norm Lookup with Fallback
3. DU Dashboard Aggregation Query
4. Rate Engine Functions (complete)
5. Auth + Role Guard patterns
6. Form Component Template

---

## 1. Server Action Template (full)

```typescript
// src/actions/vendor.actions.ts
'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const VendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
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

export type VendorInput = z.infer<typeof VendorSchema>

export async function createVendor(data: VendorInput) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const vendor = await db.vendor.create({
    data: { ...data, createdById: session.user.id },
  })

  revalidatePath('/vendors')
  return { success: true, vendor }
}

export async function updateVendor(id: string, data: VendorInput) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const vendor = await db.vendor.update({ where: { id }, data })

  revalidatePath('/vendors')
  revalidatePath(`/vendors/${id}`)
  return { success: true, vendor }
}

export async function deleteVendor(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (session.user.role !== 'DU_LEADER') throw new Error('Forbidden')

  await db.vendor.update({ where: { id }, data: { status: 'INACTIVE' } }) // soft delete
  revalidatePath('/vendors')
  return { success: true }
}

export async function getVendors(filter?: {
  market?: string
  status?: string
  search?: string
}) {
  return db.vendor.findMany({
    where: {
      ...(filter?.market && { market: filter.market as any }),
      ...(filter?.status && { status: filter.status as any }),
      ...(filter?.search && {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { contactName: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      personnel: { select: { id: true, status: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getVendorById(id: string) {
  return db.vendor.findUniqueOrThrow({
    where: { id },
    include: {
      personnel: {
        include: { jobType: true, techStack: true, level: true, domain: true },
        orderBy: { fullName: 'asc' },
      },
    },
  })
}
```

---

## 2. Rate Norm Lookup with Fallback

```typescript
// src/lib/rate-engine.ts — lookupRateNorm
// Fallback chain: exact → General domain → Generic tech stack

export async function lookupRateNorm(
  jobTypeId: string,
  techStackId: string,
  levelId: string,
  domainId: string,
  market: string
) {
  // 1. Exact match
  let norm = await db.rateNorm.findFirst({
    where: { jobTypeId, techStackId, levelId, domainId, market: market as any },
  })

  // 2. Fallback: General domain
  if (!norm) {
    const general = await db.domain.findFirst({ where: { name: 'General' } })
    if (general) {
      norm = await db.rateNorm.findFirst({
        where: { jobTypeId, techStackId, levelId, domainId: general.id, market: market as any },
      })
    }
  }

  // 3. Fallback: Generic tech stack
  if (!norm) {
    const generic = await db.techStack.findFirst({ where: { name: 'Generic' } })
    if (generic) {
      norm = await db.rateNorm.findFirst({
        where: { jobTypeId, techStackId: generic.id, levelId, domainId, market: market as any },
      })
    }
  }

  return norm
}

// Load SystemConfig into RateConfig object
export async function getRateConfig(): Promise<RateConfig> {
  const configs = await db.systemConfig.findMany()
  const map = Object.fromEntries(configs.map((c) => [c.key, parseFloat(c.value)]))
  return {
    overheadRatePct: map['OVERHEAD_RATE_PCT'] ?? 0.2,
    marketRateFactorPct: map['MARKET_RATE_FACTOR_PCT'] ?? 0.8,
    driftAlertThresholdPct: map['DRIFT_ALERT_THRESHOLD_PCT'] ?? 0.15,
  }
}
```

---

## 3. DU Dashboard Aggregation Query

```typescript
// src/app/(dashboard)/page.tsx — Server Component
import { db } from '@/lib/db'
import { getRateConfig, calculateAssignmentRates, lookupRateNorm } from '@/lib/rate-engine'

export default async function DashboardPage() {
  const [assignments, config, alertCount] = await Promise.all([
    db.assignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        personnel: {
          include: { jobType: true, techStack: true, level: true, domain: true, vendor: true },
        },
        project: true,
      },
    }),
    getRateConfig(),
    db.rateAlert.count({ where: { status: { in: ['PENDING', 'FLAGGED_FOR_DU_LEADER'] } } }),
  ])

  // Aggregate per project
  const projectMap = new Map<string, { name: string; revenue: number; cost: number; headcount: number }>()

  for (const a of assignments) {
    const norm = await lookupRateNorm(
      a.personnel.jobTypeId,
      a.personnel.techStackId,
      a.personnel.levelId,
      a.personnel.domainId,
      a.project.market
    )

    const rates = calculateAssignmentRates({
      memberBillingOverride: a.billingRateOverride,
      projectOverrideRate: null, // fetch project override separately if needed
      normRate: norm?.rateNorm ?? null,
      personnelVendorRate: a.personnel.vendorRateActual,
      vendorRateOverride: a.vendorRateOverride,
    }, config)

    const existing = projectMap.get(a.projectId) ?? {
      name: a.project.name,
      revenue: 0, cost: 0, headcount: 0,
    }
    projectMap.set(a.projectId, {
      ...existing,
      revenue: existing.revenue + rates.billingRate,
      cost: existing.cost + rates.vendorRate,
      headcount: existing.headcount + 1,
    })
  }

  const projects = Array.from(projectMap.values()).map((p) => ({
    ...p,
    margin: p.revenue - p.cost,
    marginPct: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : 0,
  }))

  const totals = projects.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, cost: acc.cost + p.cost, headcount: acc.headcount + p.headcount }),
    { revenue: 0, cost: 0, headcount: 0 }
  )

  return <DashboardView projects={projects} totals={totals} alertCount={alertCount} />
}
```

---

## 4. Rate Engine Pure Functions (complete)

```typescript
// src/lib/rate-engine.ts

export interface RateConfig {
  overheadRatePct: number
  marketRateFactorPct: number
  driftAlertThresholdPct: number
}

export interface RateResolutionInput {
  personnelVendorRate: number | null
  normRate: number | null
  projectOverrideRate: number | null
  memberBillingOverride: number | null
  vendorRateOverride: number | null
}

export interface RateResult {
  billingRate: number
  vendorRate: number
  vendorTargetRate: number
  grossMargin: number
  grossMarginPct: number
  billingRateSource: 'member_override' | 'project_override' | 'norm' | 'unknown'
  deltaVsNorm: number | null
  isAboveTarget: boolean
}

export function calculateVendorTargetRate(billingRate: number, config: RateConfig): number {
  const afterOverhead = billingRate * (1 - config.overheadRatePct)
  return afterOverhead * config.marketRateFactorPct
}

export function calculateAssignmentRates(input: RateResolutionInput, config: RateConfig): RateResult {
  let billingRate = 0
  let billingRateSource: RateResult['billingRateSource'] = 'unknown'

  if (input.memberBillingOverride !== null) {
    billingRate = input.memberBillingOverride
    billingRateSource = 'member_override'
  } else if (input.projectOverrideRate !== null) {
    billingRate = input.projectOverrideRate
    billingRateSource = 'project_override'
  } else if (input.normRate !== null) {
    billingRate = input.normRate
    billingRateSource = 'norm'
  }

  const vendorRate = input.vendorRateOverride ?? input.personnelVendorRate ?? 0
  const vendorTargetRate = calculateVendorTargetRate(billingRate, config)
  const grossMargin = billingRate - vendorRate
  const grossMarginPct = billingRate > 0 ? grossMargin / billingRate : 0
  const deltaVsNorm = input.normRate && input.normRate > 0
    ? (billingRate - input.normRate) / input.normRate
    : null
  const isAboveTarget = vendorRate > vendorTargetRate * (1 + config.driftAlertThresholdPct)

  return { billingRate, vendorRate, vendorTargetRate, grossMargin, grossMarginPct, billingRateSource, deltaVsNorm, isAboveTarget }
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
```

---

## 5. Auth + Role Guard

```typescript
// Anywhere in Server Actions or Server Components:
import { auth } from '@/lib/auth'

// Basic auth check
const session = await auth()
if (!session) throw new Error('Unauthorized')

// DU Leader only
if (session.user.role !== 'DU_LEADER') throw new Error('Forbidden')

// In Server Component — conditional rendering
const session = await auth()
const isDULeader = session?.user.role === 'DU_LEADER'

return (
  <div>
    {isDULeader && <MarginColumn />}  {/* P&L only for DU Leader */}
  </div>
)
```

---

## 6. Form Component Template

```typescript
// Example: VendorForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { VendorSchema, createVendor } from '@/actions/vendor.actions'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FormValues = z.infer<typeof VendorSchema>

export function VendorForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(VendorSchema),
    defaultValues: { name: '', contactName: '', contactEmail: '', market: 'ENGLISH', status: 'ACTIVE', languageStrength: [] },
  })

  async function onSubmit(values: FormValues) {
    try {
      await createVendor(values)
      toast.success('Vendor created successfully')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create vendor')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* Add more fields following the same pattern */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Vendor'}
        </Button>
      </form>
    </Form>
  )
}
```
