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
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputLabel from '@mui/material/InputLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WorkOrder = {
  id: string; woNumber: string; date: string; description?: string | null;
  customerPO?: string | null;
  totalAmount: number; status: string;
  quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
  branch?: { name: string } | null;
  purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
};
type Quotation = { id: string; quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string }; totalAmount: number };
type Team = { id: string; teamName: string; leaderName: string };

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  PENDING:     { label: 'รอดำเนินการ', bgColor: '#FEF3C7', textColor: '#D97706', borderColor: '#FDE68A' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', bgColor: '#DBEAFE', textColor: '#2563EB', borderColor: '#93C5FD' },
  COMPLETED:   { label: 'เสร็จสิ้น', bgColor: '#D1FAE5', textColor: '#059669', borderColor: '#6EE7B7' },
  PAID:        { label: 'จ่ายแล้ว', bgColor: '#E0E7FF', textColor: '#4F46E5', borderColor: '#A5B4FC' },
  CANCELLED:   { label: 'ยกเลิก', bgColor: '#FEE2E2', textColor: '#DC2626', borderColor: '#FCA5A5' },
};

const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' },
  { value: 'PENDING', label: 'รอดำเนินการ' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'PAID', label: 'จ่ายแล้ว' },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function WorkOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    quotationId: '', teamId: '', date: new Date().toISOString().split('T')[0],
    startDate: '', endDate: '', description: '', totalAmount: 0, notes: '',
    customerPO: '',
  });

  // Year/Month filter
  const currentYear = new Date().getFullYear() + 543; // Buddhist year
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(0); // 0 = all months
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Action menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWO, setMenuWO] = useState<WorkOrder | null>(null);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<WorkOrder | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== 'ALL') p.set('status', statusFilter);
      if (search) p.set('search', search);
      const r = await fetch(`/api/work-orders?${p}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  // Filter by year/month
  const filteredByDate = data.filter((wo) => {
    const d = new Date(wo.date);
    const buddhistYear = d.getFullYear() + 543;
    if (buddhistYear !== yearFilter) return false;
    if (monthFilter > 0 && (d.getMonth() + 1) !== monthFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  // ── Menu handlers ──
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, wo: WorkOrder) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuWO(wo);
  };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuWO(null); };

  // Status update
  const handleStatusUpdate = async (status: string, label: string) => {
    if (!menuWO) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/work-orders/${menuWO.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: `${menuWO.woNumber} → ${label}`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
    } finally { setActionLoading(false); }
  };

  // Cancel
  const handleCancelClick = () => {
    if (!menuWO) return;
    setCancelTarget(menuWO);
    setCancelDialogOpen(true);
    handleMenuClose();
  };
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${cancelTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: `ยกเลิก ${cancelTarget.woNumber} เรียบร้อย`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการยกเลิก', severity: 'error' });
    } finally {
      setActionLoading(false);
      setCancelDialogOpen(false);
    }
  };

  // Create dialog
  const openDialog = async () => {
    setDialogOpen(true);
    const [qRes, tRes] = await Promise.all([
      fetch('/api/quotations?status=APPROVED').then(r => r.json()).catch(() => []),
      fetch('/api/technicians').then(r => r.json()).catch(() => []),
    ]);
    setQuotations(Array.isArray(qRes) ? qRes : []);
    setTeams(Array.isArray(tRes) ? tRes : []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdById: 'system' }),
      });
      if (!res.ok) throw new Error('Failed');
      const newWO = await res.json();
      setDialogOpen(false);
      setForm({ quotationId: '', teamId: '', date: new Date().toISOString().split('T')[0], startDate: '', endDate: '', description: '', totalAmount: 0, notes: '', customerPO: '' });
      setSnackbar({ open: true, message: `สร้าง ${newWO.woNumber} เรียบร้อย`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการสร้าง WO', severity: 'error' });
    } finally { setSaving(false); }
  };

  const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

  // ===== HEADER =====
  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        เอกสาร {'>'} ตอบรับทำงาน
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              ตอบรับทำงาน (WO/PO)
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 160 }}>
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
            <TextField placeholder="ค้นหา WO, ลูกค้า, รายละเอียด..." value={search}
              onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 300, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large" onClick={openDialog}
                startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                sx={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  borderRadius: '12px', px: 3.5, py: 1.2, fontSize: '16px', fontWeight: 600,
                  textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' },
                }}>
                + สร้าง WO ใหม่
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Year/Month filter row */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>กรองตาม:</Typography>
        {yearOptions.map((y) => (
          <Chip key={y} label={`ปี ${y}`} size="small"
            onClick={() => setYearFilter(y)}
            sx={{
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              bgcolor: yearFilter === y ? '#0284C7' : '#F1F5F9',
              color: yearFilter === y ? '#fff' : '#475569',
              '&:hover': { bgcolor: yearFilter === y ? '#0369A1' : '#E2E8F0' },
            }} />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Chip label="ทั้งปี" size="small"
          onClick={() => setMonthFilter(0)}
          sx={{
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            bgcolor: monthFilter === 0 ? '#059669' : '#F1F5F9',
            color: monthFilter === 0 ? '#fff' : '#475569',
            '&:hover': { bgcolor: monthFilter === 0 ? '#047857' : '#E2E8F0' },
          }} />
        {['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map((m, i) => (
          <Chip key={i+1} label={m} size="small"
            onClick={() => setMonthFilter(i + 1)}
            sx={{
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              bgcolor: monthFilter === i + 1 ? '#059669' : '#F1F5F9',
              color: monthFilter === i + 1 ? '#fff' : '#475569',
              '&:hover': { bgcolor: monthFilter === i + 1 ? '#047857' : '#E2E8F0' },
            }} />
        ))}
      </Box>
    </div>
  );

  // ===== CONTENT =====
  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
      ) : filteredByDate.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:clipboard-check</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มี Work Order</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;+ สร้าง WO ใหม่&quot; เพื่อเริ่มต้น</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' } }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox checked={selected.length === data.length && data.length > 0}
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      onChange={toggleAll} size="small" />
                  </TableCell>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>เลขที่ WO</TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>อ้างอิง QT</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ชื่อโครงการ/งาน</TableCell>
                  <TableCell>PO ลูกค้า</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredByDate.map((wo, idx) => {
                  const sc = statusConfig[wo.status] || statusConfig['PENDING'];
                  const isCancelled = wo.status === 'CANCELLED';
                  return (
                    <TableRow key={wo.id} hover selected={selected.includes(wo.id)}
                      sx={{
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        opacity: isCancelled ? 0.5 : 1,
                        '&:hover': { bgcolor: '#F0F9FF' },
                        '& td': { fontSize: '14px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                      }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(wo.id)} onChange={() => toggleSelect(wo.id)} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{wo.woNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(wo.date)}</TableCell>
                      <TableCell>
                        {wo.quotation?.quotationNumber ? (
                          <Chip label={wo.quotation.quotationNumber} size="small"
                            sx={{ fontSize: '12px', height: 24, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {wo.quotation?.customerGroup?.groupName || '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                          {wo.quotation?.projectName || wo.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', color: '#64748B' }}>
                        {wo.customerPO || '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '15px !important',
                        color: isCancelled ? '#94A3B8' : '#1E293B',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}>
                        {fmt(wo.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={sc.label} size="small" sx={{
                          fontSize: '12px', fontWeight: 600,
                          bgcolor: sc.bgColor, color: sc.textColor,
                          border: `1px solid ${sc.borderColor}`, borderRadius: '8px',
                        }} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, wo)}
                            disabled={actionLoading}
                            sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' } }}>
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

          {/* Footer summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FAFBFC' }}>
            <Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {filteredByDate.length} รายการ</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
              ยอดรวม{' '}
              <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(filteredByDate.filter(w => w.status !== 'CANCELLED').reduce((s, w) => s + Number(w.totalAmount), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}

      {/* ========== Action Menu ========== */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 220, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>

        {/* Status transitions depending on current status */}
        {menuWO && menuWO.status === 'PENDING' && (
          <MenuItem onClick={() => handleStatusUpdate('IN_PROGRESS', 'กำลังดำเนินการ')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#2563EB' }}>lucide:play</FuseSvgIcon></ListItemIcon>
            <ListItemText>เริ่มดำเนินการ</ListItemText>
          </MenuItem>
        )}
        {menuWO && menuWO.status === 'IN_PROGRESS' && (
          <MenuItem onClick={() => handleStatusUpdate('COMPLETED', 'เสร็จสิ้น')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
            <ListItemText>เสร็จสิ้น</ListItemText>
          </MenuItem>
        )}
        {menuWO && menuWO.status === 'COMPLETED' && (
          <MenuItem onClick={() => handleStatusUpdate('PAID', 'จ่ายแล้ว')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#4F46E5' }}>lucide:banknote</FuseSvgIcon></ListItemIcon>
            <ListItemText>จ่ายแล้ว</ListItemText>
          </MenuItem>
        )}

        {menuWO && menuWO.status !== 'CANCELLED' && menuWO.status !== 'PAID' && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={() => { window.open(`/api/work-orders/${menuWO.id}/pdf`, '_blank'); handleMenuClose(); }}
              sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
              <ListItemText>พิมพ์ใบตอบรับงาน</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleCancelClick} sx={{ py: 1.2, gap: 1.5, color: '#DC2626' }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#DC2626' }}>lucide:trash-2</FuseSvgIcon></ListItemIcon>
              <ListItemText primaryTypographyProps={{ color: '#DC2626' }}>ยกเลิก</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* ========== Cancel Confirmation Dialog ========== */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon sx={{ color: '#EF4444' }} size={24}>lucide:alert-triangle</FuseSvgIcon>
          ยืนยันการยกเลิก
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography sx={{ fontSize: '15px', color: '#475569', mb: 1 }}>คุณต้องการยกเลิก Work Order:</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{cancelTarget?.woNumber}</Typography>
          <Typography sx={{ fontSize: '14px', color: '#64748B', mt: 0.5 }}>{cancelTarget?.description || '-'}</Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setCancelDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
            ไม่ยกเลิก
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Create Dialog ========== */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon sx={{ color: '#22C55E' }} size={24}>lucide:clipboard-plus</FuseSvgIcon>
          สร้าง Work Order ใหม่
        </DialogTitle>
        <Divider />
        <DialogContent>
          <div className="space-y-16 mt-8">
            <FormControl fullWidth>
              <InputLabel>อ้างอิงใบเสนอราคา</InputLabel>
              <Select value={form.quotationId}
                onChange={(e) => setForm({ ...form, quotationId: e.target.value })}
                label="อ้างอิงใบเสนอราคา" sx={{ borderRadius: '10px' }}>
                <MenuItem value="">- ไม่ระบุ -</MenuItem>
                {quotations.map(q => (
                  <MenuItem key={q.id} value={q.id}>{q.quotationNumber} — {q.customerGroup?.groupName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>ทีมช่าง</InputLabel>
              <Select value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                label="ทีมช่าง" sx={{ borderRadius: '10px' }}>
                <MenuItem value="">- ไม่ระบุ -</MenuItem>
                {teams.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.teamName} ({t.leaderName})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="วันที่" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} />
            <div className="grid grid-cols-2 gap-16">
              <TextField label="วันเริ่มงาน" type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} />
              <TextField label="วันสิ้นสุด" type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </div>
            <TextField label="รายละเอียดงาน" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline rows={3} fullWidth sx={fieldSx} />
            <TextField label="ยอดรวม (บาท)" type="number" value={form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
              fullWidth sx={fieldSx} />
            <TextField label="เลข PO ลูกค้า (ถ้ามี)" value={form.customerPO}
              onChange={(e) => setForm({ ...form, customerPO: e.target.value })}
              fullWidth sx={fieldSx} placeholder="เช่น WO-XXXXX / PO-XXXXX" />
          </div>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '15px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontSize: '15px', px: 3, fontWeight: 700,
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' },
            }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default WorkOrdersPage;
