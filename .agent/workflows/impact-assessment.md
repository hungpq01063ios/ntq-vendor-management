---
description: Đánh giá impact khi thay đổi code hoặc thêm tính năng — tiết kiệm token
---

# Impact Assessment Workflow

> Dùng workflow này **TRƯỚC** khi bắt đầu code bất kỳ thay đổi nào liên quan đến nghiệp vụ,
> xóa/thêm field, hoặc sửa logic cross-cutting.

## Khi nào cần chạy workflow này?

- Xóa/thêm/đổi tên field trong entity
- Thay đổi công thức tính toán
- Thay đổi Zod schema hoặc Prisma model
- Thêm/xóa concept nghiệp vụ (vd: xóa Market khỏi Vendor)
- Thay đổi config keys (SystemConfig, MarketConfig)

## Steps

### Step 1: Đọc Dependency Map (~80 dòng)
// turbo
```
Đọc file docs/DEPENDENCY_MAP.md
```
Xác định domain concept bị ảnh hưởng → liệt kê affected files từ bảng.

### Step 2: Targeted grep (chỉ trong affected files)
// turbo
```
grep -rn "KEYWORD" <affected_file_1> <affected_file_2> ...
```
KHÔNG grep toàn codebase. Chỉ grep trong files đã xác định từ Step 1.

### Step 3: Đọc context tối thiểu

Chỉ đọc **hàm/block** liên quan trong mỗi file, KHÔNG đọc cả file.
Dùng `view_file` với `StartLine`/`EndLine` cụ thể.

### Step 4: Liệt kê impact summary

Trước khi code, tạo bảng impact:

```markdown
| File | Thay đổi cần làm | Độ rủi ro |
|------|------------------|-----------|
| lib/rate-engine.ts | Xóa field X từ interface | High |
| actions/rate.actions.ts | Bỏ X khỏi rateConfig builder | Medium |
| components/rate/ConfigForm.tsx | Xóa input field X | Low |
```

Confirm với user nếu impact > 5 files hoặc có High risk.

### Step 5: Thực hiện code changes

Theo thứ tự:
1. **Schema/Type layer** trước (validations.ts, rate-engine.ts, types)
2. **Action layer** (server actions)
3. **UI layer** (components, pages)
4. Run `npx tsc --noEmit` sau mỗi layer

### Step 6: Cập nhật docs

Sau khi code xong:
- [ ] `docs/DEPENDENCY_MAP.md` — nếu thêm/xóa file hoặc thay đổi dependency
- [ ] `docs/PRD-Module*.md` — nếu thay đổi nghiệp vụ
- [ ] `docs/PRD-Index.md` — nếu bump version
- [ ] `PROJECT_MEMORY.md` — thêm changelog entry

---

## Ví dụ: Xóa MarketRateFactor từ Global Config

**Step 1**: Đọc DEPENDENCY_MAP → section "Rate Engine" → 6 files affected
**Step 2**: `grep "MARKET_RATE_FACTOR" rate-engine.ts rate.actions.ts alert.actions.ts dashboard.actions.ts validations.ts GlobalConfigForm.tsx`
**Step 3**: Đọc chỉ rateConfig builder trong mỗi action file (~10 dòng/file)
**Step 4**: Impact summary: 6 files, 1 High (rate-engine), 3 Medium (actions), 1 Low (UI), 1 Low (validation)
**Step 5**: Code: rate-engine → actions → GlobalConfigForm → tsc check
**Step 6**: Update DEPENDENCY_MAP (no change), PRD-Module3 (update formula), PROJECT_MEMORY (changelog)

**Token estimate**: ~800 tokens (Step 1-4) vs ~3000 tokens (full grep + read all files)
