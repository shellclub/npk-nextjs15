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
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type PurchaseOrder = {
  id: string; poNumber: string; date: string; totalAmount: number; status: string;
  workOrder?: { woNumber: string } | null;
  team?: { teamName: string; leaderName: string } | null;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'แบบร่าง', bgColor: '#F3F4F6', textColor: '#6B7280' },
  APPROVED: { label: 'อนุมัติ', bgColor: '#D1FAE5', textColor: '#059669' },
  ORDERED: { label: 'สั่งซื้อแล้ว', bgColor: '#DBEAFE', textColor: '#2563EB' },
  RECEIVED: { label: 'รับแล้ว', bgColor: '#E0E7FF', textColor: '#4F46E5' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#FEE2E2', textColor: '#DC2626' },
};
const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'APPROVED', label: 'อนุมัติ' }, { value: 'ORDERED', label: 'สั่งซื้อแล้ว' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function PurchaseOrdersPage() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
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
      const r = await fetch(`/api/purchase-orders?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>จัดการ {'>'} แสดงทั้งหมด</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>ใบสั่งซื้อให้ช่าง (PO)</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '15px', bgcolor: statusFilter === 'ALL' ? '#E0F2FE' : '#F8FAFC', border: statusFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid #E2E8F0', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 500, color: statusFilter === 'ALL' ? '#0284C7' : '#475569' }}>
                {statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '15px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField placeholder="ค้นหา PO, ทีมช่าง..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
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
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:shopping-cart</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบสั่งซื้อ</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;สร้างใหม่&quot; เพื่อเริ่มต้น</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '15px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.length === data.length && data.length > 0} indeterminate={selected.length > 0 && selected.length < data.length} onChange={toggleAll} size="small" /></TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>เลขที่ PO</TableCell>
                  <TableCell>WO อ้างอิง</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(po => {
                  const sc = statusConfig[po.status] || statusConfig['DRAFT'];
                  return (
                    <TableRow key={po.id} hover selected={selected.includes(po.id)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '15px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.includes(po.id)} onChange={() => toggleSelect(po.id)} size="small" /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(po.date)}</TableCell>
                      <TableCell><Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>{po.poNumber}</Typography></TableCell>
                      <TableCell>{po.workOrder?.woNumber || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{po.team?.teamName || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '16px !important' }}>{fmt(po.totalAmount)}</TableCell>
                      <TableCell align="center"><Chip label={sc.label} size="small" sx={{ bgcolor: sc.bgColor, color: sc.textColor, fontWeight: 600, fontSize: '13px', borderRadius: '8px' }} /></TableCell>
                      <TableCell align="center"><Tooltip title="เพิ่มเติม"><IconButton size="small"><FuseSvgIcon size={18}>lucide:more-horizontal</FuseSvgIcon></IconButton></Tooltip></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, p) => s + Number(p.totalAmount), 0))}</Box> บาท</Typography>
          </Box>
        </>
      )}
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default PurchaseOrdersPage;
