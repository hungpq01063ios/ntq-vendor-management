# PRD: Vendor Management System — Phase 1
## Vendor Profile Hub + Project-Headcount Tracker + Rate Engine

**Version**: 1.3
**Date**: 2026-03-18
**Status**: Draft — Pending Review

| Version | Ngày | Thay đổi |
|---------|------|---------|
| v1.0 | 2026-03-17 | Initial PRD — Vendor Profile Hub + Project Tracker |
| v1.1 | 2026-03-17 | **Bổ sung Module 3: Rate Engine** — Rate Norm Table, 3-layer rate inheritance, Vendor Target Rate formula, Rate Drift Alert, Per-member override. Cập nhật Data Model, Flows, KRs, Timeline. |
| v1.2 | 2026-03-18 | **Thay đổi Rate Engine**: `MarketRateFactor%` không còn là tham số toàn cục — mỗi thị trường có Rate Factor riêng, cấu hình trong bảng **MarketConfig**. Cập nhật Flow F, Feature 3.2, Data Model, Appendix B. |
| v1.3 | 2026-03-18 | **Vendor không phân theo Market**: xóa trường Market khỏi Vendor (filter, cột bảng, form, detail). **Rate Calculator**: thêm công cụ tính toán 2 chiều (Billing ↔ Max Vendor Rate) theo từng thị trường. Cập nhật Flow A, Feature 1.1, Feature 3.6, Data Model VENDOR, Appendix B. |

---

## 1. Summary

Phase 1 của hệ thống Vendor Management nội bộ NTQ xây dựng nền tảng dữ liệu cốt lõi gồm **ba module**: **Vendor Profile Hub** (quản lý hồ sơ và thông tin nhân sự theo vendor), **Project-Headcount Tracker** (theo dõi dự án, headcount, và P&L), và **Rate Engine** (hệ thống quản lý rate theo 3 tầng — Norm / Project / Member — với công thức tính Vendor Target Rate cấu hình được và cơ chế cảnh báo rate drift). Rate Engine là dependency trực tiếp của Project Tracker: không có rate đúng thì margin calculation sẽ sai. Sản phẩm phục vụ hai người dùng nội bộ duy nhất: **DU Leader** và **Vendor PIC** của DU8 — thị trường tiếng Anh, NTQ Solution.

---

## 2. Contacts

| Tên | Vai trò | Trách nhiệm với PRD |
|-----|---------|---------------------|
| Phạm Quốc Hưng | DU Leader — DU8, NTQ Solution | Product Owner, người phê duyệt cuối cùng |
| Vendor PIC Lead | NTQ Internal Staff | Primary user, tham gia design review và UAT |
| Tech Lead (TBD) | Engineering | Ước lượng effort, technical feasibility |
| UX Designer (TBD) | Design | Thiết kế UI/UX cho hai user personas |

---

## 3. Background

### Vấn đề hiện tại

DU8 hiện đang quản lý ~80 nhân sự thuê ngoài từ nhiều vendor qua ~15 dự án thị trường tiếng Anh. Toàn bộ dữ liệu vendor, nhân sự, dự án và rate đang nằm rải rác ở nhiều file Excel riêng lẻ, email thread, chat Slack/Teams, và ghi chú cá nhân của từng Vendor PIC.

Về riêng phần **Rate Management** — vấn đề đặc biệt nghiêm trọng:
- Không có bảng Rate Norm chuẩn: Sale phải ước lượng hoặc hỏi lại mỗi lần báo giá cho khách hàng
- Không có công thức chuẩn để tính giá nên offer với vendor: Vendor PIC tự negotiate dựa trên kinh nghiệm cá nhân
- Mỗi member trong cùng một dự án có thể có rate khác nhau — không có nơi nào track được điều này một cách nhất quán
- Khi thị trường biến động, không có cơ chế nào thông báo cho DU Leader biết rate norm đang bị lỗi thời

### Tại sao bây giờ?

DU8 đang scale mạnh. Với 15 dự án và nhiều vendor song song, sai lệch về rate ảnh hưởng trực tiếp đến P&L. Một quyết định pricing sai có thể tạo ra margin âm trên một dự án mà không ai biết cho đến cuối tháng.

### Liên hệ với chiến lược

Tối ưu P&L là mục tiêu chiến lược ngắn hạn của DU8. Rate Engine là công cụ trực tiếp giúp DU Leader kiểm soát pricing một cách có hệ thống, thay vì phụ thuộc vào kinh nghiệm cá nhân của từng Vendor PIC.

---

## 4. Objective

### Mục tiêu

Xây dựng hệ thống nội bộ cho phép DU Leader và Vendor PIC **quản lý vendor, nhân sự, dự án và rate** trong một nơi duy nhất — với Rate Engine đảm bảo pricing decision luôn có căn cứ từ dữ liệu, không phải cảm tính.

### Tại sao quan trọng?

