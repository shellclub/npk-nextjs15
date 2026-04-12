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

  if (!po) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
        <h2 style={{ color: '#94A3B8' }}>กำลังโหลด...</h2>
      </div>
    );
  }

  const adjustments = po.adjustments || [];
  const totalAdds = adjustments.filter((a: PO) => a.adjustmentType === 'ADD').reduce((s: number, a: PO) => s + Number(a.amount), 0);
  const totalDeducts = adjustments.filter((a: PO) => a.adjustmentType === 'DEDUCT').reduce((s: number, a: PO) => s + Number(a.amount), 0);
  const grandTotal = po.totalAmount ? Number(po.totalAmount) : (totalAdds - totalDeducts);

  const teamName = po.team?.leaderName || po.team?.teamName || '-';
  const teamAddress = po.team?.leaderAddress || '';
  const teamPhone = po.team?.leaderPhone || '';
  const refNo = po.quotation?.quotationNumber || '-';
  const projectName = po.quotation?.projectName || '';

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
              Call : 09-8942-9891, 06-5961-9799, 09-3694-4591
            </div>
          </div>

          {/* Title */}
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12.5, color: '#555', fontWeight: 600, width: 130 }}>เลขที่อ้างอิง :</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0369A1' }}>{refNo}</span>
          </div>

          {/* Two columns: Contractor + Buyer */}
          <div style={{ display: 'flex', gap: 16, margin: '8px 0 12px' }}>
            <div style={{ flex: 1, border: '1px solid #BBDEFB', borderRadius: 8, padding: '8px 12px', background: '#E3F2FD' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', marginBottom: 4, textTransform: 'uppercase' }}>ผู้รับจ้าง (Contractor)</div>
              <div style={{ fontSize: 12.5 }}><strong>ชื่อ :</strong> {teamName}</div>
              {teamAddress && <div style={{ fontSize: 12, color: '#444' }}><strong>ที่อยู่ :</strong> {teamAddress}</div>}
              {teamPhone && <div style={{ fontSize: 12, color: '#444' }}><strong>โทร :</strong> {teamPhone}</div>}
            </div>
            <div style={{ flex: 1, border: '1px solid #C8E6C9', borderRadius: 8, padding: '8px 12px', background: '#E8F5E9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', marginBottom: 4, textTransform: 'uppercase' }}>ผู้สั่งซื้อ (Buyer)</div>
              <div style={{ fontSize: 12.5 }}><strong>ชื่อ :</strong> บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ fontSize: 12, color: '#444' }}><strong>ที่อยู่ :</strong> 210/19 หมู่ 4 ต.สนามชัย อ.เมือง จ.สุพรรณบุรี 72000</div>
              <div style={{ fontSize: 12, color: '#444' }}><strong>โทร :</strong> 09-8942-9891</div>
            </div>
          </div>

          {projectName && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: '#555', fontWeight: 600 }}>ชื่อโครงการ/งาน :</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1B5E20' }}>{projectName}</span>
            </div>
          )}

          {/* Adjustments Table */}
          {adjustments.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 6px', border: '1px solid #0D47A1', width: 50, textAlign: 'center' }}>#</th>
                  <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 6px', border: '1px solid #0D47A1', width: 80, textAlign: 'center' }}>ประเภท</th>
                  <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', border: '1px solid #0D47A1' }}>รายละเอียด</th>
                  <th style={{ background: '#1565C0', color: '#fff', fontWeight: 700, padding: '7px 8px', border: '1px solid #0D47A1', width: 120, textAlign: 'right' }}>จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj: PO, i: number) => (
                  <tr key={adj.id || i}>
                    <td style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #E2E8F0' }}>{i + 1}</td>
                    <td style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #E2E8F0', color: adj.adjustmentType === 'ADD' ? '#059669' : '#DC2626', fontWeight: 600 }}>
                      {adj.adjustmentType === 'ADD' ? 'งานเพิ่ม' : 'งานลด'}
                    </td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #E2E8F0' }}>{adj.description}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', borderBottom: '1px solid #E2E8F0', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: adj.adjustmentType === 'ADD' ? '#059669' : '#DC2626' }}>
                      {adj.adjustmentType === 'ADD' ? '+' : '-'}{fmt(adj.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <table style={{ width: '45%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669', padding: '4px 8px' }}>งานเพิ่ม</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 8px', color: '#059669' }}>{fmt(totalAdds)}</td>
                  <td style={{ padding: '4px 4px' }}>บาท</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626', padding: '4px 8px' }}>งานลด</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#DC2626', padding: '4px 8px' }}>-{fmt(totalDeducts)}</td>
                  <td style={{ padding: '4px 4px' }}>บาท</td>
                </tr>
                <tr style={{ borderTop: '2px solid #1565C0' }}>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#1565C0', padding: '6px 8px' }}>จำนวนเงินทั้งสิ้น</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#1565C0', fontVariantNumeric: 'tabular-nums', padding: '6px 8px' }}>{fmt(grandTotal)}</td>
                  <td style={{ fontWeight: 800, color: '#1565C0', padding: '6px 4px' }}>บาท</td>
                </tr>
              </tbody>
            </table>
          </div>

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
              <div style={{ fontSize: 11, color: '#777' }}>{teamName}</div>
              <div style={{ fontSize: 11, color: '#777' }}>วันที่ ......./......./........</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
