# Test Plan — NTQ Vendor Management System

> **Version:** 1.0 · **Date:** 2026-03-22 · **Author:** Senior QA Lead  
> **Application:** NTQ Vendor Management — Internal Tool DU8  
> **Stack:** Next.js 16 · TypeScript · Prisma · PostgreSQL (Supabase) · NextAuth v5  
> **Env:** Vercel (Production) · localhost:3000 (Dev/Staging)

---

## 1. Mục tiêu & Phạm vi

### 1.1 Mục tiêu
- Đảm bảo toàn bộ chức năng hoạt động đúng theo PRD v1.5 và 15 CRs đã implement
- Xác minh RBAC (Role-Based Access Control) — 2 roles: DU_LEADER / VENDOR_PIC
- Kiểm tra data integrity giữa các module liên kết (Vendor ↔ Personnel ↔ Assignment ↔ Project ↔ Rate)
- Xác minh i18n hoạt động đúng (VI ↔ EN)
- Kiểm tra UX/UI theo CR Plan (sorting, inline actions, form sections, etc.)

### 1.2 Phạm vi (In Scope)

| Module | Routes | Mô tả |
|--------|--------|-------|
| Auth & RBAC | `/auth/signin`, layout guards | Login, role-based access, session |
| Dashboard | `/` | Cards, charts, P&L summary |
| Vendor Hub | `/vendors`, `/vendors/[id]` | CRUD, filter, import, detail, edit, deactivate |
| Personnel | `/personnel`, `/personnel/[id]` | CRUD, filter, import, CV management, interview status |
| Pipeline | `/pipeline` | Kanban view, inline status change, project filter |
| Projects | `/projects`, `/projects/[id]` | CRUD, assignments, P&L, domain/techstack display |
| Rate Norms | `/rates` | Matrix view, CRUD, import, clone, market tabs |
| Rate Config | `/rates/config` | SystemConfig, Market management, Rate Calculator |
| Drift Alerts | `/alerts` | Alert table, Flag/Resolve/Dismiss workflow |
| i18n | Toàn hệ thống | Chuyển đổi VI ↔ EN |
| Excel Import | Vendor, Personnel, Rate | Template download + upload + parse + validate |

### 1.3 Ngoài phạm vi (Out of Scope)
- Performance/Load testing (internal tool, ~2 users)
- Mobile responsive (desktop-only tool)
- Security penetration testing
- API testing (app uses Server Actions, not REST API)

---

## 2. Test Approach & Strategy

### 2.1 Test Levels

| Level | Tool/Method | Coverage Target |
|-------|-------------|-----------------|
| Unit Test | Vitest | Rate Engine — **100% đã đạt** (50 tests) |
| Integration Test | Manual + TypeScript check | Server Actions ↔ DB |
| System Test (Functional) | Manual execution | Toàn bộ modules |
| UI/UX Test | Manual + visual review | i18n, sorting, form sections |
| Regression | Manual checklist | After each sprint |

### 2.2 Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| DU_LEADER | admin@ntq.com.vn | admin123 | Full access — tất cả chức năng |
| VENDOR_PIC | pic@ntq.com.vn | vendor123 | Limited — không thấy Rate, không thấy Vendor Rate column |

### 2.3 Test Data (Seed)

| Entity | Test Data |
|--------|-----------|
| Vendors | TechViet Solutions (ENGLISH, ACTIVE) · CodeBase Vietnam (JAPAN, ACTIVE) |
| Projects | FinApp Portal (ENGLISH, FinCorp Inc, ACTIVE) |
| Personnel | Le Van C (Java Senior, PASSED) · Pham Thi D (Tester Middle, NEW) |
| Rate Norms | 22 norms — Dev/Tester/BA/DevOps/PM · Java/React/Golang/.NET · ENGLISH |
| Config | Overhead=20% · DriftThreshold=15% |

---

## 3. Test Cases — Module-by-Module

---