- **Với DU Leader**: Kiểm soát pricing ở cấp chiến lược — set rate norm, cấu hình overhead và margin target, nhận alert khi thị trường thay đổi. Không còn bị bất ngờ vì margin thấp cuối tháng.
- **Với Vendor PIC**: Khi negotiate với vendor, có con số cụ thể để tham chiếu — `Vendor Target Rate` được tính tự động từ công thức. Tự tin hơn, đồng nhất hơn giữa các PIC.
- **Với Sale team**: Có Rate Card chuẩn để báo giá khách hàng — không cần đoán mò hoặc hỏi lại nội bộ.

### Key Results (OKR Format)

| # | Key Result | Baseline | Target | Đo bằng |
|---|-----------|---------|--------|---------|
| KR1 | % vendor active được lưu trong system (thay vì Excel) | 0% | ≥90% trong 60 ngày sau launch | Số vendor trong system / tổng vendor active |
| KR2 | Thời gian Vendor PIC tra cứu thông tin 1 nhân sự | ~10 phút | ≤1 phút | User testing / self-reported |
| KR3 | % dự án có đủ fields để tính margin chính xác | ~40% | ≥85% trong 30 ngày sau launch | System data completeness report |
| KR4 | Tần suất DU Leader mở dashboard review | N/A | ≥2 lần/tuần | Session logs |
| KR5 | % Vendor PIC dùng system thay vì Excel | 0% | ≥80% trong 45 ngày sau launch | DAU/WAU metric |
| **KR6** | **% assignment có Billing Rate được lấy từ Rate Norm (không nhập tay)** | 0% | **≥70% trong 30 ngày sau launch** | System audit log |
| **KR7** | **Số rate drift alerts được DU Leader review trong tháng đầu** | N/A | **≥1 alert được xử lý** | Alert resolution log |

---

## 5. Market Segments (User Personas)

### Persona 1 — DU Leader: "The Strategist"

> **Hưng, 36 tuổi — DU Leader DU8**
> Quản lý ~80 nhân sự, ~15 dự án, thị trường tiếng Anh. Có nền tảng kỹ thuật (Magento, .NET, Java) và quản trị CNTT. Đang tập trung tối ưu P&L và scale DU.

**Jobs to be done**:
- Xem tổng quan headcount và margin toàn DU trong <5 phút
- Set pricing strategy một lần, hệ thống áp dụng nhất quán cho toàn DU
- Nhận cảnh báo khi rate thị trường thay đổi để điều chỉnh kịp thời
- Báo cáo DU8 lên BOD mà không cần compile thủ công

**Pain points hiện tại**:
- Phải ping nhiều người để lấy số liệu
- Không biết real-time margin từng dự án
- Sale báo giá không nhất quán vì không có rate card chuẩn
- Không có cơ chế nào alert khi rate vendor thực tế vượt quá target

**Constraints**:
- Ít thời gian — cần thông tin nhanh
- Muốn set policy ở cấp cao, không muốn xử lý chi tiết từng member

---

### Persona 2 — Vendor PIC: "The Operator"

> **Vendor PIC (NTQ Internal Staff)**
> Làm việc trực tiếp với vendor bên ngoài, quản lý hàng ngày thông tin nhân sự, follow-up chất lượng, negotiate rate với vendor.

**Jobs to be done**:
- Tra cứu nhanh thông tin nhân sự (level, rate, project, trạng thái)
- Khi nhận CV từ vendor, biết ngay Vendor Target Rate để đánh giá hợp lệ không
- Assign member vào project với rate đúng — không nhập tay lại từ đầu
- Khi rate vendor thực tế cao hơn target, có cách báo lên DU Leader dễ dàng

**Pain points hiện tại**:
- Không có bảng tham chiếu rate chuẩn — mỗi PIC negotiate theo kinh nghiệm riêng
- Phải tính tay hoặc hỏi DU Leader mỗi khi cần biết nên offer giá bao nhiêu
- Khi có bất thường về rate, không biết cần report cho ai và theo format nào

**Constraints**:
- UX đơn giản, ít click
- Cần desktop-first, search/filter nhanh

---

## 6. Value Propositions

### Module 1: Vendor Profile Hub

| Dimension | Nội dung |
|-----------|---------|
| **Who** | Vendor PIC quản lý danh sách vendor và nhân sự |
| **Why (Before)** | Thông tin nằm rải rác — mất thời gian tìm, dễ nhầm |
| **How** | Profile page tập trung cho mỗi vendor: thông tin chung, nhân sự, lịch sử dự án |
| **What After** | Tra cứu bất kỳ thông tin nào trong <1 phút, luôn up-to-date |
| **Gains** | Tiết kiệm thời gian, giảm sai sót, đánh giá vendor có căn cứ |
| **Alternatives** | Excel rải rác, email, Slack |

### Module 2: Project-Headcount Tracker

