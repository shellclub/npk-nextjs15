# NPK Service — Design Handoff (instructions for Claude Code)

This folder holds the approved UI design for **NPK Service & Supply** (business document system: quotation → work order → technician PO → completed work → invoice / tax invoice / receipt / payment voucher / 50 ทวิ).

Your job: implement these screens in **Next.js (App Router) + PostgreSQL (Prisma) + Tailwind CSS v4**, matching the design closely.

## What is in this folder

| Path | What it is | How to use it |
|---|---|---|
| `screenshots/*.png` | Full-page render of every screen at 1440 px | **Primary visual reference.** Open the matching PNG before building a page. |
| `design-source/*.dc.html` | Design source per screen (HTML + inline styles + a small `class Component` logic block) | Exact values: spacing, colors, copy, sample data, interactions. Read the markup for structure and the `<script type="text/x-dc">` block for behaviour (filters, tabs, totals). It is NOT React: `{{hole}}` = value from `renderVals()`, `<sc-for>` = map, `<sc-if>` = conditional. |
| `design-source/index.html` | Opens every design in a browser (`npx serve design-source`) | Use if you need to click through interactions. |
| `docs/design-system.md` | Colors, type, spacing, radii, shadows, component recipes | Build shared components from this first. |
| `docs/pages.md` | Every screen: route, sections, columns, filters, actions, interactions | Checklist per page. |
| `docs/data-mapping.md` | Screen fields ↔ Prisma models, plus known gaps | Read before touching API/DB. |
| `tailwind/globals.css` | Tailwind v4 `@theme` tokens + fonts | Copy into `src/app/globals.css`. |
| `prisma/schema.prisma` | Reference copy of the current schema from `shellclub/npk-nextjs15` | Source of truth for data; don't invent fields. |
| `public/npk-logo.png` | Company logo | Copy into `public/`. |

## Rules

1. **Language**: all UI copy is Thai, exactly as in the designs. Keep `lang="th"`.
2. **Fonts**: `Prompt` (headings, labels, buttons, numbers in KPIs) and `Sarabun` (body, tables, inputs) via `next/font/google` with `subsets: ['thai','latin']`. Screenshots were rendered with a fallback Thai font — trust the font names, not the PNG glyphs.
3. **Tokens only**: use the theme tokens in `tailwind/globals.css` (`bg-brand`, `text-ink-muted`, …). No raw hex in components.
4. **Layout shell is shared**: green sidebar (`AppSidebar`) + white rounded top bar (`AppTopbar` with breadcrumb, notifications, user) + content area with `rounded-tl-[32px]`. One layout in `app/(app)/layout.tsx`.
5. **Responsive**: pages are fluid (designed at 1440). Below 820 px the sidebar stacks above content; tables scroll horizontally inside their card (`overflow-x-auto`), never the page.
6. **Accessibility** (already designed in — keep it): real `<button>`/`<a>`/`<label>`; icon-only buttons have `aria-label`; touch targets ≥ 44 px; focus ring `outline-2 outline-focus outline-offset-2`; status is never color-only (badge has text).
7. **Money**: store `Decimal(12,2)`; display `฿1,234.00` (`th-TH` grouping, 2 decimals in documents, 0 decimals allowed in KPI cards). Thai baht text (`…บาทถ้วน`) is required on quotation/invoice totals — a `bahtText()` implementation exists in `design-source/QuotationNew.dc.html`; port it to `lib/baht-text.ts` with unit tests.
8. **Dates**: show Buddhist Era short form `9 พ.ย. 69` in tables and `วันจันทร์ที่ 9 พฤศจิกายน 2569` in headings (`Intl.DateTimeFormat('th-TH-u-ca-buddhist')`). Store UTC.
9. **Icons**: `lucide-react` (the designs use Lucide-style stroke icons; names are listed in `docs/design-system.md`).
10. **Sample data**: values in `[วงเล็บเหลี่ยม]` are placeholders — never ship them; read real data from the DB.
11. Work page by page in the order in `docs/pages.md`. After each page: run `npm run lint && npm run build`, then compare against the screenshot.

## Suggested component set (`src/components/ui`)

`Button` (primary / soft / ghost / dashed), `IconButton`, `Card`, `StatCard`, `StatusBadge` (dot + label, color from config), `FilterTabs` (pill tabs with count), `SearchInput`, `Select`, `Field` (label + input + error), `DataTable` (header row `bg-surface-2`, row hover, right-aligned money, optional `tfoot` totals, empty state), `Pagination`, `MoneyText`, `Stepper` (WO flow), `FileDrop`, `PageHeader` (h1 + subtitle + actions).
