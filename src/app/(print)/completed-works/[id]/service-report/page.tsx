'use client';

import { useState, useEffect, use } from 'react';

type ServiceItem = { id: string; itemNo: number; description: string };
type CW = {
  id: string; completionDate: string;
  workOrder: {
    woNumber: string; poNumber?: string | null; date: string;
    quotation?: {
      quotationNumber: string; projectName?: string | null;
      customerGroup: { groupName: string };
    } | null;
  };
  serviceItems: ServiceItem[];
};

function ServiceReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CW | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/completed-works/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => window.print(), 800);
    }
  }, [loading, data]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Sarabun, sans-serif' }}>กำลังโหลด...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Sarabun, sans-serif' }}>ไม่พบข้อมูล</div>;

  const wo = data.workOrder;
  const customerName = wo.quotation?.customerGroup?.groupName || '..............................................';
  const branchName = wo.quotation?.projectName || '..............................................';
  const poNumber = wo.poNumber || '..............................................';
  const qtNumber = wo.quotation?.quotationNumber || '..............................................';

  // Fill up to at least 15 rows
  const items = [...data.serviceItems];
  while (items.length < 15) {
    items.push({ id: `empty-${items.length}`, itemNo: items.length + 1, description: '' });
  }

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; font-size: 14px; color: #1a1a1a; background: #fff; }
        .sr-page { width: 186mm; min-height: 270mm; display: flex; flex-direction: column; margin: 0 auto; padding: 5mm; }

        .sr-header { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 3mm; }
        .sr-logo { width: 22mm; height: 22mm; object-fit: contain; }
        .sr-company { text-align: center; flex: 1; }
        .sr-cname { font-size: 13px; font-weight: bold; color: #0d6b3f; }
        .sr-cname-en { font-size: 14px; font-weight: bold; color: #0d6b3f; }
        .sr-caddr { font-size: 10px; color: #333; }

        .sr-title { font-size: 18px; font-weight: bold; text-align: center; margin: 4mm 0; border-bottom: 2px solid #000; padding-bottom: 2mm; }

        .sr-info { margin-bottom: 3mm; }
        .sr-row { display: flex; gap: 2mm; margin-bottom: 2mm; font-size: 13px; align-items: baseline; }
        .sr-label { font-weight: bold; white-space: nowrap; }
        .sr-val { border-bottom: 1px dotted #666; flex: 1; min-height: 16px; padding-left: 2mm; }

        .sr-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; flex: 1; }
        .sr-table th { background: #f5f5f5; border: 1px solid #999; padding: 2mm 3mm; font-size: 12px; font-weight: bold; text-align: left; }
        .sr-table td { border: 1px solid #999; padding: 2mm 3mm; font-size: 13px; vertical-align: top; min-height: 7mm; height: 7mm; }
        .sr-no { width: 12mm; text-align: center; }

        .sr-sigs { display: flex; gap: 5mm; margin-top: 5mm; }
        .sr-sig { flex: 1; text-align: center; }
        .sr-sigline { border-bottom: 1px solid #333; height: 20mm; margin-bottom: 1mm; }
        .sr-siglabel { font-size: 11px; color: #333; }
        .sr-sigsub { font-size: 10px; color: #666; }
      `}</style>

      <div className="sr-page">
        <div className="sr-header">
          <img src="/images/logo/npk-logo.png" alt="NPK" className="sr-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="sr-company">
            <div className="sr-cname">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด (สำนักงานใหญ่)</div>
            <div className="sr-cname-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
            <div className="sr-caddr">210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000</div>
            <div className="sr-caddr">Head Office ฿ 210/19 Moo.4 Tumbon Sanamchai, Mueang Supanburi, Suphanburi 72000</div>
            <div className="sr-caddr">Tel. 09-8942-9891, 06-5961-9799, 09-3694-4591 E-mail : npkservicesupply@gmail.com</div>
          </div>
        </div>

        <div className="sr-title">SERVICE REPORT</div>

        <div className="sr-info">
          <div className="sr-row">
            <span className="sr-label">ผู้รับบริการ</span>
            <span className="sr-val">{customerName}</span>
          </div>
          <div className="sr-row">
            <span className="sr-label">สาขาที่ปฏิบัติงาน</span>
            <span className="sr-val" style={{ flex: 0.6 }}>{branchName}</span>
            <span className="sr-label">เลขที่คำสั่งงาน</span>
            <span className="sr-val" style={{ flex: 0.4 }}>{poNumber}</span>
          </div>
          <div className="sr-row">
            <span className="sr-label">อ้างถึง</span>
            <span className="sr-val" style={{ flex: 0.6 }}></span>
            <span className="sr-label">ใบเสนอราคาเลขที่</span>
            <span className="sr-val" style={{ flex: 0.4 }}>{qtNumber}</span>
          </div>
        </div>

        <table className="sr-table">
          <thead>
            <tr>
              <th className="sr-no">ลำดับที่</th>
              <th>รายการแจ้งแก้ไข/ปรับปรุง/ซ่อมแซม</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="sr-no">{item.description ? item.itemNo : ''}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sr-sigs">
          <div className="sr-sig">
            <div className="sr-siglabel" style={{ fontWeight: 'bold', marginBottom: '1mm' }}>ลงชื่อ</div>
            <div className="sr-sigline"></div>
            <div className="sr-siglabel">ผู้ส่งมอบงาน</div>
            <div className="sr-sigsub">ตำแหน่ง ................................</div>
            <div className="sr-sigsub">วันเดือน/ปี ...........................</div>
          </div>
          <div className="sr-sig">
            <div className="sr-siglabel" style={{ fontWeight: 'bold', marginBottom: '1mm' }}>ลงชื่อ</div>
            <div className="sr-sigline"></div>
            <div className="sr-siglabel">ผู้ตรวจรับงาน</div>
            <div className="sr-sigsub">ตำแหน่ง ................................</div>
            <div className="sr-sigsub">วันเดือน/ปี ...........................</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ServiceReportPage;