### MODULE 1: Authentication & Authorization

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| AUTH-01 | Login thành công | 1. Mở `/auth/signin` 2. Nhập email/password đúng 3. Click Sign In | Redirect về Dashboard `/` | P0 | Both |
| AUTH-02 | Login thất bại — sai password | Nhập email đúng + password sai | Hiện thông báo "Invalid email or password" | P0 | Both |
| AUTH-03 | Login thất bại — email không tồn tại | Nhập email không có trong DB | Hiện thông báo lỗi | P0 | Both |
| AUTH-04 | Session guard — truy cập không có session | Mở `/vendors` khi chưa login | Redirect về `/auth/signin` | P0 | N/A |
| AUTH-05 | RBAC — DU_LEADER thấy Rate Config | Login DU_LEADER → mở `/rates/config` | Hiện trang Rate Config | P0 | DU_LEADER |
| AUTH-06 | RBAC — VENDOR_PIC không thấy Rate columns | Login VENDOR_PIC → mở `/personnel` | Cột "Vendor Rate" bị ẩn | P0 | VENDOR_PIC |
| AUTH-07 | RBAC — VENDOR_PIC không thấy P&L card | Login VENDOR_PIC → mở `/projects/[id]` | Không hiện Project P&L card | P1 | VENDOR_PIC |
| AUTH-08 | Sign out | Click Sign Out ở sidebar | Redirect về login page, session bị xóa | P1 | Both |
| AUTH-09 | i18n — Login page hiện đúng ngôn ngữ | Switch locale → reload login page | Tất cả labels thay đổi theo locale | P2 | Both |

---

### MODULE 2: Dashboard

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| DASH-01 | Hiển thị summary cards | Login DU_LEADER → xem Dashboard | Hiện 6 cards: Active HC, Projects, Revenue, Cost, Margin, Alerts | P0 | DU_LEADER |
| DASH-02 | Charts render đúng data | Kiểm tra biểu đồ Revenue by Project | Biểu đồ hiện đúng theo data assignments | P1 | DU_LEADER |
| DASH-03 | Project Summary table | Xem bảng tổng hợp dự án | Hiện đúng Project/Client/Market/HC/Revenue/Cost/Margin | P1 | DU_LEADER |
| DASH-04 | Dashboard VENDOR_PIC | Login VENDOR_PIC → xem Dashboard | Không hiện Revenue/Cost cards (giấu sensitive data) | P1 | VENDOR_PIC |
| DASH-05 | Data consistency | So sánh số liệu Dashboard vs Detail pages | Tổng Revenue = sum billing rates × active members | P0 | DU_LEADER |

---

### MODULE 3: Vendor Management

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| VEN-01 | Tạo vendor mới | Click "+ Add Vendor" → điền form → Save | Vendor xuất hiện trong list, toast success | P0 | DU_LEADER |
| VEN-02 | Validation — thiếu required fields | Bỏ trống Name/Contact/Email → Submit | Hiện validation errors đỏ dưới mỗi field | P0 | Both |
| VEN-03 | Edit vendor (CR-19) | Vendor detail → click Edit → sửa thông tin → Save | Thông tin cập nhật, toast "Vendor updated" | P0 | Both |
| VEN-04 | Market dropdown (CR-24) | Tạo/edit vendor → chọn Market | Dropdown hiện list markets từ DB (không hardcode) | P0 | Both |
| VEN-05 | Programming language filter (CR-01) | Chọn filter "React" ở VendorTable | Chỉ hiện vendors có languageStrength chứa "React" | P1 | Both |
| VEN-06 | Programming language multi-select | Tạo vendor → chọn nhiều ngôn ngữ (Java, React, Go) | Tags hiện đúng, lưu thành công | P1 | Both |
| VEN-07 | Vendor ratings (CR-16) | Tạo vendor với rating 4★ quality, 3★ response | Table hiện ★ icons, Detail hiện full rating | P1 | Both |
| VEN-08 | Vendor website (CR-17) | Tạo vendor với website URL | Detail page hiện link clickable, mở tab mới | P2 | Both |
| VEN-09 | Deactivate vendor | Click ⋯ → Deactivate → Confirm modal | Status đổi thành INACTIVE, toast success | P0 | DU_LEADER |
| VEN-10 | Search vendor | Gõ tên vendor vào ô Search | List filter theo tên (case-insensitive) | P1 | Both |
| VEN-11 | Status filter | Chọn filter "Active" | Chỉ hiện vendors có status ACTIVE | P1 | Both |
| VEN-12 | Import vendors từ Excel (CR-04) | Download template → điền data → Upload | Vendors được tạo, toast hiện số lượng | P1 | DU_LEADER |
| VEN-13 | Import — file sai format | Upload file .txt hoặc Excel sai cột | Hiện error message rõ ràng | P1 | DU_LEADER |
| VEN-14 | Table sorting (CR-28) | Click header "Name" → "Status" → "Headcount" | Data sort asc/desc/none, hiện arrow ↑/↓ | P1 | Both |
| VEN-15 | Add Personnel từ Detail (CR-20) | Vendor detail → click "+ Add Personnel" | Mở PersonnelSheet, vendor pre-locked | P0 | Both |
| VEN-16 | Vendor detail — hiện personnel list | Mở vendor detail | Hiện bảng personnel với status, interview badges | P1 | Both |

