# Data mapping and known gaps

Schema reference: `prisma/schema.prisma` (copied from `shellclub/npk-nextjs15`). Existing API routes in that repo: `auth, branches, company, completed-works, contacts, customers, dashboard, invoices, payment-vouchers, purchase-orders, quotation-items, quotations, receipt-vouchers, reports/monthly-summary, tax-invoices, technician-teams, technicians, withholding-tax, work-order-statuses, work-orders`.

## Document numbers

| Doc | Format | Source |
|---|---|---|
| Quotation | `Npk{yy}{mm}{dd}-{seq}` e.g. `Npk261109-001` (prefix from company settings) | repo |
| Work order | `WO-{yy}{mm}{dd}-{seq}` | repo |
| PO ช่าง | `PO{yy}{mm}{dd}/Npk-{seq}` | repo |
| Invoice / tax invoice / receipt / payment / 50 ทวิ | design uses `INV-`, `TX-`, `RV-`, `PV-`, `WHT-` + `{yy}{mm}{dd}-{seq}` | **assumption — confirm with owner** |

Note: `QuotationNew`/`Quotations` designs show `QT-6911-012`, and `WorkOrders`/`WorkOrderNew` show `WO-6911-008`. Those mock numbers are outdated; use the repo formats above.

## Screen → model

| Screen field | Model.field |
|---|---|
| Customer (quotation, WO) | `CustomerGroup.groupName`, `.taxId`, `.headOfficeAddress`; branch `CustomerBranch` (`code`, `name`, `address`, contact) |
| ผู้ติดต่อ | `Contact` (per group) or `Quotation.contactPerson/contactPhone` |
| Quotation totals | `subtotal`, `discountPercent`/`discountAmount`, `vatPercent`, `vatAmount`, `totalAmount` |
| ยืนราคา (วัน) | `Quotation.validDays`; "ยืนราคาถึง" = `date + validDays` |
| Quotation items | `QuotationItem` (`itemType` HEADER/ITEM, `parentIndex`, `materialPrice`, `labourPrice`, `isAdjustment`) |
| รูปหน้างาน | `QuotationPhoto` (`photoType` BEFORE/AFTER) |
| WO | `WorkOrder` (`poNumber`, `poDate`, `teamId`/`teamName`, `startDate`, `endDate`, warranty dates, `status` = `WorkOrderStatusConfig.code`, `workflowType`) |
| PO ช่าง | `PurchaseOrder` + `PurchaseOrderItem` (`totalMaterial`, `totalLabour`) + `POAdjustment` (ADD/DEDUCT) |
| งานเสร็จ | `CompletedWork` (`status` COMPLETED/PENDING_PAYMENT/PAID, `hasPhotos`, `hasWorkReceipt`) + `CompletedWorkPhoto`, `ServiceReportItem` |
| ใบแจ้งหนี้ | `Invoice` (`InvoiceStatus`) |
| ใบกำกับภาษี | `TaxInvoice` (1:1 invoice) |
| ใบสำคัญรับ | `ReceiptVoucher` (`paymentMethod`, bank, cheque) |
| ใบสำคัญจ่าย | `PaymentVoucher` (+ optional `WithholdingTax` 1:1) |
| 50 ทวิ | `WithholdingTax` (`incomeType`, `taxRate`, `incomeAmount`, `taxAmount`) |
| ทีมช่าง | `TechnicianTeam` + `TeamMember` |
| บริษัท | `Company` + `BankAccount` |
| สถานะ WO | `WorkOrderStatusConfig` |

## Fields in the design that the schema does NOT have yet

Decide per item: add a migration, or drop from the UI.

| Design element | Suggestion |
|---|---|
| Quotation "ผู้เสนอราคา" select | use `createdById` (User) — no new field |
| Quotation "อ้างอิง" (customer RFQ no.) | add `Quotation.reference String?` |
| Quotation payment-terms select | map to `Quotation.conditions` (text) or add enum |
| Quotation "ลูกค้าหัก ณ ที่จ่าย 3%" | add `Quotation.withholdingPercent Decimal?` (or compute only on invoice) |
| WO "ยืนยันด้วย" (PO / อีเมล-LINE / เซ็นรับ) + note | add `WorkOrder.confirmationType String` + `confirmationNote String?` |
| WO customer PO file | add `WorkOrder.poFileUrl String?` |
| WO สถานที่หน้างาน / ผู้ติดต่อหน้างาน | use branch address/contact, or add `siteAddress`, `siteContact` |
| WO include/exclude QT items | add `WorkOrderItem` table or store excluded item ids |
| WO ประมาณการต้นทุน (ค่าจ้างช่าง, ค่าวัสดุ) | derive from PurchaseOrder totals; or add `estimatedLabour`, `estimatedMaterial` |
| Technician specialty | repo UI has `specialty`, schema doesn't — add `TechnicianTeam.specialty String?` |
| Company fax / website / Line ID / doc prefix / VAT / quote validity / opening text / default warranty / branch | repo UI has these labels — confirm columns exist (add to `Company` if missing) |
| BankAccount "แสดงในใบเสนอราคา", "ค่าเริ่มต้น" | add `showOnQuotation Boolean`, `isDefault Boolean` |
| Invoice partial payments | `InvoiceStatus.PARTIAL` exists but `ReceiptVoucher.invoiceId` is unique (1:1) — needs 1:n to support partial receipts |
| Status-tab counts, KPI cards | aggregate queries (`groupBy status`) per list API — add `?summary=1` |

## Status name alignment

The WO list/new designs use labels "เสร็จแล้ว (รอจ่ายช่าง)" and "จ่ายช่างแล้ว" and omit "ยกเลิก". The DB seed uses **เสร็จสิ้น / จ่ายแล้ว / ยกเลิก**. Always render names and colors from `WorkOrderStatusConfig`.
