import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function fmt(n: number | string) {
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

    const itemsHtml = q.items.map((item, i) => `
      <tr>
        <td class="center">${i + 1}</td>
        <td class="desc">${item.description.replace(/\n/g, '<br/>')}</td>
        <td class="center">${Number(item.quantity)}</td>
        <td class="center">${item.unit}</td>
        <td class="right">${fmt(item.unitPrice)}</td>
        <td class="right"></td>
        <td class="right">${fmt(Number(item.quantity) * Number(item.unitPrice))}</td>
        <td class="right"></td>
        <td class="right">${fmt(item.amount)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบเสนอราคา ${q.quotationNumber}</title>
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
      padding: 15mm 15mm 20mm 15mm;
      position: relative;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 8px;
    }
    .header-logo { width: 100px; height: auto; }
    .header-info { flex: 1; text-align: center; }
    .header-info .company-th {
      font-size: 18px; font-weight: 700; color: #1a1a1a;
      margin-bottom: 2px;
    }
    .header-info .company-en {
      font-size: 15px; font-weight: 600; color: #333;
      margin-bottom: 6px;
    }
    .header-info .addr {
      font-size: 11px; color: #555; line-height: 1.6;
    }

    /* ── Title ── */
    .title {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: #0066cc;
      margin: 15px 0 12px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 6px;
    }

    /* ── Customer Info ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 40px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .info-grid .label { color: #666; font-weight: 600; }
    .info-grid .value { color: #1a1a1a; }

    /* ── Items Table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: 12px;
    }
    .items-table thead th {
      background: #f0f4f8;
      color: #333;
      font-weight: 700;
      padding: 8px 6px;
      border: 1px solid #ccc;
      text-align: center;
      font-size: 11px;
    }
    .items-table thead th.sub {
      font-size: 10px;
      font-weight: 600;
      background: #f7f9fb;
    }
    .items-table tbody td {
      padding: 6px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    .items-table .center { text-align: center; }
    .items-table .right { text-align: right; font-variant-numeric: tabular-nums; }
    .items-table .desc { min-width: 200px; }

    /* ── Totals ── */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 0;
    }
    .totals-table {
      border-collapse: collapse;
      font-size: 13px;
      min-width: 340px;
    }
    .totals-table td {
      padding: 6px 10px;
      border: 1px solid #ddd;
    }
    .totals-table .label-cell {
      text-align: right;
      color: #0066cc;
      font-weight: 600;
    }
    .totals-table .amount-cell {
      text-align: right;
      font-weight: 600;
      min-width: 120px;
      font-variant-numeric: tabular-nums;
    }
    .totals-table .grand-total {
      background: #f0f4f8;
      font-size: 14px;
      font-weight: 700;
    }

    /* ── Notes ── */
    .notes-section {
      margin-top: 20px;
      font-size: 12px;
      line-height: 1.7;
    }
    .notes-section .label { font-weight: 700; color: #333; margin-bottom: 4px; }

    /* ── Signature ── */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 50px;
      font-size: 12px;
      text-align: center;
    }
    .sig-box {
      border-top: 1px solid #999;
      padding-top: 8px;
      margin-top: 50px;
    }

    @media print {
      body { padding: 0; }
      .page { padding: 10mm; margin: 0; width: 100%; min-height: auto; }
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
    <div class="info-grid">
      <div><span class="label">ชื่อลูกค้า :</span> <span class="value">${q.customerGroup?.groupName || '-'}</span></div>
      <div><span class="label">เลขที่ :</span> <span class="value">${q.quotationNumber}</span></div>

      <div><span class="label">อ้างถึง :</span> <span class="value">${q.contactPerson || '-'}</span></div>
      <div><span class="label">วันที่ :</span> <span class="value">${thaiDate(new Date(q.date))}</span></div>

      <div><span class="label">สาขา :</span> <span class="value">${q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</span></div>
      <div><span class="label">W/O :</span> <span class="value"></span></div>

      <div><span class="label">โครงการ :</span> <span class="value">${q.projectName || '-'}</span></div>
      <div><span class="label">P/O :</span> <span class="value"></span></div>
    </div>

    <div style="font-size:12px; margin-bottom:8px; color:#555;">บริษัทฯ มีความยินดีขอเสนอราคา</div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" style="width:35px">Item</th>
          <th rowspan="2">Description</th>
          <th rowspan="2" style="width:45px">Qty</th>
          <th rowspan="2" style="width:45px">Unit</th>
          <th colspan="2">Price Unit/Baht</th>
          <th colspan="2">Total Price/Baht</th>
          <th rowspan="2" style="width:90px">Amount Baht</th>
        </tr>
        <tr>
          <th class="sub" style="width:80px">Material</th>
          <th class="sub" style="width:80px">Labour</th>
          <th class="sub" style="width:80px">Material</th>
          <th class="sub" style="width:80px">Labour</th>
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
          <td style="min-width:50px; text-align:center; border:1px solid #ddd;">บาท</td>
        </tr>
        ${Number(q.discountAmount) > 0 ? `
        <tr>
          <td class="label-cell">ส่วนลด ${Number(q.discountPercent) > 0 ? `${Number(q.discountPercent)}%` : ''}</td>
          <td class="amount-cell" style="color:#dc2626;">-${fmt(q.discountAmount)}</td>
          <td style="text-align:center; border:1px solid #ddd;">บาท</td>
        </tr>` : ''}
        <tr>
          <td class="label-cell" style="color:#dc2626;">ภาษีมูลค่าเพิ่ม ${Number(q.vatPercent)}%</td>
          <td class="amount-cell">${fmt(q.vatAmount)}</td>
          <td style="text-align:center; border:1px solid #ddd;">บาท</td>
        </tr>
        <tr class="grand-total">
          <td class="label-cell">จำนวนเงินทั้งสิ้น</td>
          <td class="amount-cell">${fmt(q.totalAmount)}</td>
          <td style="text-align:center; border:1px solid #ddd; font-weight:700;">บาท</td>
        </tr>
      </table>
    </div>

    <!-- Notes -->
    ${q.notes || q.warranty ? `
    <div class="notes-section">
      ${q.notes ? `<div><span class="label">หมายเหตุ :</span> ${q.notes}</div>` : ''}
      ${q.warranty ? `<div><span class="label">เงื่อนไขรับประกัน :</span> ${q.warranty}</div>` : ''}
      <div style="margin-top:6px;">เสนอราคามีผลภายใน ${q.validDays} วัน</div>
    </div>` : `
    <div class="notes-section">
      <div>เสนอราคามีผลภายใน ${q.validDays} วัน</div>
    </div>`}

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
