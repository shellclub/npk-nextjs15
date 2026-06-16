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

type WO = {
  id: string; woNumber: string; date: string; status: string;
  poNumber?: string | null; description?: string | null;
  totalAmount: number; teamName?: string | null;
  quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
  purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
};

const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'รอดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', bg: '#DBEAFE', color: '#2563EB' },
  COMPLETED: { label: 'เสร็จสิ้น', bg: '#D1FAE5', color: '#059669' },
  PAID: { label: 'จ่ายแล้ว', bg: '#E0E7FF', color: '#4F46E5' },
  CANCELLED: { label: 'ยกเลิก', bg: '#FEE2E2', color: '#DC2626' },
};

function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [wo, setWo] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${id}`);
      if (!res.ok) throw new Error('Not found');
      setWo(await res.json());
    } catch { setWo(null); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const poTotal = wo?.purchaseOrders
    ?.filter(p => p.status !== 'CANCELLED')
    .reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;

  const handlePayContractor = async () => {
    if (!wo || !confirm(`ออกใบสำคัญจ่ายและบันทึก ${wo.woNumber} เป็นจ่ายแล้ว?`)) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/pay-contractor`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/apps/payment-vouchers/${data.paymentVoucher.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally { setPaying(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#0284C7' }} /></Box>;
  if (!wo) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography sx={{ mb: 2 }}>ไม่พบ Work Order</Typography>
      <Button onClick={() => router.push('/apps/work-orders')} sx={{ textTransform: 'none' }}>กลับรายการ WO</Button>
    </Box>
  );

  const st = statusStyle[wo.status] || { label: wo.status, bg: '#F1F5F9', color: '#64748B' };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>เอกสาร &gt; WO &gt; {wo.woNumber}</Typography>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.push('/apps/work-orders')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#0284C7' }}>{wo.woNumber}</Typography>
          <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700 }} />
        </div>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:printer</FuseSvgIcon>}
            onClick={() => setPrintOpen(true)} sx={{ borderRadius: '10px', textTransform: 'none' }}>พิมพ์ใบตอบรับงาน</Button>
          <Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:truck</FuseSvgIcon>}
            onClick={() => window.open(`/api/work-orders/${id}/delivery-note`, '_blank')}
            sx={{ borderRadius: '10px', textTransform: 'none', borderColor: '#059669', color: '#059669' }}>ใบส่งมอบงาน</Button>
          {wo.status === 'COMPLETED' && (
            <Button variant="contained" size="small" disabled={paying}
              startIcon={<FuseSvgIcon size={16}>lucide:banknote</FuseSvgIcon>}
              onClick={handlePayContractor}
              sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }}>
              {paying ? 'กำลังดำเนินการ...' : 'ออกใบสำคัญจ่ายช่าง'}
            </Button>
          )}
        </Box>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', mb: 1 }}>ข้อมูลงาน</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>วันที่: {fmtDate(wo.date)}</div>
            <div>ลูกค้า: <strong>{wo.quotation?.customerGroup?.groupName || '-'}</strong></div>
            <div>โครงการ: {wo.quotation?.projectName || wo.description || '-'}</div>
            <div>อ้างอิง QT: {wo.quotation?.quotationNumber || '-'}</div>
            {wo.poNumber && <div>P/O ลูกค้า: {wo.poNumber}</div>}
          </Box>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', mb: 1 }}>ทีมช่าง / ยอดเงิน</Typography>
          <Box sx={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div>ทีม: {wo.team?.teamName || wo.teamName || '-'}</div>
            <div>หัวหน้าทีม: {wo.team?.leaderName || '-'}</div>
            <div>ยอด WO: <strong>{fmt(wo.totalAmount)} บาท</strong></div>
            {poTotal > 0 && <div>ยอด PO รวม: <strong style={{ color: '#7C3AED' }}>{fmt(poTotal)} บาท</strong></div>}
          </Box>
        </Paper>
      </Box>

      {wo.purchaseOrders && wo.purchaseOrders.length > 0 && (
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E9D5FF', bgcolor: '#FAF5FF' }} elevation={0}>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', mb: 1.5 }}>ใบสั่งซื้อให้ช่าง (PO)</Typography>
          {wo.purchaseOrders.map(po => (
            <Box key={po.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid #EDE9FE' }}>
              <Button size="small" onClick={() => router.push(`/apps/purchase-orders/${po.id}`)}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#7C3AED', p: 0, minWidth: 0 }}>{po.poNumber}</Button>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip label={po.status} size="small" sx={{ height: 22, fontSize: '11px' }} />
                <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(po.totalAmount)} บาท</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.push('/apps/work-orders')}
          sx={{ borderRadius: '10px', textTransform: 'none' }}>กลับรายการ WO</Button>
        <Button variant="text" onClick={() => router.push(`/apps/reports`)}
          sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B' }}>ดูรายงาน</Button>
      </Box>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth
        PaperProps={{ sx: { width: '90vw', maxWidth: 1100, height: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 700, color: '#0284C7' }}>{wo.woNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPrintOpen(false)} sx={{ textTransform: 'none' }}>ปิด</Button>
            <Button variant="contained" onClick={() => { (document.getElementById('wo-detail-print') as HTMLIFrameElement)?.contentWindow?.print(); }}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>} sx={{ textTransform: 'none', bgcolor: '#0284C7' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', display: 'flex' }}>
          <iframe id="wo-detail-print" src={printOpen ? `/api/work-orders/${id}/pdf` : 'about:blank'}
            style={{ flex: 1, border: 'none', margin: 16, maxWidth: 800, background: '#fff', borderRadius: 4 }} title="Print" />
        </Box>
      </Dialog>
    </>
  );
}

export default WorkOrderDetailPage;
