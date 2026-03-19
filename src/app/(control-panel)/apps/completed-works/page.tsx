'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WorkOrder = {
  id: string; woNumber: string; date: string; description?: string | null;
  totalAmount: number; status: string;
  quotation?: { quotationNumber: string; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  COMPLETED:   { label: 'เสร็จสิ้น', bgColor: '#D1FAE5', textColor: '#059669', borderColor: '#6EE7B7' },
  PAID:        { label: 'จ่ายแล้ว', bgColor: '#E0E7FF', textColor: '#4F46E5', borderColor: '#A5B4FC' },
};
const filterOptions = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'PAID', label: 'จ่ายแล้ว' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function CompletedWorksPage() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWO, setMenuWO] = useState<WorkOrder | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch COMPLETED and PAID work orders
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (search) params.set('search', search);
      const r = await fetch(`/api/work-orders?${params}`);
      const d = await r.json();
      const all: WorkOrder[] = Array.isArray(d) ? d : [];
      // Filter to only completed/paid statuses
      const filtered = statusFilter === 'ALL'
        ? all.filter(w => w.status === 'COMPLETED' || w.status === 'PAID')
        : all;
      setData(filtered);
    } catch { setData([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, wo: WorkOrder) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuWO(wo);
  };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuWO(null); };

  const handleStatusUpdate = async (status: string, label: string) => {
    if (!menuWO) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/work-orders/${menuWO.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: `${menuWO.woNumber} → ${label}`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
    } finally { setActionLoading(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        จัดการงาน {'>'} งานเสร็จแล้วทั้งหมด
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              งานเสร็จแล้วทั้งหมด
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: '10px', fontSize: '15px',
                  bgcolor: statusFilter === 'ALL' ? '#D1FAE5' : '#F8FAFC',
                  border: statusFilter === 'ALL' ? '1.5px solid #6EE7B7' : '1px solid #E2E8F0',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  fontWeight: 500, color: statusFilter === 'ALL' ? '#059669' : '#475569',
                }}>
                {filterOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '15px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#059669' }} /></Box>
      ) : data.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:circle-check</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีงานที่เสร็จแล้ว</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>งานที่เสร็จสิ้นจะแสดงที่นี่</Typography>
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
                  <TableCell>อ้างอิง QT</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>รายละเอียดงาน</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((wo, idx) => {
                  const sc = statusConfig[wo.status] || statusConfig['COMPLETED'];
                  return (
                    <TableRow key={wo.id} hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0FDF4' }, '& td': { fontSize: '14px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{wo.woNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(wo.date)}</TableCell>
                      <TableCell>
                        {wo.quotation?.quotationNumber ? (
                          <Chip label={wo.quotation.quotationNumber} size="small"
                            sx={{ fontSize: '12px', height: 24, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.quotation?.customerGroup?.groupName || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wo.description || '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '15px !important' }}>
                        {fmt(wo.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={sc.label} size="small" sx={{ fontSize: '12px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px' }} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, wo)} disabled={actionLoading}
                            sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#059669' } }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FAFBFC' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#059669' }}>
              ยอดรวม{' '}
              <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(data.reduce((s, w) => s + Number(w.totalAmount), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        {menuWO && menuWO.status === 'COMPLETED' && (
          <MenuItem onClick={() => handleStatusUpdate('PAID', 'จ่ายแล้ว')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#4F46E5' }}>lucide:banknote</FuseSvgIcon></ListItemIcon>
            <ListItemText>จ่ายแล้ว</ListItemText>
          </MenuItem>
        )}
        {menuWO && menuWO.status === 'PAID' && (
          <MenuItem disabled sx={{ py: 1.2, gap: 1.5, opacity: 0.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
            <ListItemText>ดำเนินการครบแล้ว</ListItemText>
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        {menuWO && menuWO.status === 'COMPLETED' && (
          <MenuItem onClick={() => handleStatusUpdate('IN_PROGRESS', 'ย้อนสถานะ')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#D97706' }}>lucide:undo-2</FuseSvgIcon></ListItemIcon>
            <ListItemText>ย้อนสถานะ → กำลังดำเนินการ</ListItemText>
          </MenuItem>
        )}
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

export default CompletedWorksPage;
