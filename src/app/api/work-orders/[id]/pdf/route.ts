import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-orders/[id]/pdf — Generate acceptance PDF for work order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customerGroup: true,
            branch: true,
            items: { orderBy: { itemOrder: 'asc' } },
          },
        },
        branch: true,
        team: { select: { teamName: true, leaderName: true } },
        createdBy: { select: { name: true } },
      },
    });

    if (!wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const q = wo.quotation;

    // Format number
    function fmt(n: number | string | null | undefined) {
      return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Thai date
    function fmtDate(d: Date | string) {
      const date = new Date(d);
      const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      const day = date.getDate();
      const month = thMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    }

    // Build items HTML from quotation items
    const items = q?.items || [];
    let itemIdx = 0;
    const itemRows = items.map((item) => {
      const isHeader = item.itemType === 'HEADER';
      if (isHeader) {
        itemIdx = 0;
        return `<tr class="header-row">
          <td style="font-weight:700;color:#1E293B;">${item.description}</td>
          <td colspan="5"></td>
        </tr>`;
      }
      itemIdx++;
      // For acceptance PDF, show selling price (unitPrice from quotation = customer price)
      const amount = Number(item.amount);
      return `<tr>
        <td style="padding-left:24px;">${item.parentIndex != null ? `${item.parentIndex}.${itemIdx}` : itemIdx}</td>
        <td>${item.description}</td>
        <td class="tc">${Number(item.quantity)}</td>
        <td class="tc">${item.unit || 'งาน'}</td>
        <td class="tr">${fmt(item.unitPrice)}</td>
        <td class="tr">${fmt(amount)}</td>
      </tr>`;
    }).join('');

    // Totals
    const subtotal = Number(q?.subtotal || wo.totalAmount);
    const discountAmount = Number(q?.discountAmount || 0);
    const vatPercent = Number(q?.vatPercent || 7);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = Number(q?.vatAmount || (afterDiscount * vatPercent / 100));
    const totalAmount = Number(q?.totalAmount || Number(wo.totalAmount));

    const customerName = q?.customerGroup?.groupName || '-';
    const customerAddress = q?.address || q?.customerGroup?.headOfficeAddress || '-';
    const branchDisplay = wo.branch ? `${wo.branch.code || ''} ${wo.branch.name}` : (q?.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-');
    const projectName = q?.projectName || wo.description || '-';

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      color: #1E293B;
      background: #E8EDF2;
      padding: 20px;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 15mm 18mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    /* ── Header ── */
    .company-header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #1B5E20;
      padding-bottom: 8px;
    }
    .company-header img { height: 60px; }
    .company-header .name-th { font-size: 18px; font-weight: 800; color: #1B5E20; }
    .company-header .name-en { font-size: 14px; font-weight: 600; color: #2E7D32; }
    .company-header .info { font-size: 11px; color: #555; }

    .doc-title {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      color: #1B5E20;
      margin: 12px 0 6px;
      letter-spacing: 2px;
    }

    /* ── Acceptance message ── */
    .acceptance-msg {
      background: #E8F5E9;
      border: 1px solid #C8E6C9;
      border-radius: 8px;
      padding: 10px 16px;
      margin: 10px 0 12px;
      font-size: 13px;
      color: #2E7D32;
      line-height: 1.7;
    }

    /* ── Info Table ── */
    .info-table {
      width: 100%;
      font-size: 12.5px;
      margin-bottom: 10px;
      border-collapse: collapse;
    }
    .info-table td { padding: 3px 6px; vertical-align: top; }
    .info-table .label { font-weight: 600; color: #555; white-space: nowrap; width: 130px; }
    .info-table .value { color: #1E293B; }
    .info-table .value-blue { color: #0066cc; font-weight: 600; }
    .info-table .value-green { color: #1B5E20; font-weight: 700; font-size: 15px; }

    /* ── WO/PO highlight ── */
    .wo-po-box {
      display: flex;
      gap: 16px;
      margin: 8px 0 12px;
    }
    .wo-po-item {
      flex: 1;
      border: 2px solid #1B5E20;
      border-radius: 8px;
      padding: 8px 14px;
      text-align: center;
    }
    .wo-po-item .label { font-size: 11px; color: #555; font-weight: 600; }
    .wo-po-item .value { font-size: 16px; font-weight: 800; color: #1B5E20; }

    /* ── Items Table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 12px;
    }
    .items-table th {
      background: #1B5E20;
      color: #fff;
      font-weight: 700;
      padding: 7px 8px;
      font-size: 12px;
      border: 1px solid #15511B;
    }
    .items-table td {
      padding: 5px 8px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    .items-table .tc { text-align: center; }
    .items-table .tr { text-align: right; font-variant-numeric: tabular-nums; }
    .items-table .header-row td {
      background: #F1F8E9;
      border-bottom: 1px solid #C8E6C9;
      font-weight: 700;
    }

    /* ── Summary ── */
    .summary-table {
      width: 45%;
      float: right;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 6px;
    }
    .summary-table td { padding: 5px 8px; }
    .summary-table .label { text-align: right; font-weight: 600; color: #555; }
    .summary-table .value { text-align: right; font-variant-numeric: tabular-nums; }
    .summary-table .total-row td { border-top: 2px solid #1B5E20; font-weight: 800; font-size: 15px; color: #1B5E20; }

    /* ── Footer ── */
    .conditions {
      clear: both;
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
    }
    .conditions h4 { font-size: 13px; font-weight: 700; color: #1B5E20; margin-bottom: 4px; }
    .conditions p { font-size: 12px; color: #444; line-height: 1.6; white-space: pre-line; }

    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 12px;
    }
    .sig-box {
      width: 45%;
      text-align: center;
    }
    .sig-box .line { border-top: 1px solid #999; margin: 30px 20px 4px; }
    .sig-box .name { font-size: 12px; color: #333; font-weight: 600; }
    .sig-box .role { font-size: 11px; color: #777; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Company Header -->
    <div class="company-header">
      <div class="name-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
      <div class="name-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
      <div class="info">
        สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br>
        Call : 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com
      </div>
    </div>

    <div class="doc-title">ใบตอบรับทำงาน</div>

    <!-- Acceptance Message -->
    <div class="acceptance-msg">
      &emsp;บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด มีความยินดีที่จะรับดำเนินการตามรายการที่ระบุไว้ด้านล่าง
      ตามเงื่อนไขและข้อตกลงที่กำหนด ขอขอบคุณที่ไว้วางใจในบริการของบริษัทฯ
    </div>

    <!-- WO / PO Numbers -->
    <div class="wo-po-box">
      <div class="wo-po-item">
        <div class="label">เลขที่ WO</div>
        <div class="value">${wo.woNumber}</div>
      </div>
      <div class="wo-po-item">
        <div class="label">เลข PO ลูกค้า</div>
        <div class="value">${wo.customerPO || '-'}</div>
      </div>
      <div class="wo-po-item">
        <div class="label">อ้างอิงใบเสนอราคา</div>
        <div class="value">${q?.quotationNumber || '-'}</div>
      </div>
    </div>

    <!-- Info table -->
    <table class="info-table">
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td class="value">${customerName}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${fmtDate(wo.date)}</td>
      </tr>
      <tr>
        <td class="label">ที่อยู่ :</td>
        <td class="value">${customerAddress}</td>
        <td class="label" style="text-align:right;">ทีมช่าง :</td>
        <td class="value" style="text-align:right;">${wo.team?.teamName || '-'}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา/สาขา :</td>
        <td class="value">${branchDisplay}</td>
        <td class="label" style="text-align:right;">หัวหน้าทีม :</td>
        <td class="value" style="text-align:right;">${wo.team?.leaderName || '-'}</td>
      </tr>
      ${projectName !== '-' ? `<tr>
        <td class="label">ชื่อโครงการ/งาน :</td>
        <td class="value-green" colspan="3">${projectName}</td>
      </tr>` : ''}
      ${wo.startDate || wo.endDate ? `<tr>
        <td class="label">ระยะเวลางาน :</td>
        <td class="value" colspan="3">${wo.startDate ? fmtDate(wo.startDate) : '-'} ถึง ${wo.endDate ? fmtDate(wo.endDate) : '-'}</td>
      </tr>` : ''}
    </table>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:50px;">Item</th>
          <th>Description</th>
          <th style="width:50px;">Qty</th>
          <th style="width:60px;">Unit</th>
          <th style="width:100px;">ราคา/หน่วย</th>
          <th style="width:100px;">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="6" style="text-align:center;color:#999;">ไม่มีรายการ</td></tr>'}
      </tbody>
    </table>

    <!-- Summary -->
    <table class="summary-table">
      <tr>
        <td class="label">ราคาเป็นเงิน</td>
        <td class="value">${fmt(subtotal)}</td>
        <td>บาท</td>
      </tr>
      ${discountAmount > 0 ? `<tr>
        <td class="label" style="color:#DC2626;">ส่วนลด</td>
        <td class="value" style="color:#DC2626;">-${fmt(discountAmount)}</td>
        <td>บาท</td>
      </tr>` : ''}
      <tr>
        <td class="label">ภาษีมูลค่าเพิ่ม ${vatPercent}%</td>
        <td class="value">${fmt(vatAmount)}</td>
        <td>บาท</td>
      </tr>
      <tr class="total-row">
        <td class="label">จำนวนเงินทั้งสิ้น</td>
        <td class="value">${fmt(totalAmount)}</td>
        <td>บาท</td>
      </tr>
    </table>

    <!-- Conditions -->
    ${q?.conditions || q?.warranty ? `
    <div class="conditions">
      <h4>เงื่อนไข</h4>
      <p>${q?.conditions || q?.warranty || ''}</p>
    </div>` : ''}

    <!-- Signatures -->
    <div class="signature-section">
      <div class="sig-box">
        <div class="line"></div>
        <div class="name">ผู้รับงาน</div>
        <div class="role">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
        <div class="role">วันที่ ......./......./........</div>
      </div>
      <div class="sig-box">
        <div class="line"></div>
        <div class="name">ผู้อนุมัติ</div>
        <div class="role">${customerName}</div>
        <div class="role">วันที่ ......./......./........</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('GET /api/work-orders/[id]/pdf error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
