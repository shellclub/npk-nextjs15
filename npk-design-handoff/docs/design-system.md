# Design system

All tokens live in `tailwind/globals.css`. Class names below assume those tokens.

## Type scale

| Use | Font | Size / line | Weight | Tailwind |
|---|---|---|---|---|
| Page title (h1) | Prompt | 26 / 36 | 600 | `font-display text-[26px] leading-9 font-semibold` |
| Card title (h2) | Prompt | 20 / 30 | 600 | `font-display text-xl leading-[30px] font-semibold` |
| KPI number | Prompt | 24–28 / 32–36 | 600 | `font-display text-2xl font-semibold` |
| Body | Sarabun | 15 / 24 | 400 | `text-[15px] leading-6` |
| Table cell | Sarabun | 14 / 22 | 400 | `text-sm leading-[22px]` |
| Table header | Prompt | 13 / 20 | 500, `text-ink-muted` | `font-display text-[13px] font-medium` |
| Field label | Prompt | 14 / 20 | 500 | `font-display text-sm font-medium` |
| Filter label | Prompt | 13 / 18 | 500, muted | |
| Badge | Prompt | 12 / 18 | 500 | |
| Sidebar group | Prompt | 12 / 16 | 500, `tracking-[0.08em]` | |
| Sidebar item | Prompt | 15 | 500 | |

## Layout shell (every signed-in page)

```
<div class="min-h-screen flex flex-wrap bg-brand">
  <aside  class="flex-[1_1_248px] max-w-[280px] px-4 py-6 text-on-brand">   ← AppSidebar
  <main   class="flex-[999_1_560px] min-w-0 bg-canvas rounded-tl-[32px] px-8 pt-6 pb-12 flex flex-col gap-6">
     <header class="bg-surface rounded-2xl shadow-card px-5 py-3 flex flex-wrap items-center gap-4"> ← AppTopbar
     <PageHeader/> … cards …
```
- < 820 px: sidebar `basis-full max-w-none`, content `rounded-t-3xl p-4`.
- **Sidebar**: logo tile 52×52 white `rounded-[14px]` + "NPK Service / Service & Supply"; "แดชบอร์ด" link; 5 groups (เอกสาร, จัดการงาน, การเงิน, รายงาน, ข้อมูลหลัก) from `navigationConfig.ts`; items 44 px high, `rounded-lg`, hover `bg-brand-hover`; **active item = white bg + `text-primary-ink` + `aria-current="page"`**; yellow count pill (`bg-accent`) for WO pending (5) and รอจ่ายช่าง (8); divider; "ออกจากระบบ".
- **Top bar**: breadcrumb (แดชบอร์ด › group › page; on dashboard a search box instead), bell button 44 px `bg-tint` with red count dot, avatar 44 px `bg-brand`, user name + role.

## Components

| Component | Recipe |
|---|---|
| Card | `bg-surface rounded-2xl shadow-card p-6 flex flex-col gap-4` |
| Stat card | `rounded-[14px] px-5 py-[18px]`; neutral = `bg-surface border border-line`; highlighted = `bg-tint` (green) or `bg-warn-soft` (orange). Label 14 muted, value Prompt 24 semibold (colored per meaning), sub 13 muted. Grid `repeat(auto-fit,minmax(200px,1fr)) gap-4`. |
| Primary button | `h-11 px-5 rounded-lg bg-primary text-white font-display font-medium text-[15px] hover:bg-primary-hover` + optional 18 px icon |
| Soft button | same, `bg-tint text-primary-ink` |
| Outline button | `bg-surface border border-line text-primary-ink` |
| Ghost button | no bg, `text-primary-ink` (ยกเลิก) |
| Dashed add | `border border-dashed border-brand bg-surface-2 text-primary-ink` (+ เพิ่มรายการ, + สาขา) |
| Icon button | 44×44 `rounded-md text-ink-muted hover:bg-tint hover:text-primary-ink`, `aria-label` required |
| Input / select | `h-11 rounded-lg border border-line-strong px-3 text-[15px]`; with leading icon `pl-11`; focus ring `outline-focus` |
| Filter pills | `h-10 px-3.5 rounded-full border`; off = `bg-surface border-line`; on = `bg-primary border-primary text-white`; count chip inside (`bg-track` / `bg-white/20`); `aria-pressed` |
| Status badge | `inline-flex gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium` + 6 px dot in fg color |
| Data table | wrapper `overflow-x-auto`; `th` `bg-surface-2 px-3 py-2.5`; `td` `px-3 py-3 border-t border-line`; row hover `bg-[#f8fcf6]`; money right-aligned `whitespace-nowrap font-semibold`; two-line cell = bold title + 13 px muted sub; totals `tfoot` `bg-surface-2 border-t-2`. |
| Pagination | 44 px square links, current = `bg-primary text-white` |
| View toggle | segmented control `bg-track p-[3px] rounded-lg`, active segment white |
| Stepper (WO) | 32 px circles: done = `bg-primary` ✓, current = white with primary ring, todo = `bg-track`; connector 2 px line |
| Progress bar | 10 px `rounded-full bg-track`, fill color per status |
| Bar chart | pure CSS/flex or Recharts; income `primary`, expense/cost `chart-expense`; y-axis muted 12 px; `role="img"` + Thai `aria-label` |

## Status colors

| Domain | Status → (bg / fg token) |
|---|---|
| Quotation | ร่าง track/ink · ส่งแล้ว info · อนุมัติ success · ยกเลิก danger · (repo also has ปฏิเสธ → danger, หมดอายุ → warn) |
| WO | **from DB** `WorkOrderStatusConfig.color/bgColor` (seed: รอดำเนินการ #D97706/#FEF3C7, กำลังดำเนินการ #2563EB/#DBEAFE, เสร็จสิ้น #059669/#D1FAE5, จ่ายแล้ว #4F46E5/#E0E7FF, ยกเลิก #DC2626/#FEE2E2) |
| PO ช่าง | แบบร่าง track · อนุมัติ info · สั่งซื้อแล้ว tint/primary-ink · รับแล้ว success · ยกเลิก danger |
| Completed work | เสร็จสิ้น success · รอจ่ายค่าแรง warn · จ่ายแล้ว violet |
| Invoice | ยังไม่ชำระ warn · ชำระบางส่วน info · ชำระแล้ว success · เกินกำหนด danger · ยกเลิก track/muted |
| Payment method | โอนเงิน info · เงินสด tint · เช็ค warn |

## Icons (lucide-react)

Sidebar (from repo `navigationConfig.ts`): `LayoutDashboard`, `FileText`, `ClipboardCheck`, `ShoppingCart`, `CircleCheck`, `Clock`, `Receipt`, `FileBadge`, `Download`, `Upload`, `FileSpreadsheet`, `BarChart3`, `Building2`, `HardHat`, `Settings`, `Tags`, `LogOut`.
UI: `Search`, `Bell`, `Plus`, `Download`, `Printer`, `Pencil`, `Eye`, `Trash2`, `ChevronRight`, `ChevronLeft`, `ArrowRight`, `Paperclip`, `Image`, `Send`, `Upload`, `List`, `Columns3`, `Users`, `Mail`, `Lock`, `ShieldCheck`.
