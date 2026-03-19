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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
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

type WithholdingTax = {
  id: string; whtNumber: string; date: string; payeeName: string; payeeTaxId: string;
  incomeType: string; taxRate: number; incomeAmount: number; taxAmount: number;
  paymentVoucher?: { voucherNumber: string; amount: number; paymentMethod: string } | null;
};

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function WithholdingTaxPage() {
  const [data, setData] = useState<WithholdingTax[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<WithholdingTax | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: WithholdingTax) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuItem(item); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuItem(null); };
  const handlePrint = () => { if (menuItem) setSnackbar({ open: true, message: `กำลังพิมพ์ 50 ทวิ ${menuItem.whtNumber}...`, severity: 'success' }); handleMenuClose(); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const r = await fetch(`/api/withholding-tax?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน {'>'} 50 ทวิ (หนังสือรับรองภาษีหัก ณ ที่จ่าย)</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>50 ทวิ</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <TextField placeholder="ค้นหาเลขที่, ผู้รับเงิน..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 340, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large"
                startIcon={<FuseSvgIcon size={20}>lucide:printer</FuseSvgIcon>}
                sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', borderRadius: '12px', px: 3.5, py: 1.2, fontSize: '16px', fontWeight: 600, textTransform: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.35)', '&:hover': { background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)' } }}>
                พิมพ์ 50 ทวิ
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>
      : data.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:stamp</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีรายการ 50 ทวิ</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>50 ทวิ จะถูกสร้างอัตโนมัติเมื่อออกใบสำคัญจ่ายพร้อมหัก ณ ที่จ่าย</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.length === data.length && data.length > 0} indeterminate={selected.length > 0 && selected.length < data.length} onChange={toggleAll} size="small" /></TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>เลขที่</TableCell>
                  <TableCell>ผู้ถูกหักภาษี</TableCell>
                  <TableCell>เลขผู้เสียภาษี</TableCell>
                  <TableCell>ประเภทเงินได้</TableCell>
                  <TableCell align="right">เงินได้ (บาท)</TableCell>
                  <TableCell align="center">อัตราภาษี</TableCell>
                  <TableCell align="right">ภาษีหัก (บาท)</TableCell>
                  <TableCell>ใบสำคัญจ่าย</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(wht => (
                  <TableRow key={wht.id} hover selected={selected.includes(wht.id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#FAF5FF' }, '& td': { fontSize: '15px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                    <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.includes(wht.id)} onChange={() => toggleSelect(wht.id)} size="small" /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(wht.date)}</TableCell>
                    <TableCell><Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#7C3AED' }}>{wht.whtNumber}</Typography></TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{wht.payeeName}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '14px !important' }}>{wht.payeeTaxId}</TableCell>
                    <TableCell>{wht.incomeType}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(wht.incomeAmount)}</TableCell>
                    <TableCell align="center"><Chip label={`${wht.taxRate}%`} size="small" sx={{ bgcolor: '#F3E8FF', color: '#7C3AED', fontWeight: 700, fontSize: '13px', borderRadius: '8px' }} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '16px !important', color: '#DC2626' }}>{fmt(wht.taxAmount)}</TableCell>
                    <TableCell><Typography sx={{ fontSize: '14px', color: '#0284C7' }}>{wht.paymentVoucher?.voucherNumber || '-'}</Typography></TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="จัดการ" arrow>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, wht)}
                          sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#FAF5FF', color: '#7C3AED' } }}>
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
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#7C3AED' }}>ภาษีหักรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, w) => s + Number(w.taxAmount), 0))}</Box> บาท</Typography>
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={handlePrint} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#7C3AED' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
          <ListItemText>พิมพ์ 50 ทวิ</ListItemText>
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

export default WithholdingTaxPage;
