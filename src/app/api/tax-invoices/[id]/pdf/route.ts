import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildNpkDocumentHtml, buildProjectInfoRows, thaiDate } from '@/lib/pdf/npk-document-html';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ti = await prisma.taxInvoice.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            workOrder: {
              include: {
                quotation: { include: { customerGroup: true, branch: true, items: { orderBy: { itemOrder: 'asc' } } } },
              },
            },
          },
        },
      },
    });
    if (!ti) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const origin = req.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const q = ti.invoice?.workOrder?.quotation;
    const customer = q?.customerGroup?.groupName || '-';
    const taxId = q?.customerGroup?.taxId || '-';
    const branchLabel = q?.branch ? `${q.branch.code || ''} ${q.branch.name}`.trim() : '-';
    const projectName = q?.projectName || '-';
    const woNumber = ti.invoice?.workOrder?.woNumber || '';
    const invNumber = ti.invoice?.invoiceNumber || '-';

    const infoTableHtml = `
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td class="value" style="font-weight:600;">${customer}</td>
        <td class="label" style="text-align:right;">เลขที่ :</td>
        <td class="value-blue" style="text-align:right;">${ti.taxInvoiceNumber}</td>
      </tr>
      <tr>
        <td class="label">เลขผู้เสียภาษี :</td>
        <td class="value" style="font-family:monospace;">${taxId}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${thaiDate(ti.date)}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา /สาขา :</td>
        <td class="value">${branchLabel}</td>
        <td class="label" style="text-align:right;">อ้างอิง Invoice :</td>
        <td class="value-blue" style="text-align:right;">${invNumber}</td>
      </tr>
      ${woNumber ? `
      <tr>
        <td class="label">เลข WO :</td>
        <td class="value-blue" style="font-weight:600;">${woNumber}</td>
        <td></td><td></td>
      </tr>` : ''}
      ${buildProjectInfoRows(projectName)}
    `;

    const html = buildNpkDocumentHtml({
      pageTitle: `ใบกำกับภาษี ${ti.taxInvoiceNumber}`,
      documentTitle: 'ใบกำกับภาษี (Tax Invoice)',
      logoUrl,
      infoTableHtml,
      greetingHtml: '(ต้นฉบับ / Original) — บริษัทฯ ขอออกใบกำกับภาษีตามรายการดังต่อไปนี้',
      items: q?.items || [],
      fillerRowCount: 8,
      conditions: ti.notes || '-',
      warranty: '-',
      notes: '-',
      subtotal: Number(ti.subtotal),
      discountAmount: 0,
      vatPercent: 7,
      vatAmount: Number(ti.vatAmount),
      totalAmount: Number(ti.totalAmount),
      closingParagraphHtml: 'ใบกำกับภาษีฉบับนี้ออกตามความเป็นจริง',
      footerLeftHtml: 'ในนามลูกค้า',
      footerRightHtml: 'ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
      footerInNameHtml: `ในนาม  ${customer}`,
      signatureLeftTitle: 'ผู้รับ',
      signatureRightName: 'มนต์เทียน เรืองเดชอังกูร',
      signatureRightDate: thaiDate(ti.date),
    });

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
