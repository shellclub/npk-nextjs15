# Screens

Routes follow the existing repo (`shellclub/npk-nextjs15`, `src/app/(control-panel)/apps/*`) so links and APIs line up. Build in this order. Each entry: design file → screenshot → what to build.

Common to every list page: `PageHeader` (h1, subtitle, actions) → optional stat cards → card with filter pills (with counts) + search + extra selects → `DataTable` → footer (count summary / pagination). Search filters client-side in the design; implement server-side (`?q=&status=&page=`) through the existing `/api/*` routes.

---

### 0. เข้าสู่ระบบ — `Main.dc.html` → `/sign-in`
Split layout: green brand panel (logo tile, "NPK Service", headline "งานบริการ เอกสาร การเงิน / ครบจบในระบบเดียว", 3 feature rows with icons, decorative circles) overlapped by white form card (`shadow-float`, `-ml-16`). Form: อีเมล (mail icon), รหัสผ่าน (lock icon + show/hide toggle button with aria-label), ลืมรหัสผ่าน? link, จดจำการเข้าสู่ระบบ checkbox, primary submit, footer "ยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบ" + security note. Mobile: panel above, card full width. Hook to next-auth credentials.

### 1. แดชบอร์ด — `Dashboard.dc.html` → `/dashboards/project`
Top bar has global search. Header "ภาพรวมระบบ" + Thai full date; actions ออกใบแจ้งหนี้ (soft), สร้างใบเสนอราคา (primary).
- 4 KPI cards: มูลค่าใบเสนอราคา (count, approved), WO กำลังดำเนินการ, ใบแจ้งหนี้ค้างชำระ (warn), รับ − จ่าย เดือนนี้.
- Bar chart รายรับ (ใบสำคัญรับ) vs รายจ่าย (ใบสำคัญจ่าย), last 6 months.
- สถานะงาน WO: progress bars per status + orange link card "N งาน เสร็จแล้ว รอจ่ายช่าง" → pending-payments.
- Tables: ใบเสนอราคาล่าสุด (5), งาน WO ล่าสุด (5), each with ดูทั้งหมด.
- 4 doc summary tiles: ใบกำกับภาษี, ใบสำคัญรับ, ใบสำคัญจ่าย, หัก ณ ที่จ่าย (amount + count this year).
Data: `/api/dashboard`.

### 2. ใบเสนอราคา — `Quotations.dc.html` → `/apps/quotations`
Stats: มูลค่ารวม, รอลูกค้าตอบกลับ, อนุมัติแล้ว + อัตราอนุมัติ, ใกล้หมดอายุยืนราคา (≤7 days, warn). Pills: ทั้งหมด/ร่าง/ส่งแล้ว/อนุมัติ/ยกเลิก (+ ปฏิเสธ/หมดอายุ from enum). Filters: search, ลูกค้า, ช่วงเวลา. Columns: เลขที่ (link), วันที่, ลูกค้า/โครงการ, มูลค่า (รวม VAT), ยืนราคาถึง (= date + validDays; orange when ≤7 days), สถานะ, การดำเนินการ (เปิด WO only when APPROVED → `/apps/work-orders/new?quotationId=`, แก้ไข, พิมพ์ PDF → `/apps/quotations/[id]/pdf`). Export Excel button.