---

### MODULE 4: Personnel Management

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| PER-01 | Tạo personnel mới (with CV) | Click "+ Add" → điền đầy đủ → thêm CV → Save | Personnel created, toast "Personnel created with CV" | P0 | Both |
| PER-02 | Tạo personnel — thiếu CV (CR-18) | Điền form nhưng không thêm CV → Submit | Toast error "Please add at least 1 CV", CV form auto-opens | P0 | Both |
| PER-03 | CV form auto-open (CR-18) | Click "+ Add Personnel" (create mode) | CV section mở sẵn, có badge "Required" | P1 | Both |
| PER-04 | Edit personnel | Click Edit → sửa thông tin → Save | Thông tin cập nhật, toast success | P0 | Both |
| PER-05 | Delete (soft) personnel | Click Delete → Confirm | Status đổi ENDED | P0 | DU_LEADER |
| PER-06 | Interview status inline change (CR-06) | Dropdown interview status → chọn "PASSED" | Status cập nhật ngay, toast success | P0 | Both |
| PER-07 | Additional tech stacks (CR-09) | Tạo personnel → chọn 2 additional TechStack → thử chọn thứ 3 | 2 tags hiện, nút thứ 3 bị disabled | P1 | Both |
| PER-08 | Multi-filter | Chọn Status + Interview + JobType + TechStack cùng lúc | Kết quả filter chính xác, badges hiện đúng | P1 | Both |
| PER-09 | Import personnel (CR-10) | Download template → điền → Upload | Personnel được tạo, toast success | P1 | DU_LEADER |
| PER-10 | Projects column (CR-07) | Personnel có active assignment | Cột "Projects" hiện tên project liên kết | P1 | Both |
| PER-11 | Vendor Rate column — DU_LEADER only | Login DU_LEADER → xem PersonnelTable | Hiện cột Vendor Rate | P0 | DU_LEADER |
| PER-12 | Vendor Rate column — VENDOR_PIC ẩn | Login VENDOR_PIC → xem PersonnelTable | Không hiện cột Vendor Rate | P0 | VENDOR_PIC |
| PER-13 | Table sorting (CR-28) | Click header "Name" → "Vendor" → "Level" | Data sort đúng, arrow indicators | P1 | Both |
| PER-14 | Form section dividers (CR-26) | Mở form Add/Edit Personnel | Hiện 4 sections: ① Basic Info, ② Skills, ③ Rate & Notes, ④ CV Files | P2 | Both |
| PER-15 | Personnel detail — CV management | Mở `/personnel/[id]` | Hiện danh sách CVs, nút Add/Edit/Delete/Set Latest | P1 | Both |
| PER-16 | CV — Set as Latest | Click "Set as Latest" trên CV cũ | CV mới có badge "Latest", CV cũ mất badge | P1 | Both |
| PER-17 | CV — Delete | Click Delete CV → Confirm | CV bị xóa khỏi list | P1 | Both |

---

