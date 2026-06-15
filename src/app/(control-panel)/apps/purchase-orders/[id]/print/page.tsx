'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateThai(d: string | Date | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function fmtDateShort(d: string | Date | null | undefined) {
  if (!d) return '';
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear() + 543);
  return `${dd}/${mm}/${yy}`;
}

function numberToThaiText(num: number): string {
  if (num === 0) return 'ศูนย์บาทถ้วน';
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  const baht = Math.floor(Math.abs(num));
  const satang = Math.round((Math.abs(num) - baht) * 100);
  let result = num < 0 ? 'ลบ' : '';
  const bahtStr = String(baht);
  const len = bahtStr.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(bahtStr[i]);
    const pos = len - i - 1;
    if (d === 0) continue;
    if (pos === 0 && d === 1 && len > 1) { result += 'เอ็ด'; }
    else if (pos === 1 && d === 1) { result += 'สิบ'; }
    else if (pos === 1 && d === 2) { result += 'ยี่สิบ'; }
    else { result += digits[d] + positions[pos]; }
  }
  result += 'บาท';
  if (satang === 0) { result += 'ถ้วน'; }
  else {
    const satStr = String(satang).padStart(2, '0');
    for (let i = 0; i < 2; i++) {
      const d = parseInt(satStr[i]);
      const pos = 1 - i;
      if (d === 0) continue;
      if (pos === 0 && d === 1 && satang > 9) { result += 'เอ็ด'; }
      else if (pos === 1 && d === 1) { result += 'สิบ'; }
      else if (pos === 1 && d === 2) { result += 'ยี่สิบ'; }
      else { result += digits[d] + positions[pos]; }
    }
    result += 'สตางค์';
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PO = any;

export default function PurchaseOrderPrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [po, setPO] = useState<PO | null>(null);

  useEffect(() => {
    fetch(`/api/purchase-orders/${id}`).then(r => r.json()).then(data => {
      if (data && !data.error) setPO(data);
    }).catch(() => {});
  }, [id]);

  // Note: Printing is triggered from the parent page toolbar button
  // which calls iframe.contentWindow.print()

  if (!po) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
        <h2 style={{ color: '#94A3B8' }}>กำลังโหลด...</h2>
      </div>
    );
  }

  const items: PO[] = po.items || [];
  const subtotal = Number(po.subtotal) || items.filter((i: PO) => i.itemType === 'ITEM').reduce((s: number, i: PO) => s + Number(i.amount), 0);
  const discPct = Number(po.discountPercent) || 0;
  const discAmt = Number(po.discountAmount) || (subtotal * discPct / 100);
  const afterDisc = Number(po.afterDiscount) || (subtotal - discAmt);
  const vatPct = Number(po.vatPercent) || 0;
  const vatAmt = Number(po.vatAmount) || (afterDisc * vatPct / 100);
  const grandTotal = Number(po.totalAmount) || (afterDisc + vatAmt);

  const teamName = po.team?.leaderName || po.team?.teamName || '-';
  const teamAddress = po.team?.leaderAddress || '';
  const teamPhone = po.team?.leaderPhone || '';
  const customerName = po.quotation?.customerGroup?.groupName || '-';
  const address = po.quotation?.branch?.name || '';
  const branchCode = po.quotation?.branch?.code || '';
  const projectName = po.quotation?.projectName || '';
  const refNo = po.quotation?.quotationNumber || '';

  const thCell = { background: '#1565C0', color: '#fff', fontWeight: 700, padding: '6px 6px', fontSize: 11, border: '1px solid #0D47A1', textAlign: 'center' as const };
  const tdCell = { padding: '4px 6px', borderBottom: '1px solid #ddd', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', fontSize: 11.5 };

  // Build item rows
  let headerIdx = 0;
  const itemRows = items.map((it: PO, idx: number) => {
    if (it.itemType === 'HEADER') {
      headerIdx++;
      return (
        <tr key={it.id} style={{ backgroundColor: '#F1F8E9' }}>
          <td style={{ ...tdCell, fontWeight: 700, color: '#1B5E20' }}>{headerIdx}</td>
          <td colSpan={8} style={{ ...tdCell, fontWeight: 700, color: '#1B5E20' }}>{it.description}</td>
        </tr>
      );
    }

    const parentNum = it.parentIndex != null ? it.parentIndex + 1 : headerIdx;
    const subIdx = items.filter((x: PO, i: number) => i < idx && x.itemType === 'ITEM' && x.parentIndex === it.parentIndex).length + 1;

    const qty = Number(it.quantity);
    const matP = Number(it.materialPrice);
    const labP = Number(it.labourPrice);
    const totalMat = Number(it.totalMaterial) || qty * matP;
    const totalLab = Number(it.totalLabour) || qty * labP;
    const amount = Number(it.amount) || totalMat + totalLab;
    const isNeg = qty < 0;

    return (
      <tr key={it.id} style={{ backgroundColor: it.isAdjustment ? (isNeg ? '#FFF5F5' : '#F0FFF4') : 'transparent' }}>
        <td style={{ ...tdCell, textAlign: 'center' }}>{it.isAdjustment ? (isNeg ? '(-)' : '(+)') : `${parentNum}.${subIdx}`}</td>
        <td style={{ ...tdCell }}>{it.description}{it.isAdjustment ? ' *' : ''}</td>
        <td style={{ ...tdCell, textAlign: 'center' }}>{qty}</td>
        <td style={{ ...tdCell, textAlign: 'center' }}>{it.unit}</td>
        <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{matP ? fmt(matP) : ''}</td>
        <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{labP ? fmt(labP) : ''}</td>
        <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{totalMat ? fmt(totalMat) : ''}</td>
        <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{totalLab ? fmt(totalLab) : ''}</td>
        <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: isNeg ? '#DC2626' : '#000' }}>{amount ? fmt(amount) : ''}</td>
      </tr>
    );
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #E8EDF2; }
        @media print {
          body { margin: 0; padding: 0; background: #fff; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 10mm 12mm !important; border-radius: 0 !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Sarabun', sans-serif", background: '#E8EDF2', minHeight: '100vh', padding: '20px' }}>
        <div className="page" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', padding: '12mm 15mm', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>

          {/* Company Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #1565C0', paddingBottom: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1565C0' }}>บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1976D2' }}>NPK SERVICE & SUPPLY CO.,LTD.</div>
              <div style={{ fontSize: 10, color: '#555' }}>สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000</div>
              <div style={{ fontSize: 10, color: '#555' }}>Tel: 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail: npkservicesupply@gmail.com</div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#1565C0', margin: '8px 0 6px', letterSpacing: 2 }}>
            ใบสั่งซื้อ / Purchase order
          </div>

          {/* PO Number & Date */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <div style={{ fontSize: 12 }}>
              <strong style={{ color: '#1565C0' }}>เลขที่ {po.poNumber}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div />
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <strong>วันที่</strong> {fmtDateThai(po.date)}
            </div>
          </div>

          {/* Customer & Buyer info */}
          <div style={{ display: 'flex', gap: 20, fontSize: 12, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div><strong>ชื่อลูกค้า :</strong> {customerName}</div>
              {address && <div><strong>ที่อยู่ :</strong> {address}</div>}
              {branchCode && <div><strong>รหัสสาขา/สาขา :</strong> {branchCode} {address}</div>}
              <div><strong>ชื่อโครงการ :</strong> {projectName}</div>
              <div><strong>วันประกันผลงาน :</strong> เริ่ม {fmtDateShort(po.warrantyStartDate)} สิ้นสุด {fmtDateShort(po.warrantyEndDate)}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div><strong>ผู้สั่งซื้อ :</strong> บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div><strong>ที่อยู่ :</strong> 210/10 หมู่ 4 ต.สนามชัย อ.เมือง จ.สุพรรณบุรี 72000</div>
              <div><strong>เบอร์โทร :</strong> 098-984-9891</div>
              {po.workOrder?.woNumber && <div><strong>W/O</strong> {po.workOrder.woNumber}</div>}
              <div><strong>P/O</strong> {po.poNumber}</div>
              <div><strong>เริ่มงาน</strong> {fmtDateShort(po.startDate)}</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0', fontSize: 11.5 }}>
            <thead>
              <tr>
                <th style={{ ...thCell, width: 45 }}>Item</th>
                <th style={thCell}>Description</th>
                <th style={{ ...thCell, width: 35 }}>Qty</th>
                <th style={{ ...thCell, width: 40 }}>Unit</th>
                <th colSpan={2} style={thCell}>Price Unit/Baht</th>
                <th colSpan={2} style={thCell}>Total Price/Baht</th>
                <th style={{ ...thCell, width: 85 }}>Amount Baht</th>
              </tr>
              <tr>
                <th colSpan={4} style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px' }}></th>
                <th style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px', width: 75 }}>Material</th>
                <th style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px', width: 75 }}>Labour</th>
                <th style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px', width: 75 }}>Material</th>
                <th style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px', width: 75 }}>Labour</th>
                <th style={{ ...thCell, background: '#1976D2', fontSize: 10, padding: '2px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {itemRows}
            </tbody>
          </table>

          <div style={{ flex: 1 }} />

          {/* Payment conditions */}
          <div style={{ borderTop: '1px solid #999', paddingTop: 6, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 12 }}>
              <div style={{ flex: 1 }}>
                <strong>เงื่อนไขการชำระเงิน :</strong>
                {po.conditions ? (
                  <div style={{ whiteSpace: 'pre-line', fontSize: 11, color: '#444', marginTop: 4 }}>{po.conditions}</div>
                ) : (
                  <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
                    1. ผู้รับจ้างทำงานตาม Po ตามเลขที่อ้างอิง เสร็จให้ถ่ายสำเนา ใบรับงาน และส่งรูปภาพก่อน-หลังทำงาน มาทาง Line ของบริษัท และส่งตัวจริงตามมาที่อยู่ของบริษัท<br/>
                    2. การจ่ายเงินบริษัทจะจ่ายให้ภายใน 15 วันหลังจากงานเสร็จสมบูรณ์และเอกสารครบตามที่กำหนด<br/>
                    3. ผู้รับจ้างต้องรับประกันผลงานตามระเวลาที่กำหนด ตามราคานี้เท่านั้น
                  </div>
                )}
                {po.notes && (
                  <div style={{ marginTop: 6 }}>
                    <strong>หมายเหตุ </strong>
                    <span style={{ color: '#DC2626', fontSize: 11 }}>{po.notes}</span>
                  </div>
                )}
              </div>
              {/* Summary table */}
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: 200 }}>
                <tbody>
                  <tr><td style={{ textAlign: 'right', fontWeight: 600, padding: '2px 6px' }}>Sub Total</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '2px 6px', borderBottom: '1px solid #ddd' }}>{fmt(subtotal)}</td></tr>
                  {discPct > 0 && <tr><td style={{ textAlign: 'right', fontWeight: 600, padding: '2px 6px' }}>Discount</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '2px 6px', borderBottom: '1px solid #ddd' }}>{fmt(discAmt)}</td></tr>}
                  {discPct > 0 && <tr><td style={{ textAlign: 'right', fontWeight: 600, padding: '2px 6px' }}>After Discount</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '2px 6px', borderBottom: '1px solid #ddd' }}>{fmt(afterDisc)}</td></tr>}
                  {vatPct > 0 && <tr><td style={{ textAlign: 'right', fontWeight: 600, padding: '2px 6px' }}>Vat {vatPct}%</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '2px 6px', borderBottom: '1px solid #ddd' }}>{fmt(vatAmt)}</td></tr>}
                  <tr style={{ borderTop: '2px solid #1565C0' }}>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: '#1565C0', padding: '4px 6px' }}>Grand Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: '#1565C0', fontVariantNumeric: 'tabular-nums', padding: '4px 6px' }}>{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount text */}
          <div style={{ margin: '8px 0', padding: '4px 10px', background: '#E3F2FD', borderRadius: 4, border: '1px solid #BBDEFB', fontSize: 12 }}>
            <strong>{numberToThaiText(grandTotal)}</strong>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 8 }}>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>ในนาม</div>
              <div style={{ borderTop: '1px solid #999', margin: '25px 20px 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>ผู้อนุมัติรับซื้อ/รับจ้าง</div>
              <div style={{ fontSize: 11, color: '#777' }}>วันที่ ......./......./........</div>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ borderTop: '1px solid #999', margin: '25px 20px 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>ผู้อนุมัติ</div>
              <div style={{ fontSize: 11, color: '#555' }}>มนตฺ์เทียน เชื้องเชซิ่งกูร</div>
              <div style={{ fontSize: 11, color: '#555' }}>กรรมการผู้จัดการ</div>
              <div style={{ fontSize: 11, color: '#777' }}>วันที่ ......./......./........</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
