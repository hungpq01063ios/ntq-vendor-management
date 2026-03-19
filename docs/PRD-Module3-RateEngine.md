# Module 3: Rate Engine

> 📖 Xem [PRD-Index](PRD-Index.md) để hiểu tổng quan.
> File này chứa chi tiết Rate Engine — Norm, Config, Market, Calculator, Override, Alert.

---

## User Flows

### Flow E — DU Leader: Setup Rate Norm Table
```
DU Leader vào [Settings] → [Rate Management] → [Rate Norm]
  → Xem Rate Matrix Grid: hàng = Job+Level, cột = Tech Stack
  → Click cell để edit: nhập rate_min, rate_norm, rate_max
  → Set effective date
  → Save → Toàn bộ assignment mới tự lấy norm này làm default
```

### Flow F — DU Leader: Cấu hình Global Params
```
[Settings] → [Rate Management] → [Global Config]
  → Chỉnh OverheadRate% (ví dụ: 20%)
  → Chỉnh Rate Drift Alert Threshold% (ví dụ: 15%)
  → Save → Công thức Vendor Target Rate tự cập nhật

[Global Config] → Section "Markets & Rate Factors"
  → Xem danh sách markets (ENGLISH, JAPAN, ...)
  → Chỉnh Rate Factor% cho từng market riêng lẻ
  → Market Factor được áp dụng theo market của từng dự án

[Global Config] → Section "Rate Calculator"
  → Chọn thị trường + nhập Billing Rate → tính Max Vendor Rate
  → Hoặc: nhập Max Vendor Rate → tính Billing Rate cần đạt
```

### Flow G — Vendor PIC: Xử lý Rate Drift Alert
```
Vendor PIC nhận notification: "Rate drift detected — Java Senior Developer"
  → Xem chi tiết: Norm rate = $1,500 | Avg vendor actual = $1,850 | Drift = +23%
  → Chọn action:
      [Flag for DU Leader] → DU Leader thấy trong Rate Alerts inbox
      [Update Norm] → Request DU Leader review
      [Dismiss] → Ghi nhận nhưng không action (kèm ghi chú)
```

---

## Features

### Feature 3.1 — Rate Norm Table (Bảng Rate Chuẩn Thị Trường)

Nguồn tham chiếu chính thức cho toàn DU8. Mỗi record xác định bởi 4 dimensions:

| Dimension | Giá trị ví dụ |
|-----------|--------------|
| **Job** | Developer, Tester, BA, DevOps, Designer, PM... |
| **Tech Stack** | Java, Golang, .NET, React, Python, Generic... |
| **Level** | Junior / Middle / Senior / Leader / Principal |
| **Domain** | Fintech, Healthcare, E-commerce, General... |

Mỗi record có: `rate_min` / `rate_norm` / `rate_max` (USD/tháng) và `effective_date`.

*UI*: Rate Matrix Grid (hàng = Job+Level, cột = Tech Stack). Filter theo Domain, Market. Click cell edit inline.

*Fallback*: Không có exact match → fallback Domain=General, TechStack=Generic.

---

### Feature 3.2 — Global Config Panel

DU Leader cấu hình tham số toàn DU:

| Param | Mô tả | Ví dụ |
|-------|-------|-------|
| `OverheadRate%` | Overhead trừ vào billing rate | 20% |
| `DriftAlertThreshold%` | % chênh lệch trigger alert | 15% |

> ⚠️ `MarketRateFactor%` không còn là tham số toàn cục — xem Feature 3.2b.

---

### Feature 3.2b — Market Config (Per-Market Rate Factor)

Mỗi thị trường có Rate Factor riêng:

| Market | Rate Factor | Ý nghĩa |
|--------|-------------|---------|
| ENGLISH | 80% | Standard |
| JAPAN | 75% | Cạnh tranh cao hơn |
| KOREA | 78% | Thị trường Hàn |
| *(Custom)* | *(configurable)* | DU Leader thêm market mới |

DU Leader có thể CRUD + toggle active từng market.

---

### Feature 3.6 — Rate Calculator (Công cụ tính 2 chiều) *(v1.3)*

