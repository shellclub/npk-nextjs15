'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
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
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import { useAlert } from '@/components/shared/AlertProvider';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type ReceiptVoucher = {
  id: string; voucherNumber: string; date: string; amount: number;
  paymentMethod: string; bankName?: string | null; notes?: string | null;
  invoice?: { invoiceNumber: string; totalAmount: number; workOrder?: { woNumber: string; quotation?: { customerGroup: { groupName: string } } | null } | null } | null;
};

const paymentMethodLabels: Record<string, string> = { CASH: 'เงินสด', TRANSFER: 'โอนเงิน', CHEQUE: 'เช็ค' };
function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function ReceiptVouchersPage() {
  const router = useRouter();
  const alert = useAlert();
  const [data, setData] = useState<ReceiptVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<ReceiptVoucher | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReceiptVoucher | null>(null);

  // Print preview dialog
  const [printOpen, setPrintOpen] = useState(false);
  const [printId, setPrintId] = useState('');
  const [printNumber, setPrintNumber] = useState('');

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: ReceiptVoucher) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuItem(item); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuItem(null); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const r = await fetch(`/api/receipt-vouchers?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await fetch(`/api/receipt-vouchers/${deleteTarget.id}`, { method: 'DELETE' });
      alert.showSuccess('ลบเรียบร้อย', `${deleteTarget.voucherNumber} ถูกลบแล้ว`);
      load();
    } catch { alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้'); }
    finally { setActionLoading(false); setDeleteOpen(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน {'>'} ใบสำคัญรับ</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>ใบสำคัญรับ</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <TextField placeholder="ค้นหาเลขที่ใบสำคัญรับ..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 340, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '14px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large"
                onClick={() => router.push('/apps/receipt-vouchers/new')}
                startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(5,150,105,0.35)', '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)' } }}>
                + บันทึกการรับเงิน
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
        : data.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:hand-coins</FuseSvgIcon>
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบสำคัญรับ</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontSize: '13px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.2, bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ width: 40 }}>#</TableCell>
                    <TableCell>วันที่</TableCell>
                    <TableCell>เลขที่ใบสำคัญรับ</TableCell>
                    <TableCell>ลูกค้า</TableCell>
                    <TableCell>Invoice อ้างอิง</TableCell>
                    <TableCell align="center">วิธีชำระ</TableCell>
                    <TableCell align="right">จำนวนเงิน (บาท)</TableCell>
                    <TableCell align="center" sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((rv, idx) => {
                    const custName = rv.invoice?.workOrder?.quotation?.customerGroup?.groupName || '-';
                    return (
                      <TableRow key={rv.id} hover
                        onClick={() => router.push(`/apps/receipt-vouchers/${rv.id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0FDF4' }, '& td': { fontSize: '13px', color: '#334155', py: 0.8, borderBottom: '1px solid #F1F5F9' } }}>
                        <TableCell sx={{ color: '#94A3B8', fontWeight: 500 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(rv.date)}</TableCell>
                        <TableCell><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{rv.voucherNumber}</Typography></TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{custName}</TableCell>
                        <TableCell>{rv.invoice?.invoiceNumber || '-'}</TableCell>
                        <TableCell align="center"><Chip label={paymentMethodLabels[rv.paymentMethod] || rv.paymentMethod} size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '11px', borderRadius: '8px' }} /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '14px !important' }}>{fmt(rv.amount)}</TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="จัดการ" arrow>
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, rv)}
                              sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#059669' } }}>
                              <FuseSvgIcon size={18}>lucide:ellipsis-vertical</FuseSvgIcon>
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC' }}>
              <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#059669' }}>ยอดรวมรับ <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, r) => s + Number(r.amount), 0))}</Box> บาท</Typography>
            </Box>
          </>
        )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={() => { if (menuItem) router.push(`/apps/receipt-vouchers/${menuItem.id}`); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
          <ListItemText>ดูรายละเอียด</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuItem) { setPrintId(menuItem.id); setPrintNumber(menuItem.voucherNumber); setPrintOpen(true); } handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
          <ListItemText>พิมพ์ใบสำคัญรับ</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { if (menuItem) { setDeleteTarget(menuItem); setDeleteOpen(true); } handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5, color: '#DC2626' }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#DC2626' }}>lucide:trash-2</FuseSvgIcon></ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: '#DC2626' }}>ลบ</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon sx={{ color: '#EF4444' }} size={24}>lucide:alert-triangle</FuseSvgIcon> ยืนยันการลบ
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography sx={{ fontSize: '15px', color: '#475569', mb: 1 }}>คุณต้องการลบใบสำคัญรับ:</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{deleteTarget?.voucherNumber}</Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>ยกเลิก</Button>
          <Button onClick={handleDelete} variant="contained" disabled={actionLoading} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>{actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันลบ'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />

      {/* Print Preview Dialog */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth
        PaperProps={{ sx: { borderRadius: '16px', width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{printNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPrintOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#64748B' }}>ปิดหน้าต่าง</Button>
            <Button variant="contained" startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
              onClick={() => { const f = document.getElementById('rv-print-iframe') as HTMLIFrameElement; f?.contentWindow?.print(); }}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg,#059669,#047857)' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
          <iframe id="rv-print-iframe" src={printOpen && printId ? `/api/receipt-vouchers/${printId}/pdf` : 'about:blank'}
            style={{ flex: 1, border: 'none', background: '#fff', margin: '16px auto', maxWidth: '800px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px' }}
            title="Print Preview" />
        </Box>
      </Dialog>
    </>
  );
}

export default ReceiptVouchersPage;
