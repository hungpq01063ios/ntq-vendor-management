# CR Plan — Phase 1 Polish & UX Improvements

> **Version:** 1.3 · **Date:** 2026-03-22 · **Author:** Phạm Quốc Hưng (PO)  
> **Nguồn:** Senior PO Review — rà soát toàn bộ luồng, màn hình, logic sau khi ship Phase 1  
> **Mục tiêu:** Nâng chất lượng UX, sửa inconsistency, giảm friction cho 2 users chính
> **Sprint 1 Status:** ✅ COMPLETED (2026-03-22)  
> **Sprint 2 Status:** ✅ COMPLETED (2026-03-22)
> **Sprint 3 Status:** ✅ COMPLETED (2026-03-22)

---

## Tổng quan

Phase 1 đã ship đầy đủ 3 module (Vendor Hub, Project Tracker, Rate Engine). Tuy nhiên, sau rà soát phát hiện **15 vấn đề** ở 4 nhóm:

| Nhóm | Số CR | Mô tả |
|------|:-----:|-------|
| 🔴 P0 — Critical | 4 | Ảnh hưởng trực tiếp đến usability, data bị "mất" |
| 🟡 P1 — Important | 7 | Flow rườm rà, thiếu action, logic chưa tối ưu |
| 🔵 P2 — Nice to Have | 4 | Scale, performance, naming |

**Estimated total effort:** ~12-16 ngày dev

---

## 🔴 P0 — Critical (Sửa Ngay)

### CR-15: i18n Consistency — Loại bỏ hardcode strings

**Vấn đề:**  
Hệ thống có i18n engine (vi/en) nhưng chỉ ~60% UI đã dùng translation keys. Còn lại hardcode trộn lẫn Việt-Anh trên cùng một màn hình, tạo trải nghiệm "Frankenstein" cho user.

**Files ảnh hưởng:**

| File | Tình trạng | Ví dụ hardcode |
|------|-----------|----------------|
| `PersonnelSheet.tsx` | ❌ 100% hardcode EN | "Vendor", "Full Name", "Job Type", "Level", "Cancel", "Save Changes" |
| `AssignmentSheet.tsx` | ❌ 100% hardcode EN | "Personnel", "Role in Project", "Start Date", "Billing Rate Override" |
| `AssignmentSection.tsx` | ❌ 100% hardcode EN | "Assignments", "+ Add Assignment", "Edit", "End", "Delete" |
| `VendorSheet.tsx` | ⚠️ Trộn VN+EN | "Ngôn ngữ lập trình thế mạnh", "Đánh giá performance (1–5 ★)", "Website" |
| `VendorTable.tsx` | ⚠️ 1 chỗ hardcode | Filter label "Ngôn ngữ lập trình" |
| `RateMatrixGrid.tsx` | ⚠️ Trộn VN+EN | Banner VN + table headers EN + button "Clone từ English" |
| `RateNormSheet.tsx` | ❌ Chưa check | Likely hardcode EN |
| `PipelineClient.tsx` | ⚠️ Hardcode VN | "Pipeline", "nhân sự", "Lọc theo dự án", stage labels |
| `PersonnelTable.tsx` | ⚠️ 1 cột | "Dự án process" — trộn VN-EN |
| `ProjectDetail page` | ❌ Hardcode EN | "Client", "Start Date", "End Date", "Notes" |
| `AlertTable.tsx` | ❌ Chưa check | Likely hardcode EN |
| `RateCalculator.tsx` | ❌ Chưa check | Likely mix |
| `GlobalConfigForm.tsx` | ❌ Chưa check | Likely hardcode EN |

**Giải pháp:**

1. Audit tất cả component files, grep mọi user-facing string
2. Thêm keys mới vào `src/i18n/locales/vi.ts` + `en.ts` (+ update `types.ts`)
3. Replace hardcode → `{t.xxx.yyy}` (client) hoặc `{t.xxx.yyy}` (server)
4. Test bằng cách switch locale → verify 100% UI thay đổi