**Chiều 1: Billing Rate → Max Vendor Rate**
```
Max Vendor Rate = Billing Rate × Market Rate × (1 − Overhead Rate)
```

**Chiều 2: Max Vendor Rate → Billing Rate**
```
Billing Rate = (VR + VR/(1−Overhead) × Overhead) / Market Rate
```

2 chiều là inverse — `BR = VR / (Market × (1-Overhead))`.

| Input | Thị trường | Output |
|-------|-----------|--------|
| Billing = $2,000 | ENGLISH 80% | Max VR = **$1,280** |
| Max VR = $1,280 | ENGLISH 80% | Billing = **$2,000** |
| Billing = $3,000 | JAPAN 75% | Max VR = **$1,800** |

---

### Công thức Vendor Target Rate

```
VendorTargetRate = BillingRate × MarketFactor[project.market] × (1 − OverheadRate%)
```

Tương đương: `(BillingRate - BillingRate × Overhead%) × MarketFactor%`

*Ví dụ ENGLISH*: $2,000 × 0.8 × 0.8 = **$1,280**
*Ví dụ JAPAN*: $2,000 × 0.75 × 0.8 = **$1,200**

---

### Feature 3.3 — Project Rate Override

Mỗi dự án có thể override billing rate cho combination Job+Stack+Level cụ thể.

- Mặc định: kế thừa Rate Norm
- Override: set custom rate cho dự án
- Mọi assignment dùng Project Rate làm default thay Norm

---

### Feature 3.4 — Member Rate Override

Một member cụ thể có thể có billing rate khác Project Rate.

- Hiển thị: Rate gốc, Rate override, Delta (`+$200 / +10% vs norm`)
- Override chỉ ảnh hưởng member này trong dự án này

---

### Feature 3.5 — Rate Drift Alert

Trigger khi: `|VendorActualRate - VendorTargetRate| / VendorTargetRate > DriftThreshold%`

*Alert detail*: Job + Stack + Level, Rate Norm vs Actual, % chênh lệch
*PIC actions*: Flag for DU Leader / Dismiss with note
*DU Leader actions*: Update Norm / Acknowledge / Snooze 30 ngày
*Scope Phase 1*: Manual trigger + on-save check. Automated scan → Phase 2.

---

## Data Model

```
RATE TAXONOMY (Master — DU Leader manages)
  JOB_TYPES     (id, name)
  TECH_STACKS   (id, name)
  LEVELS        (id, name, order)
  DOMAINS       (id, name)

RATE_NORM
  ├── id, job_type_id, tech_stack_id, level_id, domain_id, market
  ├── rate_min, rate_norm, rate_max   (USD/month)
  └── effective_date, created_by, created_at

SYSTEM_CONFIG  (key, value, updated_by, updated_at)
  -- overhead_rate_pct          e.g. "0.20"
  -- drift_alert_threshold_pct  e.g. "0.15"

MARKET_CONFIG  (id, code, name, market_rate_factor_pct, is_active, order)
  -- ENGLISH → 0.80 | JAPAN → 0.75 | KOREA → 0.78

PROJECT_RATE_OVERRIDE
  ├── id, project_id, job_type_id, tech_stack_id, level_id, domain_id
  └── custom_billing_rate, set_by, set_at

RATE_ALERT
  ├── id, job_type_id, tech_stack_id, level_id
  ├── norm_rate, actual_avg_vendor_rate, drift_pct
  ├── triggered_by, triggered_at
  └── status: pending / flagged / resolved / dismissed
  -- note (required when dismissed)
```

---

## Appendix: End-to-End Examples

**Setup**: Java + Senior + Fintech = $2,000. Overhead=20%. ENGLISH=80%, JAPAN=75%.

| Scenario | Input | Result |
|----------|-------|--------|
| Normal | Vendor A=$1,200 vs target $1,280 | ✅ Below target |
| Drift | Vendor B=$1,500 vs target $1,280 | ❌ +17.2% > 15% → Alert |
| Japan | Same spec, Japan project | Target = $1,200 |
| Project override | Client pays $2,500 | Target (ENG) = $1,600 |