| Dimension | Nội dung |
|-----------|---------|
| **Who** | DU Leader cần P&L visibility; Vendor PIC cần theo dõi assignment |
| **Why (Before)** | Margin không biết real-time; assignment phải nhớ hoặc tra nhiều file |
| **How** | Dashboard tổng hợp dự án: headcount, billing rate, vendor rate, margin |
| **What After** | DU Leader xem P&L snapshot bất cứ lúc nào; biết ngay dự án nào đang lệch |
| **Gains** | Quyết định sourcing nhanh hơn; identify revenue risk sớm |
| **Alternatives** | Tổng hợp Excel thủ công trước mỗi meeting |

### Module 3: Rate Engine

| Dimension | Nội dung |
|-----------|---------|
| **Who** | DU Leader set pricing strategy; Vendor PIC dùng rate để negotiate và assign |
| **Why (Before)** | Không có rate chuẩn — Sale báo giá không nhất quán, PIC negotiate cảm tính |
| **How** | Bảng Rate Norm (Job × Stack × Level × Domain) + công thức Vendor Target Rate + override 3 tầng + alert khi rate drift |
| **What After** | Mọi pricing decision đều có căn cứ từ dữ liệu. PIC biết chính xác nên offer vendor bao nhiêu. DU Leader được alert khi thị trường thay đổi. |
| **Gains** | Margin được bảo vệ từ đầu, không phải fix sau; Sale tự tin báo giá; PIC không cần đoán mò |
| **Alternatives** | Estimate cá nhân, hỏi DU Leader mỗi lần, không có baseline để so sánh |

---

## 7. Solution

### 7.1 User Flows

#### Flow A — Vendor PIC: Thêm vendor mới
```
Vendor PIC nhận thông tin vendor mới
  → [Vendors] → [+ Add Vendor]
  → Nhập thông tin cơ bản: Tên, Size, Language strength
  → Save → Profile page tự động tạo
```
> ⚠️ **v1.3**: Vendor không còn phân theo Market. Trường "Thị trường hoạt động" đã bị xóa khỏi form tạo vendor. Market được xác định theo **dự án** (Project), không phải theo vendor.

#### Flow B — Vendor PIC: Thêm nhân sự từ vendor
```
Vendor gửi CV qua email
  → Chọn Vendor → [Personnel] → [+ Add Member]
  → Nhập: Tên, Job, Tech Stack, Level, Domain, English Level, Leadership
  → System auto-lookup: hiển thị Rate Norm range cho profile này
  → Nhập Vendor Rate thực tế
  → Nếu Vendor Rate > Vendor Target Rate + threshold% → Show warning (Rate Drift)
  → Save
```

#### Flow C — Vendor PIC: Assign member vào dự án
```
Khách hàng confirm thuê nhân sự
  → [Projects] → Chọn project → [+ Assign Member]
  → Chọn nhân sự từ pool
  → System auto-suggest 3 giá trị:
      [1] Billing Rate = Project Rate (lấy từ Rate Norm, hoặc project override nếu có)
      [2] Vendor Rate = rate từ personnel profile (auto-fill)
      [3] Vendor Target Rate = (Billing Rate - Billing Rate × OverheadRate%) × MarketFactor%
  → Vendor PIC có thể override Billing Rate cho riêng member này (hiển thị delta vs norm)
  → Save → Margin tự tính
```

#### Flow D — DU Leader: Xem P&L overview
```
DU Leader vào Dashboard
  → Summary cards: Headcount / Revenue / Cost / Avg Margin%
  → Xem Rate Alerts badge (nếu có drift chưa xử lý)
  → Drill down vào project hoặc vendor cụ thể
```

#### Flow E — DU Leader: Setup Rate Norm Table
```
DU Leader vào [Settings] → [Rate Management] → [Rate Norm]
  → Xem Rate Matrix Grid: hàng = Job+Level, cột = Tech Stack
  → Click cell để edit: nhập rate_min, rate_norm, rate_max
  → Set effective date (áp dụng từ ngày nào)
  → Save → Toàn bộ assignment mới tự lấy norm này làm default
```

#### Flow F — DU Leader: Cấu hình Global Params
```
[Settings] → [Rate Management] → [Global Config]
  → Chỉnh OverheadRate% (ví dụ: 20%)
  → Chỉnh Rate Drift Alert Threshold% (ví dụ: 15%)
  → Save → Công thức Vendor Target Rate tự cập nhật cho tất cả lookups

[Settings] → [Rate Management] → [Global Config] → Section "Markets & Rate Factors"
  → Xem danh sách markets (ENGLISH, JAPAN, ...)
  → Chỉnh Rate Factor% cho từng market riêng lẻ
  → Market Factor được áp dụng theo market của từng dự án
```

#### Flow G — Vendor PIC: Xử lý Rate Drift Alert
```
Vendor PIC nhận notification: "Rate drift detected — Java Senior Developer"
  → Xem chi tiết: Norm rate = $1,500 | Avg vendor actual = $1,850 | Drift = +23%
  → Chọn action:
      [Flag for DU Leader] → DU Leader thấy trong Rate Alerts inbox
      [Update Norm] → Request DU Leader review và update Rate Norm
      [Dismiss] → Ghi nhận nhưng không action (kèm ghi chú lý do)
```

---

### 7.2 Key Features

