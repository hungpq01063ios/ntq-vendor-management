# Module 2: Project-Headcount Tracker

> 📖 Xem [PRD-Index](PRD-Index.md) để hiểu tổng quan.
> File này chỉ chứa chi tiết Module 2 — Project, Assignment, P&L, Dashboard.
> **Last updated**: v1.5 — 2026-03-19

---

## User Flows

### Flow C — Vendor PIC: Assign member vào dự án
```
Khách hàng confirm thuê nhân sự
  → [Projects] → Chọn project → [+ Assign Member]
  → Chọn nhân sự từ pool
  → System auto-suggest 3 giá trị:
      [1] Billing Rate = Project Rate (từ Rate Norm, hoặc project override)
      [2] Vendor Rate = rate từ personnel profile (auto-fill)
      [3] Vendor Target Rate = Billing Rate × Market[project] × (1-Overhead%)
  → Vendor PIC có thể override Billing Rate cho riêng member (hiển thị delta vs norm)
  → Save → Margin tự tính
```

### Flow D — DU Leader: Xem P&L overview
```
DU Leader vào Dashboard
  → Summary cards: Headcount / Revenue / Cost / Avg Margin%
  → Xem Rate Alerts badge (nếu có drift chưa xử lý)
  → Drill down vào project hoặc vendor cụ thể
```

---

## Features

### Feature 2.1 — Project List
Danh sách dự án với thông tin tóm tắt và P&L nhanh.

*Fields bắt buộc*:
- Tên dự án, thị trường, tên khách hàng
- Start date, End date (dự kiến), Status
- Tổng headcount, Monthly revenue, Monthly cost, Gross margin%

### Feature 2.2 — Headcount Assignment *(tích hợp Rate Engine)*
Gắn nhân sự vào dự án với rate được auto-suggest từ Rate Engine.

*Fields*:
- Nhân sự (chọn từ pool), Vendor (auto-fill), Role trong dự án
- **Billing Rate**: auto-fill từ Project Rate Norm → override per member → hiển thị `(+X% vs norm)`
- **Vendor Rate**: auto-fill từ personnel profile → có thể chỉnh
- **Vendor Target Rate**: computed, read-only
- Start date / End date, Status

*Assignment actions (v1.5)*:
- **Edit**: Mở AssignmentSheet edit mode, pre-fill data, personnel locked
- **End** (soft delete): Đặt status=ENDED + endDate=today, ai cũng dùng được
- **Delete** (hard delete): Chỉ DU_LEADER mới thấy nút, có confirm dialog

### Feature 2.3 — Project P&L Summary Card
Tự động tính: Monthly revenue / Monthly cost / Gross margin / Margin%.

*Hiển thị ở (v1.5)*:
- **Project detail page** (`/projects/[id]`): P&L card giữa Project Info và Assignments table — chỉ DU_LEADER thấy
- **Assignment table**: Cột Billing Rate (+ source badge), Vendor Rate (+ drift warning), Margin%
- **Dashboard** (`/`): Tổng hợp tất cả dự án

*Màu margin*: ≥ 30% = xanh, ≥ 10% = vàng, < 10% = đỏ

### Feature 2.4 — DU Dashboard
- Summary cards: Headcount / Revenue / Cost / Avg Margin%
- **Rate Alerts badge**: Số alerts chưa xử lý
- Bar chart Revenue by project, Pie chart Headcount by vendor
- Project table (sortable theo margin)
- Quick filter: by vendor / market / status

---

## Data Model

```
PROJECT
  ├── id, name, market, client_name, start_date, end_date, status, notes
  └── [has many through ASSIGNMENT] PERSONNEL

ASSIGNMENT
  ├── id, personnel_id, project_id, role_in_project
  ├── billing_rate         -- resolve chain → PROJECT_RATE_OVERRIDE → RATE_NORM
  ├── billing_rate_override_note
  ├── vendor_rate          -- inherit from PERSONNEL.vendor_rate_actual
  ├── start_date, end_date, status
  └── [computed fields]
       vendor_target_rate  = billing_rate × Market[project.market] × (1-overhead%)
       gross_margin        = billing_rate - vendor_rate
       gross_margin_pct    = gross_margin / billing_rate × 100

Rate Resolution Chain:
  billing_rate = memberOverride ?? projectOverride ?? rateNorm.rateNorm
  vendorRate   = assignmentOverride ?? personnel.vendorRateActual
```

---

## Value Proposition

| Dimension | Nội dung |
|-----------|---------|
| **Who** | DU Leader cần P&L visibility; Vendor PIC cần theo dõi assignment |
| **Why (Before)** | Margin không biết real-time; assignment phải nhớ hoặc tra nhiều file |
| **How** | Dashboard tổng hợp dự án: headcount, billing rate, vendor rate, margin |
| **What After** | DU Leader xem P&L snapshot bất cứ lúc nào; biết ngay dự án nào đang lệch |
