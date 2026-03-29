'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPOById, calcPOTotals, fmt, numberToThaiText, type PurchaseOrder } from '../../po-store';

export default function PurchaseOrderPrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [po, setPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const found = getPOById(id);
    if (found) setPO(found);
  }, [id]);

  if (!po) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
        <h2 style={{ color: '#EF4444' }}>ไม่พบใบสั่งซื้อ ID: {id}</h2>
      </div>
    );
  }

  const totals = calcPOTotals(po);

  // Thai date formatting
  function fmtDateThai(d: string) {
    if (!d) return '-';
    const date = new Date(d);
    const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  }

  // Build items rows
  let globalIdx = 0;
  const itemRows = po.items.flatMap((main, mi) => {
    const headerRow = (
      <tr key={`h-${mi}`} style={{ backgroundColor: '#F1F8E9' }}>
        <td colSpan={8} style={{ padding: '6px 10px', fontWeight: 700, fontSize: '13px', color: '#1B5E20', borderBottom: '1px solid #C8E6C9' }}>
          {mi + 1}. {main.title}
        </td>
      </tr>
    );

    const subRows = main.subItems.map((sub, si) => {
      globalIdx++;
      const matTotal = sub.qty * sub.materialUnitPrice;
      const labTotal = sub.qty * sub.labourUnitPrice;
      const lineTotal = matTotal + labTotal;
      return (
        <tr key={`s-${mi}-${si}`}>
          <td style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '12px' }}>{mi + 1}.{si + 1}</td>
          <td style={{ padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontSize: '12px' }}>{sub.description}</td>
          <td style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '12px' }}>{sub.qty}</td>
          <td style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '12px' }}>{sub.unit}</td>
          <td style={{ textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{fmt(sub.materialUnitPrice)}</td>
          <td style={{ textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{fmt(sub.labourUnitPrice)}</td>
          <td style={{ textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{fmt(matTotal)}</td>
          <td style={{ textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(lineTotal)}</td>
        </tr>
      );
    });

    return [headerRow, ...subRows];
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; padding: 12mm 15mm !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
          🖨️ พิมพ์
        </button>
        <button onClick={() => window.history.back()}
          style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          ← กลับ
        </button>
      </div>

      <div style={{ fontFamily: "'Sarabun', sans-serif", background: '#E8EDF2', minHeight: '100vh', padding: 20 }}>
        <div className="page" style={{
          width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff',
          padding: '15mm 18mm', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>

          {/* Company Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1565C0', paddingBottom: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1565C0' }}>บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1976D2' }}>NPK SERVICE & SUPPLY CO.,LTD.</div>
            <div style={{ fontSize: 11, color: '#555' }}>
              สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br />
              Call : 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com
            </div>
          </div>

          {/* Document Title */}
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#1565C0', margin: '12px 0 6px', letterSpacing: 2 }}>
            ใบสั่งซื้อ / Purchase Order
          </div>

          {/* PO Number & Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>เลขที่ PO :</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1565C0' }}>{po.poNumber}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>วันที่ :</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtDateThai(po.date)}</span>
            </div>
          </div>

          {/* Reference */}
          {po.referenceNo && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: '#555', fontWeight: 600, width: 130 }}>เลขที่อ้างอิง :</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0369A1' }}>{po.referenceNo}</span>
            </div>
          )}

          {/* Two columns: Contractor + Buyer */}
          <div style={{ display: 'flex', gap: 16, margin: '8px 0 12px' }}>
            {/* Contractor */}
            <div style={{ flex: 1, border: '1px solid #BBDEFB', borderRadius: 8, padding: '8px 12px', background: '#E3F2FD' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ผู้รับจ้าง (Contractor)</div>
              <div style={{ fontSize: 12.5 }}><strong>ชื่อ :</strong> {po.contractorName}</div>
              {po.contractorAddress && <div style={{ fontSize: 12, color: '#444' }}><strong>ที่อยู่ :</strong> {po.contractorAddress}</div>}
              {po.contractorPhone && <div style={{ fontSize: 12, color: '#444' }}><strong>โทร :</strong> {po.contractorPhone}</div>}
            </div>
            {/* Buyer */}
            <div style={{ flex: 1, border: '1px solid #C8E6C9', borderRadius: 8, padding: '8px 12px', background: '#E8F5E9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ผู้สั่งซื้อ (Buyer)</div>
              <div style={{ fontSize: 12.5 }}><strong>ชื่อ :</strong> บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ fontSize: 12, color: '#444' }}><strong>ที่อยู่ :</strong> 210/19 หมู่ 4 ต.สนามชัย อ.เมืองสุพรรณบุรี จ.สุพรรณบุรี 72000</div>
              <div style={{ fontSize: 12, color: '#444' }}><strong>โทร :</strong> 09-8942-9891</div>
            </div>
          </div>

          {/* Work Name / Project */}
          {po.workName && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: '#555', fontWeight: 600 }}>ชื่อโครงการ/งาน :</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1B5E20' }}>{po.workName}</span>
            </div>
          )}
          {po.branchSite && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: '#555', fontWeight: 600 }}>สถานที่ :</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{po.branchSite}</span>
            </div>
          )}

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 6px', fontSize: 12, border: '1px solid #0D47A1', width: 50, textAlign: 'center' }}>Item</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', fontSize: 12, border: '1px solid #0D47A1' }}>Description</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 6px', fontSize: 12, border: '1px solid #0D47A1', width: 40, textAlign: 'center' }}>Qty</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 6px', fontSize: 12, border: '1px solid #0D47A1', width: 50, textAlign: 'center' }}>Unit</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', fontSize: 12, border: '1px solid #0D47A1', width: 90, textAlign: 'center' }}>ค่าวัสดุ/หน่วย</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', fontSize: 12, border: '1px solid #0D47A1', width: 90, textAlign: 'center' }}>ค่าแรง/หน่วย</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', fontSize: 12, border: '1px solid #0D47A1', width: 90, textAlign: 'center' }}>รวมวัสดุ</th>
                <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', fontSize: 12, border: '1px solid #0D47A1', width: 100, textAlign: 'center' }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {itemRows}
            </tbody>
          </table>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <table style={{ width: '45%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#555', padding: '4px 8px' }}>ราคาเป็นเงิน</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 8px' }}>{fmt(totals.subtotal)}</td>
                  <td style={{ padding: '4px 4px' }}>บาท</td>
                </tr>
                {totals.discountAmount > 0 && (
                  <tr>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626', padding: '4px 8px' }}>ส่วนลด {po.discountPercent}%</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#DC2626', padding: '4px 8px' }}>-{fmt(totals.discountAmount)}</td>
                    <td style={{ padding: '4px 4px' }}>บาท</td>
                  </tr>
                )}
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626', padding: '4px 8px' }}>หัก ณ ที่จ่าย {po.vat3Percent}%</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#DC2626', padding: '4px 8px' }}>-{fmt(totals.vat3Amount)}</td>
                  <td style={{ padding: '4px 4px' }}>บาท</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#555', padding: '4px 8px' }}>ภาษีมูลค่าเพิ่ม {po.vat7Percent}%</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 8px' }}>{fmt(totals.vat7Amount)}</td>
                  <td style={{ padding: '4px 4px' }}>บาท</td>
                </tr>
                <tr style={{ borderTop: '2px solid #1565C0' }}>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#1565C0', padding: '6px 8px' }}>จำนวนเงินทั้งสิ้น</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#1565C0', fontVariantNumeric: 'tabular-nums', padding: '6px 8px' }}>{fmt(totals.grandTotal)}</td>
                  <td style={{ fontWeight: 800, color: '#1565C0', padding: '6px 4px' }}>บาท</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Thai text */}
          <div style={{ margin: '8px 0', padding: '6px 12px', background: '#E3F2FD', borderRadius: 6, border: '1px solid #BBDEFB' }}>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>จำนวนเงิน (ตัวอักษร) : </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1565C0' }}>{numberToThaiText(totals.grandTotal)}</span>
          </div>

          {/* Payment Terms */}
          {po.paymentTerms && po.paymentTerms.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>เงื่อนไขการชำระเงิน</div>
              {po.paymentTerms.map((term, i) => (
                <div key={i} style={{ fontSize: 12, color: '#444', lineHeight: 1.6, paddingLeft: 12, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>{i + 1}.</span>
                  <span style={{ paddingLeft: 4 }}>{term}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {po.notes && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>หมายเหตุ : </span>
              <span style={{ fontSize: 12, color: '#DC2626' }}>{po.notes}</span>
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 12 }}>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #999', margin: '30px 20px 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>ผู้สั่งซื้อ</div>
              <div style={{ fontSize: 11, color: '#777' }}>บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ fontSize: 11, color: '#777' }}>วันที่ ......./......./........</div>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #999', margin: '30px 20px 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>ผู้รับจ้าง</div>
              <div style={{ fontSize: 11, color: '#777' }}>{po.contractorName}</div>
              <div style={{ fontSize: 11, color: '#777' }}>วันที่ ......./......./........</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