#### MODULE 1: Vendor Profile Hub

**Feature 1.1 — Vendor Directory**
Danh sách tất cả vendor với thông tin tóm tắt. Search, filter theo ngôn ngữ/status.

> ⚠️ **v1.3**: Vendor không còn phân loại theo Market. Filter Market và cột Market đã bị xóa. Market được xác định theo Project, không theo Vendor.

*Fields bắt buộc*:
- Tên công ty, tên người liên hệ, email, số điện thoại
- Company size, language strength
- Status: Active / Inactive / On hold
- Ngày bắt đầu hợp tác, ghi chú đánh giá chung

**Feature 1.2 — Vendor Personnel List**
Tab nhân sự trong mỗi vendor profile, liệt kê toàn bộ nhân sự đã/đang làm.

*Fields bắt buộc — bao gồm rate dimensions mới*:
- Họ tên
- **Job** (Developer, Tester, BA, DevOps, Designer...)
- **Primary Tech Stack** (Java, Golang, .NET, React, Python...)
- **Technical Level** (Junior / Middle / Senior / Leader / Principal)
- **Domain** (Fintech, Healthcare, E-commerce, General...)
- English Level (Basic / Intermediate / Advanced / Fluent)
- Leadership capability (Yes/No + ghi chú)
- Vendor rate thực tế (USD/tháng)
- **Vendor Target Rate** (computed, read-only — xem section Rate Engine)
- **Rate status**: Within target / Above target / Below target (auto-colored)
- Trạng thái: Available / On Project / Ended
- Interview process status: New → Screening → Technical Test → Interview → Passed / Failed
- Ghi chú kỹ thuật (free text)

**Feature 1.3 — Candidate Pipeline View**
Kanban view ứng viên đang tuyển, grouped theo vị trí. Mỗi card hiện status, vendor, thời gian ở bước hiện tại.

---

#### MODULE 2: Project-Headcount Tracker

**Feature 2.1 — Project List**
Danh sách dự án với thông tin tóm tắt và P&L nhanh.

*Fields bắt buộc*:
- Tên dự án, thị trường, tên khách hàng
- Start date, End date (dự kiến), Status
- Tổng headcount, Monthly revenue, Monthly cost, Gross margin%

**Feature 2.2 — Headcount Assignment** *(Updated — tích hợp Rate Engine)*
Gắn nhân sự vào dự án với rate được auto-suggest từ Rate Engine.

*Fields*:
- Nhân sự (chọn từ pool), Vendor (auto-fill), Role trong dự án
- **Billing Rate**: auto-fill từ Project Rate Norm → có thể override per member → hiển thị `(+X% vs norm)` nếu override
- **Vendor Rate**: auto-fill từ personnel profile → có thể chỉnh nếu có thỏa thuận riêng
- **Vendor Target Rate**: computed, read-only — Vendor PIC thấy ngay target so với actual vendor rate
- Start date / End date, Status

**Feature 2.3 — Project P&L Summary Card**
Tự động tính: Monthly revenue / Monthly cost / Gross margin / Margin%.

**Feature 2.4 — DU Dashboard**
- Summary cards: Headcount / Revenue / Cost / Avg Margin%
- **Rate Alerts badge**: Số alerts chưa xử lý
- Bar chart Revenue by project, Pie chart Headcount by vendor
- Project table (sortable theo margin)
- Quick filter: by vendor / market / status

---

#### MODULE 3: Rate Engine *(Mới — v1.1)*

**Feature 3.1 — Rate Norm Table (Bảng Rate Chuẩn Thị Trường)**

Mục đích: Là nguồn tham chiếu chính thức cho toàn DU8. Sale dùng để báo giá. Vendor PIC dùng làm baseline để negotiate với vendor.

Cấu trúc bảng Rate Norm — mỗi record xác định bởi 4 dimensions:

| Dimension | Giá trị ví dụ |
|-----------|--------------|
| **Job** | Developer, Tester, BA, DevOps, Designer, PM... |
| **Tech Stack** | Java, Golang, .NET, React, Python, Generic... |
| **Level** | Junior / Middle / Senior / Leader / Principal |
| **Domain** | Fintech, Healthcare, E-commerce, General... |

Mỗi record có: `rate_min` / `rate_norm` / `rate_max` (USD/tháng) và `effective_date`.

*Ví dụ*: Java + Senior + Fintech = $1,800 / $2,000 / $2,400

*UI — Rate Matrix Grid*: Hiển thị dạng bảng 2 chiều (hàng = Job+Level, cột = Tech Stack), có thể filter theo Domain và Market. Click cell để edit inline.

*Lookup logic*: Nếu không có exact match (ví dụ không có Domain Fintech thì fallback về General, không có Tech Stack Python thì fallback về Generic).

---

**Feature 3.2 — Global Config Panel (Tham Số Công Thức)**

DU Leader cấu hình các tham số áp dụng toàn DU:

| Param | Mô tả | Ví dụ |
|-------|-------|-------|
| `OverheadRate%` | Phần trăm overhead trừ vào Project Rate trước khi tính vendor target | 20% |
| `DriftAlertThreshold%` | % chênh lệch so với Norm Rate để trigger cảnh báo | 15% |

> ⚠️ **`MarketRateFactor%` không còn là tham số toàn cục.** Rate Factor được cấu hình **riêng cho từng thị trường** trong bảng **Markets & Rate Factors** (xem Feature 3.2b bên dưới). Vendor Target Rate sẽ áp dụng đúng Market Factor theo thị trường của từng dự án.

**Feature 3.2b — Market Config (Hệ Số Thị Trường Theo Từng Market)**

Mỗi thị trường (market) có Rate Factor riêng, thay vì dùng một hệ số toàn cục:

| Market | Rate Factor | Ý nghĩa |
|--------|-------------|--------|
| ENGLISH | 80% | Thị trường tiếng Anh — tỉ lệ standard |
| JAPAN | 75% | Thị trường Nhật — cạnh tranh giá cao hơn |
| KOREA | 78% | Thị trường Hàn | 
| *(Custom)* | *(configurable)* | DU Leader có thể thêm market mới |

DU Leader có thể thêm / sửa / bật-tắt từng market trong UI. Rate Factor của market được dùng tự động khi tính Vendor Target Rate cho dự án thuộc thị trường đó.

**Công thức Vendor Target Rate** *(updated v1.2)*:
```
VendorTargetRate = (ProjectRate - (ProjectRate × OverheadRate%)) × MarketRateFactor[project.market]
```

*Ví dụ — Dự án thị trường ENGLISH (factor 80%)*:
ProjectRate = $2,000 | OverheadRate = 20% | MarketFactor[ENGLISH] = 80%
→ `VendorTargetRate = (2,000 - 400) × 80% = $1,280`

*Ví dụ — Dự án thị trường JAPAN (factor 75%)*:
ProjectRate = $2,000 | OverheadRate = 20% | MarketFactor[JAPAN] = 75%
→ `VendorTargetRate = (2,000 - 400) × 75% = $1,200`

*Ý nghĩa*: Mỗi thị trường có biên độ khác nhau — Rate Engine tự động áp dụng đúng factor theo market của dự án, không cần DU Leader điều chỉnh thủ công.

---

**Feature 3.3 — Project Rate Override (Bảng Rate Thực Tế Theo Dự Án)**

Mục đích: Mỗi dự án có thể có billing rate khác nhau so với Rate Norm (do deal đặc biệt, khách hàng negotiate, thị trường đặc thù...).

*Cơ chế*:
- Mặc định: Project Rate = Rate Norm (kế thừa, không cần nhập)
- Override: DU Leader hoặc Vendor PIC có thể set Project Rate riêng cho một combination Job+Stack+Level trong một dự án cụ thể
- Mọi assignment trong dự án đó sẽ tự dùng Project Rate này làm default (thay vì Rate Norm)

*UI*: Trong Project detail page → Tab "Rate Settings" → Bảng hiện rate mặc định kế thừa từ Norm → Nhấn "Override" để set custom rate cho project này.

---

**Feature 3.4 — Member Rate Override (Per-Member Billing Rate)**

Mục đích: Một member cụ thể trong dự án có thể có billing rate khác với Project Rate (thỏa thuận riêng với khách hàng).

*Cơ chế*: Khi assign member → trường Billing Rate có thể edit → system hiển thị:
- Rate gốc: `$2,000 (from project norm)`
- Rate override: `$2,200`
- Delta: `+$200 (+10% vs norm)` — màu vàng nếu <20%, màu đỏ nếu ≥20%

*Lưu ý*: Override chỉ ảnh hưởng đến member này trong dự án này — không thay đổi Rate Norm hay Project Rate gốc.

---

**Feature 3.5 — Rate Drift Alert (Cảnh Báo Lệch Rate Thị Trường)**

Mục đích: Khi rate thực tế vendor đang offer (từ actual assignments và personnel records) khác xa Rate Norm, DU Leader cần biết để cập nhật pricing strategy.

*Trigger*: Khi Vendor PIC nhập/cập nhật Vendor Rate của một nhân sự, system so sánh với Vendor Target Rate tính từ Rate Norm:
- Nếu `|VendorActualRate - VendorTargetRate| / VendorTargetRate > DriftThreshold%` → tạo Rate Drift Alert

*Ngoài ra*: Vendor PIC có thể manually trigger "Report Rate Drift" từ bất kỳ personnel record nào.

*Alert detail bao gồm*:
- Job + Stack + Level + Domain bị ảnh hưởng
- Rate Norm hiện tại vs. Vendor Actual Rate trung bình (từ các records hiện có)
- % chênh lệch
- Danh sách vendors đang offer rate này

*Vendor PIC actions*: Flag for DU Leader / Dismiss with note
*DU Leader actions*: Update Rate Norm / Acknowledge / Snooze 30 ngày

*Scope Phase 1*: Alert dựa trên manual trigger và on-save check. Automated background scan → Phase 2.