### 3. สร้าง/แก้ไขใบเสนอราคา — `QuotationNew.dc.html` → `/apps/quotations/new`, `/apps/quotations/[id]`
Header: title + status badge + auto number note; actions ยกเลิก, ดูตัวอย่าง PDF, บันทึกร่าง, บันทึกและส่งลูกค้า. Two columns (2fr / 1fr, wraps):
- ข้อมูลลูกค้า: select customer group (+ เพิ่มลูกค้าใหม่ link) → info well (ชื่อ, เลขผู้เสียภาษี + สาขา, ที่อยู่, ผู้ติดต่อ). **Add a สาขา select** (schema has `branchId`).
- รายละเอียดเอกสาร: ชื่อโครงการ (full width), วันที่, ยืนราคา (วัน), อ้างอิง, ผู้เสนอราคา.
- รายการ: editable table (รายละเอียด, จำนวน, หน่วย, ราคา/หน่วย, จำนวนเงิน computed, delete) + เพิ่มรายการ. **Schema also supports HEADER rows and material/labour price split — add a "หัวข้อ" row type and ค่าวัสดุ/ค่าแรง columns (toggle).**
- Right: สรุปยอด (รวมเป็นเงิน, ส่วนลด input, หลังหักส่วนลด, VAT 7%, ยอดรวมทั้งสิ้น large + baht text), checkbox ลูกค้าหัก ณ ที่จ่าย 3% → shows withheld amount and net payable. เงื่อนไขและหมายเหตุ: payment terms select, notes textarea, file drop (photos → `QuotationPhoto`).
Use react-hook-form + zod; totals recomputed live.

### 4. ตอบรับทำงาน (WO/PO) — `WorkOrders.dc.html` → `/apps/work-orders`
Stats per status (color bar + count + amount). Pills: ทั้งหมด + statuses **from `WorkOrderStatusConfig`** (design shows older names — use DB). Segmented toggle **ตาราง / บอร์ด**. Filters: search (WO, PO ลูกค้า, QT, ลูกค้า, งาน), ทีมช่าง, กำหนดเสร็จ. Table: เลขที่ WO, PO ลูกค้า/อ้างอิง QT, ลูกค้า/งาน, ทีมช่าง, กำหนดเสร็จ (red + "เลยกำหนด" when past endDate and not finished), มูลค่า, สถานะ, next-step action (มอบหมายช่าง → ออกใบสั่งซื้อช่าง → จ่ายช่าง/วางบิล → ออกใบแจ้งหนี้) + chevron. Board: one column per status, cards (WO no, due, project, customer, team, amount).

### 5. เปิดงาน WO — `WorkOrderNew.dc.html` → `/apps/work-orders/new`, `/apps/work-orders/[id]`
Header with status badge + auto number; actions ยกเลิก, บันทึก, บันทึกและออกใบสั่งซื้อให้ช่าง. Stepper: ใบเสนอราคา ✓ → ตอบรับงาน WO (current) → ใบสั่งซื้อให้ช่าง → งานเสร็จ/จ่ายช่าง → วางบิล/รับชำระ.
- อ้างอิงใบเสนอราคา: select approved QTs → info well. **Add `workflowType` choice (QUOTE_FIRST / WO_FIRST / WORK_FIRST); when not QUOTE_FIRST the QT is optional.**
- การยืนยันจากลูกค้า: radio PO / อีเมล-LINE / เซ็นรับ; PO → เลขที่ PO, วันที่ PO, file upload; else free-text detail.
- ขอบเขตงานที่ตอบรับ: QT items with include checkboxes; totals ก่อน VAT / VAT / มูลค่างาน WO.
- Right: มอบหมายงาน (สถานะ select from config, ทีมช่าง select, วันเริ่มงาน, กำหนดเสร็จ, สถานที่หน้างาน, ผู้ติดต่อหน้างาน; **add ประกันเริ่ม/สิ้นสุด**). ประมาณการต้นทุน: ค่าจ้างช่าง + ค่าวัสดุ inputs → กำไรขั้นต้น + margin bar (orange < 20 %, red < 0).

### 6. ใบสั่งซื้อให้ช่าง — `PurchaseOrders.dc.html` → `/apps/purchase-orders`
Pills: แสดงทั้งหมด/แบบร่าง/อนุมัติ/สั่งซื้อแล้ว/รับแล้ว/ยกเลิก. Columns: เลข PO ช่าง, ชื่องาน/ลูกค้า สาขา, ทีมช่าง, ค่าของ, ค่าแรง, ยอดงานเพิ่ม (green +), ยอดงานลด (red −), สรุปค่างาน (= ของ + แรง + เพิ่ม − ลด, from `POAdjustment`), สถานะ, แนบเอกสาร (contractorQuoteUrl chip), จัดการ (ดู, แก้ไข, พิมพ์ → `/apps/purchase-orders/[id]/print`). Stats: total year, draft/approve, ordered, net adjustments ("ลบไม่ได้" audit note). Detail/new pages: reuse QuotationNew layout with material/labour columns and an adjustments log.

