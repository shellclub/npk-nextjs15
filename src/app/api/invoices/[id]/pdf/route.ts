import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildNpkDocumentHtml, buildProjectInfoRows, thaiDate } from '@/lib/pdf/npk-document-html';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            quotation: { include: { customerGroup: true, branch: true, items: { orderBy: { itemOrder: 'asc' } } } },
          },
        },
      },
    });
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const origin = req.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const q = inv.workOrder?.quotation;
    const customer = q?.customerGroup?.groupName || '-';
    const branchLabel = q?.branch ? `${q.branch.code || ''} ${q.branch.name}`.trim() : '-';
    const projectName = q?.projectName || '-';
    const woNumber = inv.workOrder?.woNumber || '';

    const infoTableHtml = `
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td class="value" style="font-weight:600;">${customer}</td>
        <td class="label" style="text-align:right;">เลขที่ :</td>
        <td class="value-blue" style="text-align:right;">${inv.invoiceNumber}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา /สาขา :</td>
        <td class="value">${branchLabel}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${thaiDate(inv.date)}</td>
      </tr>
      ${woNumber ? `
      <tr>
        <td class="label">เลข WO :</td>
        <td class="value-blue" style="font-weight:600;">${woNumber}</td>
        <td class="label" style="text-align:right;">ครบกำหนด :</td>
        <td class="value" style="text-align:right;color:#DC2626;font-weight:700;">${thaiDate(inv.dueDate)}</td>
      </tr>` : ''}
      ${buildProjectInfoRows(projectName)}
    `;

    const subtotal = Number(inv.subtotal);
    const disc = Number((inv as { discountAmount?: number }).discountAmount || 0);
    const vatPct = subtotal > 0 && Number(inv.vatAmount) > 0 ? 7 : 0;
    const vat = Number(inv.vatAmount || 0);
    const total = Number(inv.totalAmount);

    const html = buildNpkDocumentHtml({
      pageTitle: `ใบแจ้งหนี้ ${inv.invoiceNumber}`,
      documentTitle: 'ใบแจ้งหนี้ (Invoice)',
      logoUrl,
      infoTableHtml,
      greetingHtml: 'บริษัทฯ ขอเรียนแจ้งค่าใช้จ่ายตามรายการดังต่อไปนี้',
      items: q?.items || [],
      fillerRowCount: 8,
      conditions: inv.notes || '-',
      warranty: '-',
      notes: '-',
      subtotal,
      discountAmount: disc,
      vatPercent: vatPct,
      vatAmount: vat,
      totalAmount: total,
      closingParagraphHtml: 'กรุณาชำระเงินภายในวันครบกำหนดตามที่ระบุข้างต้น',
      footerLeftHtml: 'ในนามลูกค้า',
      footerRightHtml: 'ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
      footerInNameHtml: `ในนาม  ${customer}`,
      signatureLeftTitle: 'ผู้อนุมัติ / ลูกค้า',
      signatureRightName: 'มนต์เทียน เรืองเดชอังกูร',
      signatureRightDate: thaiDate(inv.date),
    });

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
