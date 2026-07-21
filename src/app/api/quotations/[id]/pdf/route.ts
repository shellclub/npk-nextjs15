import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { thaiDate } from '@/lib/pdf/npk-document-html';
import { buildQuotationDocumentHtml } from '@/lib/pdf/quotation-document-html';

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
        workOrders: { select: { woNumber: true, poNumber: true }, where: { status: { not: 'CANCELLED' } } },
      },
    });

    if (!q) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const signatureUrl = `${origin}/assets/images/signature/npk-signature.png`;

    const displayQN = (q.revisionNumber || 0) > 0
      ? `${q.quotationNumber} Rev.${q.revisionNumber}`
      : q.quotationNumber;

    const extraPagesHtml = q.photos && q.photos.length > 0 ? `
  <div class="page" style="page-break-before: always;">
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
    <div style="text-align:center; font-size:20px; font-weight:700; color:#dc2626; margin:8px 0 6px;">รูปภาพ REPORT</div>
    <div style="font-size:12px; margin-bottom:8px; border-bottom:2px solid #333; padding-bottom:4px;">
      <div><strong>สถานที่ปฏิบัติงาน</strong> ${q.customerGroup?.groupName || '-'}</div>
      <div style="display:flex; gap:20px;">
        <span><strong>สาขา</strong> ${q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</span>
        <span><strong>เลขที่คำสั่งงาน</strong> ${displayQN}</span>
        <span><strong>ใบเสนอราคาลงวันที่</strong> ${thaiDate(new Date(q.date))}</span>
      </div>
    </div>
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
  </div>` : '';

    const html = buildQuotationDocumentHtml({
      pageTitle: `ใบเสนอราคา ${displayQN}`,
      logoUrl,
      customerName: q.customerGroup?.groupName || '-',
      displayQN,
      referenceText: '',
      dateText: thaiDate(new Date(q.date)),
      branchDisplay: q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-',
      woNumber: q.workOrders?.[0]?.woNumber || '',
      poNumber: q.workOrders?.[0]?.poNumber || '',
      items: q.items,
      subtotal: Number(q.subtotal),
      discountAmount: Number(q.discountAmount),
      vatPercent: Number(q.vatPercent),
      vatAmount: Number(q.vatAmount),
      totalAmount: Number(q.totalAmount),
      salespersonName: q.createdBy?.name || 'มนต์เทียน เรืองเดชอังกูร',
      signatureUrl,
      extraPagesHtml,
    });

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