**Effort:** 2–3 ngày  
**Priority:** 🔴 P0

---

### CR-16: Hiển thị Vendor Ratings trên List & Detail

**Vấn đề:**  
Vendor có 2 fields rating (`performanceRating`, `responseSpeedRating`, cả 2 scale 1–5 ★) + `performanceNote`, nhập được từ VendorSheet nhưng **không hiện ở bất kỳ đâu khác**. User nhập data "vào lỗ đen".

**Files ảnh hưởng:**
- `VendorTable.tsx` — thêm cột hoặc indicator
- `vendors/[id]/page.tsx` — thêm section ratings

**Giải pháp:**

1. **VendorTable** — Thêm cột "Rating" hiển thị `performanceRating` dưới dạng ★ icons (1–5). Nếu chưa đánh giá, hiện "—".
   ```
   Ví dụ: ★★★★☆ (4/5)
   ```

2. **VendorDetail** — Thêm section "Đánh giá" sau thông tin liên hệ:
   ```
   ┌─────────────────────────────────────────┐
   │ Đánh giá                                │
   │ Chất lượng chung:    ★★★★☆  (4/5)       │
   │ Tốc độ phản hồi:    ★★★★★  (5/5)       │
   │ Ghi chú: "Phản hồi nhanh, chất lượng…"  │
   └─────────────────────────────────────────┘
   ```

3. Truyền thêm ratings data từ server → client (VendorTable type + query)

**Effort:** 0.5 ngày  
**Priority:** 🔴 P0

---

### CR-17: Hiển thị Vendor Website trên Detail Page

**Vấn đề:**  
Field `website` (CR-02) có form nhập trong VendorSheet nhưng `vendors/[id]/page.tsx` không hiển thị.

**Giải pháp:**

1. Thêm vào VendorDetail grid, dưới contact info:
   ```tsx
   {vendor.website && (
     <div>
       <span className="text-gray-500">Website</span>
       <a href={vendor.website} target="_blank" className="font-medium text-blue-600 hover:underline">
         {vendor.website}
       </a>
     </div>
   )}
   ```

2. Có thể thêm cột Website vào VendorTable (optional — bảng đã rộng).

**Effort:** 0.5 ngày (bao gồm cả CR-16)  
**Priority:** 🔴 P0

---

### CR-18: Personnel CV Validation UX — Đưa lên đầu hoặc validate sớm

**Vấn đề:**  
Khi tạo mới Personnel, CV bắt buộc (≥1) nhưng CV section nằm **cuối cùng** trong form dài 15+ fields. User điền hết → bấm Save → bị báo lỗi "Vui lòng thêm ít nhất 1 CV" → phải scroll xuống thêm CV.

**Giải pháp — Chọn 1 trong 2:**

**Option A (Recommend): Mở sẵn CV form + visual indicator**
1. Khi create mode, tự động mở `cvFormOpen = true` (hiện form thêm CV ngay)
2. Thêm visual indicator ở header section: badge đỏ "Bắt buộc" nếu chưa có CV
3. Khi user nhấn Save mà chưa có CV → scroll tự động đến CV section + highlight

```tsx
// Thay đổi useEffect
useEffect(() => {
  if (open) {
    // ...existing reset...
    if (!personnel) setCvFormOpen(true); // Auto-open CV form in create mode
  }
}, [open, personnel, reset]);
```

**Option B: Wizard form (effort lớn hơn, UX tốt nhất)**
- Chia PersonnelSheet thành 3 steps: Basic Info → Skills & Rate → CV
- Step navigation ở top, only enable Save ở step cuối
- → Xếp vào P2 nếu chọn Option A trước

**Effort:** 0.5 ngày (Option A) / 2–3 ngày (Option B)  
**Priority:** 🔴 P0

---

## 🟡 P1 — Important (Nên sửa sớm)

### CR-19: Vendor Detail — Thêm Edit & Quick Actions

