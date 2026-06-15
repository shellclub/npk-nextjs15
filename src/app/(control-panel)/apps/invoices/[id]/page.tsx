'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  UNPAID: { label: 'ยังไม่ชำระ', bgColor: '#FEF3C7', textColor: '#D97706', borderColor: '#FDE68A' },
  PARTIAL: { label: 'ชำระบางส่วน', bgColor: '#E0F2FE', textColor: '#0284C7', borderColor: '#BAE6FD' },
  PAID: { label: 'ชำระแล้ว', bgColor: '#D1FAE5', textColor: '#059669', borderColor: '#6EE7B7' },
  OVERDUE: { label: 'เกินกำหนด', bgColor: '#FEE2E2', textColor: '#DC2626', borderColor: '#FCA5A5' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#F3F4F6', textColor: '#6B7280', borderColor: '#D1D5DB' },
};

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Invoice = any;

function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  const fetchInv = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error('Not found');
      setInv(await res.json());
    } catch { setInv(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchInv(); }, [fetchInv]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>;
  }
  if (!inv) {
    return <Box sx={{ textAlign: 'center', py: 10 }}><Typography>ไม่พบใบแจ้งหนี้</Typography></Box>;
  }

  const sc = statusConfig[inv.status] || statusConfig.UNPAID;
  const q = inv.workOrder?.quotation;
  const customerName = q?.customerGroup?.groupName || '-';

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบแจ้งหนี้ &gt; {inv.invoiceNumber}</Typography>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.push('/apps/invoices')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{inv.invoiceNumber}</Typography>
          <Chip label={sc.label} sx={{ fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}` }} />
        </div>
        <Button variant="outlined" startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
          onClick={() => setPrintOpen(true)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>พิมพ์</Button>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none p-6" elevation={0}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', mb: 1 }}>ข้อมูลลูกค้า</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div><span style={{ color: '#94A3B8' }}>ลูกค้า:</span> <strong>{customerName}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>สาขา:</span> {q?.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}</div>
            <div><span style={{ color: '#94A3B8' }}>โครงการ:</span> {q?.projectName || '-'}</div>
            <div><span style={{ color: '#94A3B8' }}>WO:</span> {inv.workOrder?.woNumber || '-'}</div>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', mb: 1 }}>ข้อมูลใบแจ้งหนี้</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div><span style={{ color: '#94A3B8' }}>วันที่:</span> {fmtDate(inv.date)}</div>
            <div><span style={{ color: '#94A3B8' }}>ครบกำหนด:</span> <strong style={{ color: inv.status === 'OVERDUE' ? '#DC2626' : undefined }}>{fmtDate(inv.dueDate)}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>ใบเสนอราคา:</span> {q?.quotationNumber || '-'}</div>
            {inv.notes && <div><span style={{ color: '#94A3B8' }}>หมายเหตุ:</span> {inv.notes}</div>}
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #BAE6FD', bgcolor: '#F0F9FF', maxWidth: 400, ml: 'auto' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><span>Sub Total</span><strong>{fmt(inv.subtotal)}</strong></Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><span>VAT {Number(inv.vatPercent)}%</span><strong>{fmt(inv.vatAmount)}</strong></Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', color: '#0284C7', fontWeight: 800, borderTop: '2px solid #BAE6FD', pt: 1, mt: 1 }}>
          <span>Grand Total</span><span>{fmt(inv.totalAmount)}</span>
        </Box>
      </Paper>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth
        PaperProps={{ sx: { borderRadius: '16px', width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Typography sx={{ fontWeight: 700, color: '#0284C7' }}>{inv.invoiceNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPrintOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none' }}>ปิด</Button>
            <Button variant="contained" startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
              onClick={() => { const f = document.getElementById('inv-detail-print') as HTMLIFrameElement; f?.contentWindow?.print(); }}
              sx={{ borderRadius: '10px', textTransform: 'none', background: 'linear-gradient(135deg,#0284C7,#0369A1)' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', display: 'flex' }}>
          <iframe id="inv-detail-print" src={printOpen ? `/api/invoices/${id}/pdf` : 'about:blank'}
            style={{ flex: 1, border: 'none', margin: 16, maxWidth: 800, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 4 }} title="Print" />
        </Box>
      </Dialog>
    </>
  );
}

export default InvoiceDetailPage;
