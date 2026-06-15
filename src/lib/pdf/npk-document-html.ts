/** Shared HTML print template — ใช้ร่วมกันระหว่างใบเสนอราคา และ ใบสั่งซื้อให้ช่าง */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fmt(n: any) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function thaiDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export function shortDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear() + 543);
  return `${dd}/${mm}/${yy}`;
}

export function thaiAmountText(num: number): string {
  const txt = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const unit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  const n = Number(num);
  if (n === 0) return 'ศูนย์ถ้วน';
  const [intPart, decPart] = n.toFixed(2).split('.');
  let result = '';
  const intStr = intPart.replace(/,/g, '');
  const len = intStr.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(intStr[i]);
    const pos = len - i - 1;
    if (d === 0) continue;
    if (pos === 1 && d === 1) { result += 'สิบ'; continue; }
    if (pos === 1 && d === 2) { result += 'ยี่สิบ'; continue; }
    if (pos === 0 && d === 1 && len > 1) { result += 'เอ็ด'; continue; }
    result += txt[d] + unit[pos];
  }
  const dec = parseInt(decPart);
  if (dec === 0) { result += 'ถ้วน'; }
  else {
    const d1 = Math.floor(dec / 10);
    const d2 = dec % 10;
    if (d1 === 1) result += 'สิบ';
    else if (d1 === 2) result += 'ยี่สิบ';
    else if (d1 > 0) result += txt[d1] + 'สิบ';
    if (d2 === 1 && d1 > 0) result += 'เอ็ด';
    else if (d2 > 0) result += txt[d2];
    result += 'สตางค์';
  }
  return result;
}

export interface DocumentLineItem {
  itemType?: string | null;
  parentIndex?: number | null;
  description?: string | null;
  quantity?: unknown;
  unit?: string | null;
  materialPrice?: unknown;
  labourPrice?: unknown;
  amount?: unknown;
  totalMaterial?: unknown;
  totalLabour?: unknown;
  isAdjustment?: boolean;
}

export interface NpkDocumentHtmlConfig {
  pageTitle: string;
  documentTitle: string;
  logoUrl: string;
  infoTableHtml: string;
  greetingHtml: string;
  items: DocumentLineItem[];
  fillerRowCount?: number;
  conditions: string;
  warranty: string;
  notes: string;
  subtotal: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  closingParagraphHtml: string;
  footerLeftHtml: string;
  footerRightHtml: string;
  footerInNameHtml: string;
  signatureLeftTitle: string;
  signatureRightName: string;
  signatureRightDate: string;
  extraPagesHtml?: string;
}

/** แถวชื่อโครงการ — ถ้าระบุ wo/po จะแสดงฝั่งขวา (ใช้ในใบตอบรับงาน) */
export function buildProjectInfoRows(
  projectName: string,
  woPo?: { woNumber?: string; poNumber?: string }
): string {
  if (woPo) {
    return `
      <tr>
        <td class="label col-left-label">ชื่อโครงการ :</td>
        <td class="value-green col-left-value">${projectName || '-'}</td>
        <td class="label col-right-label">W/O :</td>
        <td class="value-blue col-right-value">${woPo.woNumber || ''}</td>
      </tr>
      <tr>
        <td class="col-left-label"></td>
        <td class="col-left-value"></td>
        <td class="label col-right-label">P/O :</td>
        <td class="value-blue col-right-value">${woPo.poNumber || ''}</td>
      </tr>`;
  }
  return `
      <tr>
        <td class="label col-left-label">ชื่อโครงการ :</td>
        <td class="value-green col-left-value" colspan="3">${projectName || '-'}</td>
      </tr>`;
}

export function buildQuotationInfoTableHtml(params: {
  customerName: string;
  displayQN: string;
  branchDisplay: string;
  dateText: string;
  address: string;
  contactPerson: string;
  validDaysText: string;
  contactPhone: string;
  projectName: string;
  woPo?: { woNumber?: string; poNumber?: string };
}): string {
  return `
      <tr>
        <td class="label col-left-label">ชื่อลูกค้า :</td>
        <td class="value col-left-value" style="font-weight:600;">${params.customerName}</td>
        <td class="label col-right-label">เลขที่ :</td>
        <td class="value-blue col-right-value">${params.displayQN}</td>
      </tr>
      <tr>
        <td class="label col-left-label">รหัสสาขา /สาขา :</td>
        <td class="value col-left-value">${params.branchDisplay}</td>
        <td class="label col-right-label">วันที่ :</td>
        <td class="value col-right-value">${params.dateText}</td>
      </tr>
      <tr>
        <td class="label col-left-label">ที่อยู่ :</td>
        <td class="value col-left-value">${params.address}</td>
        <td class="label col-right-label">ชื่อผู้ติดต่อ :</td>
        <td class="value col-right-value">${params.contactPerson}</td>
      </tr>
      <tr>
        <td class="label col-left-label">ยืนยันราคา :</td>
        <td class="value col-left-value">${params.validDaysText}</td>
        <td class="label col-right-label">โทร :</td>
        <td class="value col-right-value">${params.contactPhone}</td>
      </tr>
      ${buildProjectInfoRows(params.projectName, params.woPo)}`;
}

