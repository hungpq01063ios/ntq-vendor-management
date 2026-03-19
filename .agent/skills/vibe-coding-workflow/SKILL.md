---
name: Vibe Coding Workflow
description: Optimized workflow for AI-assisted development. Defines how Antigravity should approach tasks to maximize efficiency and minimize token usage in the Vendor Management project.
---

# Vibe Coding Workflow — NTQ Vendor Management

## Purpose

Workflow này đảm bảo:
- ⚡ **Speed** — Không re-read thông tin đã biết
- 🎯 **Consistency** — Mọi feature theo cùng 1 pattern
- 💰 **Token Efficiency** — Lazy load: chỉ đọc file khi thực sự cần

---

## Step 0 — Session Start (MANDATORY)

> **Chỉ đọc `PROJECT_MEMORY.md` — Section §1, §2, §3** (~60 dòng, ~700 tokens).
> Không đọc toàn file, không đọc PRD, không đọc skills ngay từ đầu.

```
Mandatory read (mỗi session):
  PROJECT_MEMORY.md §1–§3   → Snapshot, build status, feature status

On-demand (chỉ khi task cần):
  PROJECT_MEMORY.md §4–§9   → ADRs, files, backlog, seed, changelog
  PRD-VendorManagement-Phase1.md → Nghiệp vụ chi tiết, business rules
  ntq-vendor-dev/SKILL.md       → Architecture, code patterns
  coding-quality/SKILL.md        → Quality standards, ActionResult, auth
  references/patterns.md         → Server Action template, Rate Engine code
  references/schema.prisma       → DB schema đầy đủ
```

---

## Step 1 — Task Routing

### Khi nào đọc skill nào?

| Task type | Skills cần đọc |
|---|---|
| Cần hiểu nghiệp vụ / thay đổi feature | PRD §liên quan |
| New feature (CRUD, page, form) | `ntq-vendor-dev` + `coding-quality` |
| Rate Engine / pricing logic | `ntq-vendor-dev` + `references/patterns.md §Rate Engine` |
| DB schema / migration | `ntq-vendor-dev` + `references/schema.prisma` |
| Auth / RBAC | `coding-quality §3 Auth Helpers` |
| Testing | `coding-quality §5 Testing` |
| Bug fix / refactor | `coding-quality §4 TypeScript Rules + §6 Checklist` |
| Viết Server Action mới | `references/patterns.md §Server Action Template` |
| Dashboard widget | `references/patterns.md §Dashboard Aggregation` |

**Token tip:** Tham chiếu section cụ thể (§N) thay vì đọc cả file.

---

## Step 2 — Check Before Creating

Trước khi tạo file mới:
1. File tương tự đã tồn tại? → Reuse / extend
2. Utility đã có? → `src/lib/utils.ts`, `src/lib/auth-helpers.ts`
3. Component tương tự? → `src/components/features/`

---

## Step 3 — Implementation Order

```
Vendor Management Project (Next.js 15 App Router):

1. Database   → update prisma/schema.prisma → npx prisma db push → npx prisma generate
              → ⚠️ RESTART dev server (Prisma client trong node_modules không tự HMR)
2. Actions    → src/actions/[entity].actions.ts (Zod schema + CRUD)
3. Page       → src/app/(dashboard)/[route]/page.tsx (Server Component)
4. Components → src/components/features/[domain]/ (Client Components)
5. Verify     → npx tsc --noEmit → npm test → test in browser
6. Doc Sync   → ⚠️ BẮT BUỘC — xem Step 4 bên dưới
```

---

## Step 4 — Doc Sync Gate (BẮT BUỘC) 🚨

> **RULE: Code XONG ≠ Task XONG. Task XONG = Code + Docs đồng bộ.**
> Bỏ qua step này = nợ kỹ thuật ẩn → session sau sẽ bị sai thông tin.

### Decision Tree — Cần update file nào?

```
┌── Có thay đổi gì?
│
├─ Thêm/sửa/xóa tính năng user-facing?
│  ├─ YES → (A) PRD Module file + PRD-Index version table
│  └─ NO  → skip PRD
│
├─ Thêm entity DB / field mới?
│  ├─ YES → (B) PRD Data Model section
│  └─ NO  → skip
│
├─ Thêm file mới (action/component/page)?
│  ├─ YES → (C) DEPENDENCY_MAP.md
│  └─ NO  → skip
│
├─ Thêm gotcha / pattern / rule mới?
│  ├─ YES → (D) ntq-vendor-dev/SKILL.md hoặc coding-quality/SKILL.md
│  └─ NO  → skip
│
└── MỌI TRƯỜNG HỢP (kể cả bug fix):
   └─ (E) PROJECT_MEMORY.md §8 changelog + §3 feature status (nếu feature mới)
```

### File-by-File Checklist

