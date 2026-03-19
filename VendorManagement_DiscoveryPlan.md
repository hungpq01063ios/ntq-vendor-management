# Discovery Plan: NTQ Internal Vendor Management System

**Date**: 2026-03-17 | **Last Updated**: 2026-03-17 (v1.1)
**Owner**: Phạm Quốc Hưng — DU Leader, DU8, NTQ Solution
**Product Stage**: New Internal Product
**Discovery Question**: *Làm thế nào để xây dựng một hệ thống quản lý vendor nội bộ giúp DU Leader và Vendor PIC tối ưu hóa toàn bộ vòng đời nhân sự — từ tuyển dụng → onboard → follow-up → kết thúc hợp đồng — và cải thiện P&L visibility cho DU8?*

---

## Changelog

| Version | Ngày | Nội dung thay đổi |
|---------|------|------------------|
| v1.0 | 2026-03-17 | Initial discovery plan |
| v1.1 | 2026-03-17 | **Clarify user scope**: Chỉ DU Leader + Vendor PIC là người dùng hệ thống. External vendor không thao tác. Cập nhật assumptions A1/A4/A11 và experiments E1.1/E1.2 tương ứng. |

---

## Context Summary

**Tổ chức**: NTQ Solution — DU8, thị trường tiếng Anh (~80 nhân sự, ~15 dự án)
**Vấn đề hiện tại**: Quản lý vendor đang phân tán qua nhiều file Excel, email, chat — không có single source of truth
**Mục tiêu chiến lược**: Tối ưu P&L, mở rộng quy mô DU8, nâng vị thế thị trường tiếng Anh của NTQ
**Vòng đời nhân sự**: Tuyển dụng → Offer → Onboard → Follow (W1/W3/W4/W8/Monthly) → Gia hạn → Kết thúc

**Nguồn dữ liệu đầu vào**:
- `VendorManagementIdea.xlsx` — 5 nhóm yêu cầu nghiệp vụ
- `Quy trình follow nhân sự.xlsx` — Quy trình chi tiết 5 giai đoạn

---

## ⚠️ User Scope (Updated v1.1)

> **Internal users duy nhất của hệ thống là:**
>
> 👤 **DU Leader (Phạm Quốc Hưng)** — Xem P&L overview, vendor performance, headcount toàn DU, ra quyết định chiến lược sourcing
>
> 👤 **Vendor PIC (NTQ internal staff)** — Vận hành hàng ngày: nhập/theo dõi CV ứng viên, quản lý thông tin nhân sự theo vendor, thực hiện follow-up timeline, ghi chú đánh giá, cập nhật contract status
>
> ❌ **External Vendor** — **KHÔNG có quyền truy cập, KHÔNG thao tác trực tiếp** vào hệ thống. Họ là đối tượng *được quản lý*, không phải *người dùng*. Thông tin về vendor do Vendor PIC nhập vào thay.

---

## Ideas Explored (10 ideas — Brainstorm Phase)

| # | Idea | Góc nhìn |
|---|------|----------|
| 1 | Vendor Profile Hub — Hồ sơ vendor tập trung với scorecard động | PM |
| 2 | Smart CV Parser & Candidate Pipeline — AI bóc tách CV tự động | Engineer |
| 3 | Project-Headcount Tracker — Dashboard theo dõi dự án và headcount | PM |
| 4 | Automated Follow-up Engine — Trigger task theo timeline W1/W3/W4/W8 | PM + Engineer |
| 5 | Vendor Ranking & Scoring Engine — Leaderboard theo bộ tiêu chí có trọng số | PM |
| 6 | Rate Card & Budget Calculator — Bảng rate theo thị trường, auto tính budget | Engineer |
| 7 | Onboarding Workflow Automation — Digital checklist onboarding chuẩn hóa | Designer |
| 8 | Contract Lifecycle Manager — Quản lý hợp đồng từ tạo → ký → gia hạn → kết thúc | PM |
| 9 | Satisfaction Survey & Feedback Loop — Survey định kỳ tích hợp, tổng hợp tự động | Designer |
| 10 | Unified Analytics Dashboard — Báo cáo tổng hợp vendor performance, headcount, P&L | PM |

