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

type WhtData = {
  id: string; whtNumber: string; date: string; payeeName: string; payeeTaxId: string | null;
  payeeAddress: string | null; incomeType: string; taxRate: number; incomeAmount: number; taxAmount: number; notes: string | null;
  paymentVoucher?: { id: string; voucherNumber: string; amount: number; paymentMethod: string; date: string } | null;
};

function WithholdingTaxDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [wht, setWht] = useState<WhtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/withholding-tax/${id}`);
      if (!res.ok) throw new Error('Not found');
      setWht(await res.json());
    } catch { setWht(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>;
  if (!wht) return <Box sx={{ textAlign: 'center', py: 10 }}><Typography>ไม่พบรายการ 50 ทวิ</Typography></Box>;

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; 50 ทวิ &gt; {wht.whtNumber}</Typography>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.push('/apps/withholding-tax')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#7C3AED' }}>{wht.whtNumber}</Typography>
          <Chip label={`${wht.taxRate}%`} size="small" sx={{ bgcolor: '#F3E8FF', color: '#7C3AED', fontWeight: 700 }} />
        </div>
        <Button variant="outlined" startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} onClick={() => setPrintOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none', borderColor: '#7C3AED', color: '#7C3AED' }}>พิมพ์ 50 ทวิ</Button>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E9D5FF', bgcolor: '#FAF5FF' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', mb: 1 }}>ผู้ถูกหักภาษี</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>ชื่อ: <strong>{wht.payeeName}</strong></div>
            <div>เลขผู้เสียภาษี: {wht.payeeTaxId || '-'}</div>
            {wht.payeeAddress && <div>ที่อยู่: {wht.payeeAddress}</div>}
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E9D5FF' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', mb: 1 }}>รายละเอียด</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>วันที่: {fmtDate(wht.date)}</div>
            <div>ประเภทเงินได้: {wht.incomeType}</div>
            {wht.paymentVoucher && (
              <div>ใบสำคัญจ่าย: <Button size="small" onClick={() => router.push(`/apps/payment-vouchers/${wht.paymentVoucher!.id}`)}
                sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '13px', color: '#0284C7' }}>{wht.paymentVoucher.voucherNumber}</Button></div>
            )}
            {wht.notes && <div>หมายเหตุ: {wht.notes}</div>}
          </Box>
        </Paper>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, maxWidth: 700, ml: 'auto' }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }} elevation={0}>
          <Typography sx={{ fontSize: '13px', color: '#64748B', mb: 0.5 }}>จำนวนเงินที่จ่าย</Typography>
          <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#334155' }}>{fmt(wht.incomeAmount)} บาท</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E9D5FF', bgcolor: '#FAF5FF', textAlign: 'center' }} elevation={0}>
          <Typography sx={{ fontSize: '13px', color: '#7C3AED', mb: 0.5 }}>ภาษีหัก ณ ที่จ่าย ({wht.taxRate}%)</Typography>
          <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#7C3AED' }}>{fmt(wht.taxAmount)} บาท</Typography>
        </Paper>
      </Box>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth PaperProps={{ sx: { width: '90vw', maxWidth: 1100, height: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 700, color: '#7C3AED' }}>{wht.whtNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPrintOpen(false)} sx={{ textTransform: 'none' }}>ปิด</Button>
            <Button variant="contained" onClick={() => { (document.getElementById('wht-print') as HTMLIFrameElement)?.contentWindow?.print(); }}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} sx={{ textTransform: 'none', bgcolor: '#7C3AED' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', display: 'flex' }}>
          <iframe id="wht-print" src={printOpen ? `/api/withholding-tax/${id}/pdf` : 'about:blank'} style={{ flex: 1, border: 'none', margin: 16, maxWidth: 800, background: '#fff', borderRadius: 4 }} title="Print" />
        </Box>
      </Dialog>
    </>
  );
}

export default WithholdingTaxDetailPage;