**Vấn đề:**  
Vendor Detail page (`/vendors/[id]`) hoàn toàn read-only. Không có nút Edit, không có shortcut. User phải quay lại list page rồi bấm Edit.

**Giải pháp:**

1. Thêm `VendorSheet` component vào Vendor Detail page (convert sang hybrid server/client hoặc tách client wrapper)
2. Header thêm các action buttons:

```
┌────────────────────────────────────────────────────────┐
│ TechViet Solutions            [Edit] [+ Add Personnel] │
│ ● Active · English · 5 members                         │
└────────────────────────────────────────────────────────┘
```

3. Nút "Edit" → mở VendorSheet (edit mode, pre-filled data)
4. Nút "+ Add Personnel" → xem CR-20

**Effort:** 1 ngày  
**Priority:** 🟡 P1

---

### CR-20: Add Personnel From Vendor Detail

**Vấn đề:**  
Vendor Detail hiển thị danh sách nhân sự, nhưng muốn thêm nhân sự cho vendor → phải navigate sang `/personnel` → chọn lại vendor trong dropdown. Thêm 3–4 clicks thừa.

**Giải pháp:**

1. Thêm nút "+ Add Personnel" ở section nhân sự trong Vendor Detail
2. Mở `PersonnelSheet` với `vendorId` pre-selected & locked
3. Cần truyền thêm lookup data (jobTypes, techStacks, levels, domains) vào detail page

```tsx
// vendors/[id]/page.tsx
<PersonnelSheet
  open={sheetOpen}
  onClose={() => setSheetOpen(false)}
  vendors={[{ id: vendor.id, name: vendor.name }]}  // pre-locked
  // ...other lookups...
/>
```

4. Vendor dropdown trong PersonnelSheet: nếu chỉ 1 vendor được truyền → auto-select & disable field

**Effort:** 1 ngày  
**Priority:** 🟡 P1

---

### CR-21: Project Detail — Hiển thị Domain & TechStack

**Vấn đề:**  
Project có fields `domainId` + `techStackId` (CR-11, đã implement) nhưng `projects/[id]/page.tsx` không hiển thị. Ngoài ra, `marketCode` hiện raw code ("ENGLISH") thay vì tên đầy đủ.

**Giải pháp:**

1. Fetch domain + techStack relation trong `getProjectById()` (nếu chưa include)
2. Thêm vào Project Detail grid:
   ```
   Domain:     Fintech
   Tech Stack: Java
   Market:     English (thay vì raw "ENGLISH")
   ```
3. Tương tự cho ProjectTable list page: thêm cột Domain + TechStack (optional)

**Effort:** 0.5 ngày  
**Priority:** 🟡 P1

---

### CR-22: Assignment Personnel Pool — Cho phép chọn ON_PROJECT

**Vấn đề:**  
Khi assign member vào project, chỉ hiện personnel `status=AVAILABLE`. Nhân sự `ON_PROJECT` (đang ở dự án khác) không thể chọn → không hỗ trợ kiêm nhiệm.

**Giải pháp:**

1. Thay `getPersonnel({ status: "AVAILABLE" })` → `getPersonnel({ status: ["AVAILABLE", "ON_PROJECT"] })`
2. Trong dropdown PersonnelSheet, thêm visual indicator:
   ```
   Nguyen Van A — Java/Senior (TechViet) [Available]
   Pham Thi B — Tester/Middle (CodeBase) ⚠️ On Project: FinApp
   ```
3. Nếu chọn ON_PROJECT → hiện warning: "Nhân sự đang ở dự án khác. Có thể ảnh hưởng capacity."
4. Update `getPersonnel()` action để support array status filter

**Effort:** 1 ngày  
**Priority:** 🟡 P1

---

### CR-23: Personnel Status Auto-Sync khi Assign/End

**Vấn đề logic:**  
Assign member vào project → personnel status vẫn "Available" (không tự đổi "On Project"). End assignment → không tự đổi lại "Available". User phải update tay 2 nơi.

