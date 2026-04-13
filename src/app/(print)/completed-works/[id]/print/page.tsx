'use client';

import { useState, useEffect, use } from 'react';

type Photo = { id: string; fileName: string; fileUrl: string; photoType: string };
type CW = {
  id: string;
  workOrder: {
    woNumber: string; poNumber?: string | null;
    quotation?: {
      quotationNumber: string; projectName?: string | null;
      customerGroup: { groupName: string };
    } | null;
  };
  photos: Photo[];
};

function PrintPhotosPage({ params }: { params: Promise<{ id: string }> }) {
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

  const workPhotos = data.photos.filter(p => p.photoType === 'WORK');
  const wo = data.workOrder;
  const customerName = wo.quotation?.customerGroup?.groupName || '-';
  const qtNumber = wo.quotation?.quotationNumber || '-';
  const poNumber = wo.poNumber || '-';
  const projectName = wo.quotation?.projectName || '...';

  // Split photos into pages of 4
  const pages: Photo[][] = [];
  for (let i = 0; i < workPhotos.length; i += 4) {
    pages.push(workPhotos.slice(i, i + 4));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; font-size: 14px; color: #1a1a1a; background: #fff; }
        .page { page-break-after: always; width: 190mm; min-height: 277mm; padding: 5mm; margin: 0 auto; }
        .page:last-child { page-break-after: auto; }

        .company-row { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
        .logo { width: 20mm; height: 20mm; object-fit: contain; }
        .company-info { text-align: left; flex: 1; }
        .company-name { font-size: 14px; font-weight: bold; color: #0d6b3f; }
        .company-name-en { font-size: 12px; font-weight: bold; color: #0d6b3f; }
        .company-address { font-size: 10px; color: #555; }

        .report-title { font-size: 18px; font-weight: bold; color: #c00; text-align: center; margin: 3mm 0; }

        .info-row { display: flex; gap: 3mm; margin-bottom: 1.5mm; font-size: 12px; }
        .info-label { font-weight: bold; min-width: 25mm; }
        .info-value { border-bottom: 1px dotted #999; flex: 1; padding-bottom: 1px; }

        .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 4mm; }
        .photo-cell { border: 1px solid #ddd; border-radius: 3mm; overflow: hidden; height: 115mm; display: flex; align-items: center; justify-content: center; background: #fafafa; }
        .photo-cell img { width: 100%; height: 100%; object-fit: cover; }
        .empty-cell { color: #ccc; font-size: 12px; }
      `}</style>

      {pages.map((pagePhotos, pageIdx) => (
        <div className="page" key={pageIdx}>
          <div className="company-row">
            <img src="/images/logo/npk-logo.png" alt="NPK" className="logo"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="company-info">
              <div className="company-name">บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด (สำนักงานใหญ่)</div>
              <div className="company-name-en">NPK SERVICE & SUPPLY CO.,LTD.</div>
              <div className="company-address">210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000</div>
              <div className="company-address">Call : 09-8942-9891, 06-5961-9799 , 09-3694-4591 E-mail : npkservicesupply@gmail.com</div>
            </div>
          </div>

          <div className="report-title">รูปภาพ REPORT</div>

          <div className="info-row">
            <span className="info-label">สถานที่ปฏิบัติงาน</span>
            <span className="info-value">{customerName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">สาขา</span>
            <span className="info-value" style={{ flex: 0.5 }}>{projectName}</span>
            <span className="info-label" style={{ minWidth: '28mm' }}>เลขที่คำสั่งงาน</span>
            <span className="info-value" style={{ flex: 0.5 }}>{poNumber}</span>
            <span className="info-label" style={{ minWidth: '30mm' }}>ใบเสนอราคาเลขที่</span>
            <span className="info-value" style={{ flex: 0.5 }}>{qtNumber}</span>
          </div>

          <div className="photo-grid">
            {[0, 1, 2, 3].map(i => (
              <div className="photo-cell" key={i}>
                {pagePhotos[i] ? (
                  <img src={pagePhotos[i].fileUrl} alt={pagePhotos[i].fileName} />
                ) : (
                  <span className="empty-cell">{workPhotos.length === 0 ? 'ยังไม่มีรูปภาพ' : ''}</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '2mm' }}>
            หน้า {pageIdx + 1} / {pages.length}
          </div>
        </div>
      ))}
    </>
  );
}

export default PrintPhotosPage;
