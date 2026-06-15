import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fmt, thaiAmountText, thaiDate } from '@/lib/pdf/npk-document-html';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const wht = await prisma.withholdingTax.findUnique({
      where: { id },
      include: { paymentVoucher: true },
    });
    if (!wht) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const origin = req.nextUrl.origin;
    const logoUrl = `${origin}/assets/images/logo/npk-logo.png`;
    const pv = wht.paymentVoucher;
    const incomeAmount = Number(wht.incomeAmount);
    const taxAmount = Number(wht.taxAmount);
    const taxRate = Number(wht.taxRate);

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>50 ทวิ ${wht.whtNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Sarabun',sans-serif; font-size:13px; color:#333; background:#fff; }
.page { width:210mm; min-height:297mm; margin:0 auto; padding:12mm; }
.header { display:flex; gap:16px; border-bottom:2px solid #7C3AED; padding-bottom:8px; margin-bottom:12px; }
.header-logo { width:100px; }
.company-th { font-size:16px; font-weight:800; color:#5B21B6; }
.company-en { font-size:12px; color:#7C3AED; }
.addr { font-size:10px; color:#555; line-height:1.6; }
.title { text-align:center; font-size:20px; font-weight:800; color:#5B21B6; margin:12px 0 4px; }
.subtitle { text-align:center; font-size:12px; color:#666; margin-bottom:16px; }
.box { border:1px solid #C4B5FD; border-radius:8px; padding:14px; margin-bottom:12px; background:#FAF5FF; }
.row { display:flex; margin-bottom:6px; }
.label { width:160px; font-weight:600; color:#5B21B6; flex-shrink:0; }
.value { flex:1; }
.amount-highlight { text-align:center; background:#F5F3FF; border:2px solid #7C3AED; border-radius:8px; padding:16px; margin:16px 0; }
.amount-num { font-size:24px; font-weight:800; color:#7C3AED; }
.sig { display:flex; justify-content:space-between; margin-top:40px; }
.sig-box { width:42%; text-align:center; }
.sig-line { border-top:1px solid #999; margin:30px 16px 6px; }
@media print { .page { padding:8mm; width:100%; } }
</style></head><body><div class="page">
<div class="header">
  <img src="${logoUrl}" alt="NPK" class="header-logo" onerror="this.style.display='none'"/>
  <div>
    <div class="company-th">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
    <div class="company-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
    <div class="addr">สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br/>เลขผู้เสียภาษี 0105555161084</div>
  </div>
  <div style="text-align:right;">
    <div style="font-weight:700;color:#7C3AED;">${wht.whtNumber}</div>
    <div style="font-size:12px;color:#666;">${thaiDate(wht.date)}</div>
  </div>
</div>
<div class="title">หนังสือรับรองการหักภาษี ณ ที่จ่าย</div>
<div class="subtitle">Withholding Tax Certificate (50 ทวิ)</div>
<div class="box">
  <div class="row"><span class="label">ผู้มีหน้าที่หักภาษี :</span><span class="value">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</span></div>
  <div class="row"><span class="label">เลขผู้เสียภาษี (ผู้หัก) :</span><span class="value">0105555161084</span></div>
  <div class="row"><span class="label">ผู้ถูกหักภาษี :</span><span class="value" style="font-weight:700;">${wht.payeeName}</span></div>
  <div class="row"><span class="label">เลขผู้เสียภาษี (ผู้ถูกหัก) :</span><span class="value">${wht.payeeTaxId || '-'}</span></div>
  ${wht.payeeAddress ? `<div class="row"><span class="label">ที่อยู่ :</span><span class="value">${wht.payeeAddress}</span></div>` : ''}
  <div class="row"><span class="label">ประเภทเงินได้ :</span><span class="value">${wht.incomeType}</span></div>
  <div class="row"><span class="label">อ้างอิงใบสำคัญจ่าย :</span><span class="value">${pv?.voucherNumber || '-'}</span></div>
</div>
<div class="box" style="background:#fff;">
  <div class="row"><span class="label">จำนวนเงินที่จ่าย :</span><span class="value">${fmt(incomeAmount)} บาท</span></div>
  <div class="row"><span class="label">อัตราภาษีหัก ณ ที่จ่าย :</span><span class="value">${taxRate}%</span></div>
</div>
<div class="amount-highlight">
  <div style="font-size:13px;color:#666;margin-bottom:4px;">ภาษีที่หักและนำส่งไว้</div>
  <div class="amount-num">${fmt(taxAmount)} บาท</div>
  <div style="font-size:12px;color:#666;margin-top:6px;">( ${thaiAmountText(taxAmount)} )</div>
</div>
${wht.notes ? `<div style="font-size:12px;margin-bottom:12px;"><strong>หมายเหตุ:</strong> ${wht.notes}</div>` : ''}
<div class="sig">
  <div class="sig-box"><div class="sig-line"></div><div style="font-weight:600;">ผู้ถูกหักภาษี</div><div style="font-size:11px;color:#555;">${wht.payeeName}</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
  <div class="sig-box"><div class="sig-line"></div><div style="font-weight:600;">ผู้หักภาษี</div><div style="font-size:11px;color:#555;">มนต์เทียน เรืองเดชอังกูร</div><div style="font-size:11px;color:#555;">กรรมการผู้จัดการ</div><div style="font-size:11px;color:#777;">วันที่......./......./........</div></div>
</div>
</div></body></html>`;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