---

## Selected Ideas for Validation (5 ideas)

Tiêu chí lựa chọn: **Strategic alignment với P&L optimization + scale DU8**

| # | Idea | Lý do chọn |
|---|------|-----------|
| **#1** | Vendor Profile Hub | Foundation layer — không có profile chuẩn thì không quản lý được |
| **#3** | Project-Headcount Tracker | Visibility trực tiếp vào revenue/margin — critical cho DU Leader |
| **#4** | Automated Follow-up Engine | Quy trình W1/W3/W4/W8 hiện tại rất dễ bị bỏ sót nếu manual |
| **#5** | Vendor Ranking & Scoring | Xác định vendor chiến lược — tối ưu hóa sourcing decision |
| **#8** | Contract Lifecycle Manager | Tránh revenue leak do miss renewal — direct P&L impact |

---

## Critical Assumptions (Updated v1.1)

> **Ghi chú v1.1**: Loại bỏ A1 và A11 vì external vendor không dùng system. Revise A4 từ "Sale/PM" → "Vendor PIC + DU Leader".

| # | Assumption | Idea | Category | Impact | Uncertainty | Priority | Status |
|---|-----------|------|----------|--------|-------------|----------|--------|
| ~~A1~~ | ~~Vendor cung cấp thông tin chính xác khi nhập~~ | ~~#1~~ | ~~Value~~ | ~~Medium~~ | ~~Medium~~ | ~~P3~~ | ❌ **Loại bỏ** — Vendor PIC là người nhập thay |
| A2 | Vendor PIC duy trì cập nhật vendor profile thường xuyên | #1 | Usability | High | Medium | 🟠 P2 | Active |
| A3 | Dữ liệu vendor hiện tại đủ để migrate vào system | #1 | Feasibility | Medium | Medium | 🟡 P3 | Active |
| **A4** | **Vendor PIC + DU Leader sẽ adopt và dùng system thay cho Excel/email** | #3 | Usability | **HIGH** | **HIGH** | 🔴 P1 | ✏️ **Revised** — trước là "Sale/PM" |
| A5 | Billing rate có thể centralize mà không vi phạm policy bảo mật | #3 | Viability | High | Low | 🟡 P3 | Active |
| **A6** | Data quality đủ tốt để P&L dashboard có ý nghĩa | #3 | Value | **HIGH** | **HIGH** | 🔴 P1 | Active |
| **A7** | Vendor PIC hoàn thành follow-up checklist đúng timeline | #4 | Usability | **HIGH** | **HIGH** | 🔴 P1 | Active |
| A8 | Đánh giá nhân sự có thể standardize thành format aggregate | #4 | Feasibility | High | Medium | 🟠 P2 | Active |
| A9 | Follow-up automation giảm tỷ lệ churn sớm | #4 | Value | High | Medium | 🟠 P2 | Active |
| **A10** | Đủ historical data để vendor ranking meaningful | #5 | Feasibility | High | **HIGH** | 🟠 P2 | Active |
| ~~A11~~ | ~~Vendor chấp nhận ranking mà không phản ứng tiêu cực~~ | ~~#5~~ | ~~Viability~~ | ~~Medium~~ | ~~Medium~~ | ~~P3~~ | ❌ **Loại bỏ** — Ranking là internal-only, vendor không thấy |
| A12 | Tiêu chí ranking ổn định đủ lâu để so sánh có giá trị | #5 | Value | Medium | Low | 🟡 P3 | Active |
| A13 | Hợp đồng hiện tại có đủ metadata để digitize | #8 | Feasibility | Medium | Medium | 🟡 P3 | Active |
| A14 | Alert 30 ngày đủ để xử lý renewal | #8 | Usability | High | Low | 🟡 P3 | Active |
| **A15** | Centralize contract data không tạo legal/compliance risk | #8 | Viability | High | **HIGH** | 🔴 P1* | Active |

*A15: Cần legal team NTQ sign off — dependency quan trọng

---

## Validation Experiments (Updated v1.1)