### MODULE 5: Pipeline (Kanban)

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| PIPE-01 | Hiển thị kanban board | Mở `/pipeline` | 6 columns: New → Screening → Technical Test → Interview → Passed → Failed | P0 | Both |
| PIPE-02 | Personnel cards đúng column | Tạo personnel với interview = SCREENING | Card xuất hiện ở column "Screening" | P0 | Both |
| PIPE-03 | Inline status change (CR-27) | Click ⋮ trên card → chọn "Passed" | Card di chuyển sang column "Passed", toast success | P0 | Both |
| PIPE-04 | Project filter (CR-12) | Chọn project từ dropdown filter | Chỉ hiện personnel có assignment ở project đó | P1 | Both |
| PIPE-05 | Clear filter | Click "✕ Clear filter" | Hiện lại tất cả personnel | P1 | Both |
| PIPE-06 | Exclude ENDED personnel | Personnel có status ENDED | Không hiện trên pipeline board | P1 | Both |
| PIPE-07 | Card info đúng | Xem card trên pipeline | Hiện: Name, Vendor, JobType, Level, English Level, Projects | P1 | Both |
| PIPE-08 | Leadership indicator | Personnel có leadership = true | Card hiện ★ vàng cạnh tên | P2 | Both |

---

### MODULE 6: Project Management

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| PROJ-01 | Tạo project mới | Click "+ New Project" → điền form → Save | Project hiện trong list, toast success | P0 | Both |
| PROJ-02 | Project detail — Domain & TechStack (CR-21) | Mở project detail | Hiện Domain name, TechStack name, Market name (không code) | P0 | Both |
| PROJ-03 | Add assignment | Project detail → "+ Add Assignment" → chọn personnel | Assignment tạo thành công | P0 | Both |
| PROJ-04 | Assignment pool ON_PROJECT (CR-22) | Có personnel ON_PROJECT → mở Add Assignment | Personnel hiện trong dropdown với warning ⚠️ "On: ProjectName" | P1 | Both |
| PROJ-05 | End assignment | Click "End" trên assignment | Status ENDED, personnel auto-sync (CR-23) | P0 | Both |
| PROJ-06 | Personnel auto-sync — ON_PROJECT (CR-23) | Tạo assignment cho personnel AVAILABLE | Personnel status tự đổi thành ON_PROJECT | P0 | Both |
| PROJ-07 | Personnel auto-sync — AVAILABLE (CR-23) | End tất cả assignments của personnel | Personnel status tự đổi về AVAILABLE | P0 | Both |
| PROJ-08 | Delete assignment (CR-25) | Click Delete → Custom modal hiện → Confirm | Assignment bị xóa, custom modal (không phải window.confirm) | P1 | Both |
| PROJ-09 | Edit assignment | Click Edit → sửa billing/vendor rate → Save | Rates cập nhật, toast success | P1 | Both |
| PROJ-10 | P&L card — DU_LEADER | Mở project detail (DU_LEADER) | P&L card hiện: Total Revenue, Total Cost, Margin, Margin% | P0 | DU_LEADER |
| PROJ-11 | P&L card — VENDOR_PIC ẩn | Login VENDOR_PIC → mở project detail | P&L card KHÔNG hiện | P0 | VENDOR_PIC |
| PROJ-12 | Rate Override | `/projects/[id]/rates` → thêm override | Override áp dụng cho personnel matching criteria | P1 | DU_LEADER |
| PROJ-13 | End project | Click "End" → Confirm | Project status ENDED | P1 | DU_LEADER |
| PROJ-14 | Table sorting (CR-28) | Click header "Name" → "Client" → "Start Date" | Sort đúng, arrow indicators | P1 | Both |
| PROJ-15 | Market name display | Xem Project table + detail | Hiện market name (ví dụ "English") thay vì raw code "ENGLISH" | P1 | Both |

---

### MODULE 7: Rate Norms

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| RATE-01 | Rate Norm matrix | Mở `/rates` | Hiện matrix: JobType × TechStack × Level × Domain × Rate | P0 | DU_LEADER |
| RATE-02 | Tạo rate norm | Click "+ Add Rate Norm" → điền → Save | Norm hiện trong matrix, toast success | P0 | DU_LEADER |
| RATE-03 | Edit rate norm | Click Edit → sửa rate → Save | Rate cập nhật | P1 | DU_LEADER |
| RATE-04 | Delete rate norm | Click Delete → Confirm | Norm bị xóa | P1 | DU_LEADER |
| RATE-05 | Market tab context | Chọn tab "Japan" | Banner hiện "Viewing rate norms for market: Japan" | P1 | DU_LEADER |
| RATE-06 | Unique constraint | Tạo norm duplicate (same JobType+TechStack+Level+Domain+Market) | Error "already exists" | P0 | DU_LEADER |
| RATE-07 | Import rates (CR-14) | Download template (pre-filled) → edit → Upload | Rates imported, toast success | P1 | DU_LEADER |
| RATE-08 | Clone from English | Tab Japan → click "Clone from English" | Norms copy từ English, skip duplicates, toast summary | P1 | DU_LEADER |
| RATE-09 | Template pre-fill | Download rate template cho market "Japan" | Excel chứa existing data của Japan market (không empty) | P2 | DU_LEADER |

