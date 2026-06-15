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
function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string | null | undefined) { if (!d) return '-'; return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

const methodLabel: Record<string, string> = { TRANSFER: 'โอนเงิน', CASH: 'เงินสด', CHEQUE: 'เช็ค' };

function ReceiptVoucherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rv, setRv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipt-vouchers/${id}`);
      if (!res.ok) throw new Error('Not found');
      setRv(await res.json());
    } catch { setRv(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!rv) return <Box sx={{ textAlign: 'center', py: 10 }}><Typography>ไม่พบใบสำคัญรับ</Typography></Box>;

  const inv = rv.invoice;
  const customerName = inv?.workOrder?.quotation?.customerGroup?.groupName || '-';

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบสำคัญรับ &gt; {rv.voucherNumber}</Typography>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.push('/apps/receipt-vouchers')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#7C3AED' }}>{rv.voucherNumber}</Typography>
          <Chip label={methodLabel[rv.paymentMethod] || rv.paymentMethod} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED' }} />
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
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', mb: 1 }}>ผู้ชำระเงิน</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>ลูกค้า: <strong>{customerName}</strong></div>
            <div>ใบแจ้งหนี้: {inv?.invoiceNumber || '-'}</div>
            <div>WO: {inv?.workOrder?.woNumber || '-'}</div>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', mb: 1 }}>รายละเอียดการรับเงิน</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>วันที่: {fmtDate(rv.date)}</div>
            <div>วิธีชำระ: {methodLabel[rv.paymentMethod] || rv.paymentMethod}</div>
            {rv.bankName && <div>ธนาคาร: {rv.bankName}</div>}
            {rv.chequeNumber && <div>เลขเช็ค: {rv.chequeNumber}</div>}
            {rv.notes && <div>หมายเหตุ: {rv.notes}</div>}
          </Box>
        </Paper>
      </Box>
      <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #DDD6FE', bgcolor: '#F5F3FF', maxWidth: 400, ml: 'auto', textAlign: 'center' }} elevation={0}>
        <Typography sx={{ fontSize: '14px', color: '#64748B', mb: 1 }}>จำนวนเงินที่รับ</Typography>
        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#7C3AED' }}>{fmt(rv.amount)} บาท</Typography>
      </Paper>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth PaperProps={{ sx: { width: '90vw', maxWidth: 1100, height: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 700, color: '#7C3AED' }}>{rv.voucherNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPrintOpen(false)} sx={{ textTransform: 'none' }}>ปิด</Button>
            <Button variant="contained" onClick={() => { (document.getElementById('rv-print') as HTMLIFrameElement)?.contentWindow?.print(); }}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} sx={{ textTransform: 'none', bgcolor: '#7C3AED' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', display: 'flex' }}>
          <iframe id="rv-print" src={printOpen ? `/api/receipt-vouchers/${id}/pdf` : 'about:blank'} style={{ flex: 1, border: 'none', margin: 16, maxWidth: 800, background: '#fff', borderRadius: 4 }} title="Print" />
        </Box>
      </Dialog>
    </>
  );
}

export default ReceiptVoucherDetailPage;
