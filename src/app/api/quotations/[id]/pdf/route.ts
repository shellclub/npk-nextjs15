import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function thaiDate(d: Date) {
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const q = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customerGroup: true,
        branch: true,
        createdBy: { select: { name: true } },
        items: { orderBy: { itemOrder: 'asc' } },
        photos: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!q) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;

    // Display quotation number with Rev
    const displayQN = (q.revisionNumber || 0) > 0
      ? `${q.quotationNumber} Rev.${q.revisionNumber}`
      : q.quotationNumber;

    // Build items HTML with header/sub-item support
    let headerCount = 0;
    const subCountMap: Record<number, number> = {};

    const itemsHtml = q.items.map((item, i) => {
      const isHeader = (item.itemType || 'ITEM') === 'HEADER';

      if (isHeader) {
        headerCount++;
        subCountMap[i] = 0;
        return `
          <tr class="header-row">
            <td class="center" style="font-weight:700; color:#333;">${headerCount}</td>
            <td colspan="8" style="font-weight:700; color:#333;">${item.description.replace(/\n/g, '<br/>')}</td>
          </tr>`;
      }

      // Sub-item
      const parentIdx = item.parentIndex ?? -1;
      let displayNum = '';
      if (parentIdx >= 0 && subCountMap[parentIdx] !== undefined) {
        subCountMap[parentIdx]++;
        let hNum = 0;
        for (let j = 0; j <= parentIdx; j++) {
          if ((q.items[j].itemType || 'ITEM') === 'HEADER') hNum++;
        }
        displayNum = `${hNum}.${subCountMap[parentIdx]}`;
      } else {
        displayNum = `${i + 1}`;
      }

      const matPrice = Number(item.materialPrice || 0);
      const labPrice = Number(item.labourPrice || 0);
      const qty = Number(item.quantity);
      const matTotal = qty * matPrice;
      const labTotal = qty * labPrice;
      const amount = matTotal + labTotal;

      return `
        <tr>
          <td class="center">${displayNum}</td>
          <td class="desc">${item.description.replace(/\n/g, '<br/>')}</td>
          <td class="center">${qty}</td>
          <td class="center">${item.unit || ''}</td>
          <td class="right">${matPrice > 0 ? fmt(matPrice) : ''}</td>
          <td class="right">${labPrice > 0 ? fmt(labPrice) : ''}</td>
          <td class="right">${matTotal > 0 ? fmt(matTotal) : ''}</td>
          <td class="right">${labTotal > 0 ? fmt(labTotal) : ''}</td>
          <td class="right">${fmt(amount)}</td>
        </tr>`;
    }).join('');

    // Conditions text (use conditions first, fallback to warranty + notes)
    const conditionsText = q.conditions || q.warranty || '';
    const notesText = q.notes || '';

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบเสนอราคา ${displayQN}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
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

    /* ── Header ── */
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

    /* ── Title ── */
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin: 10px 0 8px;
      padding-bottom: 4px;
    }

    /* ── Customer Info Table ── */
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
      width: 100px;
    }
    .info-table .value {
      color: #1a1a1a;
    }
    .info-table .value-right {
      text-align: right;
      color: #1a1a1a;
    }
    .info-table .value-blue {
      color: #0066cc;
      font-weight: 600;
    }
    .info-table .value-green {
      color: #059669;
      font-weight: 700;
      font-size: 15px;
    }

    /* ── Items Wrapper ── */
    .items-wrapper {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    /* ── Items Table ── */
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

    /* ── Totals ── */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 0;
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

    /* ── Conditions ── */
    .conditions-section {
      margin-top: 15px;
      font-size: 11px;
      line-height: 1.7;
    }
    .conditions-section .label { font-weight: 700; color: #333; margin-bottom: 3px; }

    /* ── Signature ── */
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
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <img src="${logoUrl}" alt="NPK Logo" class="header-logo" />
      <div class="header-info">
        <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="company-en">NPK SERVICE & SUPPLY CO.,LTD</div>
        <div class="addr">
          สำนักงานใหญ่ : 210/19  หมู่ 4  ตำบลสนามชัย  อำเภอเมืองสุพรรณบุรี  จังหวัดสุพรรณบุรี  72000<br/>
          Head Office : 210/19 Moo.4 , Tombon Sanamchai ,  Amphur Mueang   Suphanburi,   Suphanburi 72000<br/>
          เลขผู้เสียภาษี 0105555161084 &nbsp;&nbsp; Tel: 09-8942-9891, 06-5961-9799 , 09-3694-4591 &nbsp;&nbsp; E-mail : npkservicesupply@gmail.com
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="title">ใบเสนอราคา (Quotation)</div>

    <!-- Customer Info -->
    <table class="info-table">
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td class="value" style="font-weight:600;">${q.customerGroup?.groupName || '-'}</td>
        <td class="label" style="text-align:right;">เลขที่ :</td>
        <td class="value-blue" style="text-align:right;">${displayQN}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา /สาขา :</td>
        <td class="value">${q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${thaiDate(new Date(q.date))}</td>
      </tr>
      <tr>
        <td class="label">ที่อยู่ :</td>
        <td class="value">${q.address || q.customerGroup?.headOfficeAddress || '-'}</td>
        <td class="label" style="text-align:right;">ชื่อผู้ติดต่อ :</td>
        <td class="value" style="text-align:right;">${q.contactPerson || '-'}</td>
      </tr>
      <tr>
        <td class="label">ยืนยันราคา :</td>
        <td class="value">${q.validDays} วันนับจากวันที่เสนอราคา</td>
        <td class="label" style="text-align:right;">โทร :</td>
        <td class="value" style="text-align:right;">${q.contactPhone || '-'}</td>
      </tr>
      <tr>
        <td class="label">ชื่อโครงการ :</td>
        <td class="value-green" colspan="3">${q.projectName || '-'}</td>
      </tr>
    </table>

    <!-- Greeting -->
    <div style="font-size:12px; color:#333; margin: 4px 0 6px; line-height:1.6;">
      บริษัทฯ มีความยินดีใคร่ขอเสนอราคางานบริการ โดยมีทีมงานคุณภาพให้กับท่าน มีรายละเอียด ดังนี้
    </div>

    <!-- Items Table -->
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
        ${Array(20).fill('<tr class="filler-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('\n        ')}
      </tbody>
    </table>
    </div>

    <!-- Conditions + Totals side by side -->
    <div style="display:flex; margin-top:0; gap:0;">
      <!-- LEFT: Conditions box -->
      <div style="flex:1; border:1px solid #999; font-size:11px;">
        <div style="padding:4px 6px; border-bottom:1px solid #999; min-height:28px;">
          <strong>เงื่อนไขการชำระเงิน :</strong> ${q.conditions || ''}
        </div>
        <div style="padding:4px 6px; border-bottom:1px solid #999; min-height:28px;">
          <strong>เงื่อนไขการรับประกัน</strong> ${q.warranty || ''}
        </div>
        <div style="padding:4px 6px; min-height:28px;">
          <strong>หมายเหตุ :</strong> ${q.notes || ''}
        </div>
      </div>

      <!-- RIGHT: Totals table -->
      <table class="totals-table" style="margin:0;">
        <tr>
          <td class="label-cell">Sub Total</td>
          <td class="amount-cell">${fmt(q.subtotal)}</td>
        </tr>
        ${Number(q.discountAmount) > 0 ? `
        <tr>
          <td class="label-cell">Discount</td>
          <td class="amount-cell" style="color:#dc2626;">-${fmt(q.discountAmount)}</td>
        </tr>
        <tr>
          <td class="label-cell">After Discount</td>
          <td class="amount-cell">${fmt(Number(q.subtotal) - Number(q.discountAmount))}</td>
        </tr>` : ''}
        <tr>
          <td class="label-cell">Vat ${Number(q.vatPercent)}%</td>
          <td class="amount-cell">${fmt(q.vatAmount)}</td>
        </tr>
        <tr class="grand-total">
          <td class="label-cell">Grand Total</td>
          <td class="amount-cell">${fmt(q.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Closing -->
    <div style="font-size:12px; font-weight:700; text-align:right; margin:6px 0 8px;">
      ( ${(() => {
        const txt = ['', 'หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
        const unit = ['', 'สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
        const n = Number(q.totalAmount);
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
        result += '';
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
      })()} )
    </div>

    <div style="font-size:11px; margin-bottom:6px; line-height:1.6;">
      จึงเรียนมาเพื่อพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะมีโอกาสให้บริการแก่ท่าน และขอบขอบพระคุณมา ณ โอกาสนี้
    </div>

    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
      <span>กรุณาลงชื่อเพื่ออนุมัติและส่งกลับ กรณีต้องการใช้บริการ</span>
      <span>ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</span>
    </div>
    <div style="font-size:11px; margin-bottom:15px;">
      ในนาม  ${q.customerGroup?.groupName || ''}
    </div>

    <!-- Signature -->
    <div class="signature-section">
      <div>
        <div style="text-align:center; font-weight:700; font-size:12px; margin-bottom:25px;">ผู้อนุมัติสั่งซื้อ/สั่งจ้าง</div>
        <div class="sig-box">
          .....................................................<br/>
          วันที่......./......./........
        </div>
      </div>
      <div>
        <div style="text-align:center; font-weight:700; font-size:12px; margin-bottom:5px;">ผู้อนุมัติ</div>
        <div style="text-align:center; font-size:11px;">
          ${q.createdBy?.name || 'มนต์เทียน เรืองเดชอังกูร'}<br/>
          กรรมการผู้จัดการ<br/>
          ${thaiDate(new Date(q.date))}
        </div>
      </div>
    </div>
  </div>

  ${q.photos && q.photos.length > 0 ? `
  <!-- Photo Report Page -->
  <div class="page" style="page-break-before: always;">
    <!-- Header (same) -->
    <div class="header">
      <img src="${logoUrl}" alt="NPK Logo" class="header-logo" />
      <div class="header-info">
        <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="company-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
        <div class="addr">
          สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br/>
          Call : 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com
        </div>
      </div>
    </div>

    <!-- Title -->
    <div style="text-align:center; font-size:20px; font-weight:700; color:#dc2626; margin:8px 0 6px;">รูปภาพ REPORT</div>

    <!-- Info -->
    <div style="font-size:12px; margin-bottom:8px; border-bottom:2px solid #333; padding-bottom:4px;">
      <div><strong>สถานที่ปฏิบัติงาน</strong> ${q.customerGroup?.groupName || '-'}</div>
      <div style="display:flex; gap:20px;">
        <span><strong>สาขา</strong> ${q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</span>
        <span><strong>เลขที่คำสั่งงาน</strong> ${displayQN}</span>
        <span><strong>ใบเสนอราคาลงวันที่</strong> ${thaiDate(new Date(q.date))}</span>
      </div>
    </div>

    <!-- Photo Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      ${q.photos.map((photo, idx) => `
        <div style="border:1px solid #ccc; border-radius:4px; overflow:hidden;">
          <img src="${photo.fileUrl}" alt="${photo.caption || `รูปที่ ${idx + 1}`}"
               style="width:100%; height:180px; object-fit:cover; display:block;" />
          <div style="padding:4px 8px; font-size:10px; background:#f8f8f8; border-top:1px solid #eee;">
            <span style="color:#333;">${photo.caption || `รูปที่ ${idx + 1}`}</span>
            <span style="float:right; color:#0066cc; font-size:9px;">${photo.photoType === 'AFTER' ? 'หลังทำงาน' : 'ก่อนทำงาน'}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