**Giải pháp:**

1. Trong `createAssignment()`:
   ```typescript
   // After successful create
   await prisma.personnel.update({
     where: { id: data.personnelId },
     data: { status: "ON_PROJECT" }
   });
   ```

2. Trong `endAssignment()`:
   ```typescript
   // After successful end, check if personnel has other active assignments
   const otherActive = await prisma.assignment.count({
     where: { personnelId, status: "ACTIVE", id: { not: assignmentId } }
   });
   if (otherActive === 0) {
     await prisma.personnel.update({
       where: { id: personnelId },
       data: { status: "AVAILABLE" }
     });
   }
   ```

3. Edge case: Nếu nhân sự kiêm nhiệm (CR-22), chỉ đổi AVAILABLE khi **tất cả** assignments đã end.

**Effort:** 1 ngày  
**Priority:** 🟡 P1

---

### CR-24: Vendor `marketCode` — Xóa hoặc cho chọn

**Vấn đề:**  
PRD v1.3 nói "Vendor không phân theo Market" → đã xóa Market khỏi filter/form. Nhưng:
- Prisma schema vẫn có field `marketCode` trên Vendor
- `VendorSheet.tsx` hardcode `marketCode: "ENGLISH"`
- Vendor Detail page vẫn hiện market code

**Giải pháp — Chọn 1:**

**Option A (Recommend): Xóa hẳn `marketCode` khỏi Vendor**
1. Migration: remove column `marketCode` from Vendor table
2. Update Prisma schema, seed, actions, detail page
3. Clean: xóa mọi reference đến vendor market

**Option B: Giữ nhưng cho user chọn**
1. Thêm dropdown Market vào VendorSheet (fetch từ MarketConfig)
2. Hiện tên market thay vì raw code ở Detail

**Effort:** 0.5–1 ngày  
**Priority:** 🟡 P1

---

### CR-25: Assignment Delete — Custom Confirmation Modal

**Vấn đề:**  
Assignment hard delete dùng `window.confirm()` trong khi tất cả module khác (Vendor, Personnel, Rate Norm) dùng custom styled modal dialog. Không nhất quán.

**Giải pháp:**

1. Thêm state `deleteTargetId` + confirmation modal vào `AssignmentSection.tsx`
2. Copy pattern từ VendorTable/PersonnelTable (đã có sẵn):
   ```tsx
   {deleteTarget && (
     <>
       <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteTarget(null)} />
       <div className="fixed inset-0 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
           <h3>Xóa assignment?</h3>
           <p>Hành động này không thể hoàn tác.</p>
           <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDelete}>Delete</Button>
           </div>
         </div>
       </div>
     </>
   )}
   ```

**Effort:** 0.5 ngày  
**Priority:** 🟡 P1

---

## 🔵 P2 — Nice to Have (Phase 2 Backlog)

### CR-26: Personnel Form — Wizard/Multi-step

**Vấn đề:**  
PersonnelSheet có 15+ fields + CV section trong side panel 520px. Form quá dài, overwhelming cho first-time users.

**Giải pháp:**  
Chia thành 3 steps/tabs:
1. **Step 1 — Thông tin cơ bản:** Vendor, Full Name, Job Type, Level, Domain, English Level, Status
2. **Step 2 — Skills & Rate:** Primary Tech Stack, Additional Tech Stacks, Leadership, Vendor Rate, Interview Status, Notes
3. **Step 3 — CV/Resume:** CV list + add form (bắt buộc khi create)

Mỗi step có validation riêng. Navigation: Back/Next + step indicator ở header.

**Effort:** 2–3 ngày  
**Priority:** 🔵 P2

---

### CR-27: Pipeline — Inline Status Change

**Vấn đề:**  
Pipeline kanban hiện read-only. Đổi interview status phải navigate sang Personnel table hoặc detail page.

**Giải pháp — Chọn 1:**

