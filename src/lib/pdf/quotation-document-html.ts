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
	/** ข้อความหลัง W/O (เลข WO หรือสถานะใบเสนอราคา) */
	woText?: string;
	/** เลข P/O ของลูกค้า */
	poText?: string;
	photos?: DocPhoto[];
}

const esc = (s: unknown) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
const nl = (s: unknown) => esc(s).replace(/\n/g, '<br/>');

// ความจุของแต่ละหน้า หน่วยเป็น "บรรทัด" (1 บรรทัด = 23px)
const CAP_FIRST = 33;
const CAP_NEXT = 36;
const FOOT_LINES = 9; // พื้นที่ท้ายเอกสาร (สรุปยอด/เงื่อนไข/ลายเซ็น) บนหน้าสุดท้าย
const CHARS_PER_LINE = 46;
const PHOTOS_PER_PAGE = 6;

const STYLES = `
  @font-face { font-family: 'THSarabunNew'; src: url('/fonts/THSarabunNew.ttf') format('truetype'); font-weight: 400; }
  @font-face { font-family: 'THSarabunNew'; src: url('/fonts/THSarabunNew-Bold.ttf') format('truetype'); font-weight: 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'THSarabunNew', 'Sarabun', 'Tahoma', sans-serif; font-size: 16px; line-height: 20px; color: #000; background: #e5e7eb; }
  .page { position: relative; width: 210mm; height: 297mm; padding: 3mm 8.5mm 10mm; margin: 0 auto 12px; background: #fff; overflow: hidden; page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  @media print { body { background: #fff; } .page { margin: 0; } }
  .hd { position: relative; text-align: center; }
  .hd img { position: absolute; left: 0; top: 16px; width: 125px; height: auto; }
  .hd .name-th { font-size: 24px; font-weight: 700; line-height: 34px; }
  .hd .name-en { font-size: 25px; line-height: 32px; }
  .hd .sm { font-size: 16px; line-height: 24px; }
  .hd .sm.th { font-weight: 700; line-height: 30px; margin-top: 0; }
  .hd .sm.en { margin-top: 7px; }
  .title { text-align: center; font-size: 26px; font-weight: 700; line-height: 24px; margin: 15px 0 9px; }
  .title.report { color: #c4161c; }
  .info { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .info td { padding: 0; vertical-align: top; font-size: 18px; line-height: 24.5px; }
  .info .l { width: 506px; }
  .info .r { width: 40px; white-space: nowrap; }
  .info .rv { width: auto; }
  .proj { font-size: 18px; }
  table.items { width: 100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed; }
  .items th { border: 1px solid #000; font-weight: 400; font-size: 16.5px; padding: 2px 3px; text-align: center; background: #fff; }
  .items td { border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #d9d9d9; padding: 0 5px; height: 23px; font-size: 17.5px; line-height: 23px; vertical-align: top; }
  .items td.center { text-align: center; }
  .items td.right { text-align: right; white-space: nowrap; }
  .items td.desc { text-align: left; word-break: break-word; }
  .items tr.filler td { border-bottom: none; }
  .items tr.header-row td { font-weight: 700; }
  .foot { display: flex; justify-content: space-between; align-items: flex-start; }
  .foot .words { flex: 1; padding: 0 0 0 21px; font-size: 17.5px; font-weight: 700; line-height: 23px; }



  .tot { border-collapse: collapse; flex: none; margin-right: 0; }
  .tot td { border: 1px solid #000; border-top: none; padding: 0 4px; font-size: 16.5px; font-weight: 700; line-height: 22px; height: 23px; white-space: nowrap; }
  .tot td.k { text-align: left; width: 78px; }
  .tot td.n { text-align: right; width: 78px; }

  .tot tr.g td { border-bottom: 3px double #000; }
  .close { position: relative; margin: 30px 4px 0 auto; width: 340px; text-align: right; font-size: 18px; line-height: 22px; }
  .close .sigbox { position: relative; height: 32px; }
  .close .sig { position: absolute; right: 60px; top: -8px; width: 110px; height: auto; }
  .close .stamp { position: absolute; right: 150px; top: 8px; width: 100px; height: auto; opacity: .85; }
  .close .line { margin-top: 0; }
  .pageno { position: absolute; right: 10mm; bottom: 5mm; font-size: 13px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .photo { border: 1px solid #bbb; border-radius: 4px; overflow: hidden; }
  .photo img { width: 100%; height: 235px; object-fit: cover; display: block; background: #f3f3f3; }
  .photo .cap { display: flex; justify-content: space-between; gap: 8px; padding: 3px 8px; font-size: 14px; background: #f8f8f8; border-top: 1px solid #eee; }
  .photo .cap span:last-child { color: #0b5cad; white-space: nowrap; }
`;