### 7. งานเสร็จแล้วทั้งหมด — `CompletedWorks.dc.html` → `/apps/completed-works`
Pills: ทั้งหมด/เสร็จสิ้น/รอจ่ายค่าแรง/จ่ายแล้ว. Filters: ทีมช่าง, เดือน. Columns: วันที่, WO/อ้างอิง QT, รายละเอียดงาน/ลูกค้า, ทีมช่าง, ยอดรวม, เอกสาร (✓/✕ รูป, ✓/✕ ใบรับ from `hasPhotos`/`hasWorkReceipt`), สถานะ, จัดการ (Service Report → `/completed-works/[id]/service-report`, รูปภาพ Report → `/completed-works/[id]/print`, ดู). Stats include "เอกสารไม่ครบ".

### 8. งานเสร็จรอจ่ายช่าง — `PendingPayments.dc.html` → `/apps/pending-payments`
No pills. Stats: total pending (warn), per-team totals, aged > 30 days (danger). Columns: วันที่, เลขที่ WO, ชื่อโครงการ/ลูกค้า, ทีมช่าง + ผู้รับเงิน, อ้างอิง PO (or orange "ไม่มี PO"), ยอดจ่ายช่าง, primary "จ่ายช่าง" → `/apps/payment-vouchers/new?workOrderId=`. tfoot total.

### 9. ใบแจ้งหนี้ — `Invoices.dc.html` → `/apps/invoices`
Pills: แสดงทั้งหมด/ยังไม่ชำระ/ชำระบางส่วน/ชำระแล้ว/เกินกำหนด/ยกเลิก. Columns: เลขที่, วันที่, ครบกำหนด (red bold if overdue), ลูกค้า/WO, ยอดรวม, สถานะ, ดู/พิมพ์. Stats: ค้างชำระ, เกินกำหนด, รับชำระเดือนนี้, ออกทั้งปี.

### 10. ใบกำกับภาษี — `TaxInvoices.dc.html` → `/apps/tax-invoices`
Filter เดือนภาษี. Columns: เลขที่, วันที่, ลูกค้า, เลขผู้เสียภาษี, อ้างอิงใบแจ้งหนี้, ก่อน VAT, VAT 7%, ยอดรวม, ดู/พิมพ์; tfoot totals. Stats: VAT เดือนนี้, count year, VAT สะสม (ภ.พ.30). Action: ส่งออกรายงานภาษีขาย.

### 11. ใบสำคัญรับ — `ReceiptVouchers.dc.html` → `/apps/receipt-vouchers`
Pills by `paymentMethod` (ทั้งหมด/โอนเงิน/เช็ค/เงินสด). Columns: เลขที่, วันที่, ลูกค้า/ใบแจ้งหนี้, วิธีชำระ badge, ธนาคาร/เช็ค, จำนวนเงิน. Stats: เดือนนี้, ปีนี้, เช็ครอเคลียร์.

### 12. ใบสำคัญจ่าย — `PaymentVouchers.dc.html` → `/apps/payment-vouchers`
Pills by method. Filter ประเภทเงินได้ (ค่าจ้าง, ค่าบริการ, ค่าเช่า, ค่าขนส่ง, ค่าโฆษณา, อื่นๆ — same list as repo). Columns: เลขที่, วันที่, ผู้รับเงิน, รายละเอียด, วิธีจ่าย, หัก ณ ที่จ่าย (chip "50 ทวิ" / "ไม่หัก"), จำนวนเงิน.

### 13. ออก 50 ทวิ — `WithholdingTax.dc.html` → `/apps/withholding-tax`
Filters: เดือนภาษี, ประเภทเงินได้. Columns: เลขที่, วันที่, ผู้ถูกหักภาษี + เลขผู้เสียภาษี, ประเภทเงินได้, อัตราภาษี, เงินได้, ภาษีหัก, ใบสำคัญจ่าย link, ดู/พิมพ์ 50 ทวิ; tfoot totals. Action: ส่งออกสำหรับยื่น ภ.ง.ด.