**Option A: Quick action menu trên card (effort nhỏ)**
- Hover card → hiện icon menu (⋮)
- Click → dropdown: "Chuyển sang Screening / Technical Test / Interview / Passed / Failed"
- Gọi `updateInterviewStatus()` trực tiếp

**Option B: Drag & drop (effort lớn)**
- Dùng thư viện `@dnd-kit/core` hoặc `react-beautiful-dnd`
- Kéo card từ cột này sang cột khác → tự động update status
- Cần handle optimistic update + rollback

**Effort:** 1 ngày (A) / 3–5 ngày (B)  
**Priority:** 🔵 P2

---

### CR-28: Table Sorting & Pagination

**Vấn đề:**  
Tất cả list pages load toàn bộ data, không sort, không paginate. OK cho ~2 users + ít data, nhưng không scale.

**Giải pháp:**

1. **Sorting** — Thêm header click-to-sort cho mỗi bảng:
   - VendorTable: sort by Name, Status, Headcount
   - PersonnelTable: sort by Name, Level, Status, Vendor Rate
   - ProjectTable: sort by Name, Status, Margin%
   - RateMatrixGrid: sort by Job, Level, Norm Rate

2. **Pagination** — Server-side cursor pagination:
   - Thay `findMany()` → `findMany({ take: 25, skip: offset })`
   - Thêm pagination controls (< 1 2 3 ... N >)
   - Cần update Server Actions + page components

**Effort:** 2–3 ngày (sorting) + 3–4 ngày (pagination)  
**Priority:** 🔵 P2

---

### CR-29: Rename `languageStrength` → `programmingLanguages`

**Vấn đề:**  
Field ban đầu nghĩa là "ngoại ngữ thế mạnh", v1.6 đổi thành "ngôn ngữ lập trình". Nhưng tên field trong DB vẫn là `languageStrength` → confusing cho dev.

**Giải pháp:**

1. Prisma migration: rename column `languageStrength` → `programmingLanguages`
2. Update tất cả references: actions, components, types, seed, import templates
3. **Breaking change** — cần coordinate deploy
4. Optional: cũng rename translation key

**Effort:** 1 ngày  
**Priority:** 🔵 P2

---

## 📅 Lộ trình đề xuất

### Sprint 1 (Tuần 1): P0 — Critical Fixes

| CR | Task | Effort | Status |
|----|------|--------|--------|
| CR-16 + CR-17 | Vendor ratings + website display | 0.5 ngày | ✅ DONE |
| CR-18 | Personnel CV validation UX (Option A) | 0.5 ngày | ✅ DONE |
| CR-15 | i18n audit + fix — PersonnelSheet, AssignmentSheet, AssignmentSection | 1.5 ngày | ✅ DONE |
| CR-15 | i18n audit + fix — RateNormSheet, AlertTable, PipelineClient, PersonnelTable, VendorTable | 1.5 ngày | ✅ DONE |
| CR-25 | Assignment delete custom modal (bonus) | 0.5 ngày | ✅ DONE |
| — | **Subtotal** | **4.5 ngày** | **✅ All Done** |

### Sprint 2 (Tuần 2): P1 — Flow Improvements

| CR | Task | Effort | Status |
|----|------|--------|--------|
| CR-19 + CR-20 | Vendor Detail Edit + Add Personnel | 1.5 ngày | ✅ DONE |
| CR-21 | Project Detail Domain/TechStack display | 0.5 ngày | ✅ DONE |
| CR-23 | Personnel status auto-sync | 1 ngày | ✅ Already done |
| CR-25 | Assignment delete custom modal | 0.5 ngày | ✅ Done in Sprint 1 |
| CR-24 | Vendor marketCode — cho chọn | 0.5 ngày | ✅ DONE |
| CR-22 | Assignment pool ON_PROJECT support | 1 ngày | ✅ DONE |
| — | **Subtotal** | **5 ngày** | **✅ All Done** |

### Sprint 3 (Phase 2): P2 — Polish

