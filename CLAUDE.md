# NTQ Vendor Management — Project Context

## Stack
Next.js 15 App Router · TypeScript · Prisma 5 · PostgreSQL (Supabase)
shadcn/ui · Tailwind · NextAuth v5 · Zod · Server Actions

## Architecture Rules (NON-NEGOTIABLE)
- CRUD logic → Server Actions trong `src/actions/[entity].actions.ts`
- NO `/api/` routes for CRUD
- Pages → Server Components (no useState/useEffect in page.tsx)
- Forms → Client Components in `src/components/features/`
- Always: `revalidatePath()` after mutation
- Always: `const session = await auth()` check in every action
- DU_LEADER-only: hide P&L columns from VENDOR_PIC

## Rate Engine Formula
VendorTargetRate = (ProjectRate - ProjectRate × OverheadRate%) × MarketFactor%
Resolution chain: memberOverride → projectOverride → rateNorm

## Roles
- DU_LEADER: full access including P&L, Rate Config, soft-delete
- VENDOR_PIC: read/write vendors, personnel, assignments — no P&L

## Key Files
- prisma/schema.prisma → single source of truth for data model
- src/lib/rate-engine.ts → pure functions, NO db calls here
- src/actions/ → all mutations live here