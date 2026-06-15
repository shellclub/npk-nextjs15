'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));
function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string | null | undefined) { if (!d) return '-'; return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function TaxInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ti, setTi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tax-invoices/${id}`);
      if (!res.ok) throw new Error('Not found');
      setTi(await res.json());
    } catch { setTi(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!ti) return <Box sx={{ textAlign: 'center', py: 10 }}><Typography>ไม่พบใบกำกับภาษี</Typography></Box>;

  const inv = ti.invoice;
  const q = inv?.workOrder?.quotation;
  const customerName = q?.customerGroup?.groupName || '-';

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบกำกับภาษี &gt; {ti.taxInvoiceNumber}</Typography>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.push('/apps/tax-invoices')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#16A34A' }}>{ti.taxInvoiceNumber}</Typography>
        </div>
        <Button variant="outlined" startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} onClick={() => setPrintOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none' }}>พิมพ์</Button>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', mb: 1 }}>ข้อมูลลูกค้า</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>ลูกค้า: <strong>{customerName}</strong></div>
            <div>เลขผู้เสียภาษี: {q?.customerGroup?.taxId || '-'}</div>
            <div>WO: {inv?.workOrder?.woNumber || '-'}</div>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', mb: 1 }}>อ้างอิง</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>ใบแจ้งหนี้: <strong>{inv?.invoiceNumber || '-'}</strong></div>
            <div>วันที่: {fmtDate(ti.date)}</div>
            {ti.notes && <div>หมายเหตุ: {ti.notes}</div>}
          </Box>
        </Paper>
      </Box>
      <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #BBF7D0', bgcolor: '#F0FDF4', maxWidth: 400, ml: 'auto' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><span>Sub Total</span><strong>{fmt(ti.subtotal)}</strong></Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><span>VAT</span><strong>{fmt(ti.vatAmount)}</strong></Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', color: '#16A34A', fontWeight: 800, borderTop: '2px solid #BBF7D0', pt: 1 }}><span>Grand Total</span><span>{fmt(ti.totalAmount)}</span></Box>
      </Paper>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth PaperProps={{ sx: { width: '90vw', maxWidth: 1100, height: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 700, color: '#16A34A' }}>{ti.taxInvoiceNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPrintOpen(false)} sx={{ textTransform: 'none' }}>ปิด</Button>
            <Button variant="contained" onClick={() => { (document.getElementById('ti-print') as HTMLIFrameElement)?.contentWindow?.print(); }}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} sx={{ textTransform: 'none', bgcolor: '#16A34A' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', display: 'flex' }}>
          <iframe id="ti-print" src={printOpen ? `/api/tax-invoices/${id}/pdf` : 'about:blank'} style={{ flex: 1, border: 'none', margin: 16, maxWidth: 800, background: '#fff', borderRadius: 4 }} title="Print" />
        </Box>
      </Dialog>
    </>
  );
}

export default TaxInvoiceDetailPage;
