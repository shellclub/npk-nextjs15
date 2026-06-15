import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildVoucherDocumentHtml, fmt, thaiAmountText, thaiDate } from '@/lib/pdf/npk-document-html';

const payMethod: Record<string, string> = { CASH: 'เงินสด', TRANSFER: 'โอนเงิน', CHEQUE: 'เช็ค' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rv = await prisma.receiptVoucher.findUnique({
      where: { id },
      include: { invoice: { include: { workOrder: { include: { quotation: { include: { customerGroup: true, branch: true } } } } } } },
    });
    if (!rv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const origin = req.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const q = rv.invoice?.workOrder?.quotation;
    const customer = q?.customerGroup?.groupName || '-';
    const branch = q?.branch?.name || '';
    const amount = Number(rv.amount);
    const method = payMethod[rv.paymentMethod] || rv.paymentMethod;

    const bodyHtml = `<div class="box">
  <div class="row"><span class="row-label">ได้รับเงินจาก :</span><span class="row-value" style="font-weight:600;font-size:14px;">${customer}</span></div>
  ${branch ? `<div class="row"><span class="row-label">สาขา :</span><span class="row-value">${branch}</span></div>` : ''}
  <div class="row"><span class="row-label">วิธีชำระเงิน :</span><span class="row-value">${method}${rv.bankName ? ` — ${rv.bankName}` : ''}${rv.chequeNumber ? ` (เช็คเลขที่ ${rv.chequeNumber})` : ''}</span></div>
  ${rv.invoice?.invoiceNumber ? `<div class="row"><span class="row-label">ชำระค่า Invoice :</span><span class="row-value" style="color:#0284C7;font-weight:600;">${rv.invoice.invoiceNumber}</span></div>` : ''}
  ${rv.notes ? `<div class="row"><span class="row-label">หมายเหตุ :</span><span class="row-value">${rv.notes}</span></div>` : ''}
</div>`;

    const amountHtml = `<div style="background:#F0FDF4;border:2px solid #059669;border-radius:8px;padding:12px 20px;text-align:center;margin:16px 0;">
  <div style="font-size:28px;font-weight:800;color:#059669;font-variant-numeric:tabular-nums;">${fmt(amount)} บาท</div>
  <div style="font-size:13px;color:#666;margin-top:4px;">( ${thaiAmountText(amount)} )</div>
</div>`;

    const signatureHtml = `<div style="display:flex;justify-content:space-between;margin-top:40px;">
  <div style="width:42%;text-align:center;"><div style="border-top:1px solid #999;margin:30px 20px 6px;"></div><div style="font-size:12px;font-weight:600;">ผู้รับเงิน</div><div style="font-size:11px;color:#777;">${customer}</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
  <div style="width:42%;text-align:center;"><div style="border-top:1px solid #999;margin:30px 20px 6px;"></div><div style="font-size:12px;font-weight:600;">ผู้จ่ายเงิน</div><div style="font-size:11px;color:#555;">มนต์เทียน เรืองเดชอังกูร</div><div style="font-size:11px;color:#555;">กรรมการผู้จัดการ</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
</div>`;

    const html = buildVoucherDocumentHtml({
      pageTitle: `ใบสำคัญรับ ${rv.voucherNumber}`,
      documentTitle: 'ใบสำคัญรับ',
      documentSubtitle: 'Receipt Voucher',
      logoUrl,
      accentColor: '#059669',
      docNumber: rv.voucherNumber,
      docDate: thaiDate(rv.date),
      bodyHtml,
      amountHtml,
      signatureHtml,
    });

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
