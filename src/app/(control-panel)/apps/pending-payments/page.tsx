'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WorkOrder = {
  id: string; woNumber: string; date: string; description?: string | null;
  totalAmount: number; status: string;
  quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
  purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
};

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function getPayAmount(wo: WorkOrder) {
  const poTotal = wo.purchaseOrders
    ?.filter(p => p.status !== 'CANCELLED')
    .reduce((s, p) => s + Number(p.totalAmount), 0) ?? 0;
  return poTotal > 0 ? poTotal : Number(wo.totalAmount);
}

function PendingPaymentsPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWO, setMenuWO] = useState<WorkOrder | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<WorkOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'COMPLETED');
      if (search) params.set('search', search);
      const r = await fetch(`/api/work-orders?${params}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, wo: WorkOrder) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuWO(wo);
  };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuWO(null); };

  const openPayDialog = (wo: WorkOrder) => {
    setPayTarget(wo);
    setPayDialogOpen(true);
    handleMenuClose();
  };

  const handleCreatePaymentVoucher = async () => {
    if (!payTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${payTarget.id}/pay-contractor`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setPayDialogOpen(false);
      setPayTarget(null);
      router.push(`/apps/payment-vouchers/${result.paymentVoucher.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally { setActionLoading(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        จัดการงาน {'>'} งานเสร็จรอจ่ายช่าง
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              งานเสร็จรอจ่ายช่าง
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <Chip
              icon={<FuseSvgIcon size={16}>lucide:clock</FuseSvgIcon>}
              label={`${data.length} รายการรอจ่าย`}
              sx={{
                bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: '14px',
                border: '1px solid #FDE68A', borderRadius: '10px', height: 36, px: 1,
              }}
            />
            <TextField placeholder="ค้นหา WO, ลูกค้า..." value={search}
              onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#D97706' }} /></Box>
      ) : data.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#6EE7B7', mb: 2 }} size={64}>lucide:party-popper</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#059669' }}>ไม่มีงานรอจ่าย 🎉</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>งานที่เสร็จแล้วรอจ่ายเงินจะแสดงที่นี่</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>เลขที่ WO</TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ชื่อโครงการ/งาน</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell>PO</TableCell>
                  <TableCell align="right">ยอดจ่ายช่าง (บาท)</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((wo, idx) => {
                  const payAmt = getPayAmount(wo);
                  const poCount = wo.purchaseOrders?.filter(p => p.status !== 'CANCELLED').length ?? 0;
                  return (
                    <TableRow key={wo.id} hover onClick={() => router.push(`/apps/work-orders/${wo.id}`)}
                      sx={{
                        cursor: 'pointer', '&:hover': { bgcolor: '#FFFBEB' },
                        '& td': { fontSize: '14px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                      }}>
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#D97706' }}>{wo.woNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(wo.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.quotation?.customerGroup?.groupName || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#D97706' }}>
                          {wo.quotation?.projectName || wo.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                      <TableCell>
                        {poCount > 0 ? (
                          <Chip label={`${poCount} PO`} size="small" sx={{ height: 22, fontSize: '11px', bgcolor: '#F3E8FF', color: '#7C3AED' }} />
                        ) : <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>ไม่มี PO</Typography>}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '15px !important', color: '#D97706' }}>
                        {fmt(payAmt)}
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, wo)} disabled={actionLoading}
                            sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#D97706' } }}>
                            <FuseSvgIcon size={20}>lucide:ellipsis-vertical</FuseSvgIcon>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
            <Typography sx={{ fontSize: '14px', color: '#92400E' }}>
              <FuseSvgIcon size={16} sx={{ mr: 0.5, verticalAlign: 'middle', color: '#D97706' }}>lucide:info</FuseSvgIcon>
              คลิกแถวเพื่อดูรายละเอียด • ออกใบสำคัญจ่ายจากยอด PO (หรือยอด WO ถ้าไม่มี PO)
            </Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#D97706' }}>
              ยอดรอจ่าย{' '}
              <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(data.reduce((s, w) => s + getPayAmount(w), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 240, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={() => { if (menuWO) router.push(`/apps/work-orders/${menuWO.id}`); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
          <ListItemText>ดูรายละเอียด WO</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => menuWO && openPayDialog(menuWO)} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#D97706' }}>lucide:banknote</FuseSvgIcon></ListItemIcon>
          <ListItemText primary="ออกใบสำคัญจ่ายช่าง" secondary={menuWO ? `${fmt(getPayAmount(menuWO))} บาท` : ''} />
        </MenuItem>
      </Menu>

      <Dialog open={payDialogOpen} onClose={() => !actionLoading && setPayDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>ออกใบสำคัญจ่ายช่าง</DialogTitle>
        <DialogContent>
          {payTarget && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '14px' }}>
              <div>WO: <strong>{payTarget.woNumber}</strong></div>
              <div>ผู้รับเงิน: <strong>{payTarget.team?.leaderName || payTarget.team?.teamName || '-'}</strong></div>
              {payTarget.purchaseOrders && payTarget.purchaseOrders.filter(p => p.status !== 'CANCELLED').length > 0 && (
                <Box sx={{ bgcolor: '#FAF5FF', p: 1.5, borderRadius: '8px', mt: 1 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', mb: 0.5 }}>อ้างอิง PO</Typography>
                  {payTarget.purchaseOrders.filter(p => p.status !== 'CANCELLED').map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.poNumber}</span><span>{fmt(p.totalAmount)} บาท</span>
                    </div>
                  ))}
                </Box>
              )}
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#D97706', textAlign: 'center', mt: 2 }}>
                {fmt(getPayAmount(payTarget))} บาท
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                ระบบจะสร้างใบสำคัญจ่ายและอัปเดตสถานะ WO เป็นจ่ายแล้ว
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayDialogOpen(false)} disabled={actionLoading} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleCreatePaymentVoucher} disabled={actionLoading}
            sx={{ textTransform: 'none', bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }}>
            {actionLoading ? 'กำลังสร้าง...' : 'ยืนยันออกใบสำคัญจ่าย'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default PendingPaymentsPage;