```
SAU MỖI FEATURE / CHANGE:

□ PROJECT_MEMORY.md
  □ §3 — thêm dòng feature status (nếu feature mới)
  □ §8 — thêm 1 dòng changelog
  □ Header — update "Last updated" date

□ docs/PRD-Module*.md (nếu thay đổi nghiệp vụ)
  □ Section Features — thêm/cập nhật feature description
  □ Section Data Model — thêm entity/field mới
  □ Section User Flows — cập nhật flow nếu khác
  □ Header — bump "Last updated" version + date

□ docs/PRD-Index.md (nếu PRD module thay đổi)
  □ Version table — thêm dòng mới
  □ Footer — update version

□ docs/DEPENDENCY_MAP.md (nếu thêm file mới)
  □ Thêm file vào đúng entity section
  □ Cập nhật cross-cutting nếu liên quan

□ .agent/skills/ntq-vendor-dev/SKILL.md (nếu thêm pattern/entity/gotcha)
  □ Domain entities diagram
  □ File structure map
  □ Non-negotiable rules (nếu phát hiện gotcha mới)

□ .agent/skills/coding-quality/SKILL.md (nếu thêm quality rule/gotcha)
  □ Quality checklist per layer
  □ Quick fix map
```

### Ví dụ: Feature "Personnel CV Management"

```
Đã code xong → cần sync:

✅ PROJECT_MEMORY.md §3 → thêm "Personnel CV management | ✅ Done"
✅ PROJECT_MEMORY.md §8 → thêm changelog "Personnel CV management..."
✅ docs/PRD-Module1-VendorHub.md → Feature 1.4 + Data Model (PERSONNEL_CV)
✅ docs/PRD-Index.md → v1.5 row in version table
✅ docs/DEPENDENCY_MAP.md → thêm cv.actions + PersonnelCVSection
✅ ntq-vendor-dev/SKILL.md → PersonnelCV in entity diagram + file map
✅ ntq-vendor-dev/SKILL.md → gotcha: "use server" không export object
```

---

## Common Pitfalls (quick ref)

| Issue | Cause | Fix |
|---|---|---|
| Trang hiện Next.js default | `app/page.tsx` tồn tại song song với `(dashboard)/page.tsx` | Xóa `app/page.tsx` |
| Frontend không update | Thiếu revalidatePath | Add `revalidatePath()` sau mutation |
| List không cập nhật sau create/update | Thiếu `router.refresh()` ở Client Sheet component | Add `router.refresh()` trước `onClose()` |
| toast.success hiện kể cả khi fail | Không check ActionResult — dùng try/catch thay vì `if (!result.success)` | Check ActionResult đúng pattern |
| Lỗi Prisma misleading sau schema change | Stale Prisma client — dev server chạy với client cũ | **Restart dev server** sau `prisma generate` |
| Server Action error | Thiếu `'use server'` | Add ở đầu action file |
| `'use server' file can only export async functions` | Export Zod schema object từ action file | Schema dùng `const` (không export) hoặc tách ra file riêng |
| Type error on session.role | NextAuth types | Dùng `(session.user as { role?: string })?.role` hoặc `getSessionWithRole()` |
| `as never` TypeScript | Enum không được import đúng | Import enum từ `@prisma/client` |
| .next cache stale | Xóa source code file | `rm -rf .next && npm run dev` |
| **Docs lỗi thời sau thêm feature** | **Bỏ qua Step 4 Doc Sync** | **Chạy decision tree + checklist ở Step 4** |

---

## Quick Checklist (copy-paste mỗi feature)

```
Code quality:
□ npx tsc --noEmit → 0 errors
□ Mutations return ActionResult<T>          (coding-quality §1)
□ Auth via requireAuth() / requireRole()    (coding-quality §3)
□ No: as never · as any · declare module    (coding-quality §4)
□ revalidatePath() called after mutation
□ Loading / error / empty states handled
□ Soft delete (status=INACTIVE), never hard delete
□ Toast reads result.error, not generic string

Doc sync (BẮT BUỘC — xem Step 4):
□ PROJECT_MEMORY.md §3 feature status
□ PROJECT_MEMORY.md §8 changelog
□ PRD Module file — features + data model (nếu nghiệp vụ thay đổi)
□ PRD-Index.md — version table (nếu PRD thay đổi)
□ DEPENDENCY_MAP.md — new files (nếu thêm file)
□ Skills — entity/pattern/gotcha (nếu phát hiện mới)
```

---

## PRD Sync Rules

**Update PRD khi:** thêm/bỏ tính năng user-facing · thay business rule · thêm field nghiệp vụ mới · thêm entity DB
**KHÔNG update PRD khi:** refactor code · fix bug nhỏ · thay đổi pattern nội bộ

Khi update: (1) bump version table ở đầu file · (2) edit đúng section · (3) giữ format hiện có

---

## Token Budget (tham khảo)

| File | ~Tokens | Khi đọc |
|---|---|---|
| `PROJECT_MEMORY.md §1–3` | ~700 | **Mỗi session** |
| `ntq-vendor-dev/SKILL.md` | ~2,200 | Feature tasks |
| `coding-quality/SKILL.md` | ~2,900 | Feature/refactor |
| `references/patterns.md` | ~3,000 | Viết action/component |
| `references/schema.prisma` | ~2,500 | DB changes |
| `PRD` | ~8,500 | Nghiệp vụ thay đổi |
| **Worst case (đọc hết)** | **~19,800** | Hiếm |
| **Typical task** | **~2,500–5,000** | 1–2 skills on-demand |