| CR | Task | Effort | Status |
|----|------|--------|--------|
| CR-26 | Personnel form section dividers | 2–3 ngày → 0.5 ngày (simplified to section headers) | ✅ DONE |
| CR-27 | Pipeline inline status change | 1–3 ngày → 1 ngày | ✅ DONE |
| CR-28 | Table client-side sorting (3 tables) | 5–7 ngày → 1.5 ngày (sorting only, pagination deferred) | ✅ DONE |
| CR-29 | Rename languageStrength | 1 ngày | 🔄 Deferred — needs DB migration |
| — | **Subtotal** | **~3 ngày** | **✅ 3/4 Done** |

---

## ✅ Acceptance Criteria Tổng Quát

- [x] Switch locale vi ↔ en → 100% UI thay đổi ngôn ngữ (CR-15) ✅
- [x] Vendor ratings hiện ở list page (★) + detail page (full) (CR-16) ✅
- [x] Vendor website hiện + click được ở detail page (CR-17) ✅
- [x] Create Personnel → CV form mở sẵn, có indicator "bắt buộc" (CR-18) ✅
- [x] Vendor Detail có nút Edit + Add Personnel (CR-19, CR-20) ✅
- [x] Project Detail hiện Domain, TechStack, Market name (CR-21) ✅
- [x] Assign member ON_PROJECT kèm warning (CR-22) ✅
- [x] Personnel status tự đổi khi assign/end (CR-23) ✅
- [x] Vendor marketCode: cho chọn market từ dropdown (CR-24) ✅
- [x] Assignment delete dùng custom modal (CR-25) ✅

---

*CR Plan v1.3 — 2026-03-22 | Sprint 1+2+3 DONE | Owner: Phạm Quốc Hưng | DU8 — NTQ Solution*

---

## 📝 Sprint 1 — Changelog

**CR-16 + CR-17: Vendor Ratings & Website Display** ✅
- `VendorTable.tsx`: Added Rating column with ★ star icons
- `vendors/[id]/page.tsx`: Added Website (clickable link) + Ratings section (performance + response speed with ★ visualization)

**CR-18: Personnel CV Validation UX** ✅
- `PersonnelSheet.tsx`: Auto-open CV form in create mode (`setCvFormOpen(!personnel)`)
- Added amber border + "!" badge when no CV added (visual required indicator)
- Toast error uses i18n key instead of hardcoded VN string

**CR-15: i18n Consistency** ✅
- `types.ts`: Added ~100 new translation keys across vendor, personnel, project, rate, alert namespaces
- `vi.ts` + `en.ts`: Complete translations for all new keys
- **Components i18n'd:**
  - `PersonnelSheet.tsx` — 100% hardcoded EN → i18n
  - `AssignmentSheet.tsx` — 100% hardcoded EN → i18n
  - `AssignmentSection.tsx` — 100% hardcoded EN → i18n
  - `RateNormSheet.tsx` — 100% hardcoded EN → i18n
  - `AlertTable.tsx` — 100% hardcoded EN → i18n
  - `PipelineClient.tsx` — 100% hardcoded VN → i18n
  - `PersonnelTable.tsx` — remaining 2 hardcoded strings → i18n
  - `VendorTable.tsx` — filter label "Ngôn ngữ lập trình" → i18n

**CR-25: Assignment Delete Custom Modal** ✅ (done in earlier session)
- `AssignmentSection.tsx`: Replaced `window.confirm()` with custom styled modal

**TypeScript:** `tsc --noEmit` passed — no errors ✅

---

## 📝 Sprint 2 — Changelog

**CR-19 + CR-20: Vendor Detail Edit + Add Personnel** ✅
- `vendors/[id]/page.tsx`: Refactored to server/client split — server handles data fetching, client handles interactive UI
- New `VendorDetailClient.tsx`: Client component with full vendor info display
- **Edit button**: Opens `VendorSheet` in edit mode with pre-filled data
- **"+ Add Personnel" button**: Opens `PersonnelSheet` with vendor pre-locked (auto-selected & single vendor in dropdown)
- Fetches all lookup data (jobTypes, techStacks, levels, domains) on server page for modal forms