### Experiment Matrix

> **Ghi chú v1.1**: E1.1 và E1.2 được revise — target user đổi từ "Sale/PM" sang "Vendor PIC + DU Leader".

| # | Tests | Method | Success Criteria | Effort | Timeline | Status |
|---|-------|--------|-----------------|--------|---------|--------|
| **E1.1** | A4 (Vendor PIC adoption) | Fake Door — prototype interface đơn giản gửi cho Vendor PIC + DU Leader | ≥70% completion trong 2 tuần | Thấp | T1-T2 | ✏️ Revised target |
| **E1.2** | A4 (Current workflow pain) | Shadow Workflow — quan sát Vendor PIC làm việc với Excel/email hiện tại | Identify ≥3 pain points cụ thể | Thấp | T1 | ✏️ Revised target |
| E2.1 | A7 (Follow-up compliance) | Concierge MVP — manual reminder qua Slack/email cho Vendor PIC | Compliance rate ≥75% | Thấp | T1-T4 | Unchanged |
| E2.2 | A7 (Checklist usability) | Google Sheet checklist prototype | ≥80% rows filled đúng deadline | Thấp | T1-T4 | Unchanged |
| E3.1 | A6 (Data quality) | Data Audit Sprint — kiểm tra completeness 6 fields cốt lõi | ≥70% records đủ 6 fields | Trung bình | T1-T2 | Unchanged |
| E3.2 | A6 (Dashboard value) | Pilot Excel/GSheet Dashboard — DU Leader review | DU Leader confirm: "đủ để ra decision" | Trung bình | T2-T3 | Unchanged |

---

## Experiment Details

### E1.1 — Fake Door Test: Vendor PIC + DU Leader Adoption (Revised)
**Hypothesis**: *Nếu interface đơn giản (≤5 fields/update), thì Vendor PIC sẽ prefer dùng system mới thay vì Excel trong vòng 2 tuần.*
**Setup**: Tạo mockup/Google Form với 5 fields: Vendor Name, Personnel Name, Level, Rate, Status — gửi cho Vendor PIC team và DU Leader dùng thử
**Measurement**: Adoption rate, time-to-complete, comment/feedback định tính
**Decision**: Rate ≥70% + feedback tích cực → build MVP | Rate <50% → redesign UX, interview thêm

---

### E1.2 — Shadow Workflow Observation (Revised)
**Hypothesis**: *Vendor PIC đang mất ≥1 giờ/tuần để manually compile và update thông tin nhân sự/vendor qua Excel và email.*
**Setup**: Ngồi cùng 2-3 Vendor PIC trong 1 tuần làm việc, quan sát workflow thực tế (không announce là đang đo)
**Measurement**: Thời gian dành cho manual tasks, số lần phải lookup thông tin ở nhiều nơi, lỗi/nhầm lẫn xảy ra
**Decision**: Xác nhận ≥3 pain points rõ ràng → prioritize features cho MVP | Ít pain points → reconsider scope

---

### E2.1 — Concierge MVP: Follow-up Engine
**Hypothesis**: *Reminder tự động sẽ tăng compliance rate của Vendor PIC từ ≤40% lên ≥75%.*
**Setup**: Chọn 3-5 nhân sự mới onboard, Vendor PIC thực hiện follow-up theo timeline, gửi reminder thủ công qua Slack
**Measurement**: % milestone hoàn thành đúng hạn vs. baseline cũ
**Decision**: Compliance ≥75% → automate | <60% → tìm root cause (process problem, không phải tool)

---

### E2.2 — Checklist Prototype
**Hypothesis**: *Checklist chuẩn hóa với timeline rõ ràng sẽ được adopt bởi ≥80% Vendor PIC.*
**Setup**: Google Sheet với columns: Member Name, Vendor, Onboard Date, W1 ✓, W3 ✓, W4 ✓, W8 ✓, Notes
**Measurement**: Fill rate theo từng milestone
**Decision**: Fill rate ≥80% → confirm user buy-in → proceed to digitize

---

