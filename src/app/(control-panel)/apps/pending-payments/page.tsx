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
  quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
};

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function PendingPaymentsPage() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWO, setMenuWO] = useState<WorkOrder | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

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

  const handleMarkPaid = async () => {
    if (!menuWO) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/work-orders/${menuWO.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: `${menuWO.woNumber} → จ่ายแล้ว ✓`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
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
                  <TableCell>อ้างอิง QT</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ชื่อโครงการ/งาน</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((wo, idx) => (
                  <TableRow key={wo.id} hover
                    sx={{
                      cursor: 'pointer', '&:hover': { bgcolor: '#FFFBEB' },
                      '& td': { fontSize: '14px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                    }}>
                    <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#D97706' }}>{wo.woNumber}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(wo.date)}</TableCell>
                    <TableCell>
                      {wo.quotation?.quotationNumber ? (
                        <Chip label={wo.quotation.quotationNumber} size="small"
                          sx={{ fontSize: '12px', height: 24, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{wo.quotation?.customerGroup?.groupName || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#D97706' }}>
                        {wo.quotation?.projectName || wo.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '15px !important', color: '#D97706' }}>
                      {fmt(wo.totalAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="รอจ่าย" size="small" sx={{
                        fontSize: '12px', fontWeight: 600,
                        bgcolor: '#FEF3C7', color: '#D97706',
                        border: '1px solid #FDE68A', borderRadius: '8px',
                      }} />
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
            <Typography sx={{ fontSize: '14px', color: '#92400E' }}>
              <FuseSvgIcon size={16} sx={{ mr: 0.5, verticalAlign: 'middle', color: '#D97706' }}>lucide:alert-circle</FuseSvgIcon>
              {data.length} รายการรอจ่ายเงิน
            </Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#D97706' }}>
              ยอดรอจ่าย{' '}
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
        <MenuItem onClick={handleMarkPaid} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
          <ListItemText>จ่ายแล้ว</ListItemText>
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

export default PendingPaymentsPage;