**CR-21: Project Detail — Domain & TechStack Display** ✅
- `project.actions.ts`: Updated `getProjectById()` to include `domain` and `techStack` relations
- `projects/[id]/page.tsx`: Full i18n overhaul + displays Domain, TechStack, and resolved Market name
- Status labels now use i18n translation keys
- All hardcoded EN strings replaced with translation keys

**CR-22: Assignment Pool — ON_PROJECT Support** ✅
- `personnel.actions.ts`: `getPersonnel()` now supports `string | string[]` for status filter
- `projects/[id]/page.tsx`: Fetches `["AVAILABLE", "ON_PROJECT"]` personnel
- `AssignmentSheet.tsx`: Personnel dropdown shows `⚠️ On: ProjectName` indicator for ON_PROJECT personnel

**CR-23: Personnel Status Auto-Sync** ✅ (already implemented)
- `assignment.actions.ts`: Already had auto-sync logic:
  - `createAssignment()` → sets personnel to ON_PROJECT
  - `endAssignment()` → checks remaining active assignments, sets AVAILABLE if none
  - `deleteAssignment()` → same logic

**CR-24: Vendor marketCode — User-selectable** ✅
- `VendorSheet.tsx`: Added `marketCode` to form schema + dropdown populated from active markets
- Removed hardcoded `marketCode: "ENGLISH"` → user selects from available markets
- `VendorTable.tsx` + `VendorTable` page: Pass `markets` prop through to VendorSheet
- `vendors/page.tsx`: Fetches active markets via `getMarkets(true)` and passes to table
- Also i18n'd remaining hardcoded VN strings in VendorSheet (labels, placeholders)
**TypeScript:** `tsc --noEmit` passed — no errors ✅

---

## 📝 Sprint 3 — Changelog

**CR-26: Personnel Form Section Dividers** ✅
- `PersonnelSheet.tsx`: Added 4 visual section headers (① Basic Info, ② Skills & Assessment, ③ Rate & Notes, ④ CV Files)
- Simplified from full wizard/multi-step to section dividers — same UX improvement at fraction of the effort
- Each section has uppercase tracking header with border divider

**CR-27: Pipeline Inline Status Change** ✅
- `PipelineClient.tsx`: Full rewrite with `PipelineCard` sub-component
- Each card now has a **⋮ quick action menu** in top-right corner
- Clicking ⋮ shows a dropdown with all other pipeline stages (color-coded with dots)
- Status change calls `updateInterviewStatus()` server action + `router.refresh()` for instant UI update
- Toast notifications on success ("PersonName → New Stage")
- Uses fixed backdrop overlay for click-away dismissal

**CR-28: Table Client-Side Sorting** ✅
- New shared `useTableSort` hook at `src/hooks/useTableSort.tsx`:
  - Supports nested property access (`vendor.name`)
  - Handles null values (pushed to end)
  - 3-state cycling: asc → desc → none
  - Number, string, and date-aware comparison
- New `SortableHeader` component: clickable column headers with ↑/↓ indicators
- Applied to 3 tables:
  - `VendorTable.tsx`: Sort by Name, Status, Headcount, Rating
  - `PersonnelTable.tsx`: Sort by Name, Vendor, Level, Status, Rate
  - `ProjectTable.tsx`: Sort by Name, Client, HC, Start Date, Status + full i18n
- Pagination deferred to future sprint

**CR-29: Rename languageStrength** 🔄 Deferred
- i18n labels already show "Programming Languages" (done in Sprint 1/CR-01)
- DB field rename (`languageStrength` → `programmingLanguages`) requires Prisma migration
- Risk: breaking change for existing data, import/export templates
- Decision: defer to dedicated migration sprint

**TypeScript:** `tsc --noEmit` passed — no errors ✅