function header(c: DocCompany, logoUrl: string): string {
	const addrTh = /^สำนักงานใหญ่/.test(c.addressTh) ? c.addressTh : `สำนักงานใหญ่ : ${c.addressTh}`;
	const addrEn = c.addressEn
		? /^Head Office/i.test(c.addressEn)
			? c.addressEn
			: `Head Office : ${c.addressEn}`
		: '';
	const contact = [
		c.phones.length ? `Call : ${esc(c.phones.join(' , '))}` : '',
		c.email ? `E-mail : ${esc(c.email)}` : ''
	]
		.filter(Boolean)
		.join(' &nbsp; ');

	return `
    <div class="hd">
      <img src="${esc(logoUrl)}" alt="" onerror="this.style.display='none'" />
      <div class="name-th">${esc(c.nameTh)}</div>
      <div class="name-en">${esc(c.nameEn)}</div>
      <div class="sm th">${esc(addrTh)}</div>
      ${addrEn ? `<div class="sm en">${esc(addrEn)}</div>` : ''}
      ${contact ? `<div class="sm">${contact}</div>` : ''}
    </div>`;
}

const THEAD = `
  <colgroup>
    <col style="width:31px"/><col/><col style="width:38px"/><col style="width:48px"/>
    <col style="width:62px"/><col style="width:60px"/><col style="width:69px"/><col style="width:71px"/><col style="width:79px"/>
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
	const extra = [
		c.conditions ? `<div><b>เงื่อนไขการชำระเงิน :</b> ${nl(c.conditions)}</div>` : '',
		c.bankLines.length ? `<div><b>ชำระเงิน :</b> ${c.bankLines.map(esc).join('<br/>')}</div>` : '',
		c.notes ? `<div><b>หมายเหตุ :</b> ${nl(c.notes)}</div>` : ''
	].join('');

	return `
    <div class="foot">
      <div class="words">( ${thaiAmountText(c.totalAmount)} )</div>
      <table class="tot">
        <tr><td class="k">Sub Total</td><td class="n">${fmt(c.subtotal)}</td></tr>
        ${hasDiscount ? `<tr><td class="k">Discount</td><td class="n">${fmt(c.discountAmount)}</td></tr><tr><td class="k">After Discount</td><td class="n">${fmt(afterDiscount)}</td></tr>` : ''}
        <tr><td class="k">Vat ${esc(c.vatPercent)}%</td><td class="n">${fmt(c.vatAmount)}</td></tr>
        <tr class="g"><td class="k">Grand Total</td><td class="n">${fmt(c.totalAmount)}</td></tr>
      </table>
    </div>
    ${extra ? `<div style="font-size:16px; line-height:21px; margin-top:6px;">${extra}</div>` : ''}
    <div class="close">
      <img class="stamp" src="${esc(c.stampUrl)}" alt="" onerror="this.style.display='none'" />
      <div>จึงเรียนมาเพื่อพิจารณาและขอบพระคุณที่ท่านเลือกใช้บริการของ NPK</div>
      <div><b>${esc(c.signerName)}</b></div>
      <div class="sigbox"><img class="sig" src="${esc(c.signatureUrl)}" alt="" onerror="this.style.display='none'" /></div>
      <div class="line">ผู้เสนอราคา.......................................................</div>
    </div>`;
}

function infoBlock(c: QuotationDocumentConfig): string {
	return `
    <div class="title">ใบเสนอราคา(Quotation)</div>
    <table class="info">
      <tr><td class="l">ชื่อลูกค้า : ${esc(c.customerName)}</td><td class="r">เลขที่</td><td class="rv">${esc(c.displayQN)}</td></tr>
      <tr><td class="l">อ้างถึง : ${esc(c.projectName)}</td><td class="r">วันที่</td><td class="rv">${esc(c.dateText)}</td></tr>
      <tr><td class="l">สาขา : ${esc(c.branchDisplay)}</td><td class="r">W/O</td><td class="rv">${esc(c.woText ?? '')}</td></tr>
      <tr><td class="l"><b>บริษัทฯ มีความยินดีขอเสนอราคา</b></td><td class="r">P/O</td><td class="rv">${esc(c.poText ?? '')}</td></tr>
    </table>`;
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
    ${total > 1 ? `<div class="pageno">หน้า ${idx + 1}/${total}</div>` : ''}
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
