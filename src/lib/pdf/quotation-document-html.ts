/** ใบเสนอราคา (Quotation) print/PDF template — matches the mpdf.pdf reference layout exactly. */

import { fmt, thaiAmountText, buildItemsTableHtml, DocumentLineItem } from '@/lib/pdf/npk-document-html';

export interface QuotationDocumentConfig {
  pageTitle: string;
  logoUrl: string;
  customerName: string;
  displayQN: string;
  referenceText: string;
  dateText: string;
  branchDisplay: string;
  woNumber: string;
  poNumber: string;
  items: DocumentLineItem[];
  subtotal: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  salespersonName: string;
  signatureUrl: string;
  extraPagesHtml?: string;
}

const QUOTATION_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      color: #000;
      background: #fff;
      padding: 0;
    }
    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 12mm 12mm 15mm 12mm;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 6px;
    }
    .header-logo { width: 90px; height: auto; flex-shrink: 0; }
    .header-info { flex: 1; text-align: center; padding-right: 90px; }
    .header-info .company-th {
      font-size: 18px; font-weight: 700; color: #000;
      margin-bottom: 1px;
    }
    .header-info .company-en {
      font-size: 13px; font-weight: 700; color: #000;
      margin-bottom: 4px;
    }
    .header-info .addr {
      font-size: 10px; color: #000; line-height: 1.6;
    }
    .title {
      text-align: center;
      font-size: 19px;
      font-weight: 700;
      color: #000;
      margin: 6px 0 8px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .info-table td {
      padding: 2px 4px;
      vertical-align: top;
      color: #000;
    }
    .info-table .label {
      font-weight: 600;
      white-space: nowrap;
    }
    .info-table .col-left-label { width: 90px; white-space: nowrap; }
    .info-table .col-left-value { width: auto; }
    .info-table .col-right-label {
      width: 50px;
      text-align: left;
      white-space: nowrap;
      font-weight: 600;
    }
    .info-table .col-right-value {
      width: 30%;
      text-align: right;
      white-space: nowrap;
    }
    .items-wrapper {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .items-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: 11px;
    }
    .items-table thead th {
      background: #fff;
      color: #000;
      font-weight: 700;
      padding: 5px 4px;
      border: 1px solid #000;
      text-align: center;
      font-size: 10px;
    }
    .items-table thead th.sub {
      font-size: 9px;
      font-weight: 600;
    }
    .items-table tbody td {
      padding: 3px 5px;
      border: 1px solid #000;
      vertical-align: top;
      color: #000;
    }
    .items-table .center { text-align: center; }
    .items-table .right { text-align: right; font-variant-numeric: tabular-nums; }
    .items-table .desc { min-width: 160px; }
    .items-table .header-row td {
      background: #fff;
      border: 1px solid #000;
    }
    .items-table .filler-row {
      height: 100%;
    }
    .items-table .filler-row td {
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-top: none;
      border-bottom: 1px solid #000;
      padding: 0;
    }
    .bottom-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-top: 0;
    }
    .amount-words {
      font-size: 12px;
      font-weight: 700;
      color: #000;
    }
    .totals-column {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .totals-table {
      border-collapse: collapse;
      font-size: 12px;
      min-width: 260px;
    }
    .totals-table td {
      padding: 4px 8px;
      border: 1px solid #000;
    }
    .totals-table .label-cell {
      text-align: right;
      font-weight: 600;
      color: #000;
    }
    .totals-table .amount-cell {
      text-align: right;
      font-weight: 600;
      min-width: 100px;
      font-variant-numeric: tabular-nums;
      color: #000;
    }
    .totals-table .grand-total {
      font-size: 13px;
      font-weight: 700;
    }
    .closing {
      font-size: 12px;
      margin-top: 10px;
      line-height: 1.7;
      color: #000;
      text-align: right;
    }
    .signature-img {
      display: block;
      height: 50px;
      margin: 2px 0 0 auto;
    }
    .signature-line {
      font-size: 12px;
      margin-top: 4px;
      color: #000;
      text-align: right;
    }
    @media print {
      body { padding: 0; }
      .page { padding: 8mm; margin: 0; width: 100%; height: 297mm; }
    }
`;

function buildQuotationHeader(logoUrl: string): string {
  return `
    <div class="header">
      <img src="${logoUrl}" alt="NPK Logo" class="header-logo" onerror="this.style.display='none'" />
      <div class="header-info">
        <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="company-en">NPK SERVICE &amp; SUPPLY CO.,LTD.</div>
        <div class="addr">
          สำนักงานใหญ่  : 210/19  หมู่ 4  ตำบลสนามชัย  อำเภอเมืองสุพรรณบุรี  จังหวัดสุพรรณบุรี  72000<br/>
          Head Office : 210/19 Moo.4 ,Tombon Sanamchai ,  Amphur Mueang   Suphanburi,   Suphanburi 72000<br/>
          Call : 09-8942-9891, 06-5961-9799 , 09-3694-4591  E-mail : npkservicesupply@gmail.com
        </div>
      </div>
    </div>`;
}

export function buildQuotationDocumentHtml(config: QuotationDocumentConfig): string {
  const itemsHtml = buildItemsTableHtml(config.items);
  const fillerRows = '<tr class="filler-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

  const hasDiscount = config.discountAmount > 0;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.pageTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>${QUOTATION_STYLES}</style>
</head>
<body>
  <div class="page">
    ${buildQuotationHeader(config.logoUrl)}

    <div class="title">ใบเสนอราคา(Quotation)</div>

    <table class="info-table">
      <tr>
        <td class="label col-left-label">ชื่อลูกค้า :</td>
        <td class="col-left-value">${config.customerName}</td>
        <td class="label col-right-label">เลขที่</td>
        <td class="col-right-value">${config.displayQN}</td>
      </tr>
      <tr>
        <td class="label col-left-label">อ้างถึง :</td>
        <td class="col-left-value">${config.referenceText || ''}</td>
        <td class="label col-right-label">วันที่</td>
        <td class="col-right-value">${config.dateText}</td>
      </tr>
      <tr>
        <td class="label col-left-label">สาขา :</td>
        <td class="col-left-value">${config.branchDisplay}</td>
        <td class="label col-right-label">W/O</td>
        <td class="col-right-value">${config.woNumber || ''}</td>
      </tr>
      <tr>
        <td class="col-left-label" colspan="2">บริษัทฯ มีความยินดีขอเสนอราคา</td>
        <td class="label col-right-label">P/O</td>
        <td class="col-right-value">${config.poNumber || ''}</td>
      </tr>
    </table>

    <div class="items-wrapper">
    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" style="width:26px">Item</th>
          <th rowspan="2">Description</th>
          <th rowspan="2" style="width:30px">Qty</th>
          <th rowspan="2" style="width:32px">Unit</th>
          <th colspan="2">Price Unit/Baht</th>
          <th colspan="2">Total Price/Baht</th>
          <th rowspan="2" style="width:75px">Amount Baht</th>
        </tr>
        <tr>
          <th class="sub" style="width:65px">Material</th>
          <th class="sub" style="width:65px">Labour</th>
          <th class="sub" style="width:65px">Material</th>
          <th class="sub" style="width:65px">Labour</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${fillerRows}
      </tbody>
    </table>
    </div>

    <div class="bottom-row">
      <div class="amount-words">( ${thaiAmountText(config.totalAmount)} )</div>
      <div class="totals-column">
        <table class="totals-table">
          <tr>
            <td class="label-cell">Sub Total</td>
            <td class="amount-cell">${fmt(config.subtotal)}</td>
          </tr>
          ${hasDiscount ? `
          <tr>
            <td class="label-cell">Discount</td>
            <td class="amount-cell">-${fmt(config.discountAmount)}</td>
          </tr>` : ''}
          <tr>
            <td class="label-cell">Vat ${config.vatPercent}%</td>
            <td class="amount-cell">${fmt(config.vatAmount)}</td>
          </tr>
          <tr class="grand-total">
            <td class="label-cell">Grand Total</td>
            <td class="amount-cell">${fmt(config.totalAmount)}</td>
          </tr>
        </table>

        <div class="closing">
          จึงเรียนมาเพื่อพิจารณาและขอบพระคุณที่ท่านเลือกใช้บริการของ NPK<br/>
          ${config.salespersonName}
        </div>

        <img src="${config.signatureUrl}" alt="ลายเซ็นต์" class="signature-img" onerror="this.style.display='none'" />

        <div class="signature-line">
          ผู้เสนอราคา............................................................
        </div>
      </div>
    </div>
  </div>

  ${config.extraPagesHtml || ''}
</body>
</html>`;
}
