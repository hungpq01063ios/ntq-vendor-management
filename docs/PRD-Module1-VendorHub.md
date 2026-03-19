# Module 1: Vendor Profile Hub

> 📖 Xem [PRD-Index](PRD-Index.md) để hiểu tổng quan.
> File này chỉ chứa chi tiết Module 1 — Vendor Directory, Personnel, Pipeline, CV.
> **Last updated**: v1.5 — 2026-03-19

---

## User Flows

### Flow A — Vendor PIC: Thêm vendor mới
```
Vendor PIC nhận thông tin vendor mới
  → [Vendors] → [+ Add Vendor]
  → Nhập thông tin cơ bản: Tên, Size, Language strength
  → Save → Profile page tự động tạo
```
> ⚠️ **v1.3**: Vendor không còn phân theo Market. Trường "Thị trường hoạt động" đã bị xóa. Market được xác định theo **dự án** (Project), không phải theo vendor.

### Flow B — Vendor PIC: Thêm nhân sự từ vendor
```
Vendor gửi CV qua email
  → Chọn Vendor → [Personnel] → [+ Add Member]
  → Nhập: Tên, Job, Tech Stack, Level, Domain, English Level, Leadership
  → (Optional) Thêm CV versions: [+ Add CV] → label, url, notes, isLatest
  → System auto-lookup: hiển thị Rate Norm range cho profile này
  → Nhập Vendor Rate thực tế
  → Nếu Vendor Rate > Vendor Target Rate + threshold% → Show warning (Rate Drift)
  → Save → Personnel created + CV versions tạo theo
```

---

## Features

### Feature 1.1 — Vendor Directory
Danh sách tất cả vendor với thông tin tóm tắt. Search, filter theo ngôn ngữ/status.

> ⚠️ **v1.3**: Vendor không còn phân loại theo Market. Filter Market và cột Market đã bị xóa.

*Fields bắt buộc*:
- Tên công ty, tên người liên hệ, email, số điện thoại
- Company size, language strength
- Status: Active / Inactive / On hold
- Ngày bắt đầu hợp tác, ghi chú đánh giá chung

### Feature 1.2 — Vendor Personnel List
Tab nhân sự trong mỗi vendor profile, liệt kê toàn bộ nhân sự đã/đang làm.

*Fields bắt buộc — bao gồm rate dimensions*:
- Họ tên
- **Job** (Developer, Tester, BA, DevOps, Designer...) — bắt buộc
- **Primary Tech Stack** (Java, Golang, .NET, React, Python...) — **optional (v1.4)**: BA/PM/Designer có thể bỏ trống
- **Technical Level** (Junior / Middle / Senior / Leader / Principal) — bắt buộc
- **Domain** (Fintech, Healthcare, E-commerce, General...) — **optional (v1.4)**: không phải role nào cũng gắn domain cụ thể
- English Level (Basic / Intermediate / Advanced / Fluent)
- Leadership capability (Yes/No + ghi chú)
- Vendor rate thực tế (USD/tháng)
- **Vendor Target Rate** (computed, read-only)
- **Rate status**: Within target / Above target / Below target (auto-colored)
- Trạng thái: Available / On Project / Ended
- Interview process status: New → Screening → Technical Test → Interview → Passed / Failed
- Ghi chú kỹ thuật (free text)

> ⚠️ **v1.4**: `techStackId` và `domainId` không còn bắt buộc. UI hiển thị `(optional)` label, dropdown mặc định là `— Not applicable —`. Khi null, Rate Lookup sẽ bỏ qua filter đó. Trên bảng/detail hiển thị `—`.

### Feature 1.3 — Candidate Pipeline View
Kanban view ứng viên đang tuyển, grouped theo vị trí. Mỗi card hiện status, vendor, thời gian ở bước hiện tại.

### Feature 1.4 — Personnel CV Management *(v1.5)*
Lưu trữ và quản lý nhiều version CV cho mỗi nhân sự.

*Chức năng*:
- **Add CV khi tạo Personnel**: Inline form trong PersonnelSheet (create mode), lưu draft local → tạo cùng Personnel
- **Quản lý CV trong detail**: Section "CV / Resume" ở `/personnel/[id]` — Add, Edit, Delete, Set Latest
- **isLatest flag**: Tự động unset version cũ khi đánh dấu version mới nhất
- **CV = URL link** (Google Drive, OneDrive...) — không upload file trực tiếp

*Fields per CV version*:
- Label (bắt buộc) — e.g. "CV v2 - Updated Mar 2026"
- URL (bắt buộc) — link Google Drive / download
- Notes (optional)
- isLatest (boolean) — chỉ 1 version được đánh dấu
- uploadedAt, uploadedBy (auto)

---

## Data Model

```
VENDOR
  ├── id, name, contact_name, contact_email, contact_phone
  ├── company_size, language_strength
  ├── status, start_date, notes
  └── [has many] PERSONNEL
  -- NOTE v1.3: field `market` đã bị xóa — market xác định theo PROJECT

PERSONNEL
  ├── id, vendor_id, full_name
  ├── job_type_id                     ← required
  ├── tech_stack_id?                  ← optional v1.4 (null cho BA/PM/Designer)
  ├── level_id                        ← required
  ├── domain_id?                      ← optional v1.4 (null khi không liên quan)
  ├── english_level, leadership, vendor_rate_actual
  ├── status, interview_status, notes
  ├── [has many] PERSONNEL_CV         ← v1.5: nhiều version CV
  └── [computed] vendor_target_rate
       = (rate_norm × Market% × (1-Overhead%))
       -- nếu tech_stack hoặc domain là null → rate lookup bỏ qua filter đó

PERSONNEL_CV                           v1.5
  ├── id, personnel_id, uploaded_by_id
  ├── label, url, notes
  ├── is_latest (boolean, chỉ 1 per personnel)
  └── uploaded_at, created_at, updated_at
```

---

## Value Proposition

| Dimension | Nội dung |
|-----------|---------|
| **Who** | Vendor PIC quản lý danh sách vendor và nhân sự |
| **Why (Before)** | Thông tin nằm rải rác — mất thời gian tìm, dễ nhầm |
| **How** | Profile page tập trung cho mỗi vendor: thông tin chung, nhân sự, lịch sử dự án |
| **What After** | Tra cứu bất kỳ thông tin nào trong <1 phút, luôn up-to-date |
