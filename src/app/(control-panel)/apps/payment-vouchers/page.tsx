'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type PaymentVoucher = {
  id: string; voucherNumber: string; date: string; payeeName: string;
  amount: number; paymentMethod: string; description?: string | null;
  withholdingTax?: { whtNumber: string; taxAmount: number; taxRate: number } | null;
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'เงินสด', TRANSFER: 'โอนเงิน', CHEQUE: 'เช็ค',
};

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function PaymentVouchersPage() {
  const [data, setData] = useState<PaymentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<PaymentVoucher | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: PaymentVoucher) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuItem(item); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuItem(null); };
  const handlePrint = () => { if (menuItem) setSnackbar({ open: true, message: `กำลังพิมพ์ ${menuItem.voucherNumber}...`, severity: 'success' }); handleMenuClose(); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const r = await fetch(`/api/payment-vouchers?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน {'>'} ใบสำคัญจ่าย</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>ใบสำคัญจ่าย</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <TextField placeholder="ค้นหาเลขที่ใบสำคัญจ่าย, ผู้รับเงิน..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 360, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large"
                startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', borderRadius: '12px', px: 3.5, py: 1.2, fontSize: '16px', fontWeight: 600, textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.35)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
                สร้างใหม่
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
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:wallet</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบสำคัญจ่าย</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;สร้างใหม่&quot; เพื่อบันทึกการจ่ายเงิน</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.length === data.length && data.length > 0} indeterminate={selected.length > 0 && selected.length < data.length} onChange={toggleAll} size="small" /></TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>เลขที่ใบสำคัญจ่าย</TableCell>
                  <TableCell>ผู้รับเงิน</TableCell>
                  <TableCell>รายละเอียด</TableCell>
                  <TableCell align="center">วิธีจ่าย</TableCell>
                  <TableCell align="center">หัก ณ ที่จ่าย</TableCell>
                  <TableCell align="right">จำนวนเงิน (บาท)</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(pv => (
                  <TableRow key={pv.id} hover selected={selected.includes(pv.id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '15px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                    <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.includes(pv.id)} onChange={() => toggleSelect(pv.id)} size="small" /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(pv.date)}</TableCell>
                    <TableCell><Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>{pv.voucherNumber}</Typography></TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{pv.payeeName}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pv.description || '-'}</TableCell>
                    <TableCell align="center"><Chip label={paymentMethodLabels[pv.paymentMethod] || pv.paymentMethod} size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }} /></TableCell>
                    <TableCell align="center">
                      {pv.withholdingTax ? (
                        <Chip label={`${pv.withholdingTax.taxRate}% (${fmt(pv.withholdingTax.taxAmount)})`} size="small"
                          sx={{ bgcolor: '#F3E8FF', color: '#7C3AED', fontWeight: 600, fontSize: '12px', borderRadius: '8px' }} />
                      ) : <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>-</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '16px !important' }}>{fmt(pv.amount)}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="จัดการ" arrow>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, pv)}
                          sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' } }}>
                          <FuseSvgIcon size={20}>lucide:ellipsis-vertical</FuseSvgIcon>
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#DC2626' }}>ยอดรวมจ่าย <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, p) => s + Number(p.amount), 0))}</Box> บาท</Typography>
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={handlePrint} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
          <ListItemText>พิมพ์ใบสำคัญจ่าย</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default PaymentVouchersPage;
