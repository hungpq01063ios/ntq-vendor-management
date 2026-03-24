---
description: Đánh giá impact khi thay đổi code hoặc thêm tính năng — tiết kiệm token
---

# Impact Assessment Workflow

> Dùng workflow này **TỰ ĐỘNG** trước khi code bất kỳ thay đổi nào liên quan đến nghiệp vụ,
> xóa/thêm field, hoặc sửa logic cross-cutting.
> **QUAN TRỌNG:** AI PHẢI tự chạy workflow này khi phát hiện bất kỳ trigger nào ở mục dưới.

## Khi nào PHẢI chạy workflow này? (Tự động trigger)

- ☑ Xóa/thêm/đổi tên field trong entity (Prisma model, Zod schema)
- ☑ Thay đổi công thức tính toán (rate-engine, dashboard)
- ☑ Thay đổi Zod schema hoặc Prisma model
- ☑ Thêm/xóa concept nghiệp vụ (vd: xóa Market khỏi Vendor)
- ☑ Thay đổi config keys (SystemConfig, MarketConfig)
- ☑ Khi implement CR/feature request → PHẢI đánh giá dependency TRƯỚC khi code
- ☑ Khi fix bug liên quan đến data flow (vd: float precision, format display)

## Steps

### Step 1: Đọc Dependency Map (~80 dòng)
// turbo
```
Đọc file docs/DEPENDENCY_MAP.md
```
Xác định domain concept bị ảnh hưởng → liệt kê affected files từ bảng.

**Quan trọng:** Check cả section **Cross-Cutting Dependencies** ở cuối file.
Nếu concept thuộc cross-cutting → follow chain đầy đủ.

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

- **High risk**: Thay đổi ảnh hưởng formula/logic → cần test
- **Medium risk**: Thay đổi action/query → cần verify runtime
- **Low risk**: Thay đổi UI/display → visual check

Confirm với user nếu impact > 5 files hoặc có High risk.

### Step 5: Thực hiện code changes

Theo thứ tự:
1. **Schema/Type layer** trước (Prisma schema → `prisma db push` + `generate` + xóa `.next`)
2. **Validation layer** (validations.ts, types)
3. **Action layer** (server actions)
4. **UI layer** (components, pages)
5. Run `npx tsc --noEmit` sau mỗi layer

### Step 6: Cập nhật docs

Sau khi code xong, **TỰ ĐỘNG** cập nhật:
- [ ] `docs/DEPENDENCY_MAP.md` — nếu thêm/xóa file hoặc thay đổi dependency
- [ ] `docs/PRD-Index.md` — bump version nếu thay đổi nghiệp vụ
- [ ] `PROJECT_MEMORY.md` — thêm changelog entry
- [ ] `cr_implementation_plan.md` — cập nhật status CR (nếu đang làm CR)

---

## Ví dụ 1: CR-09 Multi TechStack

**Step 1**: DEPENDENCY_MAP → Personnel section → 6 files + Cross-cutting `additionalTechStackIds` chain
**Step 2**: `grep "techStackId" validations.ts PersonnelSheet.tsx personnel.actions.ts`
**Step 3**: Đọc PersonnelSchema (~5 dòng), PersonnelSheet formSchema (~5 dòng), personnel.actions createPersonnel (~10 dòng)
**Step 4**: Impact:
| File | Thay đổi | Rủi ro |
|------|---------|--------|
| prisma/schema.prisma | Thêm `additionalTechStackIds String[]` | Medium |
| lib/validations.ts | Thêm field vào PersonnelSchema | Low |
| PersonnelSheet.tsx | Thêm multi-select UI + formSchema + payload | Medium |
| PersonnelTable.tsx | Hiển thị additional stacks | Low |

**Step 5**: Schema → prisma db push → validations → actions → UI → tsc check
**Step 6**: Update DEPENDENCY_MAP, PROJECT_MEMORY changelog

## Ví dụ 2: Fix vendorRateActual float precision

**Step 1**: DEPENDENCY_MAP → Cross-cutting `vendorRateActual` chain
**Step 2**: `grep "vendorRateActual" PersonnelSheet.tsx PersonnelTable.tsx personnel/[id]/page.tsx RateSuggestionCard.tsx`
**Step 3**: Đọc chỗ format/display trong mỗi file (~3 dòng/file)
**Step 4**: Impact: PersonnelSheet (submit), PersonnelTable (display), personnel/[id] (display), RateSuggestionCard (already uses maximumFractionDigits:0)
**Step 5**: Fix submit (Math.round) → fix display (Math.round + toLocaleString)
**Step 6**: Update PROJECT_MEMORY changelog

---

**Token estimate**: ~800 tokens (Step 1-4 assessment) vs ~3000 tokens (full grep + read all files)
