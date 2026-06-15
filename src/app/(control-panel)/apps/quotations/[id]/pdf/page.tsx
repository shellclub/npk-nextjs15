'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { generateQuotationPDF, QuotationPDFData } from '@/lib/pdf/quotation-pdf';

export default function QuotationPDFPage() {
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const generate = useCallback(async () => {
    try {
      // Fetch quotation data
      const res = await fetch(`/api/quotations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch quotation');
      const data = await res.json();

      // Transform data to match PDF generator interface
      const pdfData: QuotationPDFData = {
        quotationNumber: data.quotationNumber,
        revisionNumber: data.revisionNumber,
        date: data.date,
        projectName: data.projectName,
        customerPO: data.customerPO,
        address: data.address,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        subtotal: Number(data.subtotal),
        discountPercent: Number(data.discountPercent || 0),
        discountAmount: Number(data.discountAmount || 0),
        vatPercent: Number(data.vatPercent || 7),
        vatAmount: Number(data.vatAmount),
        totalAmount: Number(data.totalAmount),
        conditions: data.conditions,
        notes: data.notes,
        warranty: data.warranty,
        customerGroup: data.customerGroup,
        branch: data.branch,
        createdBy: data.createdBy,
        items: (data.items || []).map((item: any) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          materialPrice: Number(item.materialPrice || 0),
          labourPrice: Number(item.labourPrice || 0),
          parentIndex: item.parentIndex,
        })),
      };

      // Generate PDF
      const doc = generateQuotationPDF(pdfData);
      
      // Display QN for filename
      const displayQN = (pdfData.revisionNumber || 0) > 0
        ? `${pdfData.quotationNumber}_Rev${pdfData.revisionNumber}`
        : pdfData.quotationNumber;

      // Save/download the PDF
      doc.save(`ใบเสนอราคา_${displayQN}.pdf`);
      setStatus('ready');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Unknown error');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: '#f8fafc',
    }}>
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #e2e8f0',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: 18, color: '#64748b' }}>กำลังสร้าง PDF ใบเสนอราคา...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {status === 'ready' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>
            สร้าง PDF สำเร็จ!
          </p>
          <p style={{ color: '#64748b', marginBottom: 20 }}>ไฟล์ PDF ถูกดาวน์โหลดแล้ว</p>
          <button
            onClick={generate}
            style={{
              padding: '10px 24px', background: '#3b82f6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
              marginRight: 12,
            }}
          >
            ดาวน์โหลดอีกครั้ง
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: '10px 24px', background: '#94a3b8', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      )}
      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
            เกิดข้อผิดพลาด
          </p>
          <p style={{ color: '#64748b' }}>{error}</p>
          <button
            onClick={() => { setStatus('loading'); generate(); }}
            style={{
              marginTop: 16, padding: '10px 24px', background: '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
            }}
          >
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
}
