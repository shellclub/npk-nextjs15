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
import Link from 'next/link';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

type QuotationItem = {
  id: string; description: string; unit: string;
  quantity: number; unitPrice: number; amount: number;
};

type Quotation = {
  id: string; quotationNumber: string; date: string;
  customerGroup: { groupName: string };
  branch?: { name: string } | null;
  projectName?: string | null;
  subtotal: number; totalAmount: number; status: string;
  createdBy: { name: string };
  items: QuotationItem[];
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'แบบร่าง', bgColor: '#F3F4F6', textColor: '#6B7280' },
  SENT: { label: 'รออนุมัติ', bgColor: '#FEF3C7', textColor: '#D97706' },
  APPROVED: { label: 'อนุมัติ', bgColor: '#D1FAE5', textColor: '#059669' },
  REJECTED: { label: 'ปฏิเสธ', bgColor: '#FEE2E2', textColor: '#DC2626' },
  EXPIRED: { label: 'หมดอายุ', bgColor: '#F3E8FF', textColor: '#7C3AED' },
};

const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' },
  { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'SENT', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function QuotationsHeader({ search, setSearch, statusFilter, setStatusFilter }: {
  search: string; setSearch: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
}) {
  return (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        ใบเสนอราคา {'>'} แสดงทั้งหมด
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              ใบเสนอราคา
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: '10px', fontSize: '15px',
                  bgcolor: statusFilter === 'ALL' ? '#E0F2FE' : '#F8FAFC',
                  border: statusFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid #E2E8F0',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  fontWeight: 500, color: statusFilter === 'ALL' ? '#0284C7' : '#475569',
                }}>
                {statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '15px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField placeholder="ค้นหาจากชื่อลูกค้า, เลขที่เอกสาร, โปรเจ็ค..." value={search}
              onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{
                minWidth: 340,
                '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' },
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><FuseSvgIcon size={16}>lucide:x</FuseSvgIcon></IconButton></InputAdornment> : null,
              }} />
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Link href="/apps/quotations/new" passHref>
                <Button variant="contained" size="large"
                  startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                  sx={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    borderRadius: '12px', px: 3.5, py: 1.2, fontSize: '16px', fontWeight: 600,
                    textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' },
                  }}>
                  สร้างใหม่
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotationsContent({ quotations, loading, selected, toggleSelect, toggleSelectAll }: {
  quotations: Quotation[]; loading: boolean;
  selected: string[]; toggleSelect: (id: string) => void; toggleSelectAll: () => void;
}) {
  return (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#38BDF8' }} />
        </Box>
      ) : quotations.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:file-text</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบเสนอราคา</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;สร้างใหม่&quot; เพื่อเริ่มสร้าง</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{
                  '& th': {
                    fontSize: '15px', fontWeight: 700, color: '#475569',
                    borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC',
                  },
                }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox checked={selected.length === quotations.length && quotations.length > 0}
                      indeterminate={selected.length > 0 && selected.length < quotations.length}
                      onChange={toggleSelectAll} size="small" />
                  </TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>เลขที่เอกสาร</TableCell>
                  <TableCell>ชื่อลูกค้า / ชื่อโปรเจ็ค</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map(q => {
                  const sc = statusConfig[q.status] || statusConfig['DRAFT'];
                  return (
                    <TableRow key={q.id} hover selected={selected.includes(q.id)}
                      sx={{
                        cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' },
                        '& td': { fontSize: '15px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                      }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }}>
                        <Checkbox checked={selected.includes(q.id)} onChange={() => toggleSelect(q.id)} size="small" />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(q.date)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7', '&:hover': { textDecoration: 'underline' } }}>
                          {q.quotationNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>{q.customerGroup?.groupName}</Typography>
                        {q.projectName && <Typography sx={{ fontSize: '13px', color: '#94A3B8', mt: 0.25 }}>{q.projectName}</Typography>}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontSize: '16px !important' }}>
                        {fmt(q.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bgColor, color: sc.textColor, fontWeight: 600, fontSize: '13px', borderRadius: '8px', px: 0.5 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="เพิ่มเติม"><IconButton size="small"><FuseSvgIcon size={18}>lucide:more-horizontal</FuseSvgIcon></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFBFC' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {quotations.length} รายการ</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
              แสดงยอดรวมทั้งหมด{' '}
              <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/quotations?${params.toString()}`);
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch { setQuotations([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === quotations.length ? [] : quotations.map(q => q.id));

  return (
    <Root
      header={<QuotationsHeader search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />}
      content={<QuotationsContent quotations={quotations} loading={loading} selected={selected} toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll} />}
    />
  );
}

export default QuotationsPage;