export function buildItemsTableHtml(items: DocumentLineItem[]): string {
  let headerCount = 0;
  const subCountMap: Record<number, number> = {};

  return items.map((item, i) => {
    const isHeader = (item.itemType || 'ITEM') === 'HEADER';

    if (isHeader) {
      headerCount++;
      subCountMap[i] = 0;
      return `
          <tr class="header-row">
            <td class="center" style="font-weight:700; color:#333;">${headerCount}</td>
            <td colspan="8" style="font-weight:700; color:#333;">${(item.description || '').replace(/\n/g, '<br/>')}</td>
          </tr>`;
    }

    const parentIdx = item.parentIndex ?? -1;
    let displayNum = '';
    if (parentIdx >= 0 && subCountMap[parentIdx] !== undefined) {
      subCountMap[parentIdx]++;
      let hNum = 0;
      for (let j = 0; j <= parentIdx; j++) {
        if ((items[j].itemType || 'ITEM') === 'HEADER') hNum++;
      }
      displayNum = `${hNum}.${subCountMap[parentIdx]}`;
    } else {
      displayNum = `${i + 1}`;
    }

    const qty = Number(item.quantity);
    const matPrice = Number(item.materialPrice || 0);
    const labPrice = Number(item.labourPrice || 0);
    const matTotal = Number(item.totalMaterial) || qty * matPrice;
    const labTotal = Number(item.totalLabour) || qty * labPrice;
    const amount = Number(item.amount) || matTotal + labTotal;
    const isNeg = qty < 0;
    const isAdj = item.isAdjustment;

    return `
        <tr style="${isAdj ? (isNeg ? 'background:#FFF5F5;' : 'background:#F0FFF4;') : ''}">
          <td class="center">${isAdj ? (isNeg ? '(-)' : '(+)') : displayNum}</td>
          <td class="desc">${(item.description || '').replace(/\n/g, '<br/>')}${isAdj ? ' *' : ''}</td>
          <td class="center">${qty}</td>
          <td class="center">${item.unit || ''}</td>
          <td class="right">${matPrice > 0 ? fmt(matPrice) : ''}</td>
          <td class="right">${labPrice > 0 ? fmt(labPrice) : ''}</td>
          <td class="right">${matTotal > 0 ? fmt(matTotal) : ''}</td>
          <td class="right">${labTotal > 0 ? fmt(labTotal) : ''}</td>
          <td class="right" style="${isNeg ? 'color:#DC2626;' : ''}">${amount ? fmt(amount) : ''}</td>
        </tr>`;
  }).join('');
}

