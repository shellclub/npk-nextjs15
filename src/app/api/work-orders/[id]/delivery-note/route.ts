import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-orders/[id]/delivery-note — Generate delivery note PDF for completed work
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

    function fmt(n: number | string | null | undefined) {
      return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtDate(d: Date | string) {
      const date = new Date(d);
      const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    }

    // Build items
    const items = q?.items || [];
    let itemIdx = 0;
    const itemRows = items.map((item) => {
      const isHeader = item.itemType === 'HEADER';
      if (isHeader) {
        itemIdx = 0;
        return `<tr style="background:#F1F8E9;">
          <td colspan="5" style="padding:6px 10px;font-weight:700;font-size:13px;color:#1B5E20;border-bottom:1px solid #C8E6C9;">${item.description}</td>
        </tr>`;
      }
      itemIdx++;
      return `<tr>
        <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #E2E8F0;font-size:12px;">${item.parentIndex != null ? `${item.parentIndex}.${itemIdx}` : itemIdx}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #E2E8F0;font-size:12px;">${item.description}</td>
        <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #E2E8F0;font-size:12px;">${Number(item.quantity)}</td>
        <td style="text-align:center;padding:5px 6px;border-bottom:1px solid #E2E8F0;font-size:12px;">${item.unit || 'งาน'}</td>
        <td style="text-align:center;padding:5px 8px;border-bottom:1px solid #E2E8F0;font-size:12px;">
          <span style="display:inline-block;width:20px;height:20px;border:1.5px solid #999;border-radius:3px;"></span>
        </td>
      </tr>`;
    }).join('');

    const customerName = q?.customerGroup?.groupName || '-';
    const customerAddress = q?.address || q?.customerGroup?.headOfficeAddress || '-';
    const branchDisplay = wo.branch ? `${wo.branch.code || ''} ${wo.branch.name}` : (q?.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-');
    const projectName = q?.projectName || wo.description || '-';
    const totalAmount = Number(q?.totalAmount || wo.totalAmount);

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Sarabun',sans-serif; font-size:13px; color:#1E293B; background:#E8EDF2; padding:20px; }
    @media print { body { background:#fff; padding:0; } .page { box-shadow:none!important; margin:0!important; } .no-print { display:none!important; } }

    .page {
      width:210mm; min-height:297mm; margin:0 auto; background:#fff;
      padding:15mm 18mm; box-shadow:0 4px 20px rgba(0,0,0,0.1);
    }
    .company-header { text-align:center; margin-bottom:10px; border-bottom:2px solid #7C3AED; padding-bottom:8px; }
    .company-header .name-th { font-size:18px; font-weight:800; color:#7C3AED; }
    .company-header .name-en { font-size:14px; font-weight:600; color:#8B5CF6; }
    .company-header .info { font-size:11px; color:#555; }

    .doc-title { text-align:center; font-size:22px; font-weight:800; color:#7C3AED; margin:14px 0 8px; letter-spacing:2px; }

    .delivery-badge {
      display:flex; justify-content:center; gap:16px; margin:8px 0 12px;
    }
    .badge-item {
      border:2px solid #7C3AED; border-radius:8px; padding:6px 16px; text-align:center;
    }
    .badge-item .lbl { font-size:11px; color:#555; font-weight:600; }
    .badge-item .val { font-size:15px; font-weight:800; color:#7C3AED; }

    .info-table { width:100%; font-size:12.5px; margin-bottom:10px; border-collapse:collapse; }
    .info-table td { padding:3px 6px; vertical-align:top; }
    .info-table .label { font-weight:600; color:#555; white-space:nowrap; width:130px; }
    .info-table .value-green { color:#1B5E20; font-weight:700; font-size:15px; }

    .items-table { width:100%; border-collapse:collapse; margin:8px 0; font-size:12px; }
    .items-table th {
      background:#7C3AED; color:#fff; font-weight:700; padding:7px 8px;
      font-size:12px; border:1px solid #6D28D9;
    }
    .items-table td { padding:5px 8px; border:1px solid #ddd; vertical-align:top; }

    .completion-section {
      margin-top:16px; padding:12px; border:2px solid #D8B4FE;
      border-radius:10px; background:#FAF5FF;
    }
    .completion-section h4 { font-size:14px; font-weight:700; color:#7C3AED; margin-bottom:8px; }

    .check-row { display:flex; gap:24px; margin-bottom:6px; align-items:center; }
    .check-box { width:18px; height:18px; border:2px solid #7C3AED; border-radius:3px; display:inline-block; }
    .check-label { font-size:13px; color:#333; }

    .note-lines { margin-top:8px; }
    .note-line { border-bottom:1px dotted #999; height:24px; margin-bottom:4px; }

    .signature-section { display:flex; justify-content:space-between; margin-top:30px; padding-top:12px; }
    .sig-box { width:30%; text-align:center; }
    .sig-box .line { border-top:1px solid #999; margin:28px 10px 4px; }
    .sig-box .name { font-size:12px; color:#333; font-weight:600; }
    .sig-box .role { font-size:11px; color:#777; }
  </style>
</head>
<body>
  <!-- Print button -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
    <button onclick="window.print()" style="padding:10px 24px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,0.3);">🖨️ พิมพ์</button>
    <button onclick="window.history.back()" style="padding:10px 20px;background:#F1F5F9;color:#475569;border:1px solid #E2E8F0;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">← กลับ</button>
  </div>

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

    <div class="doc-title">ใบส่งมอบงาน / Delivery Note</div>

    <!-- Badges -->
    <div class="delivery-badge">
      <div class="badge-item">
        <div class="lbl">เลขที่ WO</div>
        <div class="val">${wo.woNumber}</div>
      </div>
      <div class="badge-item">
        <div class="lbl">อ้างอิงใบเสนอราคา</div>
        <div class="val">${q?.quotationNumber || '-'}</div>
      </div>
      <div class="badge-item">
        <div class="lbl">วันที่ส่งมอบ</div>
        <div class="val">${fmtDate(new Date())}</div>
      </div>
    </div>

    <!-- Info -->
    <table class="info-table">
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td>${customerName}</td>
        <td class="label" style="text-align:right;">ทีมช่าง :</td>
        <td style="text-align:right;">${wo.team?.teamName || '-'}</td>
      </tr>
      <tr>
        <td class="label">ที่อยู่ :</td>
        <td>${customerAddress}</td>
        <td class="label" style="text-align:right;">หัวหน้าทีม :</td>
        <td style="text-align:right;">${wo.team?.leaderName || '-'}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา/สาขา :</td>
        <td colspan="3">${branchDisplay}</td>
      </tr>
      <tr>
        <td class="label">ชื่อโครงการ/งาน :</td>
        <td class="value-green" colspan="3">${projectName}</td>
      </tr>
      ${wo.startDate || wo.endDate ? `<tr>
        <td class="label">ระยะเวลางาน :</td>
        <td colspan="3">${wo.startDate ? fmtDate(wo.startDate) : '-'} ถึง ${wo.endDate ? fmtDate(wo.endDate) : '-'}</td>
      </tr>` : ''}
    </table>

    <!-- Items Checklist -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:50px;">Item</th>
          <th>รายละเอียดงาน</th>
          <th style="width:50px;">Qty</th>
          <th style="width:60px;">Unit</th>
          <th style="width:60px;">ตรวจสอบ</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="text-align:center;color:#999;">ไม่มีรายการ</td></tr>'}
      </tbody>
    </table>

    <!-- Completion Status Section -->
    <div class="completion-section">
      <h4>ผลการตรวจรับงาน</h4>
      <div class="check-row">
        <span class="check-box"></span>
        <span class="check-label">งานเสร็จเรียบร้อยตามรายการข้างต้น</span>
      </div>
      <div class="check-row">
        <span class="check-box"></span>
        <span class="check-label">งานเสร็จแต่ต้องแก้ไขเพิ่มเติม (ระบุด้านล่าง)</span>
      </div>
      <div class="check-row">
        <span class="check-box"></span>
        <span class="check-label">งานไม่ผ่านการตรวจรับ</span>
      </div>
      <div style="margin-top:10px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:4px;">หมายเหตุ / รายละเอียดเพิ่มเติม :</div>
        <div class="note-lines">
          <div class="note-line"></div>
          <div class="note-line"></div>
          <div class="note-line"></div>
        </div>
      </div>
    </div>

    <!-- Total Amount -->
    <div style="text-align:right;margin-top:12px;font-size:14px;">
      <span style="color:#555;font-weight:600;">มูลค่างานรวม : </span>
      <span style="font-size:17px;font-weight:800;color:#7C3AED;">${fmt(totalAmount)}</span>
      <span style="color:#555;"> บาท</span>
    </div>

    <!-- Signatures -->
    <div class="signature-section">
      <div class="sig-box">
        <div class="line"></div>
        <div class="name">ผู้ส่งมอบงาน</div>
        <div class="role">ทีม ${wo.team?.teamName || '-'}</div>
        <div class="role">วันที่ ......./......./........</div>
      </div>
      <div class="sig-box">
        <div class="line"></div>
        <div class="name">ผู้ตรวจรับงาน</div>
        <div class="role">${customerName}</div>
        <div class="role">วันที่ ......./......./........</div>
      </div>
      <div class="sig-box">
        <div class="line"></div>
        <div class="name">ผู้อนุมัติ</div>
        <div class="role">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
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
    console.error('GET /api/work-orders/[id]/delivery-note error:', error);
    return NextResponse.json({ error: 'Failed to generate delivery note' }, { status: 500 });
  }
}