---

### 7.3 Technology Notes

*(Để Tech Lead xác nhận)*

- **Frontend**: Web app desktop-first, responsive
- **Backend**: REST API — Java/.NET (stack NTQ quen)
- **Database**: Relational DB (PostgreSQL / MySQL) — nhiều relationships và joins
- **Rate Engine**: Stateless calculation service — nhận input (Job, Stack, Level, Domain, ProjectRate, Config params) và trả về VendorTargetRate. Dễ test, dễ mock.
- **Auth**: SSO nội bộ NTQ nếu có; hoặc RBAC basic (DU Leader / Vendor PIC)
- **Data import**: One-time Excel migration tool

**Phân quyền Rate Engine**:
| Action | DU Leader | Vendor PIC |
|--------|-----------|-----------|
| Xem Rate Norm | ✅ | ✅ |
| Edit Rate Norm | ✅ | ❌ |
| Edit Global Config (Overhead, DriftThreshold) | ✅ | ❌ |
| Edit Market Rate Factor (per market) | ✅ | ❌ |
| Sử dụng Rate Calculator | ✅ | ✅ |
| Set Project Rate Override | ✅ | ✅ (với DU Leader approval) |
| Override Member Billing Rate | ✅ | ✅ |
| Xem Vendor Target Rate | ✅ | ✅ |
| Xem P&L và margin | ✅ | ⚠️ Configurable (DU Leader quyết định) |
| Flag Rate Drift Alert | ✅ | ✅ |
| Resolve/Dismiss Alert | ✅ | ❌ |

---

### 7.4 Assumptions (Phase 1)

| # | Assumption | Rủi ro nếu sai | Cách validate |
|---|-----------|----------------|---------------|
| S1 | Vendor PIC nhập liệu thay cho vendor | Dữ liệu thiếu / không chính xác | Shadow workflow observation (E1.2) |
| S2 | Rate thông tin có thể centralize theo policy NTQ | Compliance issue | Confirm với DU Leader và HR |
| S3 | DU8 có đủ dữ liệu lịch sử để populate system | Start fresh với dữ liệu rỗng | Data Audit Sprint (E3.1) |
| S4 | Vendor PIC chuyển từ Excel sang system trong 45 ngày | Adoption chậm | Onboarding + training |
| **S5** | **OverheadRate% và per-market RateFactor% ổn định đủ lâu để Rate Norm có giá trị** | Config thay đổi liên tục → PIC bị confuse | DU Leader confirm policy ổn định ≥1 quý trước khi launch |
| **S6** | **Rate Norm hiện tại có thể được set ngay từ đầu với đủ Job × Stack × Level combinations** | Bảng rate rỗng quá → PIC không dùng được lookup | Data seeding sprint: DU Leader fill Rate Norm table trước khi launch |
| **S7** | **15% drift threshold là phù hợp để alert — không quá nhiều false positives** | Quá nhiều alert → PIC ignore tất cả | Có thể điều chỉnh threshold sau 2 tuần đầu |
| **S8** | **Công thức VendorTargetRate = ProjectRate × Market% × (1-Overhead%) là đúng theo business logic của NTQ** | Tính sai target → PIC negotiate sai | DU Leader confirm công thức trước khi build |
| **S9** | **Vendor không còn gắn với Market — Market xác định theo Project** | Hiểu sai dữ liệu lịch sử | DU Leader xác nhận trước khi migrate dữ liệu cũ |

---

## 8. Release Plan

### Phase 1 Scope (MVP — "Foundation Release")

**Mục tiêu**: Thay thế hoàn toàn Excel tracking cho Vendor Profile, Project Headcount và Rate Management trong DU8.

**Included in Phase 1**:

*Module 1 — Vendor Profile Hub*:
- ✅ Vendor Directory (CRUD full)
- ✅ Personnel List per Vendor — bao gồm Job, Stack, Level, Domain fields
- ✅ Candidate Pipeline View
- ✅ Vendor Target Rate display trên personnel record

*Module 2 — Project-Headcount Tracker*:
- ✅ Project List (CRUD full)
- ✅ Headcount Assignment với Rate auto-suggest
- ✅ Per-member Billing Rate override với delta indicator
- ✅ Project P&L Summary Card
- ✅ DU Dashboard (summary cards + project table + Rate Alerts badge)

*Module 3 — Rate Engine*:
- ✅ Rate Norm Table (CRUD — DU Leader only)
- ✅ Rate Matrix Grid View
- ✅ Global Config Panel (OverheadRate%, DriftThreshold%)
- ✅ Market Config Table (per-market Rate Factor% — CRUD, toggle active)
- ✅ **Rate Calculator** (công cụ tính 2 chiều: Billing Rate ↔ Max Vendor Rate)
- ✅ Project Rate Override
- ✅ Vendor Target Rate — computed display trên assignment và personnel
- ✅ Rate Drift Alert — manual trigger + on-save check
- ✅ Alert inbox cho Vendor PIC (Flag) và DU Leader (Resolve)