---

### MODULE 8: Rate Configuration

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| CONF-01 | View system config | Mở `/rates/config` | Hiện Overhead Rate, Drift Threshold | P0 | DU_LEADER |
| CONF-02 | Update overhead rate | Sửa Overhead → Save | Config cập nhật, ảnh hưởng Rate Calculator | P0 | DU_LEADER |
| CONF-03 | Market Config — add market | Click "+ Add Market" → điền code/name/factor → Save | Market hiện trong list | P1 | DU_LEADER |
| CONF-04 | Market Config — toggle active | Click toggle active/inactive | Market status đổi, toast thông báo | P1 | DU_LEADER |
| CONF-05 | Market Config — delete (in use) | Delete market đang có vendor/project sử dụng | Error "Cannot delete: market is used by..." | P0 | DU_LEADER |
| CONF-06 | Rate Calculator | Nhập Billing Rate → xem kết quả | Hiện Vendor Target Rate = (Billing - Overhead) × MarketFactor | P1 | DU_LEADER |
| CONF-07 | RBAC — VENDOR_PIC cannot access | Login VENDOR_PIC → mở `/rates/config` | Access denied hoặc redirect | P0 | VENDOR_PIC |

---

### MODULE 9: Drift Alerts

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| ALERT-01 | Scan for drift | Tạo assignment với vendor rate > target × (1+15%) → Scan | Alert PENDING xuất hiện | P0 | DU_LEADER |
| ALERT-02 | Flag for DU Leader | Click "Flag" trên alert PENDING | Status → FLAGGED_FOR_DU_LEADER | P1 | Both |
| ALERT-03 | Resolve alert | Click "Resolve" trên flagged alert | Status → RESOLVED, toast success | P1 | DU_LEADER |
| ALERT-04 | Dismiss with note | Click "Dismiss" → nhập note → Submit | Status → DISMISSED, note saved | P1 | DU_LEADER |
| ALERT-05 | Dismiss without note | Click "Dismiss" → bỏ trống note → Submit | Validation error "A note is required" | P1 | DU_LEADER |
| ALERT-06 | Filter tabs | Click "Pending" → "Flagged" → "All" | Data filter đúng theo status | P1 | Both |
| ALERT-07 | No pending alerts | Không có alert PENDING | Hiện "✅ No pending alerts" | P2 | Both |

---

### MODULE 10: i18n (Internationalization)

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| I18N-01 | Switch VI → EN | Click Language Switcher → chọn EN | 100% UI labels chuyển sang English | P0 | Both |
| I18N-02 | Switch EN → VI | Click Language Switcher → chọn VI | 100% UI labels chuyển sang Tiếng Việt | P0 | Both |
| I18N-03 | Persistence | Switch EN → reload page | Vẫn hiện EN (locale saved in cookie) | P1 | Both |
| I18N-04 | Form labels i18n | Mở VendorSheet/PersonnelSheet ở EN | Tất cả labels hiện English (no hardcoded VN) | P1 | Both |
| I18N-05 | Table headers i18n | Xem VendorTable/PersonnelTable/ProjectTable ở EN | Headers hiện English | P1 | Both |
| I18N-06 | Status badges i18n | Xem status badges (Active/On Hold/Ended) ở EN vs VI | Badges thay đổi theo locale | P2 | Both |

---

### MODULE 11: Excel Import (Cross-module)