const DOCUMENT_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      color: #333;
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
    .header-logo { width: 110px; height: auto; }
    .header-info { flex: 1; text-align: left; }
    .header-info .company-th {
      font-size: 18px; font-weight: 700; color: #1a1a1a;
      margin-bottom: 1px;
    }
    .header-info .company-en {
      font-size: 13px; font-weight: 600; color: #333;
      margin-bottom: 4px;
    }
    .header-info .addr {
      font-size: 10px; color: #555; line-height: 1.6;
    }
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin: 10px 0 8px;
      padding-bottom: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .info-table td {
      padding: 3px 6px;
      vertical-align: top;
    }
    .info-table .label {
      color: #333;
      font-weight: 600;
      white-space: nowrap;
    }
    .info-table .col-left-label {
      width: 105px;
      white-space: nowrap;
    }
    .info-table .col-left-value {
      width: auto;
    }
    .info-table .col-right-label {
      width: 72px;
      text-align: right;
      white-space: nowrap;
      padding-right: 4px;
    }
    .info-table .col-right-value {
      width: 38%;
      text-align: right;
      white-space: nowrap;
      padding-right: 0;
    }
    .info-table .value { color: #1a1a1a; }
    .info-table .value-blue { color: #0066cc; font-weight: 600; }
    .info-table .value-green {
      color: #059669;
      font-weight: 700;
      font-size: 15px;
    }
    .items-wrapper {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: 11px;
    }
    .items-table thead th {
      background: #f0f4f8;
      color: #333;
      font-weight: 700;
      padding: 6px 4px;
      border: 1px solid #999;
      text-align: center;
      font-size: 10px;
    }
    .items-table thead th.sub {
      font-size: 9px;
      font-weight: 600;
      background: #f7f9fb;
    }
    .items-table tbody td {
      padding: 4px 5px;
      border: 1px solid #bbb;
      vertical-align: top;
    }
    .items-table .center { text-align: center; }
    .items-table .right { text-align: right; font-variant-numeric: tabular-nums; }
    .items-table .desc { min-width: 180px; }
    .items-table .header-row td {
      background: #fffde7;
      border: 1px solid #bbb;
    }
    .items-table .filler-row td {
      border-left: 1px solid #bbb;
      border-right: 1px solid #bbb;
      border-top: none;
      border-bottom: none;
      padding: 0;
      height: 20px;
    }
    .totals-table {
      border-collapse: collapse;
      font-size: 12px;
      min-width: 320px;
    }
    .totals-table td {
      padding: 5px 8px;
      border: 1px solid #bbb;
    }
    .totals-table .label-cell {
      text-align: right;
      color: #0066cc;
      font-weight: 600;
    }
    .totals-table .amount-cell {
      text-align: right;
      font-weight: 600;
      min-width: 110px;
      font-variant-numeric: tabular-nums;
    }
    .totals-table .grand-total {
      background: #f0f4f8;
      font-size: 13px;
      font-weight: 700;
    }
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      font-size: 11px;
      text-align: center;
    }
    .sig-box {
      border-top: 1px solid #999;
      padding-top: 6px;
      margin-top: 40px;
    }
    @media print {
      body { padding: 0; }
      .page { padding: 8mm; margin: 0; width: 100%; height: 297mm; }
    }
`;

function buildCompanyHeader(logoUrl: string): string {
  return `
    <div class="header">
      <img src="${logoUrl}" alt="NPK Logo" class="header-logo" onerror="this.style.display='none'" />
      <div class="header-info">
        <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="company-en">NPK SERVICE & SUPPLY CO.,LTD</div>
        <div class="addr">
          สำนักงานใหญ่ : 210/19  หมู่ 4  ตำบลสนามชัย  อำเภอเมืองสุพรรณบุรี  จังหวัดสุพรรณบุรี  72000<br/>
          Head Office : 210/19 Moo.4 , Tombon Sanamchai ,  Amphur Mueang   Suphanburi,   Suphanburi 72000<br/>
          เลขผู้เสียภาษี 0105555161084 &nbsp;&nbsp; Tel: 09-8942-9891, 06-5961-9799 , 09-3694-4591 &nbsp;&nbsp; E-mail : npkservicesupply@gmail.com
        </div>
      </div>
    </div>`;
}

export function buildNpkDocumentHtml(config: NpkDocumentHtmlConfig): string {
  const itemsHtml = buildItemsTableHtml(config.items);
  const fillerCount = config.fillerRowCount ?? 20;
  const fillerRows = Array(fillerCount)
    .fill('<tr class="filler-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>')
    .join('\n        ');
  const afterDiscount = config.subtotal - config.discountAmount;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.pageTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>${DOCUMENT_STYLES}</style>
</head>
<body>
  <div class="page">
    ${buildCompanyHeader(config.logoUrl)}

    <div class="title">${config.documentTitle}</div>

    <table class="info-table">
      ${config.infoTableHtml}
    </table>

    <div style="font-size:12px; color:#333; margin: 4px 0 6px; line-height:1.6;">
      ${config.greetingHtml}
    </div>

    <div class="items-wrapper">
    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" style="width:30px">Item</th>
          <th rowspan="2">Description</th>
          <th rowspan="2" style="width:35px">Qty</th>
          <th rowspan="2" style="width:35px">Unit</th>
          <th colspan="2">Price Unit/Baht</th>
          <th colspan="2">Total Price/Baht</th>
          <th rowspan="2" style="width:80px">Amount Baht</th>
        </tr>
        <tr>
          <th class="sub" style="width:70px">Material</th>
          <th class="sub" style="width:70px">Labour</th>
          <th class="sub" style="width:70px">Material</th>
          <th class="sub" style="width:70px">Labour</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${fillerRows}
      </tbody>
    </table>
    </div>

    <div style="display:flex; margin-top:0; gap:0;">
      <div style="flex:1; border:1px solid #999; font-size:11px;">
        <div style="padding:4px 6px; border-bottom:1px solid #999; min-height:28px;">
          <strong>เงื่อนไขการชำระเงิน :</strong> ${config.conditions}
        </div>
        <div style="padding:4px 6px; border-bottom:1px solid #999; min-height:28px;">
          <strong>เงื่อนไขการรับประกัน</strong> ${config.warranty}
        </div>
        <div style="padding:4px 6px; min-height:28px;">
          <strong>หมายเหตุ :</strong> ${config.notes}
        </div>
      </div>

      <table class="totals-table" style="margin:0;">
        <tr>
          <td class="label-cell">Sub Total</td>
          <td class="amount-cell">${fmt(config.subtotal)}</td>
        </tr>
        ${config.discountAmount > 0 ? `
        <tr>
          <td class="label-cell">Discount</td>
          <td class="amount-cell" style="color:#dc2626;">-${fmt(config.discountAmount)}</td>
        </tr>
        <tr>
          <td class="label-cell">After Discount</td>
          <td class="amount-cell">${fmt(afterDiscount)}</td>
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
    </div>

    <div style="font-size:12px; font-weight:700; text-align:right; margin:6px 0 8px;">
      ( ${thaiAmountText(config.totalAmount)} )
    </div>

    <div style="font-size:11px; margin-bottom:6px; line-height:1.6;">
      ${config.closingParagraphHtml}
    </div>

    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
      <span>${config.footerLeftHtml}</span>
      <span>${config.footerRightHtml}</span>
    </div>
    <div style="font-size:11px; margin-bottom:15px;">
      ${config.footerInNameHtml}
    </div>

    <div class="signature-section">
      <div>
        <div style="text-align:center; font-weight:700; font-size:12px; margin-bottom:25px;">${config.signatureLeftTitle}</div>
        <div class="sig-box">
          .....................................................<br/>
          วันที่......./......./........
        </div>
      </div>
      <div>
        <div style="text-align:center; font-weight:700; font-size:12px; margin-bottom:5px;">ผู้อนุมัติ</div>
        <div style="text-align:center; font-size:11px;">
          ${config.signatureRightName}<br/>
          กรรมการผู้จัดการ<br/>
          ${config.signatureRightDate}
        </div>
      </div>
    </div>
  </div>

  ${config.extraPagesHtml || ''}
</body>
</html>`;
}

export interface VoucherDocumentConfig {
  pageTitle: string;
  documentTitle: string;
  documentSubtitle?: string;
  logoUrl: string;
  accentColor: string;
  docNumber: string;
  docDate: string;
  bodyHtml: string;
  amountHtml: string;
  extraHtml?: string;
  signatureHtml: string;
}

/** Template สำหรับใบสำคัญรับ/จ่าย */
export function buildVoucherDocumentHtml(config: VoucherDocumentConfig): string {
  const accent = config.accentColor;
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${config.pageTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Sarabun',sans-serif; font-size:13px; color:#333; background:#fff; }
    .page { width:210mm; min-height:297mm; margin:0 auto; padding:12mm; display:flex; flex-direction:column; }
    .header { display:flex; align-items:flex-start; gap:16px; border-bottom:2px solid ${accent}; padding-bottom:8px; margin-bottom:8px; }
    .header-logo { width:100px; height:auto; }
    .company-th { font-size:16px; font-weight:800; color:${accent}; }
    .company-en { font-size:12px; font-weight:600; color:${accent}; opacity:0.85; margin-bottom:2px; }
    .addr { font-size:10px; color:#555; line-height:1.6; }
    .title { text-align:center; font-size:22px; font-weight:800; color:${accent}; margin:12px 0 4px; letter-spacing:2px; }
    .subtitle { text-align:center; font-size:13px; color:#666; margin-bottom:16px; }
    .box { border:1px solid #ddd; border-radius:8px; padding:16px; margin-bottom:12px; }
    .row { display:flex; margin-bottom:8px; align-items:flex-start; }
    .row-label { font-weight:600; color:#333; width:140px; flex-shrink:0; }
    .row-value { flex:1; color:#1a1a1a; }
    @media print { .page { padding:8mm; width:100%; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img src="${config.logoUrl}" alt="NPK" class="header-logo" onerror="this.style.display='none'"/>
      <div style="flex:1;">
        <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="company-en">NPK SERVICE &amp; SUPPLY CO.,LTD.</div>
        <div class="addr">สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br/>Tel: 09-8942-9891, 06-5961-9799, 09-3694-4591 &nbsp; E-mail: npkservicesupply@gmail.com</div>
      </div>
      <div style="text-align:right;white-space:nowrap;">
        <div style="font-size:14px;font-weight:700;color:${accent};">${config.docNumber}</div>
        <div style="font-size:12px;color:#666;">${config.docDate}</div>
      </div>
    </div>
    <div class="title">${config.documentTitle}</div>
    ${config.documentSubtitle ? `<div class="subtitle">${config.documentSubtitle}</div>` : ''}
    ${config.bodyHtml}
    ${config.amountHtml}
    ${config.extraHtml || ''}
    ${config.signatureHtml}
  </div>
</body>
</html>`;
}