*Common*:
- ✅ Search & Filter cơ bản
- ✅ Import từ Excel (one-time migration + Rate Norm seeding)
- ✅ Role-based access: DU Leader / Vendor PIC

**Excluded from Phase 1** (dành cho Phase 2+):
- ❌ Rate Drift automated background scan (scheduled job) → Phase 2
- ❌ Rate history & versioning với trend charts → Phase 2
- ❌ Sale Rate Card PDF export → Phase 2
- ❌ Automated follow-up reminders (W1/W3/W4/W8) → Phase 2
- ❌ Contract lifecycle management → Phase 2
- ❌ Vendor ranking & scoring engine → Phase 3
- ❌ Advanced analytics → Phase 3
- ❌ AI CV parser → Phase 3

---

### Timeline Estimate (Updated)

| Milestone | Thời gian | Ghi chú |
|-----------|-----------|---------|
| Rate Norm seeding (DU Leader fill bảng rate) | 1 tuần | Làm song song với design — prerequisite cho launch |
| Design + Wireframe | 2-3 tuần | Rate Engine UX cần thêm 1 tuần so với v1.0 |
| Backend development | 4-5 tuần | Rate Engine + Formula Service thêm ~1 tuần |
| Frontend development | 4-5 tuần | Rate Matrix Grid + Smart Suggest UI phức tạp hơn |
| Integration + Testing | 1-2 tuần | UAT với Vendor PIC và DU Leader |
| Data migration + Launch | 1 tuần | Import dữ liệu cũ + verify Rate Norm |
| **Tổng** | **~13-17 tuần** | Tăng ~3-4 tuần so với v1.0 do Rate Engine |

*Lưu ý: Timeline cần Tech Lead confirm. Có thể rút ngắn nếu Rate Engine Formula Service được build riêng song song.*

---

### Success Criteria for Phase 1 Sign-off

Phase 1 thành công khi đạt **tất cả** điều kiện sau trong vòng 60 ngày sau launch:
1. ≥90% vendor active được nhập vào system
2. ≥85% dự án có đủ fields để tính margin chính xác
3. ≥80% Vendor PIC dùng system thay vì Excel
4. **Rate Norm Table được populate đầy đủ cho ≥80% combinations hiện đang dùng**
5. **≥70% assignment có Billing Rate lấy từ Rate Norm (không nhập tay từ đầu)**

---

## Appendix A: Data Model (Updated v1.1)

```
── RATE TAXONOMY (Master tables — DU Leader manages) ──────────────────
JOB_TYPES          (id, name)          -- Developer, Tester, BA...
TECH_STACKS        (id, name)          -- Java, Golang, .NET...
LEVELS             (id, name, order)   -- Junior, Middle, Senior, Leader, Principal
DOMAINS            (id, name)          -- Fintech, Healthcare, General...

── RATE ENGINE ─────────────────────────────────────────────────────────
RATE_NORM
  ├── id, job_type_id, tech_stack_id, level_id, domain_id, market
  ├── rate_min, rate_norm, rate_max   (USD/month)
  └── effective_date, created_by, created_at

SYSTEM_CONFIG      (key, value, updated_by, updated_at)
  -- overhead_rate_pct          e.g. "0.20"
  -- drift_alert_threshold_pct  e.g. "0.15"
  -- (market_rate_factor_pct đã bị xóa — v1.2)

MARKET_CONFIG      (id, code, name, market_rate_factor_pct, is_active, order)
  -- ENGLISH  → factor 0.80
  -- JAPAN    → factor 0.75
  -- KOREA    → factor 0.78
  -- *(DU Leader có thể thêm market mới)*

PROJECT_RATE_OVERRIDE
  ├── id, project_id, job_type_id, tech_stack_id, level_id, domain_id
  └── custom_billing_rate, set_by, set_at
  -- null = inherit from RATE_NORM

RATE_ALERT
  ├── id, job_type_id, tech_stack_id, level_id
  ├── norm_rate, actual_avg_vendor_rate, drift_pct
  ├── triggered_by (user_id), triggered_at
  └── status: pending / flagged / resolved / dismissed
  -- note (free text, required when dismissed)

── CORE ENTITIES ───────────────────────────────────────────────────────
VENDOR
  ├── id, name, contact_name, contact_email, contact_phone
  ├── company_size, language_strength
  ├── status, start_date, notes
  └── [has many] PERSONNEL
  -- NOTE v1.3: field `market` đã bị xóa khỏi VENDOR — market xác định theo PROJECT

PERSONNEL
  ├── id, vendor_id, full_name
  ├── job_type_id, tech_stack_id, level_id, domain_id  ← rate dimensions
  ├── english_level, leadership, vendor_rate_actual
  ├── status, interview_status, notes
  └── [computed] vendor_target_rate
       = (rate_norm - rate_norm × overhead%) × market_factor%

PROJECT
  ├── id, name, market, client_name, start_date, end_date, status, notes
  └── [has many through ASSIGNMENT] PERSONNEL

ASSIGNMENT
  ├── id, personnel_id, project_id, role_in_project
  ├── billing_rate         -- nullable: resolve chain → PROJECT_RATE_OVERRIDE → RATE_NORM
  ├── billing_rate_override_note
  ├── vendor_rate          -- nullable: inherit from PERSONNEL.vendor_rate_actual
  ├── start_date, end_date, status
  └── [computed fields]
       vendor_target_rate  = (resolved_billing_rate - resolved_billing_rate×overhead%) × market_factor%
       gross_margin        = resolved_billing_rate - resolved_vendor_rate
       gross_margin_pct    = gross_margin / resolved_billing_rate × 100
```