| TC-ID | Scenario | Steps | Expected Result | Priority | Role |
|-------|----------|-------|-----------------|----------|------|
| IMP-01 | Download template — Vendor | Click Import → Download Template | File .xlsx với đúng columns + example data | P1 | DU_LEADER |
| IMP-02 | Download template — Personnel | Click Import → Download Template | File .xlsx với đúng columns | P1 | DU_LEADER |
| IMP-03 | Download template — Rate | Click Import → Download Template (market=ENGLISH) | File .xlsx pre-filled với existing rates | P1 | DU_LEADER |
| IMP-04 | Upload valid file | Upload file Excel đúng format | Data imported, toast summary | P0 | DU_LEADER |
| IMP-05 | Upload invalid file | Upload file .pdf hoặc .doc | Error "Invalid file format" | P1 | DU_LEADER |
| IMP-06 | Upload empty file | Upload template không có data rows | Error hoặc "0 records imported" | P2 | DU_LEADER |
| IMP-07 | Duplicate handling | Import vendor đã tồn tại | Skip hoặc update (check behavior) | P1 | DU_LEADER |

---

## 4. Data Integrity Tests (Cross-Module)

| TC-ID | Scenario | Expected | Priority |
|-------|----------|----------|----------|
| DATA-01 | Create Assignment → Personnel status auto-sync | AVAILABLE → ON_PROJECT | P0 |
| DATA-02 | End all assignments → Personnel status revert | ON_PROJECT → AVAILABLE (nếu không còn active) | P0 |
| DATA-03 | Delete assignment → Personnel status check | Check remaining assignments, revert nếu cần | P0 |
| DATA-04 | Deactivate vendor → Personnel không bị ảnh hưởng | Personnel vẫn giữ status cũ | P1 |
| DATA-05 | Rate Norm update → P&L recalculation | P&L card reflect new rates correctly | P1 |
| DATA-06 | Market Config change → Rate Calculator update | Calculator dùng market factor mới | P1 |
| DATA-07 | Delete rate norm used in override → no cascade delete | Override vẫn tồn tại | P1 |
| DATA-08 | Soft delete consistency | Vendor→INACTIVE, Personnel→ENDED, Project→ENDED | P0 |

---

## 5. Rate Engine Tests (Unit — Đã Có)

> **Status:** ✅ 50/50 PASS · 100% coverage  
> **File:** `src/lib/__tests__/rate-engine.test.ts`  
> **Command:** `npm test`

| Area | Tests | Status |
|------|:-----:|--------|
| `calculateVendorTargetRate()` | 12 | ✅ |
| `resolveBillingRate()` — 3-layer inheritance | 8 | ✅ |
| `calculateAssignmentRates()` — full pipeline | 15 | ✅ |
| `isDriftAlert()` — threshold check | 8 | ✅ |
| `getMarketFactor()` — per-market + fallback | 4 | ✅ |
| `formatCurrency()` / `formatPct()` | 3 | ✅ |

---

## 6. Bug Tracking & Defect Classification

| Severity | Định nghĩa | SLA |
|----------|-----------|-----|
| **Critical (S1)** | Chức năng core bị block, data loss, security breach | Fix trong 4h |
| **Major (S2)** | Chức năng lớn lỗi nhưng có workaround | Fix trong 1 ngày |
| **Minor (S3)** | UI glitch, typo, UX không tối ưu | Fix trong sprint |
| **Trivial (S4)** | Enhancement, cosmetic | Backlog |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| Data inconsistency giữa Personnel status & Assignment | Medium | High | Test DATA-01/02/03 kỹ, thêm DB constraint nếu cần |
| Rate calculation sai ở edge case (0 billing, null vendor rate) | Low | High | Unit tests đã cover — 100% coverage |
| i18n missing keys → hiện raw key trên UI | Medium | Medium | Grep scan for untranslated strings |
| Excel import với data edge case (special chars, empty rows) | Medium | Medium | Test IMP-04/05/06/07 |
| RBAC bypass — VENDOR_PIC access DU_LEADER features | Low | High | Test AUTH-05/06/07, CONF-07 |
| Market Config delete corrupts rate norms | Low | High | Test CONF-05, constraint validation |

---

## 8. Test Execution Plan

### Phase 1: Smoke Test (1 ngày)
> **Objective:** Verify tất cả modules accessible, no crashes

- [ ] AUTH-01, AUTH-04 (Login + guard)
- [ ] DASH-01 (Dashboard loads)
- [ ] VEN-01, VEN-03 (Vendor CRUD)
- [ ] PER-01 (Personnel create)
- [ ] PROJ-01, PROJ-03 (Project + assignment)
- [ ] RATE-01, RATE-02 (Rate norm CRUD)
- [ ] PIPE-01 (Pipeline renders)
- [ ] ALERT-06 (Alert table loads)
- [ ] I18N-01 (Switch locale works)

