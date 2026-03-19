# PRD Common: RBAC, Tech Notes, Assumptions

> 📖 Xem [PRD-Index](PRD-Index.md) để hiểu tổng quan.

---

## RBAC — Phân Quyền

| Action | DU_LEADER | VENDOR_PIC |
|--------|-----------|------------|
| Xem Rate Norm | ✅ | ✅ |
| Edit Rate Norm | ✅ | ❌ |
| Edit Global Config (Overhead, DriftThreshold) | ✅ | ❌ |
| Edit Market Rate Factor (per market) | ✅ | ❌ |
| Sử dụng Rate Calculator | ✅ | ✅ |
| Set Project Rate Override | ✅ | ✅ (với DU Leader approval) |
| Override Member Billing Rate | ✅ | ✅ |
| Xem Vendor Target Rate | ✅ | ✅ |
| Xem P&L và margin | ✅ | ⚠️ Configurable |
| Flag Rate Drift Alert | ✅ | ✅ |
| Resolve/Dismiss Alert | ✅ | ❌ |
| CRUD Vendor / Personnel / Project | ✅ | ✅ |

---

## Technology Notes

- **Frontend**: Web app desktop-first, responsive
- **Stack**: Next.js 15 App Router · TypeScript · Prisma · PostgreSQL (Supabase)
- **UI**: shadcn/ui · Tailwind CSS
- **Auth**: NextAuth v5 · RBAC (DU_LEADER / VENDOR_PIC)
- **Rate Engine**: Pure functions in `src/lib/rate-engine.ts`, no DB calls
- **Deploy**: Vercel
- **Data import**: One-time Excel migration tool

---

## User Personas

### Persona 1 — DU Leader: "The Strategist"

> **Hưng, 36 tuổi — DU Leader DU8**
> Quản lý ~80 nhân sự, ~15 dự án. Tập trung tối ưu P&L và scale DU.

- JTBD: Xem tổng quan margin <5 phút, set pricing strategy, nhận alert, báo cáo BOD
- Pain: Ping nhiều người lấy data, không biết real-time margin, Sale báo giá không nhất quán
- Need: Thông tin nhanh, set policy cấp cao

### Persona 2 — Vendor PIC: "The Operator"

> **NTQ Internal Staff** — quản lý nhân sự vendor, negotiate rate.

- JTBD: Tra cứu nhanh, biết Vendor Target Rate, assign với rate đúng, report drift
- Pain: Không có rate chuẩn, tính tay, không biết report cho ai
- Need: UX đơn giản, desktop-first

---

## Assumptions

| # | Assumption | Rủi ro nếu sai |
|---|-----------|----------------|
| S1 | Vendor PIC nhập liệu thay vendor | Dữ liệu thiếu/sai |
| S2 | Rate info centralize được | Compliance issue |
| S3 | Đủ dữ liệu lịch sử populate | Start fresh |
| S4 | PIC chuyển Excel trong 45 ngày | Adoption chậm |
| S5 | Overhead% + per-market Factor% ổn định ≥1 quý | Config thay đổi liên tục |
| S6 | Rate Norm set đủ combinations từ đầu | Bảng rỗng |
| S7 | 15% drift threshold phù hợp | Quá nhiều false positives |
| S8 | Công thức VR = BR × Market × (1-Overhead) đúng | Tính sai target |
| S9 | Vendor không gắn market — market theo Project | Hiểu sai dữ liệu lịch sử |
