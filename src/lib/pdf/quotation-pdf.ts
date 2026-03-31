/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { THSarabunNew_normal, THSarabunNew_bold } from '@/lib/fonts/thsarabun-base64';

// ── Helpers ──
function fmt(n: any) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function thaiDate(d: Date | string) {
  const date = new Date(d);
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function bahtText(n: number): string {
  const txt = ['', 'หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const unit = ['', 'สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  if (n === 0) return 'ศูนย์ถ้วน';
  const [intPart, decPart] = n.toFixed(2).split('.');
  let result = '';
  const intStr = intPart.replace(/,/g, '');
  const len = intStr.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(intStr[i]);
    const pos = len - i - 1;
    if (d === 0) continue;
    if (pos === 1 && d === 1) { result += 'สิบ'; continue; }
    if (pos === 1 && d === 2) { result += 'ยี่สิบ'; continue; }
    if (pos === 0 && d === 1 && len > 1) { result += 'เอ็ด'; continue; }
    result += txt[d] + unit[pos];
  }
  result += '';
  const dec = parseInt(decPart);
  if (dec === 0) { result += 'ถ้วน'; }
  else {
    const d1 = Math.floor(dec / 10);
    const d2 = dec % 10;
    if (d1 === 1) result += 'สิบ';
    else if (d1 === 2) result += 'ยี่สิบ';
    else if (d1 > 0) result += txt[d1] + 'สิบ';
    if (d2 === 1 && d1 > 0) result += 'เอ็ด';
    else if (d2 > 0) result += txt[d2];
    result += 'สตางค์';
  }
  return result;
}

// ── Types ──
export interface QuotationPDFData {
  quotationNumber: string;
  revisionNumber?: number;
  date: string | Date;
  projectName?: string | null;
  customerPO?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  vatPercent?: number;
  vatAmount: number;
  totalAmount: number;
  conditions?: string | null;
  notes?: string | null;
  warranty?: string | null;
  customerGroup?: { groupName: string; headOfficeAddress?: string | null } | null;
  branch?: { code?: string | null; name: string } | null;
  createdBy?: { name: string } | null;
  items: Array<{
    itemType?: string | null;
    description: string;
    quantity: number;
    unit?: string | null;
    materialPrice?: number;
    labourPrice?: number;
    parentIndex?: number | null;
  }>;
  photos?: Array<{
    fileUrl: string;
    caption?: string | null;
    photoType?: string;
    uploadedBy?: string | null;
    imageData?: string; // base64 data URL for embedding in PDF
  }>;
}

// ── Main PDF Generator ──
export function generateQuotationPDF(data: QuotationPDFData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register Thai fonts
  doc.addFileToVFS('THSarabunNew.ttf', THSarabunNew_normal);
  doc.addFileToVFS('THSarabunNew-Bold.ttf', THSarabunNew_bold);
  doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
  doc.addFont('THSarabunNew-Bold.ttf', 'THSarabunNew', 'bold');
  doc.setFont('THSarabunNew', 'normal');

  const pageW = 210;
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  const centerX = pageW / 2;
  let y = 12;

  // Display QN
  const displayQN = (data.revisionNumber || 0) > 0
    ? `${data.quotationNumber} Rev.${data.revisionNumber}`
    : data.quotationNumber;

  const customerName = data.customerGroup?.groupName || '-';

  // ══════════════════════════════════════
  // HEADER — Company info (left-aligned like reference)
  // ══════════════════════════════════════
  // Logo - green N PK block (left side, larger)
  const logoW = 28;
  const logoH = 34;
  const logoX = marginL;

  // Draw NPK logo
  doc.setFillColor(34, 139, 34);
  doc.rect(logoX, y, logoW, logoH, 'F');
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  doc.text('N', logoX + 4, y + 16);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('PK', logoX + 17, y + 18);
  // Small text under logo
  doc.setFontSize(5);
  doc.text('NPK SERVICE & SUPPLY CO.,LTD.', logoX + logoW / 2, y + logoH - 2, { align: 'center' });

  // Company text - LEFT-ALIGNED next to logo
  const textStartX = logoX + logoW + 5;

  doc.setTextColor(0, 0, 0);
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(16);
  doc.text('บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด', textStartX, y + 6);

  doc.setFontSize(12);
  doc.text('NPK SERVICE & SUPPLY CO.,LTD', textStartX, y + 11);

  doc.setFont('THSarabunNew', 'normal');
  doc.setFontSize(9);
  doc.text('สำนักงานใหญ่ : 210/19  หมู่ 4  ตำบลสนามชัย  อำเภอเมืองสุพรรณบุรี  จังหวัดสุพรรณบุรี  72000', textStartX, y + 16);
  doc.text('Head Office : 210/19 Moo.4 , Tombon Sanamchai ,  Amphur Mueang   Suphanburi,   Suphanburi 72000', textStartX, y + 20);
  doc.text('เลขผู้เสียภาษี 0105555161084    Tel: 09-8942-9891, 06-5961-9799 , 09-3694-4591    E-mail : npkservicesupply@gmail.com', textStartX, y + 24);

  y += logoH + 4;

  // ══════════════════════════════════════
  // TITLE — ใบเสนอราคา(Quotation)
  // ══════════════════════════════════════
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(18);
  doc.text('ใบเสนอราคา (Quotation)', centerX, y, { align: 'center' });
  y += 8;

  // ══════════════════════════════════════
  // INFO SECTION — 2 columns (matching mpdf layout)
  // ══════════════════════════════════════
  doc.setFontSize(12);

  const leftCol = marginL;
  const rightLabelX = pageW - marginR - 60;
  const rightValueX = pageW - marginR - 30;
  const leftLabelW = 24;
  const leftValueX = leftCol + leftLabelW + 2;

  // Row 1: ชื่อลูกค้า / เลขที่
  doc.setFont('THSarabunNew', 'bold');
  doc.text('ชื่อลูกค้า :', leftCol, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(customerName, leftValueX, y);
  doc.setFont('THSarabunNew', 'bold');
  doc.text('เลขที่', rightLabelX, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(displayQN, rightValueX, y);
  y += 5.5;

  // Row 2: อ้างถึง / วันที่
  doc.setFont('THSarabunNew', 'bold');
  doc.text('อ้างถึง :', leftCol, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(data.contactName || '-', leftValueX, y);
  doc.setFont('THSarabunNew', 'bold');
  doc.text('วันที่', rightLabelX, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(thaiDate(data.date), rightValueX, y);
  y += 5.5;

  // Row 3: สาขา / W/O
  const branchDisplay = data.branch
    ? `${data.branch.code || ''} ${data.branch.name}`.trim()
    : '-';
  doc.setFont('THSarabunNew', 'bold');
  doc.text('สาขา :', leftCol, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(branchDisplay, leftValueX, y);
  doc.setFont('THSarabunNew', 'bold');
  doc.text('W/O', rightLabelX, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(data.customerPO || '', rightValueX, y);
  y += 5.5;

  // Row 4: ชื่อโครงการ / P/O
  doc.setFont('THSarabunNew', 'bold');
  doc.text('ชื่อโครงการ :', leftCol, y);
  doc.setFont('THSarabunNew', 'normal');
  doc.text(data.projectName || '-', leftValueX + 5, y);
  doc.setFont('THSarabunNew', 'bold');
  doc.text('P/O', rightLabelX, y);
  y += 5.5;

  // Row 5: บริษัทฯ มีความยินดีใคร่ขอเสนอราคา...
  doc.setFont('THSarabunNew', 'normal');
  doc.setFontSize(12);
  doc.text('บริษัทฯ มีความยินดีใคร่ขอเสนอราคางานบริการ โดยมีทีมงานคุณภาพให้กับท่าน มีรายละเอียด ดังนี้', leftCol, y);
  y += 4;

  // ══════════════════════════════════════
  // ITEMS TABLE (matching mpdf exactly)
  // ══════════════════════════════════════
  let headerCount = 0;
  const subCountMap: Record<number, number> = {};
  const tableBody: any[][] = [];

  data.items.forEach((item, i) => {
    const isHeader = (item.itemType || 'ITEM') === 'HEADER';

    if (isHeader) {
      headerCount++;
      subCountMap[i] = 0;
      tableBody.push([
        { content: '', styles: { halign: 'center' } },
        { content: item.description, colSpan: 8, styles: { fontStyle: 'bold' } },
      ]);
      return;
    }

    const parentIdx = item.parentIndex ?? -1;
    let displayNum = '';
    if (parentIdx >= 0 && subCountMap[parentIdx] !== undefined) {
      subCountMap[parentIdx]++;
      let hNum = 0;
      for (let j = 0; j <= parentIdx; j++) {
        if ((data.items[j].itemType || 'ITEM') === 'HEADER') hNum++;
      }
      displayNum = `${hNum}.${subCountMap[parentIdx]}`;
    } else {
      displayNum = `${i + 1}`;
    }

    const matPrice = Number(item.materialPrice || 0);
    const labPrice = Number(item.labourPrice || 0);
    const qty = Number(item.quantity);
    const matTotal = qty * matPrice;
    const labTotal = qty * labPrice;
    const amount = matTotal + labTotal;

    tableBody.push([
      displayNum,
      item.description,
      String(qty),
      item.unit || '',
      matPrice > 0 ? fmt(matPrice) : '',
      labPrice > 0 ? fmt(labPrice) : '',
      matTotal > 0 ? fmt(matTotal) : '',
      labTotal > 0 ? fmt(labTotal) : '',
      fmt(amount),
    ]);
  });

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [
      [
        { content: 'Item', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Description', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Unit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Price Unit/Baht', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Total Price/Baht', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Amount Baht', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ],
      [
        { content: 'Material', styles: { halign: 'center' } },
        { content: 'Labour', styles: { halign: 'center' } },
        { content: 'Material', styles: { halign: 'center' } },
        { content: 'Labour', styles: { halign: 'center' } },
      ],
    ],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'THSarabunNew',
      fontSize: 10,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },   // Item
      1: { cellWidth: 'auto' },                   // Description (auto-fill)
      2: { cellWidth: 12, halign: 'center' },     // Qty
      3: { cellWidth: 14, halign: 'center' },     // Unit
      4: { cellWidth: 20, halign: 'right' },      // Material unit price
      5: { cellWidth: 20, halign: 'right' },      // Labour unit price
      6: { cellWidth: 22, halign: 'right' },      // Material total
      7: { cellWidth: 22, halign: 'right' },      // Labour total
      8: { cellWidth: 24, halign: 'right' },      // Amount
    },
  });

  y = (doc as any).lastAutoTable.finalY;

  const totalNum = Number(data.totalAmount);
  const amountText = `( ${bahtText(totalNum)} )`;

  // ══════════════════════════════════════
  // CONDITIONS BOX (left) + TOTALS TABLE (right) — side by side
  // ══════════════════════════════════════
  const tableRightEdge = pageW - marginR; // = 195, same as items table
  const totLabelW = 40;
  const totAmountW = 45;
  const rowH = 6;
  const totTotalW = totLabelW + totAmountW;
  const totalsX = tableRightEdge - totTotalW;

  // Calculate total rows for totals
  const hasDiscount = Number(data.discountAmount) > 0;
  const totalRows = hasDiscount ? 5 : 3; // Sub, (Discount, After Discount), Vat, Grand
  const totalsHeight = totalRows * rowH;

  // ── LEFT: Conditions box (same height as totals) ──
  const condBoxX = marginL;
  const condBoxW = totalsX - marginL - 2;
  const condBoxY = y;
  const condBoxH = totalsHeight;

  // Draw conditions box border
  doc.rect(condBoxX, condBoxY, condBoxW, condBoxH);

  doc.setFontSize(10);
  let condY = condBoxY + 4.5;

  // เงื่อนไขการชำระเงิน
  doc.setFont('THSarabunNew', 'bold');
  doc.text('เงื่อนไขการชำระเงิน :', condBoxX + 2, condY);
  doc.setFont('THSarabunNew', 'normal');
  if (data.conditions) {
    const payLines = doc.splitTextToSize(data.conditions, condBoxW - 40);
    doc.text(payLines.slice(0, 2).join(' '), condBoxX + 38, condY);
  }
  condY += 5;

  // Inner line
  doc.line(condBoxX, condBoxY + (condBoxH / 3), condBoxX + condBoxW, condBoxY + (condBoxH / 3));

  // เงื่อนไขการรับประกัน
  doc.setFont('THSarabunNew', 'bold');
  doc.text('เงื่อนไขการรับประกัน', condBoxX + 2, condY + 4);
  doc.setFont('THSarabunNew', 'normal');
  if (data.warranty) {
    doc.text(data.warranty.substring(0, 60), condBoxX + 38, condY + 4);
  }

  // Inner line
  doc.line(condBoxX, condBoxY + (condBoxH * 2 / 3), condBoxX + condBoxW, condBoxY + (condBoxH * 2 / 3));

  // หมายเหตุ
  condY = condBoxY + (condBoxH * 2 / 3) + 4.5;
  doc.setFont('THSarabunNew', 'bold');
  doc.text('หมายเหตุ :', condBoxX + 2, condY);
  doc.setFont('THSarabunNew', 'normal');
  if (data.notes) {
    doc.text(data.notes.substring(0, 60), condBoxX + 20, condY);
  }

  // ── RIGHT: Totals table ──
  const drawTotalRow = (label: string, amount: string, yPos: number, isBold = false, color?: string) => {
    doc.setFont('THSarabunNew', isBold ? 'bold' : 'normal');
    doc.setFontSize(11);

    // Label cell
    doc.rect(totalsX, yPos, totLabelW, rowH);
    doc.text(label, totalsX + totLabelW - 2, yPos + 4.5, { align: 'right' });

    // Amount cell
    doc.rect(totalsX + totLabelW, yPos, totAmountW, rowH);
    if (color === 'red') doc.setTextColor(220, 38, 38);
    doc.text(amount, totalsX + totLabelW + totAmountW - 2, yPos + 4.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  let totY = y;
  drawTotalRow('Sub Total', fmt(data.subtotal), totY);
  totY += rowH;

  if (hasDiscount) {
    drawTotalRow('Discount', `-${fmt(data.discountAmount)}`, totY, false, 'red');
    totY += rowH;
    // After Discount row
    const afterDiscount = Number(data.subtotal) - Number(data.discountAmount);
    drawTotalRow('After Discount', fmt(afterDiscount), totY);
    totY += rowH;
  }

  drawTotalRow(`Vat ${Number(data.vatPercent || 7)}%`, fmt(data.vatAmount), totY);
  totY += rowH;

  drawTotalRow('Grand Total', fmt(data.totalAmount), totY, true);
  totY += rowH;

  y = Math.max(y + 8, totY + 2);

  // ══════════════════════════════════════
  // AMOUNT IN THAI TEXT (right-aligned, bold)
  // ══════════════════════════════════════
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  y += 3;
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(12);
  doc.text(amountText, pageW - marginR, y, { align: 'right' });
  y += 6;

  // ══════════════════════════════════════
  // CLOSING MESSAGE
  // ══════════════════════════════════════
  doc.setFont('THSarabunNew', 'normal');
  doc.setFontSize(11);
  doc.text('จึงเรียนมาเพื่อพิจารณา บริษัทฯ หวังเป็นอย่างยิ่งว่าจะมีโอกาสให้บริการแก่ท่าน และขอบขอบพระคุณมา ณ โอกาสนี้', marginL, y);
  y += 6;

  // ══════════════════════════════════════
  // TWO-COLUMN INSTRUCTION + COMPANY
  // ══════════════════════════════════════
  doc.setFont('THSarabunNew', 'normal');
  doc.setFontSize(11);
  doc.text('กรุณาลงชื่อเพื่ออนุมัติและส่งกลับ กรณีต้องการใช้บริการ', marginL, y);
  doc.text('ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด', pageW - marginR, y, { align: 'right' });
  y += 5;

  // Customer name line
  doc.text(`ในนาม  ${customerName}`, marginL, y);
  y += 8;

  // ══════════════════════════════════════
  // SIGNATURES (two columns)
  // ══════════════════════════════════════
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  const leftSigX = marginL + 30;
  const rightSigX = pageW - marginR - 35;
  const sigStartY = y;

  // ── LEFT: ผู้อนุมัติสั่งซื้อ/สั่งจ้าง ──
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(11);
  doc.text('ผู้อนุมัติสั่งซื้อ/สั่งจ้าง', leftSigX, sigStartY, { align: 'center' });

  // Signature line
  doc.line(leftSigX - 30, sigStartY + 12, leftSigX + 30, sigStartY + 12);

  // Date line
  doc.setFont('THSarabunNew', 'normal');
  doc.setFontSize(10);
  doc.text('วันที่......./......./........', leftSigX, sigStartY + 18, { align: 'center' });

  // ── RIGHT: ผู้อนุมัติ (company side) ──
  doc.setFont('THSarabunNew', 'bold');
  doc.setFontSize(11);
  doc.text('ผู้อนุมัติ', rightSigX, sigStartY, { align: 'center' });

  // Name
  doc.setFont('THSarabunNew', 'normal');
  doc.text(data.createdBy?.name || 'มนต์เทียน เรืองเดชอังกูร', rightSigX, sigStartY + 6, { align: 'center' });

  // Title
  doc.text('กรรมการผู้จัดการ', rightSigX, sigStartY + 11, { align: 'center' });

  // Date
  doc.text(thaiDate(data.date), rightSigX, sigStartY + 16, { align: 'center' });

  // ══════════════════════════════════════
  // PAGE 2: PHOTO REPORT (if photos exist)
  // ══════════════════════════════════════
  if (data.photos && data.photos.length > 0) {
    addPhotoReportPage(doc, data);
  }

  return doc;
}

// ── Photo Report Page Generator ──
function addPhotoReportPage(doc: jsPDF, data: QuotationPDFData) {
  const photos = data.photos || [];
  if (photos.length === 0) return;

  const pageW = 210;
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;

  // Calculate pages needed (6 photos per page in a 2x3 grid)
  const photosPerPage = 6;
  const totalPages = Math.ceil(photos.length / photosPerPage);

  for (let page = 0; page < totalPages; page++) {
    doc.addPage();
    let y = 12;

    // ── HEADER (same as quotation) ──
    const logoW = 22;
    const logoH = 28;
    const logoX = marginL;

    // Draw NPK logo
    doc.setFillColor(34, 139, 34);
    doc.rect(logoX, y, logoW, logoH, 'F');
    doc.setFont('THSarabunNew', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('N', logoX + 4, y + 14);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('PK', logoX + 14, y + 16);
    doc.setFontSize(5);
    doc.text('NPK SERVICE & SUPPLY CO.,LTD.', logoX + logoW / 2, y + logoH - 2, { align: 'center' });

    const textStartX = logoX + logoW + 5;
    const textCenterX = textStartX + (pageW - marginR - textStartX) / 2;

    doc.setTextColor(0, 0, 0);
    doc.setFont('THSarabunNew', 'bold');
    doc.setFontSize(16);
    doc.text('บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด', textCenterX, y + 5, { align: 'center' });
    doc.setFontSize(13);
    doc.text('NPK SERVICE & SUPPLY CO.,LTD.', textCenterX, y + 10, { align: 'center' });
    doc.setFont('THSarabunNew', 'normal');
    doc.setFontSize(9);
    doc.text('สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000', textCenterX, y + 15, { align: 'center' });
    doc.text('Head Office : 210/19 Moo.4 ,Tambon Sanamchai , Amphur Mueang Suphanburi , Suphanburi 72000', textCenterX, y + 19, { align: 'center' });
    doc.text('Call : 09-8942-9891, 06-5961-9799 , 09-3694-4591 E-mail : npkservicesupply@gmail.com', textCenterX, y + 23, { align: 'center' });

    y += logoH + 4;

    // ── TITLE: รูปภาพ REPORT ──
    doc.setFont('THSarabunNew', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38);
    doc.text('รูปภาพ REPORT', pageW / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 7;

    // ── Info line ──
    doc.setFont('THSarabunNew', 'normal');
    doc.setFontSize(11);

    const displayQN = (data.revisionNumber || 0) > 0
      ? `${data.quotationNumber} Rev.${data.revisionNumber}`
      : data.quotationNumber;
    const customerName = data.customerGroup?.groupName || '-';
    const branchDisplay = data.branch
      ? `${data.branch.code || ''} ${data.branch.name}`.trim()
      : '-';

    doc.setFont('THSarabunNew', 'bold');
    doc.text('สถานที่ปฏิบัติงาน', marginL, y);
    doc.setFont('THSarabunNew', 'normal');
    doc.text(customerName, marginL + 30, y);
    y += 5;

    // Branch + QN info row
    doc.setFont('THSarabunNew', 'bold');
    doc.text('สาขา', marginL, y);
    doc.setFont('THSarabunNew', 'normal');
    doc.text(branchDisplay, marginL + 15, y);

    doc.setFont('THSarabunNew', 'bold');
    doc.text('เลขที่คำสั่งงาน', marginL + 90, y);
    doc.setFont('THSarabunNew', 'normal');
    doc.text(displayQN, marginL + 115, y);

    doc.setFont('THSarabunNew', 'bold');
    doc.text('ใบเสนอราคาลงวันที่', pageW - marginR - 55, y);
    doc.setFont('THSarabunNew', 'normal');
    doc.text(thaiDate(data.date), pageW - marginR - 20, y);
    y += 3;

    // Divider line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;

    // ── Photo Grid (2 columns x 3 rows) ──
    const startIdx = page * photosPerPage;
    const endIdx = Math.min(startIdx + photosPerPage, photos.length);
    const pagePhotos = photos.slice(startIdx, endIdx);

    const colGap = 6;
    const photoW = (contentW - colGap) / 2;
    const photoH = 62;
    const rowGap = 8;

    for (let i = 0; i < pagePhotos.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = marginL + col * (photoW + colGap);
      const py = y + row * (photoH + rowGap);

      // Photo frame with border
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(px, py, photoW, photoH);

      // Try to add the image
      const photo = pagePhotos[i];
      const imgAreaH = photoH - 10;

      if (photo.imageData) {
        try {
          doc.addImage(photo.imageData, 'JPEG', px + 0.5, py + 0.5, photoW - 1, imgAreaH);
        } catch {
          // Fallback: show placeholder
          doc.setFillColor(245, 245, 245);
          doc.rect(px + 0.5, py + 0.5, photoW - 1, imgAreaH, 'F');
          doc.setFont('THSarabunNew', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e42\u0e2b\u0e25\u0e14\u0e23\u0e39\u0e1b\u0e44\u0e14\u0e49', px + photoW / 2, py + imgAreaH / 2, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
      } else {
        // Placeholder
        doc.setFillColor(245, 245, 245);
        doc.rect(px + 0.5, py + 0.5, photoW - 1, imgAreaH, 'F');
        doc.setFont('THSarabunNew', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('\ud83d\udcf7 \u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e', px + photoW / 2, py + imgAreaH / 2, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      // Caption area below photo
      doc.setFillColor(250, 250, 250);
      doc.rect(px, py + photoH - 10, photoW, 10, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.rect(px, py + photoH - 10, photoW, 10);

      doc.setFont('THSarabunNew', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);

      // Caption text
      const captionText = photo.caption || `รูปที่ ${startIdx + i + 1}`;
      const maxCaptionW = photoW - 4;
      const truncCaption = doc.getTextWidth(captionText) > maxCaptionW
        ? captionText.substring(0, 30) + '...'
        : captionText;
      doc.text(truncCaption, px + 2, py + photoH - 5);

      // Photo type badge
      const typeLabel = photo.photoType === 'AFTER' ? 'หลังทำงาน' : 'ก่อนทำงาน';
      doc.setFontSize(7);
      doc.setTextColor(0, 100, 200);
      doc.text(typeLabel, px + photoW - 2, py + photoH - 2, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    // Page number
    const totalDocPages = doc.getNumberOfPages();
    doc.setFont('THSarabunNew', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `หน้า ${totalDocPages} / รูปภาพ ${startIdx + 1}-${endIdx} จาก ${photos.length}`,
      pageW / 2,
      287,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }
}
