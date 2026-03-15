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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

type Invoice = {
  id: string; invoiceNumber: string; date: string; dueDate?: string | null;
  subtotal: number; vatAmount: number; totalAmount: number; status: string;
  workOrder?: {
    woNumber: string;
    quotation?: { quotationNumber: string; customerGroup: { groupName: string } } | null;
    branch?: { name: string } | null;
  } | null;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  UNPAID: { label: 'ยังไม่ชำระ', bgColor: '#FEF3C7', textColor: '#D97706' },
  PARTIAL: { label: 'ชำระบางส่วน', bgColor: '#E0F2FE', textColor: '#0284C7' },
  PAID: { label: 'ชำระแล้ว', bgColor: '#D1FAE5', textColor: '#059669' },
  OVERDUE: { label: 'เกินกำหนด', bgColor: '#FEE2E2', textColor: '#DC2626' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#F3F4F6', textColor: '#6B7280' },
};
const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'UNPAID', label: 'ยังไม่ชำระ' },
  { value: 'PAID', label: 'ชำระแล้ว' }, { value: 'OVERDUE', label: 'เกินกำหนด' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== 'ALL') p.set('status', statusFilter);
      if (search) p.set('search', search);
      const r = await fetch(`/api/invoices?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  return (
    <div className="w-full p-24 md:p-32 lg:p-40">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-16 mb-32">
        <div>
          <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1E293B' }}>ใบแจ้งหนี้</Typography>
          <Typography sx={{ fontSize: '16px', color: '#94A3B8', mt: 0.5 }}>ใบแจ้งหนี้ {'>'} แสดงทั้งหมด</Typography>
        </div>
        <Button variant="contained" size="large" startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
          sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', borderRadius: '12px', px: 4, py: 1.5, fontSize: '16px', fontWeight: 600, textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.35)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
          สร้างใหม่
        </Button>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, p: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '15px', bgcolor: statusFilter === 'ALL' ? '#E0F2FE' : '#F8FAFC', border: statusFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid #E2E8F0', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 500, color: statusFilter === 'ALL' ? '#0284C7' : '#475569' }}>
                {statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '15px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }} />
            <TextField placeholder="ค้นหาเลขที่ใบแจ้งหนี้..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
          </Box>
        </Paper>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
          : data.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
              <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:receipt</FuseSvgIcon>
              <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบแจ้งหนี้</Typography>
              <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;สร้างใหม่&quot; เพื่อสร้างรายการ</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC', '& th': { fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 2 } }}>
                    <TableCell padding="checkbox" sx={{ pl: 3 }}><Checkbox checked={selected.length === data.length && data.length > 0} indeterminate={selected.length > 0 && selected.length < data.length} onChange={toggleAll} size="small" /></TableCell>
                    <TableCell>วันที่</TableCell>
                    <TableCell>เลขที่</TableCell>
                    <TableCell>ลูกค้า</TableCell>
                    <TableCell>WO อ้างอิง</TableCell>
                    <TableCell>กำหนดชำระ</TableCell>
                    <TableCell align="right">ยอดรวม (บาท)</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                    <TableCell align="center" sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map(inv => {
                    const sc = statusConfig[inv.status] || statusConfig['UNPAID'];
                    const customerName = inv.workOrder?.quotation?.customerGroup?.groupName || '-';
                    return (
                      <TableRow key={inv.id} hover selected={selected.includes(inv.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '15px', color: '#334155', py: 2, borderBottom: '1px solid #F1F5F9' } }}>
                        <TableCell padding="checkbox" sx={{ pl: 3 }}><Checkbox checked={selected.includes(inv.id)} onChange={() => toggleSelect(inv.id)} size="small" /></TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(inv.date)}</TableCell>
                        <TableCell><Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>{inv.invoiceNumber}</Typography></TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{customerName}</TableCell>
                        <TableCell>{inv.workOrder?.woNumber || '-'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{inv.dueDate ? fmtDate(inv.dueDate) : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '16px !important' }}>{fmt(inv.totalAmount)}</TableCell>
                        <TableCell align="center"><Chip label={sc.label} size="small" sx={{ bgcolor: sc.bgColor, color: sc.textColor, fontWeight: 600, fontSize: '13px', borderRadius: '8px' }} /></TableCell>
                        <TableCell align="center"><Tooltip title="เพิ่มเติม"><IconButton size="small"><FuseSvgIcon size={18}>lucide:more-horizontal</FuseSvgIcon></IconButton></Tooltip></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!loading && data.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 2, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC' }}>
              <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, i) => s + Number(i.totalAmount), 0))}</Box> บาท</Typography>
            </Box>
          )}
        </Paper>
      </motion.div>
    </div>
  );
}

export default InvoicesPage;
