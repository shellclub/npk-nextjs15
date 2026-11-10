/**
 * ใบเสนอราคา (Quotation) + รูปภาพ REPORT — แม่แบบพิมพ์ตามไฟล์ตัวอย่าง "ตัวอย่าง/เสนอราคา"
 * ใช้หัวกระดาษ ฟอนต์ และกรอบเดียวกันทั้งใบเสนอราคาและรายงานรูปภาพ
 * ข้อมูลบริษัท/โลโก้/ลายเซ็น/ตราประทับมาจากหน้าตั้งค่าบริษัท
 */

import { fmt, thaiAmountText, buildItemsTableHtml, DocumentLineItem } from '@/lib/pdf/npk-document-html';

export interface DocCompany {
	nameTh: string;
	nameEn: string;
	addressTh: string;
	addressEn: string;
	taxId: string;
	phones: string[];
	email: string;
}

export interface DocPhoto {
	fileUrl: string;
	caption?: string | null;
	photoType?: string | null;
}

export interface QuotationDocumentConfig {
	pageTitle: string;
	company: DocCompany;
	logoUrl: string;
	signatureUrl: string;
	stampUrl: string;
	customerName: string;
	branchDisplay: string;
	address: string;
	validDays: number;
	projectName: string;
	displayQN: string;
	dateText: string;
	contactPerson: string;
	contactPhone: string;
	items: DocumentLineItem[];
	conditions: string;
	notes: string;
	bankLines: string[];
	subtotal: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	signerName: string;
	photos?: DocPhoto[];
}

const esc = (s: unknown) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
const nl = (s: unknown) => esc(s).replace(/\n/g, '<br/>');

// ความจุของแต่ละหน้า หน่วยเป็น "บรรทัด" (1 บรรทัด = 18px)
const CAP_FIRST = 34;
const CAP_NEXT = 44;
const FOOT_LINES = 23; // พื้นที่ท้ายเอกสาร (สรุปยอด/เงื่อนไข/ลายเซ็น) บนหน้าสุดท้าย
const CHARS_PER_LINE = 44;
const PHOTOS_PER_PAGE = 6;