**Rate Resolution Chain** (tầng kế thừa):
```
Billing Rate cho 1 assignment =
  IF assignment.billing_rate IS NOT NULL → dùng giá trị này (member override)
  ELSE IF project_rate_override EXISTS cho (project + job + stack + level + domain) → dùng giá trị này
  ELSE → dùng RATE_NORM.rate_norm (market standard)
```

---

## Appendix B: Rate Engine — Ví dụ End-to-End *(Updated v1.3)*

**Setup (DU Leader)**:
- Rate Norm: Java + Senior + Fintech = $2,000/month
- OverheadRate% = 20%
- MarketFactor[ENGLISH] = 80% | MarketFactor[JAPAN] = 75%
- Dự án thị trường ENGLISH → Vendor Target Rate = (2,000 - 400) × 80% = **$1,280**
- Dự án thị trường JAPAN → Vendor Target Rate = (2,000 - 400) × 75% = **$1,200**

**Scenario 1 — Normal case (English market)**:
Vendor A offer Java Senior: $1,200 → Below target ($1,280) ✅ Good deal, PIC có thể accept

**Scenario 2 — Above target**:
Vendor B offer Java Senior: $1,500 → Above target ($1,280) by 17.2% > threshold 15%
→ System alert: "Rate drift detected — Java Senior Fintech: Vendor B = $1,500 vs Target = $1,280 (+17.2%)"
→ Vendor PIC flags → DU Leader reviews → Quyết định: update Rate Norm lên $1,400 hoặc chỉ accept exception cho dự án này

**Scenario 3 — Japan market (lower factor)**:
Cùng Java Senior Fintech, nhưng dự án thị trường JAPAN:
→ Vendor Target Rate = (2,000 - 400) × 75% = **$1,200** (thấp hơn English market)
→ PIC tự động nhận context đúng khi assign member vào dự án Japan vs English

**Scenario 4 — Project override**:
Khách hàng dự án X trả $2,500 (thay vì $2,000 norm)
→ Vendor Target Rate cho dự án X (ENGLISH) = (2,500 - 500) × 80% = **$1,600**
→ PIC có thể offer vendor cao hơn mà vẫn đảm bảo margin

---

## Appendix C: Rate Calculator — Công Cụ Tính 2 Chiều *(Mới — v1.3)*

Công cụ tiện ích giúp DU Leader và Vendor PIC tính nhanh mức giá mà không cần biết trước Rate Norm. Đặt trong trang **Rate Config**, giữa Global Parameters và Markets & Rate Factors.

### Chiều 1: Billing Rate → Max Vendor Rate

Biết giá Sale bán cho khách (Billing Rate) và thị trường dự án → tính mức giá tối đa có thể tuyển vendor:

```
Max Vendor Rate = Billing Rate × Market Rate × (1 − Overhead Rate)
```

*Ví dụ*: Billing = $2,000 | Market ENGLISH = 80% | Overhead = 20%
→ Max Vendor Rate = 2,000 × 0.8 × 0.8 = **$1,280**

### Chiều 2: Max Vendor Rate → Billing Rate

Biết mức giá tối đa có thể tuyển vendor (Max Vendor Rate) → tính giá cần bán cho khách để đảm bảo margin:

```
Billing Rate = (Max Vendor Rate + Max Vendor Rate ÷ (1 − Overhead) × Overhead) ÷ Market Rate
```

*Ví dụ*: Max VR = $1,280 | Market ENGLISH = 80% | Overhead = 20%
→ Billing Rate = (1,280 + 1,280/0.8 × 0.2) / 0.8 = (1,280 + 320) / 0.8 = **$2,000**

### Giải thích toán học

2 chiều là inverse của nhau — chứng minh: chiều 2 rút gọn thành `BR = VR / (Market × (1-Overhead))`, đúng là inverse của chiều 1.

| Input | Thị trường | Output |
|-------|-------------|--------|
| Billing Rate = $3,000 | JAPAN (75%) | Max VR = 3,000 × 0.75 × 0.8 = **$1,800** |
| Max VR = $1,800 | JAPAN (75%) | Billing = (1,800 + 450) / 0.75 = **$3,000** |

---

*PRD v1.3 — 2026-03-18 | Owner: Phạm Quốc Hưng | DU8 — NTQ Solution*
*Next: Tech Lead review → Confirm công thức Rate Engine → UX Wireframe → Sprint Planning*
