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
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 12mm 15mm 12mm;
      position: relative;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 6px;
    }
    .header-logo { width: 90px; height: auto; }
    .header-info { flex: 1; text-align: center; }
    .header-info .company-th {
      font-size: 17px; font-weight: 700; color: #1a1a1a;
      margin-bottom: 1px;
    }
    .header-info .company-en {
      font-size: 14px; font-weight: 600; color: #333;
      margin-bottom: 4px;
    }
    .header-info .addr {
      font-size: 10px; color: #555; line-height: 1.5;
    }

    /* ── Title ── */
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: #0066cc;
      margin: 10px 0 8px;
      border-bottom: 2px solid #0066cc;
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
      .page { padding: 8mm; margin: 0; width: 100%; min-height: auto; }
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
        <div class="company-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
        <div class="addr">
          สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br/>
          Head Office : 210/19 Moo.4, Tambon Sanamchai, Amphur Mueang Suphanburi, Suphanburi 72000<br/>
          Call : 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com
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
        <td class="label">ที่อยู่ :</td>
        <td class="value">${q.customerGroup?.headOfficeAddress || '-'}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${thaiDate(new Date(q.date))}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา /สาขา :</td>
        <td class="value">${q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</td>
        <td class="label" style="text-align:right;">ชื่อผู้ติดต่อ :</td>
        <td class="value" style="text-align:right;">${q.contactPerson || '-'}</td>
      </tr>
      <tr>
        <td class="label">ยืนยันราคา :</td>
        <td class="value">${q.validDays} วันนับจากวันที่เสนอราคา</td>
        <td class="label" style="text-align:right;">โทร :</td>
        <td class="value" style="text-align:right;">${q.contactPhone || '-'}</td>
      </tr>
      ${q.projectName ? `<tr>
        <td class="label">ชื่อโครงการ/ชื่องาน :</td>
        <td class="value-blue" colspan="3">${q.projectName}</td>
      </tr>` : ''}
    </table>

    <!-- Items Table -->
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
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td class="label-cell">ราคาเป็นเงิน</td>
          <td class="amount-cell">${fmt(q.subtotal)}</td>
          <td style="min-width:40px; text-align:center; border:1px solid #bbb;">บาท</td>
        </tr>
        ${Number(q.discountAmount) > 0 ? `
        <tr>
          <td class="label-cell">ส่วนลด</td>
          <td class="amount-cell" style="color:#dc2626;">-${fmt(q.discountAmount)}</td>
          <td style="text-align:center; border:1px solid #bbb;">บาท</td>
        </tr>` : ''}
        <tr>
          <td class="label-cell" style="color:#dc2626;">ภาษีมูลค่าเพิ่ม ${Number(q.vatPercent)}%</td>
          <td class="amount-cell">${fmt(q.vatAmount)}</td>
          <td style="text-align:center; border:1px solid #bbb;">บาท</td>
        </tr>
        <tr class="grand-total">
          <td class="label-cell">จำนวนเงินทั้งสิ้น</td>
          <td class="amount-cell">${fmt(q.totalAmount)}</td>
          <td style="text-align:center; border:1px solid #bbb; font-weight:700;">บาท</td>
        </tr>
      </table>
    </div>

    <!-- Conditions -->
    ${conditionsText || notesText ? `
    <div class="conditions-section">
      ${conditionsText ? `<div><span class="label">เงื่อนไข :</span> ${conditionsText.replace(/\n/g, '<br/>')}</div>` : ''}
      ${notesText && !conditionsText ? `<div><span class="label">หมายเหตุ :</span> ${notesText.replace(/\n/g, '<br/>')}</div>` : ''}
    </div>` : ''}

    <!-- Signature -->
    <div class="signature-section">
      <div>
        <div class="sig-box">
          ผู้เสนอราคา<br/>
          บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด<br/>
          วันที่ ......./......./........
        </div>
      </div>
      <div>
        <div class="sig-box">
          ผู้อนุมัติ<br/>
          ${q.customerGroup?.groupName || ''}<br/>
          วันที่ ......./......./........
        </div>
      </div>
    </div>
  </div>
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