### 14. สรุปรายงานรายปี — `Reports.dc.html` → `/apps/reports`
Selects ปี (พ.ศ. with ค.ศ.) and เลือกทีมช่าง. KPI: จำนวน WO ทั้งปี, ยอดเสนอราคา (ก่อน VAT), ต้นทุนรวม, กำไรสุทธิ + %. 12-month bar chart. Monthly table (เดือน as button, selected row tinted; tfoot ทั้งหมด + รวม VAT 7%). Right panel: WOs of the selected month (WO, date, project, QT, team, เสนอราคา/ต้นทุน/กำไร). Data: `/api/reports/monthly-summary` (already returns `monthly`, `totals`, `vat7`, month detail).

### 15. ข้อมูลลูกค้า — `Customers.dc.html` → `/apps/customers`
Pills ทั้งหมด/ใช้งาน/ปิดใช้งาน. Columns: กลุ่มลูกค้า + เลขผู้เสียภาษี, สำนักงานใหญ่, ผู้ติดต่อ + อีเมล, เบอร์โทร, สาขา (count), สถานะ, จัดการสาขา/แก้ไข. Below: สาขาของ <selected> (รหัสสาขา, ชื่อ, ที่อยู่, ผู้ติดต่อ, edit/delete, + สาขา) and ผู้ติดต่อ list (+ เพิ่มผู้ติดต่อ). Implement selection (row click) and dialogs for add/edit.

### 16. ข้อมูลทีมช่าง — `Technicians.dc.html` → `/apps/technicians`
Pills ทั้งหมด/ใช้งาน/ปิดใช้งาน; filter ความเชี่ยวชาญ (ไฟฟ้า, ประปา, ทาสี, แอร์, ทั่วไป). Columns: ชื่อทีม, ความเชี่ยวชาญ badge, หัวหน้าช่าง + บัตรประชาชน, เบอร์โทรหัวหน้า, สมาชิก (count / "ยังไม่มีสมาชิก"), สถานะ, จัดการสมาชิก/แก้ไข. Below: member cards grid for selected team (+ เพิ่มสมาชิก).

### 17. ข้อมูลบริษัท — `CompanySettings.dc.html` → `/apps/company-settings`
Left: ข้อมูลบริษัท (logo + เปลี่ยนโลโก้, ชื่อไทย*, ชื่ออังกฤษ, เลขผู้เสียภาษี*, สาขา, ที่อยู่ไทย*, ที่อยู่อังกฤษ, เบอร์โทร, แฟกซ์, อีเมล, เว็บไซต์, Line ID); ตั้งค่าเอกสาร (รหัสนำหน้าเอกสาร with live number preview, VAT %, อายุใบเสนอราคา, ข้อความเปิดใบเสนอราคา, เงื่อนไขรับประกันเริ่มต้น). Right: บัญชีธนาคาร cards (bank, branch, type, name, number; edit/delete; แสดงในใบเสนอราคา checkbox; ใช้เป็นค่าเริ่มต้นอัตโนมัติ radio) + เพิ่มบัญชีธนาคาร. Single "บันทึกการเปลี่ยนแปลง" action.

### 18. ตั้งค่าสถานะ WO — `WorkOrderStatuses.dc.html` → `/apps/work-order-statuses`
Left table: ลำดับ, ตัวอย่าง (pill in its colors), รหัส (mono), สี (swatch + hex), ค่าเริ่มต้น tag, แก้ไข/ลบ. Note: statuses in use can't be deleted. Right form: ชื่อสถานะ*, รหัส* (auto UPPER_SNAKE), 8 color swatches (same palette as repo), live preview pill, ค่าเริ่มต้น checkbox (only one default), เพิ่ม/บันทึก + ล้างฟอร์ม. Add drag-to-reorder for `sortOrder` if time allows.