const STYLES = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Sarabun', 'Tahoma', sans-serif; font-size: 13px; line-height: 20px; color: #111; background: #e5e7eb; }
  .page { position: relative; width: 210mm; height: 297mm; padding: 9mm 13mm 14mm; margin: 0 auto 12px; background: #fff; overflow: hidden; page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  @media print { body { background: #fff; } .page { margin: 0; } }
  .hd { display: flex; align-items: center; gap: 16px; }
  .hd img { width: 112px; height: auto; flex-shrink: 0; }
  .hd .name-th { font-size: 22px; font-weight: 700; line-height: 30px; font-style: italic; }
  .hd .name-en { font-size: 17px; line-height: 24px; font-style: italic; }
  .hd .sm { font-size: 11.5px; line-height: 19px; font-style: italic; }
  .title { text-align: center; font-size: 19px; font-weight: 700; margin: 8px 0 8px; }
  .title.report { color: #c4161c; }
  .info { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .info td { padding: 1px 0; vertical-align: top; font-size: 13px; }
  .info .l { width: 122px; font-weight: 700; white-space: nowrap; }
  .info .r { width: 78px; font-weight: 700; white-space: nowrap; padding-left: 10px; }
  .info .rv { width: 160px; }
  .v { color: #dc2626; }
  .proj { color: #3a7d1e; font-size: 15px; }
  .greet { margin: 6px 0 4px; font-size: 13px; }
  table.items { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
  .items th { border: 1px solid #000; font-weight: 400; font-size: 11.5px; padding: 2px 3px; text-align: center; background: #fff; }
  .items td { border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #d9d9d9; padding: 0 4px; height: 18px; font-size: 12.5px; line-height: 17px; vertical-align: top; }
  .items td.center { text-align: center; }
  .items td.right { text-align: right; white-space: nowrap; }
  .items td.desc { text-align: left; word-break: break-word; }
  .items tr.filler td { border-bottom: 1px solid #d9d9d9; }
  .items tr.header-row td { font-weight: 700; }
  .foot { width: 100%; border: 1.5px solid #000; border-top: none; border-collapse: collapse; }
  .foot > tbody > tr > td { vertical-align: top; padding: 4px 6px; }
  .foot .txt { font-size: 12.5px; }
  .foot .txt b { font-weight: 700; }
  .tot { width: 100%; border-collapse: collapse; }
  .tot td { border: 1px solid #000; padding: 2px 6px; font-size: 12.5px; }
  .tot td.k { text-align: right; width: 95px; font-style: italic; }
  .tot td.n { text-align: right; width: 100px; }
  .tot tr.g td { font-weight: 700; }
  .words { text-align: right; font-weight: 700; margin-top: 3px; font-size: 12.5px; }
  .close { margin-top: 8px; font-size: 13px; }
  .sign { display: flex; justify-content: space-between; gap: 20px; margin-top: 8px; font-size: 13px; }
  .sign .box { width: 48%; position: relative; min-height: 120px; }
  .sign .stamp { position: absolute; left: 0; top: 18px; width: 120px; height: auto; opacity: .9; }
  .sign .sig { position: absolute; left: 70px; top: 6px; width: 120px; height: auto; }
  .sign .right-lines { position: absolute; left: 0; right: 0; bottom: 0; text-align: right; }
  .pageno { position: absolute; right: 13mm; bottom: 5mm; font-size: 11.5px; font-style: italic; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .photo { border: 1px solid #bbb; border-radius: 4px; overflow: hidden; }
  .photo img { width: 100%; height: 235px; object-fit: cover; display: block; background: #f3f3f3; }
  .photo .cap { display: flex; justify-content: space-between; gap: 8px; padding: 3px 8px; font-size: 11.5px; background: #f8f8f8; border-top: 1px solid #eee; }
  .photo .cap span:last-child { color: #0b5cad; white-space: nowrap; }
`;

function header(c: DocCompany, logoUrl: string): string {
	const addrTh = /^สำนักงานใหญ่/.test(c.addressTh) ? c.addressTh : `สำนักงานใหญ่ : ${c.addressTh}`;
	const addrEn = c.addressEn
		? /^Head Office/i.test(c.addressEn)
			? c.addressEn
			: `Head Office : ${c.addressEn}`
		: '';

	return `
    <div class="hd">
      <img src="${esc(logoUrl)}" alt="" onerror="this.style.display='none'" />
      <div>
        <div class="name-th">${esc(c.nameTh)}</div>
        <div class="name-en">${esc(c.nameEn)}</div>
        <div class="sm">${esc(addrTh)}</div>
        ${addrEn ? `<div class="sm">${esc(addrEn)}</div>` : ''}
        <div class="sm">เลขผู้เสียภาษี ${esc(c.taxId)}${c.phones.length ? ` &nbsp;&nbsp; Tel: ${esc(c.phones.join(' , '))}` : ''}${c.email ? ` &nbsp;&nbsp; E-mail : ${esc(c.email)}` : ''}</div>
      </div>
    </div>`;
}

const THEAD = `
  <colgroup>
    <col style="width:30px"/><col/><col style="width:34px"/><col style="width:38px"/>
    <col style="width:64px"/><col style="width:64px"/><col style="width:64px"/><col style="width:64px"/><col style="width:74px"/>
  </colgroup>
  <thead>
    <tr>
      <th rowspan="2">Item</th><th rowspan="2">Description</th><th rowspan="2">Qty</th><th rowspan="2">Unit</th>
      <th colspan="2">Price Unit/Baht</th><th colspan="2">Total Price/Baht</th><th rowspan="2">Amount Baht</th>
    </tr>
    <tr><th>Material</th><th>Labour</th><th>Material</th><th>Labour</th></tr>
  </thead>`;

const FILLER =
	'<tr class="filler"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

/** จำนวนบรรทัดโดยประมาณของแถวรายการ (ใช้แบ่งหน้า) */
function rowLines(rowHtml: string): number {
	const m = /<td[^>]*(?:class="desc"|colspan="8")[^>]*>([\s\S]*?)<\/td>/.exec(rowHtml);

	if (!m) return 1;

	return m[1]
		.split(/<br\s*\/?>/i)
		.map((seg) => Math.max(1, Math.ceil(seg.replace(/<[^>]*>/g, '').length / CHARS_PER_LINE)))
		.reduce((a, b) => a + b, 0);
}

/** แบ่งแถวเป็นหน้า: หน้าสุดท้ายต้องเหลือที่ให้ส่วนท้ายเอกสาร (FOOT_LINES) ถ้าไม่พอจะเป็นหน้าสุดท้ายที่มีแต่ส่วนท้าย */
function paginate(rows: { html: string; lines: number }[]): { rows: typeof rows; used: number; cap: number }[] {
	const pages: { rows: typeof rows; used: number; cap: number }[] = [];
	let i = 0;

	for (;;) {
		const cap = pages.length === 0 ? CAP_FIRST : CAP_NEXT;
		const rest = rows.slice(i).reduce((s, r) => s + r.lines, 0);
		const last = rest + FOOT_LINES <= cap;
		const take: typeof rows = [];
		let used = 0;

		while (i < rows.length && (last || used + rows[i].lines <= cap || !take.length)) {
			take.push(rows[i]);
			used += rows[i].lines;
			i++;
		}

		pages.push({ rows: take, used, cap: last ? cap - FOOT_LINES : cap });

		if (last) return pages;
	}
}

function footer(c: QuotationDocumentConfig): string {
	const hasDiscount = c.discountAmount > 0;
	const afterDiscount = c.subtotal - c.discountAmount;

	return `
    <table class="foot"><tbody><tr>
      <td class="txt">
        <div><b>เงื่อนไขการชำระเงิน :</b> ${nl(c.conditions)}</div>
        ${c.bankLines.length ? `<div style="margin-top:8px;"><b>ชำระเงิน :</b> ${c.bankLines.map(esc).join('<br/>')}</div>` : ''}
        <div style="margin-top:8px;"><b>หมายเหตุ :</b> ${nl(c.notes)}</div>
      </td>
      <td style="width:195px; padding:0;">
        <table class="tot">
          <tr><td class="k">Sub Total</td><td class="n">${fmt(c.subtotal)}</td></tr>
          <tr><td class="k">Discount</td><td class="n">${hasDiscount ? fmt(c.discountAmount) : ''}</td></tr>
          <tr><td class="k">After Discount</td><td class="n">${fmt(afterDiscount)}</td></tr>
          <tr><td class="k">Vat ${esc(c.vatPercent)}%</td><td class="n">${fmt(c.vatAmount)}</td></tr>
          <tr class="g"><td class="k">Grand Total</td><td class="n">${fmt(c.totalAmount)}</td></tr>
        </table>
      </td>
    </tr></tbody></table>
    <div class="words">${thaiAmountText(c.totalAmount)}</div>
    <div class="close">จึงเรียนมาเพื่อพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะมีโอกาสให้บริการแก่ท่าน และขอขอบพระคุณมา ณ โอกาสนี้</div>
    <div class="sign">
      <div class="box">
        <div>กรุณาลงชื่อเพื่ออนุมัติและส่งกลับ กรณีต้องการใช้บริการ</div>
        <div style="margin-top:6px;">ในนาม <b class="v">${esc(c.customerName)}</b></div>
        <div style="margin-top:34px;">ผู้อนุมัติสั่งซื้อ/สั่งจ้าง</div>
        <div style="margin-left:40px; margin-top:6px;">............................................................</div>
        <div style="margin-left:80px;">วันที่......../......../........</div>
      </div>
      <div class="box">
        <div style="text-align:right;">ในนาม ${esc(c.company.nameTh)}</div>
        <img class="stamp" src="${esc(c.stampUrl)}" alt="" onerror="this.style.display='none'" />
        <img class="sig" src="${esc(c.signatureUrl)}" alt="" onerror="this.style.display='none'" />
        <div class="right-lines">ผู้อนุมัติ<br/>${esc(c.signerName)}<br/>กรรมการผู้จัดการ</div>
      </div>
    </div>`;
}

function infoBlock(c: QuotationDocumentConfig): string {
	return `
    <div class="title">ใบเสนอราคา / Quotation</div>
    <table class="info">
      <tr><td class="l">ชื่อลูกค้า :</td><td class="v"><b>${esc(c.customerName)}</b></td><td class="r">เลขที่</td><td class="rv v">${esc(c.displayQN)}</td></tr>
      <tr><td class="l">รหัสสาขา/สาขา :</td><td class="v">${esc(c.branchDisplay)}</td><td class="r">วันที่</td><td class="rv v">${esc(c.dateText)}</td></tr>
      <tr><td class="l">ที่อยู่ :</td><td class="v">${nl(c.address)}</td><td class="r">ผู้ติดต่อ :</td><td class="rv v">${esc(c.contactPerson)}</td></tr>
      <tr><td class="l">ยืนยันราคา :</td><td class="v">${esc(c.validDays)} วันนับจากวันที่เสนอราคา</td><td class="r">เบอร์โทร :</td><td class="rv v">${esc(c.contactPhone)}</td></tr>
      <tr><td class="l">ชื่อโครงการ :</td><td class="proj" colspan="3">${esc(c.projectName)}</td></tr>
    </table>
    <div class="greet">บริษัทฯ มีความยินดีขอเสนอราคางานบริการ โดยมีทีมงานคุณภาพให้กับท่าน มีรายละเอียด ดังนี้</div>`;
}

export function buildQuotationDocumentHtml(config: QuotationDocumentConfig): string {
	const rows = buildItemsTableHtml(config.items)
		.split(/(?<=<\/tr>)/)
		.map((h) => h.trim())
		.filter(Boolean)
		.map((html) => ({ html, lines: rowLines(html) }));
	const pages = paginate(rows);
	const total = pages.length;
	const photos = config.photos ?? [];
	const photoPages: DocPhoto[][] = [];

	for (let i = 0; i < photos.length; i += PHOTOS_PER_PAGE) photoPages.push(photos.slice(i, i + PHOTOS_PER_PAGE));

	const quotationPages = pages
		.map((p, idx) => {
			const isLast = idx === total - 1;
			const filler = Math.max(0, p.cap - p.used);

			return `
  <div class="page">
    ${header(config.company, config.logoUrl)}
    ${idx === 0 ? infoBlock(config) : ''}
    <table class="items" style="margin-top:${idx === 0 ? 0 : 10}px">
      ${THEAD}
      <tbody>${p.rows.map((r) => r.html).join('')}${FILLER.repeat(filler)}</tbody>
    </table>
    ${isLast ? footer(config) : ''}
    <div class="pageno">หน้า ${idx + 1}/${total}</div>
  </div>`;
		})
		.join('');

	const reportPages = photoPages
		.map(
			(group, idx) => `
  <div class="page">
    ${header(config.company, config.logoUrl)}
    <div class="title report">รูปภาพ REPORT</div>
    <table class="info">
      <tr><td class="l">สถานที่ปฏิบัติงาน</td><td class="v" colspan="3"><b>${esc(config.customerName)}</b></td></tr>
      <tr><td class="l">สาขา</td><td class="v">${esc(config.branchDisplay)}</td><td class="r">เลขที่</td><td class="rv v">${esc(config.displayQN)}</td></tr>
      <tr><td class="l">โครงการ</td><td class="proj">${esc(config.projectName)}</td><td class="r">ลงวันที่</td><td class="rv v">${esc(config.dateText)}</td></tr>
    </table>
    <div class="photos">
      ${group
			.map(
				(ph, i) => `
        <div class="photo">
          <img src="${esc(ph.fileUrl)}" alt="${esc(ph.caption || `รูปที่ ${idx * PHOTOS_PER_PAGE + i + 1}`)}" />
          <div class="cap"><span>${esc(ph.caption || `รูปที่ ${idx * PHOTOS_PER_PAGE + i + 1}`)}</span><span>${ph.photoType === 'AFTER' ? 'หลังทำงาน' : 'ก่อนทำงาน'}</span></div>
        </div>`
			)
			.join('')}
    </div>
    <div class="pageno">รูปภาพ หน้า ${idx + 1}/${photoPages.length}</div>
  </div>`
		)
		.join('');

	return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(config.pageTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
</head>
<body>${quotationPages}${reportPages}</body>
</html>`;
}