### E3.1 — Data Audit Sprint
**Hypothesis**: *DU8 đang có ≥70% dữ liệu dự án đủ để tính margin cơ bản.*
**Setup**: Audit tất cả Excel/files, check 6 fields: project name, headcount, billing rate, vendor rate, start date, end date
**Measurement**: % records đầy đủ cả 6 fields
**Decision**: ≥70% complete → build dashboard MVP | <70% → data governance trước

---

### E3.2 — Pilot Dashboard
**Hypothesis**: *DU Leader sẽ xác nhận dashboard prototype đủ value để justify investment.*
**Setup**: Build Excel/GSheet dashboard từ dữ liệu audit, present trong management meeting
**Measurement**: DU Leader response: "Sẽ dùng" / "Cần thêm data" / "Không cần"
**Decision**: Positive → proceed to MVP | Neutral → thêm data sources | Negative → pivot scope

---

## Discovery Timeline

```
Week 1-2 (Sprint 1 — Validate Core Assumptions):
  - E1.1: Fake Door Test (Vendor PIC + DU Leader adoption)
  - E1.2: Shadow Workflow Observation (Vendor PIC current pain)
  - E3.1: Data Audit Sprint

Week 3-4 (Sprint 2 — Validate Operations):
  - E2.1: Concierge MVP — measure compliance (W1 data)
  - E2.2: Checklist Prototype — deploy & measure
  - E3.2: Pilot Dashboard — build & present

Week 5 (Decision Point):
  - Analyze all experiment results
  - Go/No-Go decision cho từng feature area
  - Finalize MVP scope
```

---

## Decision Framework

| If... | Then... |
|-------|---------|
| E1.1 adoption rate ≥70% | Build Vendor Profile Hub + Project Tracker MVP |
| E1.1 adoption rate <50% | Redesign UX, re-test trước khi commit resource |
| E2.1 compliance ≥75% | Build Automated Follow-up Engine |
| E2.1 compliance <60% | Investigate root cause — process problem, không phải tool |
| E3.1 data completeness ≥70% | Build P&L Dashboard trong MVP |
| E3.1 data completeness <70% | Tập trung data governance trước (1-2 sprints) |
| E3.2 DU Leader positive | Proceed to full MVP build với Dashboard là core feature |
| A15 legal risk confirmed | Scope out contract storage, dùng reference link thay vì full storage |

---

## MVP Scope Recommendation (Post-Discovery)

| Phase | Features | Timeline |
|-------|----------|---------|
| **Phase 1 — Foundation** | Vendor Profile Hub + Project-Headcount Tracker | Tuần 1-4 sau discovery |
| **Phase 2 — Operations** | Automated Follow-up Engine + Contract Alert System | Tuần 5-8 |
| **Phase 3 — Intelligence** | Vendor Ranking Engine + Analytics Dashboard | Tuần 9-12 |

---

## Risks & Dependencies (Updated v1.1)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Vendor PIC không adopt system mới | Medium | **Critical** | Involve Vendor PIC lead trong design phase, simplify UX tối đa |
| DU Leader không có thời gian review dashboard | Low | High | Design dashboard để có thể đọc trong <5 phút |
| Data migration từ Excel mất quá nhiều effort | High | Medium | Start fresh với new data, archive old files |
| Legal team không approve contract storage | Medium | High | Check với legal trước Phase 2 build |
| Không đủ headcount để own system lâu dài | Medium | High | Assign dedicated PIC trước khi launch |

---

## Next Steps

- [ ] **Ngay bây giờ**: Assign owner cho E1.2 (Shadow Workflow với Vendor PIC)
- [ ] **Tuần 1**: Kick off E1.1, E1.2, E3.1
- [ ] **Tuần 2**: Check-in mid-sprint, adjust nếu cần
- [ ] **Tuần 5**: Discovery Readout — Go/No-Go + finalize MVP scope
- [ ] **✅ Done**: PRD Phase 1 đã được viết (xem `PRD-VendorManagement-Phase1.md`)

---

*Living document — cập nhật khi có kết quả experiments.*
*v1.1 — 2026-03-17 | Owner: Phạm Quốc Hưng | DU8 — NTQ Solution*
