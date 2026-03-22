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

type QuotationItem = {
  itemType: string;
  parentIndex?: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  materialPrice: number;
  labourPrice: number;
  amount: number;
};

type QuotationData = {
  quotationNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  branchName: string;
  contactPerson: string;
  contactPhone: string;
  projectName: string;
  items: QuotationItem[];
  subtotal: number;

  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  totalAmount: number;
  conditions: string;
  notes: string | null;
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

  // Build display numbers for items
  let headerCount = 0;
  const subCountMap: Record<number, number> = {};
  const displayNumbers = data.items.map((item, idx) => {
    if (item.itemType === 'HEADER') {
      headerCount++;
      subCountMap[idx] = 0;
      return `${headerCount}`;
    }
    const parentIdx = item.parentIndex ?? -1;
    if (parentIdx >= 0 && subCountMap[parentIdx] !== undefined) {
      subCountMap[parentIdx]++;
      let hNum = 0;
      for (let j = 0; j <= parentIdx; j++) {
        if (data.items[j].itemType === 'HEADER') hNum++;
      }
      return `${hNum}.${subCountMap[parentIdx]}`;
    }
    return `${idx + 1}`;
  });

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

      {/* Top Bar */}
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
            🖨️ พิมพ์
          </button>
          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd',
            backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            color: '#333', fontFamily: 'Sarabun, sans-serif',
          }}>
            📥 ดาวน์โหลด
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
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={infoLabelStyle}>ชื่อลูกค้า :</td>
                <td style={{ ...infoValueStyle, fontWeight: 600 }}>{data.customerName}</td>
                <td style={{ ...infoLabelStyle, textAlign: 'right' }}>เลขที่ :</td>
                <td style={{ ...infoValueStyle, textAlign: 'right', color: '#0066cc', fontWeight: 600 }}>{data.quotationNumber}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>รหัสสาขา /สาขา :</td>
                <td style={infoValueStyle}>{data.branchName || '-'}</td>
                <td style={{ ...infoLabelStyle, textAlign: 'right' }}>วันที่ :</td>
                <td style={{ ...infoValueStyle, textAlign: 'right' }}>{thaiDate(data.date)}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>ที่อยู่ :</td>
                <td style={infoValueStyle}>{data.customerAddress || '-'}</td>
                <td style={{ ...infoLabelStyle, textAlign: 'right' }}>ชื่อผู้ติดต่อ :</td>
                <td style={{ ...infoValueStyle, textAlign: 'right' }}>{data.contactPerson || '-'}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>ยืนยันราคา :</td>
                <td style={infoValueStyle}>{data.validDays} วันนับจากวันที่เสนอราคา</td>
                <td style={{ ...infoLabelStyle, textAlign: 'right' }}>โทร :</td>
                <td style={{ ...infoValueStyle, textAlign: 'right' }}>{data.contactPhone || '-'}</td>
              </tr>
              {data.projectName && (
                <tr>
                  <td style={infoLabelStyle}>ชื่อโครงการ/ชื่องาน :</td>
                  <td colSpan={3} style={{ ...infoValueStyle, color: '#0066cc', fontWeight: 600 }}>{data.projectName}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={thStyle} rowSpan={2}>Item</th>
                <th style={thStyle} rowSpan={2}>Description</th>
                <th style={thStyle} rowSpan={2}>Qty</th>
                <th style={thStyle} rowSpan={2}>Unit</th>
                <th style={thStyle} colSpan={2}>Price Unit/Baht</th>
                <th style={thStyle} colSpan={2}>Total Price/Baht</th>
                <th style={thStyle} rowSpan={2}>Amount Baht</th>
              </tr>
              <tr>
                <th style={{ ...thStyle, fontSize: '9px' }}>Material</th>
                <th style={{ ...thStyle, fontSize: '9px' }}>Labour</th>
                <th style={{ ...thStyle, fontSize: '9px' }}>Material</th>
                <th style={{ ...thStyle, fontSize: '9px' }}>Labour</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                if (item.itemType === 'HEADER') {
                  return (
                    <tr key={i} style={{ backgroundColor: '#fffde7' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{displayNumbers[i]}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }} colSpan={8}>{item.description}</td>
                    </tr>
                  );
                }

                const matTotal = item.quantity * item.materialPrice;
                const labTotal = item.quantity * item.labourPrice;
                const amountTotal = matTotal + labTotal;

                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: 'center', width: '30px' }}>{displayNumbers[i]}</td>
                    <td style={tdStyle}>{item.description}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', width: '35px' }}>{item.unit}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '70px' }}>{item.materialPrice > 0 ? fmt(item.materialPrice) : ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '70px' }}>{item.labourPrice > 0 ? fmt(item.labourPrice) : ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '70px' }}>{matTotal > 0 ? fmt(matTotal) : ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '70px' }}>{labTotal > 0 ? fmt(labTotal) : ''}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '80px' }}>{fmt(amountTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '300px' }}>
              <tbody>
                <tr>
                  <td style={totLabelStyle}>รวมเป็นเงิน</td>
                  <td style={totAmountStyle}>{fmt(data.subtotal)}</td>
                  <td style={totUnitStyle}>บาท</td>
                </tr>
                {data.discountAmount > 0 && (
                  <tr>
                    <td style={totLabelStyle}>ส่วนลด</td>
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

          {/* Conditions */}
          {data.conditions && (
            <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: 1.7 }}>
              <div><strong>เงื่อนไข :</strong> {data.conditions}</div>
            </div>
          )}

          {/* Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', fontSize: '11px', textAlign: 'center' }}>
            <div>
              <div style={{ borderTop: '1px solid #999', paddingTop: '8px', marginTop: '40px' }}>
                ผู้เสนอราคา<br/>
                บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด<br/>
                วันที่ ......./......./........
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #999', paddingTop: '8px', marginTop: '40px' }}>
                ผู้อนุมัติ<br/>
                {data.customerName}<br/>
                วันที่ ......./......./........
              </div>
            </div>
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

const infoLabelStyle: React.CSSProperties = {
  padding: '3px 6px', fontWeight: 600, color: '#333', whiteSpace: 'nowrap', width: '100px',
};

const infoValueStyle: React.CSSProperties = {
  padding: '3px 6px', color: '#1a1a1a',
};

const thStyle: React.CSSProperties = {
  background: '#f0f4f8', color: '#333', fontWeight: 700,
  padding: '6px 4px', border: '1px solid #999', textAlign: 'center', fontSize: '10px',
};

const tdStyle: React.CSSProperties = {
  padding: '4px 5px', border: '1px solid #bbb', verticalAlign: 'top',
};

const totLabelStyle: React.CSSProperties = {
  textAlign: 'right', color: '#0066cc', fontWeight: 600, padding: '5px 8px', border: '1px solid #bbb',
};

const totAmountStyle: React.CSSProperties = {
  textAlign: 'right', fontWeight: 600, padding: '5px 8px', border: '1px solid #bbb', minWidth: '100px',
  fontVariantNumeric: 'tabular-nums',
};

const totUnitStyle: React.CSSProperties = {
  textAlign: 'center', padding: '5px 8px', border: '1px solid #bbb', minWidth: '40px',
};
