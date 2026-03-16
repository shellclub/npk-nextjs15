'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function thaiDate(d: string) {
  const date = new Date(d);
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

type QuotationData = {
  quotationNumber: string;
  date: string;
  customerName: string;
  branchName: string;
  contactPerson: string;
  projectName: string;
  items: { description: string; quantity: number; unit: string; unitPrice: number; amount: number }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  notes: string | null;
  warranty: string | null;
  validDays: number;
};

export default function SharedQuotationPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotations/${id}/share`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('ไม่พบเอกสาร หรือลิงก์ไม่ถูกต้อง'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>กำลังโหลดเอกสาร...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#DC2626' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{error || 'ไม่พบเอกสาร'}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', sans-serif; background: #e8ecf0; }
        @media print {
          .top-bar { display: none !important; }
          body { background: #fff; }
          .doc-container { box-shadow: none !important; margin: 0 !important; padding: 10mm !important; }
        }
      `}</style>

      {/* Top Bar with company logo + action buttons */}
      <div className="top-bar" style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/assets/images/logo/npk-logo.png" alt="NPK" style={{ height: '40px' }} />
          <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>NPK SERVICE & SUPPLY CO.,LTD.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd',
            backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            color: '#333', fontFamily: 'Sarabun, sans-serif',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
            </svg>
            พิมพ์
          </button>
          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd',
            backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            color: '#333', fontFamily: 'Sarabun, sans-serif',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ดาวน์โหลด
          </button>
        </div>
      </div>

      {/* Document */}
      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '0 16px' }}>
        <div ref={printRef} className="doc-container" style={{
          backgroundColor: '#fff', padding: '40px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          borderRadius: '4px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '8px' }}>
            <img src="/assets/images/logo/npk-logo.png" alt="NPK Logo" style={{ width: '90px' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700 }}>บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>NPK SERVICE & SUPPLY CO.,LTD.</div>
              <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginTop: '4px' }}>
                สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br />
                Head Office : 210/19 Moo.4, Tambon Sanamchai, Amphur Mueang Suphanburi, Suphanburi 72000<br />
                Call : 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{
            textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#0066cc',
            margin: '15px 0 12px', borderBottom: '2px solid #0066cc', paddingBottom: '6px',
          }}>
            ใบเสนอราคา (Quotation)
          </div>

          {/* Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 40px', marginBottom: '12px', fontSize: '13px' }}>
            <div><strong style={{ color: '#666' }}>ชื่อลูกค้า :</strong> {data.customerName}</div>
            <div><strong style={{ color: '#666' }}>เลขที่ :</strong> {data.quotationNumber}</div>
            <div><strong style={{ color: '#666' }}>อ้างถึง :</strong> {data.contactPerson || '-'}</div>
            <div><strong style={{ color: '#666' }}>วันที่ :</strong> {thaiDate(data.date)}</div>
            <div><strong style={{ color: '#666' }}>สาขา :</strong> {data.branchName || '-'}</div>
            <div></div>
            {data.projectName && <div><strong style={{ color: '#666' }}>โครงการ :</strong> {data.projectName}</div>}
          </div>

          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#555' }}>บริษัทฯ มีความยินดีขอเสนอราคา</div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={thStyle} rowSpan={2}>#</th>
                <th style={thStyle} rowSpan={2}>รายละเอียด</th>
                <th style={thStyle} rowSpan={2}>จำนวน</th>
                <th style={thStyle} rowSpan={2}>หน่วย</th>
                <th style={thStyle} colSpan={2}>ราคาต่อหน่วย</th>
                <th style={thStyle} rowSpan={2}>ยอดรวม</th>
              </tr>
              <tr>
                <th style={{ ...thStyle, fontSize: '10px' }}>Material</th>
                <th style={{ ...thStyle, fontSize: '10px' }}>Labour</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{i + 1}</td>
                  <td style={tdStyle}>{item.description}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', width: '50px' }}>{item.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', width: '50px' }}>{item.unit}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', width: '90px' }}>{fmt(item.unitPrice)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', width: '90px' }}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', width: '100px' }}>{fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '300px' }}>
              <tbody>
                <tr>
                  <td style={{ ...totLabelStyle }}>รวมเป็นเงิน</td>
                  <td style={totAmountStyle}>{fmt(data.subtotal)}</td>
                  <td style={totUnitStyle}>บาท</td>
                </tr>
                {data.discountAmount > 0 && (
                  <tr>
                    <td style={totLabelStyle}>ส่วนลด {data.discountPercent > 0 ? `${data.discountPercent}%` : ''}</td>
                    <td style={{ ...totAmountStyle, color: '#dc2626' }}>-{fmt(data.discountAmount)}</td>
                    <td style={totUnitStyle}>บาท</td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...totLabelStyle, color: '#dc2626' }}>ภาษีมูลค่าเพิ่ม {data.vatPercent}%</td>
                  <td style={totAmountStyle}>{fmt(data.vatAmount)}</td>
                  <td style={totUnitStyle}>บาท</td>
                </tr>
                <tr>
                  <td style={{ ...totLabelStyle, background: '#f0f4f8', fontWeight: 700, fontSize: '14px' }}>จำนวนเงินทั้งสิ้น</td>
                  <td style={{ ...totAmountStyle, background: '#f0f4f8', fontWeight: 700, fontSize: '14px' }}>{fmt(data.totalAmount)}</td>
                  <td style={{ ...totUnitStyle, background: '#f0f4f8', fontWeight: 700 }}>บาท</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {(data.notes || data.warranty) && (
            <div style={{ marginTop: '20px', fontSize: '12px', lineHeight: 1.7 }}>
              {data.notes && <div><strong>หมายเหตุ :</strong> {data.notes}</div>}
              {data.warranty && <div><strong>เงื่อนไขรับประกัน :</strong> {data.warranty}</div>}
            </div>
          )}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
            เสนอราคามีผลภายใน {data.validDays} วัน
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#999' }}>
          Copyright © {new Date().getFullYear()} NPK Service & Supply Co., Ltd. All rights reserved.
        </div>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  background: '#f0f4f8', color: '#333', fontWeight: 700,
  padding: '8px 6px', border: '1px solid #ccc', textAlign: 'center', fontSize: '11px',
};

const tdStyle: React.CSSProperties = {
  padding: '6px', border: '1px solid #ddd', verticalAlign: 'top',
};

const totLabelStyle: React.CSSProperties = {
  textAlign: 'right', color: '#0066cc', fontWeight: 600, padding: '6px 10px', border: '1px solid #ddd',
};

const totAmountStyle: React.CSSProperties = {
  textAlign: 'right', fontWeight: 600, padding: '6px 10px', border: '1px solid #ddd', minWidth: '100px',
  fontVariantNumeric: 'tabular-nums',
};

const totUnitStyle: React.CSSProperties = {
  textAlign: 'center', padding: '6px 10px', border: '1px solid #ddd', minWidth: '40px',
};
