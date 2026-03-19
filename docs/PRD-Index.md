# PRD: Vendor Management System — Phase 1
## Index & Overview

> 🤖 **Agent**: Đọc file này TRƯỚC khi làm bất kỳ task nào liên quan đến nghiệp vụ.
> Chỉ đọc module file khi task liên quan trực tiếp:
> - Vendor/Personnel → `PRD-Module1-VendorHub.md`
> - Project/Assignment/Dashboard → `PRD-Module2-ProjectTracker.md`
> - Rate/Config/Alert/Calculator → `PRD-Module3-RateEngine.md`
> - RBAC/Auth/Tech → `PRD-Common.md`

**Version**: 1.5 · **Date**: 2026-03-19 · **Status**: Draft

| Version | Ngày | Thay đổi |
|---------|------|---------|
| v1.0 | 2026-03-17 | Initial PRD — Vendor Profile Hub + Project Tracker |
| v1.1 | 2026-03-17 | Bổ sung Module 3: Rate Engine — Rate Norm, 3-layer inheritance, Vendor Target Rate, Rate Drift Alert |
| v1.2 | 2026-03-18 | `MarketRateFactor%` → per-market config (MarketConfig table). Xóa global fallback. |
| v1.3 | 2026-03-18 | Vendor không phân theo Market. Thêm Rate Calculator 2 chiều. Xóa market khỏi Vendor entity. |
| v1.4 | 2026-03-18 | **Personnel: Tech Stack và Domain → optional**. BA/PM/Designer có thể bỏ trống. DB schema đã migrate (nullable). Rate Lookup bỏ qua filter khi null. |
| v1.5 | 2026-03-19 | **Personnel CV Management** (nhiều version, add lúc create). **Project P&L card** trên detail page. **Assignment Edit/Delete**. Rate columns trong Assignment table. |

---

## 1. Summary

Phase 1 gồm **3 module**: **Vendor Profile Hub** + **Project-Headcount Tracker** + **Rate Engine**. Phục vụ 2 users nội bộ: **DU Leader** và **Vendor PIC** của DU8, NTQ Solution.

---

## 2. Contacts

| Tên | Vai trò |
|-----|---------|
| Phạm Quốc Hưng | DU Leader — DU8, Product Owner |
| Vendor PIC Lead | NTQ Internal Staff, Primary user |

---

## 3. Objective & Key Results

Xây dựng hệ thống cho phép DU Leader và Vendor PIC **quản lý vendor, nhân sự, dự án và rate** trong một nơi duy nhất — với Rate Engine đảm bảo pricing dựa trên dữ liệu.

| # | Key Result | Target |
|---|-----------|--------|
| KR1 | % vendor active trong system | ≥90% trong 60 ngày |
| KR2 | Thời gian tra cứu nhân sự | ≤1 phút |
| KR3 | % dự án đủ fields tính margin | ≥85% trong 30 ngày |
| KR4 | DU Leader mở dashboard | ≥2 lần/tuần |
| KR5 | % PIC dùng system thay Excel | ≥80% trong 45 ngày |
| KR6 | % assignment có Billing Rate từ Norm | ≥70% trong 30 ngày |
| KR7 | Drift alerts được review | ≥1 trong tháng đầu |

---

## 4. Module Map

| Module | File | Features |
|--------|------|----------|
| **1. Vendor Profile Hub** | [PRD-Module1](PRD-Module1-VendorHub.md) | Vendor Directory, Personnel List, Pipeline View |
| **2. Project-Headcount Tracker** | [PRD-Module2](PRD-Module2-ProjectTracker.md) | Project List, Assignment, P&L Card, DU Dashboard |
| **3. Rate Engine** | [PRD-Module3](PRD-Module3-RateEngine.md) | Rate Norm, Global Config, Market Config, Rate Calculator, Project/Member Override, Drift Alert |
| **Common** | [PRD-Common](PRD-Common.md) | RBAC, Tech Notes, Assumptions |

---

## 5. Release Plan (Phase 1 Scope)

**Included**:
- ✅ Module 1: Vendor CRUD + Personnel + Pipeline
- ✅ Module 2: Project CRUD + Assignment + P&L + Dashboard
- ✅ Module 3: Rate Norm + Config + Market Config + Rate Calculator + Override + Alert
- ✅ Common: Search/Filter, Import Excel, RBAC

**Excluded** (Phase 2+):
- ❌ Automated drift scan (scheduled job)
- ❌ Rate history & trend charts
- ❌ Sale Rate Card PDF export
- ❌ Automated follow-up reminders
- ❌ Contract lifecycle, Vendor ranking, AI CV parser

### Timeline

| Milestone | Thời gian |
|-----------|-----------|
| Rate Norm seeding | 1 tuần |
| Design + Wireframe | 2-3 tuần |
| Backend development | 4-5 tuần |
| Frontend development | 4-5 tuần |
| Integration + Testing | 1-2 tuần |
| Data migration + Launch | 1 tuần |
| **Tổng** | **~13-17 tuần** |

### Success Criteria

1. ≥90% vendor active trong system
2. ≥85% dự án đủ fields tính margin
3. ≥80% PIC dùng system
4. ≥80% Rate Norm combinations populated
5. ≥70% assignment có Billing Rate từ Norm

---

*PRD v1.5 — 2026-03-19 | Owner: Phạm Quốc Hưng | DU8 — NTQ Solution*