### Phase 2: Feature Testing (3-4 ngày)
> **Objective:** Verify tất cả test cases theo priority

- Ngày 1: Auth (AUTH-*) + Vendor (VEN-*) + Import (IMP-*)
- Ngày 2: Personnel (PER-*) + Pipeline (PIPE-*)
- Ngày 3: Project (PROJ-*) + Data Integrity (DATA-*)
- Ngày 4: Rate (RATE-* + CONF-*) + Alert (ALERT-*) + i18n (I18N-*)

### Phase 3: Regression (1 ngày)
> **Objective:** Re-run P0 tests sau bug fixes

- [ ] Re-run tất cả P0 test cases
- [ ] Cross-browser basic check (Chrome + Firefox)
- [ ] Rate Engine unit tests (`npm test`)

---

## 9. Entry & Exit Criteria

### Entry Criteria
- [x] TypeScript build passes (`tsc --noEmit` = 0 errors)
- [x] Unit tests pass (50/50)
- [x] Seed data available
- [x] Test accounts created
- [x] All Sprint 1-3 CRs implemented

### Exit Criteria
- [ ] 100% P0 test cases PASSED
- [ ] ≥ 95% P1 test cases PASSED
- [ ] 0 open Critical/Major bugs
- [ ] RBAC tests all PASSED
- [ ] Data integrity tests all PASSED
- [ ] i18n switch hoạt động 100%

---

## 10. Test Summary Matrix

| Module | P0 | P1 | P2 | Total TCs |
|--------|:--:|:--:|:--:|:---------:|
| Auth & RBAC | 6 | 2 | 1 | **9** |
| Dashboard | 2 | 2 | 0 | **4** (+1 P1) |
| Vendor | 5 | 8 | 1 | **14** (+2) |
| Personnel | 4 | 9 | 1 | **14** (+3) |
| Pipeline | 2 | 4 | 1 | **7** (+1) |
| Project | 5 | 6 | 0 | **11** (+4) |
| Rate Norms | 2 | 5 | 1 | **8** (+1) |
| Rate Config | 3 | 3 | 0 | **6** (+1) |
| Drift Alerts | 1 | 4 | 1 | **6** (+1) |
| i18n | 2 | 3 | 1 | **6** |
| Excel Import | 1 | 4 | 1 | **6** (+1) |
| Data Integrity | 4 | 4 | 0 | **8** |
| **TOTAL** | **37** | **54** | **8** | **99** |

> **Rate Engine Unit Tests:** 50 tests đã pass — không cần retest thủ công

---

## 11. Recommendations từ Senior Tester

### 🔴 Critical Observations

1. **Thiếu automated integration tests** — Server Actions chưa có test coverage. Recommend: viết integration tests cho `createAssignment()`, `endAssignment()`, `deleteAssignment()` (vì auto-sync logic).

2. **RBAC chỉ check ở Server Action layer** — nếu ai đó gọi trực tiếp API route (nếu có), không có middleware guard. Tuy nhiên app dùng Server Actions nên risk thấp.

3. **No database seeding for test scenarios** — Hiện tại dùng chung seed data. Recommend: tạo test-specific seed scripts cho edge cases.

### 🟡 UX Risks

4. **Pipeline inline status change (CR-27)** — ⋮ menu nhỏ, dễ missclick trên mobile (tuy nhiên đây là desktop-only tool).

5. **Table sorting remember state** — Hiện tại sort state reset khi navigate away. Có thể confuse user khi quay lại. Low priority.

6. **Pagination chưa implement** — Nếu data lớn (>100 vendors/personnel), table sẽ chậm. Đã log trong backlog.

### 🟢 Positive Observations

7. ✅ Rate Engine unit tests excellent (100% coverage, 50 tests)
8. ✅ TypeScript strict mode — catches nhiều bugs at compile time
9. ✅ ActionResult pattern giảm unhandled errors
10. ✅ Soft delete strategy — no data loss risk
11. ✅ i18n architecture solid — cookie-based, SSR-compatible

---

*Test Plan v1.0 — 2026-03-22 | 99 Test Cases | Owner: Senior QA Lead | NTQ Solution DU8*
