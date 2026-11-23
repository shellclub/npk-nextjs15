import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildNpkDocumentHtml, shortDate, thaiDate } from '@/lib/pdf/npk-document-html';

const DEFAULT_PO_CONDITIONS = `1. ผู้รับจ้างทำงานตาม Po ตามเลขที่อ้างอิง เสร็จให้ถ่ายสำเนา ใบรับงาน และส่งรูปภาพก่อน-หลังทำงาน มาทาง Line ของบริษัท และส่งตัวจริงตามมาที่อยู่ของบริษัท
2. การจ่ายเงินบริษัทจะจ่ายให้ภายใน 15 วันหลังจากงานเสร็จสมบูรณ์และเอกสารครบตามที่กำหนด
3. ผู้รับจ้างต้องรับประกันผลงานตามระยะเวลาที่กำหนด ตามราคานี้เท่านั้น`;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const po = await prisma.purchaseOrder.findUnique({
			where: { id },
			include: {
				team: true,
				quotation: {
					include: {
						customerGroup: true,
						branch: true
					}
				},
				workOrder: true,
				items: { orderBy: { itemOrder: 'asc' } }
			}
		});

		if (!po) {
			return NextResponse.json({ error: 'PO not found' }, { status: 404 });
		}

		const origin = request.nextUrl.origin;
		const logoUrl = `${origin}/api/company/asset/logo`;

		const items = po.items || [];
		const subtotal =
			Number(po.subtotal) || items.filter((i) => i.itemType === 'ITEM').reduce((s, i) => s + Number(i.amount), 0);
		const discPct = Number(po.discountPercent) || 0;
		const discAmt = Number(po.discountAmount) || (subtotal * discPct) / 100;
		const afterDisc = subtotal - discAmt;
		const vatPct = Number(po.vatPercent) || 0;
		const vatAmt = Number(po.vatAmount) || (afterDisc * vatPct) / 100;
		const whtPct = Number(po.whtPercent) || 0;
		const whtAmt = Number(po.whtAmount) || (afterDisc * whtPct) / 100;
		const grandTotal = Number(po.totalAmount) || afterDisc + vatAmt - whtAmt;

		const qt = po.quotation;
		const customerName = qt?.customerGroup?.groupName || '-';
		const branchLabel = qt?.branch ? `${qt.branch.code || ''} ${qt.branch.name}`.trim() : '-';
		const address = qt?.address || qt?.customerGroup?.headOfficeAddress || qt?.branch?.address || '-';
		const projectName = qt?.projectName || '-';
		const refNo = qt?.quotationNumber || '-';
		const teamName = po.team?.leaderName || po.team?.teamName || po.payeeName || '-';
		const teamPhone = po.team?.leaderPhone || '-';
		const woNumber = po.workOrder?.woNumber || '-';
		const warrantyText =
			po.warrantyStartDate || po.warrantyEndDate
				? `เริ่ม ${shortDate(po.warrantyStartDate)} สิ้นสุด ${shortDate(po.warrantyEndDate)}`
				: '-';
		const workPeriod = po.startDate || po.endDate ? `${shortDate(po.startDate)} - ${shortDate(po.endDate)}` : '-';

		// ตามฟอร์ม Excel ของลูกค้า: "ชื่อลูกค้า" = ผู้รับจ้าง/ทีมช่าง, "สถานที่ปฏิบัติงาน" = ลูกค้าจริงของงาน
		const payee = po.payeeName || po.team?.teamName || po.team?.leaderName || '-';
		const payeeAddress = po.team?.leaderAddress || '-';
		const payeeTaxId = po.team?.leaderIdCard ? `TAX ID ${po.team.leaderIdCard}` : '';
		const customerPO = po.workOrder?.poNumber || po.workOrder?.customerPO || '';
		const periodText =
			po.startDate || po.endDate
				? `เริ่ม ${po.startDate ? thaiDate(po.startDate) : '-'} สิ้นสุด ${po.endDate ? thaiDate(po.endDate) : '-'}`
				: 'เริ่ม - สิ้นสุด -';
		const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		const infoTableHtml = `
      <tr>
        <td class="label">ชื่อลูกค้า :</td>
        <td class="value" style="font-weight:600;color:#c00;">${esc(payee)}</td>
        <td class="label" style="text-align:right;">เลขที่ :</td>
        <td class="value-blue" style="text-align:right;">${esc(po.poNumber)}</td>
      </tr>
      <tr>
        <td class="label">ที่อยู่ :</td>
        <td class="value">${esc(payeeAddress)} ${esc(payeeTaxId)}</td>
        <td class="label" style="text-align:right;">วันที่ :</td>
        <td class="value" style="text-align:right;">${thaiDate(po.date)}</td>
      </tr>
      <tr>
        <td class="label">สถานที่ปฏิบัติงาน :</td>
        <td class="value">${esc(customerName)}</td>
        <td class="label" style="text-align:right;">ชื่อผู้ติดต่อ :</td>
        <td class="value" style="text-align:right;">${esc(teamName)}</td>
      </tr>
      <tr>
        <td class="label">รหัสสาขา /สาขา :</td>
        <td class="value">${esc(branchLabel)}</td>
        <td class="label" style="text-align:right;">เบอร์โทร :</td>
        <td class="value" style="text-align:right;">${esc(teamPhone)}</td>
      </tr>
      <tr>
        <td class="label">ชื่อโครงการ :</td>
        <td class="value-green">${esc(projectName)}</td>
        <td class="label" style="text-align:right;">W/O :</td>
        <td class="value-blue" style="text-align:right;">${esc(woNumber === '-' ? '' : woNumber)}</td>
      </tr>
      <tr>
        <td class="label">ระยะเวลาปฏิบัติงาน :</td>
        <td class="value">${periodText}</td>
        <td class="label" style="text-align:right;">P/O :</td>
        <td class="value" style="text-align:right;">${esc(customerPO)}</td>
      </tr>`;

		const html = buildNpkDocumentHtml({
			pageTitle: `ใบสั่งซื้อให้ช่าง ${po.poNumber}`,
			documentTitle: 'ใบสั่งซื้อให้ช่าง (Purchase Order)',
			logoUrl,
			infoTableHtml,
			greetingHtml: 'บริษัทฯ ขอสั่งซื้อ/จ้างงาน โดยมีรายละเอียด ดังนี้',
			items,
			conditions: po.conditions || DEFAULT_PO_CONDITIONS,
			warranty: warrantyText !== '-' ? warrantyText : '',
			notes: po.notes || '',
			subtotal,
			discountAmount: discAmt,
			vatPercent: vatPct,
			vatAmount: vatAmt,
			whtPercent: whtPct,
			whtAmount: whtAmt,
			totalAmount: grandTotal,
			closingParagraphHtml: 'จึงเรียนมาเพื่อทราบและดำเนินการตามรายละเอียดข้างต้น',
			footerLeftHtml: 'กรุณาลงชื่อเพื่อรับทราบและยืนยันการรับงาน',
			footerRightHtml: 'ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
			footerInNameHtml: `ในนาม  ${esc(payee)}`,
			signatureLeftTitle: 'ผู้อนุมัติรับซื้อ/รับจ้าง',
			signatureRightName: 'มนต์เทียน เรืองเดชอังกูร',
			signatureRightDate: thaiDate(po.date)
		});

		return new NextResponse(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	} catch (error) {
		console.error('PO PDF generation error:', error);
		return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
}
