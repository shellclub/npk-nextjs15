import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildVoucherDocumentHtml, fmt, thaiAmountText, thaiDate } from '@/lib/pdf/npk-document-html';

const payMethod: Record<string, string> = { CASH: 'เงินสด', TRANSFER: 'โอนเงิน', CHEQUE: 'เช็ค' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pv = await prisma.paymentVoucher.findUnique({ where: { id }, include: { withholdingTax: true } });
    if (!pv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const origin = req.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const amount = Number(pv.amount);
    const method = payMethod[pv.paymentMethod] || pv.paymentMethod;
    const wht = pv.withholdingTax;

    const bodyHtml = `<div class="box">
  <div class="row"><span class="row-label">จ่ายให้ :</span><span class="row-value" style="font-weight:600;font-size:14px;">${pv.payeeName}</span></div>
  <div class="row"><span class="row-label">รายละเอียด :</span><span class="row-value">${pv.description || '-'}</span></div>
  <div class="row"><span class="row-label">วิธีชำระเงิน :</span><span class="row-value">${method}${pv.bankName ? ` — ${pv.bankName}` : ''}${pv.chequeNumber ? ` (เช็คเลขที่ ${pv.chequeNumber})` : ''}</span></div>
  ${pv.notes ? `<div class="row"><span class="row-label">หมายเหตุ :</span><span class="row-value">${pv.notes}</span></div>` : ''}
</div>`;

    const amountHtml = `<div style="background:#FEF2F2;border:2px solid #DC2626;border-radius:8px;padding:12px 20px;text-align:center;margin:16px 0;">
  <div style="font-size:28px;font-weight:800;color:#DC2626;font-variant-numeric:tabular-nums;">${fmt(amount)} บาท</div>
  <div style="font-size:13px;color:#666;margin-top:4px;">( ${thaiAmountText(amount)} )</div>
</div>`;

    const extraHtml = wht ? `<div style="background:#F5F3FF;border:1px solid #A78BFA;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
  <div style="font-weight:700;color:#7C3AED;margin-bottom:8px;">หัก ณ ที่จ่าย (${wht.whtNumber})</div>
  <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;">
    <div><span style="color:#666;">ผู้รับเงิน :</span> ${wht.payeeName}</div>
    <div><span style="color:#666;">เลขที่ผู้เสียภาษี :</span> ${wht.payeeTaxId || '-'}</div>
    <div><span style="color:#666;">อัตรา :</span> ${wht.taxRate}%</div>
    <div><span style="color:#7C3AED;font-weight:700;">หักภาษี : ${fmt(Number(wht.taxAmount))} บาท</span></div>
  </div>
  <div style="font-size:12px;margin-top:4px;"><span style="color:#666;">ประเภทเงินได้ :</span> ${wht.incomeType || '-'}</div>
</div>` : '';

    const signatureHtml = `<div style="display:flex;justify-content:space-between;margin-top:40px;">
  <div style="width:42%;text-align:center;"><div style="border-top:1px solid #999;margin:30px 20px 6px;"></div><div style="font-size:12px;font-weight:600;">ผู้รับเงิน</div><div style="font-size:11px;color:#555;">${pv.payeeName}</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
  <div style="width:42%;text-align:center;"><div style="border-top:1px solid #999;margin:30px 20px 6px;"></div><div style="font-size:12px;font-weight:600;">ผู้จ่ายเงิน</div><div style="font-size:11px;color:#555;">มนต์เทียน เรืองเดชอังกูร</div><div style="font-size:11px;color:#555;">กรรมการผู้จัดการ</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
</div>`;

    const html = buildVoucherDocumentHtml({
      pageTitle: `ใบสำคัญจ่าย ${pv.voucherNumber}`,
      documentTitle: 'ใบสำคัญจ่าย',
      documentSubtitle: 'Payment Voucher',
      logoUrl,
      accentColor: '#DC2626',
      docNumber: pv.voucherNumber,
      docDate: thaiDate(pv.date),
      bodyHtml,
      amountHtml,
      extraHtml,
      signatureHtml,
    });

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
