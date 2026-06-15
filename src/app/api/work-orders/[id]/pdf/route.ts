import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildNpkDocumentHtml, buildQuotationInfoTableHtml, thaiDate } from '@/lib/pdf/npk-document-html';

export async function GET(
  request: NextRequest,
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
            createdBy: { select: { name: true } },
            items: { orderBy: { itemOrder: 'asc' } },
          },
        },
        branch: true,
        createdBy: { select: { name: true } },
      },
    });

    if (!wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const q = wo.quotation;
    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;

    const displayQN = q
      ? ((q.revisionNumber || 0) > 0
        ? `${q.quotationNumber} Rev.${q.revisionNumber}`
        : q.quotationNumber)
      : '-';

    const customerName = q?.customerGroup?.groupName || '-';
    const branchDisplay = wo.branch
      ? `${wo.branch.code || ''} ${wo.branch.name}`.trim()
      : (q?.branch ? `${q.branch.code || ''} ${q.branch.name}`.trim() : '-');
    const address = q?.address || q?.customerGroup?.headOfficeAddress || '-';
    const projectName = q?.projectName || wo.description || '-';

    const infoTableHtml = buildQuotationInfoTableHtml({
      customerName,
      displayQN,
      branchDisplay,
      dateText: thaiDate(q?.date || wo.date),
      address,
      contactPerson: q?.contactPerson || '-',
      validDaysText: q?.validDays ? `${q.validDays} วันนับจากวันที่เสนอราคา` : '-',
      contactPhone: q?.contactPhone || '-',
      projectName,
      woPo: {
        woNumber: wo.woNumber || '',
        poNumber: wo.poNumber || wo.customerPO || '',
      },
    });

    const html = buildNpkDocumentHtml({
      pageTitle: `ใบเสนอราคา ${displayQN}`,
      documentTitle: 'ใบเสนอราคา (Quotation)',
      logoUrl,
      infoTableHtml,
      greetingHtml: 'บริษัทฯ มีความยินดีใคร่ขอเสนอราคางานบริการ โดยมีทีมงานคุณภาพให้กับท่าน มีรายละเอียด ดังนี้',
      items: q?.items || [],
      conditions: q?.conditions || '',
      warranty: q?.warranty || '',
      notes: q?.notes || '',
      subtotal: Number(q?.subtotal || 0),
      discountAmount: Number(q?.discountAmount || 0),
      vatPercent: Number(q?.vatPercent || 0),
      vatAmount: Number(q?.vatAmount || 0),
      totalAmount: Number(q?.totalAmount || 0),
      closingParagraphHtml: 'จึงเรียนมาเพื่อพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะมีโอกาสให้บริการแก่ท่าน และขอบขอบพระคุณมา ณ โอกาสนี้',
      footerLeftHtml: 'กรุณาลงชื่อเพื่ออนุมัติและส่งกลับ กรณีต้องการใช้บริการ',
      footerRightHtml: 'ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
      footerInNameHtml: `ในนาม  ${customerName}`,
      signatureLeftTitle: 'ผู้อนุมัติสั่งซื้อ/สั่งจ้าง',
      signatureRightName: q?.createdBy?.name || wo.createdBy?.name || 'มนต์เทียน เรืองเดชอังกูร',
      signatureRightDate: thaiDate(q?.date || wo.date),
    });

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
