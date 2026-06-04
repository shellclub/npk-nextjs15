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
import Popover from '@mui/material/Popover';
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
import DatePickerField from '@/components/shared/DatePickerField';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WorkOrder = {
  id: string; woNumber: string; date: string;
  poNumber?: string | null; poDate?: string | null;
  startDate?: string | null; endDate?: string | null;
  warrantyStartDate?: string | null; warrantyEndDate?: string | null;
  teamName?: string | null;
  description?: string | null; customerPO?: string | null;
  totalAmount: number; status: string;
  quotation?: { quotationNumber: string; date?: string | null; projectName?: string | null; subtotal?: number | null; totalAmount?: number | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
  branch?: { name: string } | null;
  purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
  invoice?: { id: string; invoiceNumber: string; date: string; taxInvoice?: { id: string; taxInvoiceNumber: string; date: string } | null } | null;
  invoices?: { id: string; invoiceNumber: string; date: string; taxInvoice?: { id: string; taxInvoiceNumber: string; date: string } | null }[];
};
type Quotation = { id: string; quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string }; totalAmount: number; subtotal: number };
type Team = { id: string; teamName: string; leaderName: string };
type WOStatusConfig = { id: string; name: string; code: string; color: string; bgColor: string; isActive: boolean };

// Fallback for statuses not found in config
const fallbackStatus = { label: 'ไม่ระบุ', bgColor: '#F1F5F9', textColor: '#64748B', borderColor: '#E2E8F0' };

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

  // Dynamic WO statuses from settings
  const [allStatuses, setAllStatuses] = useState<WOStatusConfig[]>([]);

  // Status change popover
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);
  const [statusChangeWO, setStatusChangeWO] = useState<WorkOrder | null>(null);

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [woStatuses, setWoStatuses] = useState<{ id: string; name: string; code: string; color: string; bgColor: string }[]>([]);
  const [form, setForm] = useState({
    woNumber: '', woDate: new Date().toISOString().split('T')[0],
    poNumber: '', poDate: '',
    quotationId: '', teamId: '', teamName: '', statusCode: '',
    startDate: '', endDate: '',
    warrantyStartDate: '', warrantyEndDate: '',
    totalAmount: 0,
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

  // Edit/View dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'view' | 'edit'>('view');
  const [editWO, setEditWO] = useState<WorkOrder | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    poNumber: '', poDate: '',
    teamId: '', teamName: '', statusCode: '',
    startDate: '', endDate: '',
    warrantyStartDate: '', warrantyEndDate: '',
    totalAmount: 0, description: '', notes: '',
  });

  // PO quick-edit dialog
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poDialogWO, setPoDialogWO] = useState<WorkOrder | null>(null);
  const [poForm, setPoForm] = useState({ poNumber: '', poDate: '' });
  const [poSaving, setPoSaving] = useState(false);

  const openPoDialog = (wo: WorkOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setPoDialogWO(wo);
    setPoForm({ poNumber: wo.poNumber || '', poDate: wo.poDate ? new Date(wo.poDate).toISOString().split('T')[0] : '' });
    setPoDialogOpen(true);
  };

  const handlePoSave = async () => {
    if (!poDialogWO) return;
    setPoSaving(true);
    try {
      const res = await fetch(`/api/work-orders/${poDialogWO.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poNumber: poForm.poNumber || null, poDate: poForm.poDate || null }),
      });
      if (!res.ok) throw new Error('Failed');
      setPoDialogOpen(false);
      setSnackbar({ open: true, message: `บันทึก PO เรียบร้อย`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
    } finally { setPoSaving(false); }
  };

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Load WO statuses from settings API
  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/work-order-statuses');
      const d = await res.json();
      setAllStatuses(Array.isArray(d) ? d : []);
    } catch { setAllStatuses([]); }
  }, []);
  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // Build dynamic status config map & filter options from settings
  const statusConfig = allStatuses.reduce<Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }>>((acc, s) => {
    acc[s.code] = { label: s.name, bgColor: s.bgColor, textColor: s.color, borderColor: `${s.color}40` };
    return acc;
  }, {});
  const statusOptions = [
    { value: 'ALL', label: 'แสดงทั้งหมด' },
    ...allStatuses.filter(s => s.isActive).map(s => ({ value: s.code, label: s.name })),
  ];

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

  // ── Open View/Edit dialog ──
  const openViewDialog = (wo: WorkOrder) => {
    setEditWO(wo);
    setEditForm({
      poNumber: wo.poNumber || '',
      poDate: wo.poDate ? new Date(wo.poDate).toISOString().split('T')[0] : '',
      teamId: wo.team ? (teams.find(t => t.teamName === wo.team?.teamName)?.id || '') : '',
      teamName: wo.teamName || wo.team?.teamName || '',
      statusCode: wo.status || '',
      startDate: wo.startDate ? new Date(wo.startDate).toISOString().split('T')[0] : '',
      endDate: wo.endDate ? new Date(wo.endDate).toISOString().split('T')[0] : '',
      warrantyStartDate: wo.warrantyStartDate ? new Date(wo.warrantyStartDate).toISOString().split('T')[0] : '',
      warrantyEndDate: wo.warrantyEndDate ? new Date(wo.warrantyEndDate).toISOString().split('T')[0] : '',
      totalAmount: Number(wo.totalAmount) || Number(wo.quotation?.subtotal || wo.quotation?.totalAmount || 0),
      description: wo.description || '',
      notes: wo.quotation?.projectName || wo.description || '',
    });
    setEditMode('view');
    setEditDialogOpen(true);
    // Load teams & statuses for edit form
    Promise.all([
      fetch('/api/technicians').then(r => r.json()).catch(() => []),
      fetch('/api/work-order-statuses').then(r => r.json()).catch(() => []),
    ]).then(([tRes, sRes]) => {
      setTeams(Array.isArray(tRes) ? tRes : []);
      const statuses = Array.isArray(sRes) ? sRes.filter((s: any) => s.isActive) : [];
      setWoStatuses(statuses);
    });
  };

  const openEditDialog = (wo: WorkOrder) => {
    openViewDialog(wo);
    setEditMode('edit');
  };

  const handleEditSave = async () => {
    if (!editWO) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        poNumber: editForm.poNumber || null,
        poDate: editForm.poDate || null,
        teamId: editForm.teamId || null,
        teamName: editForm.teamName || null,
        status: editForm.statusCode || undefined,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        warrantyStartDate: editForm.warrantyStartDate || null,
        warrantyEndDate: editForm.warrantyEndDate || null,
        totalAmount: editForm.totalAmount,
        description: editForm.description || null,
      };
      const res = await fetch(`/api/work-orders/${editWO.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: `แก้ไข ${editWO.woNumber} เรียบร้อย`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการแก้ไข', severity: 'error' });
    } finally { setEditSaving(false); }
  };

  // Create dialog
  const openDialog = async () => {
    setDialogOpen(true);
    const [qRes, tRes, sRes] = await Promise.all([
      fetch('/api/quotations').then(r => r.json()).catch(() => []),
      fetch('/api/technicians').then(r => r.json()).catch(() => []),
      fetch('/api/work-order-statuses').then(r => r.json()).catch(() => []),
    ]);
    setQuotations(Array.isArray(qRes) ? qRes : []);
    setTeams(Array.isArray(tRes) ? tRes : []);
    const statuses = Array.isArray(sRes) ? sRes.filter((s: any) => s.isActive) : [];
    setWoStatuses(statuses);
    // Set default status
    const defaultStatus = statuses.find((s: any) => s.isDefault);
    if (defaultStatus) {
      setForm(prev => ({ ...prev, statusCode: defaultStatus.code }));
    }
  };

  const handleSave = async () => {
    setCreateError('');
    // Validate required fields
    if (!form.statusCode) {
      setCreateError('กรุณาเลือกสถานะก่อนบันทึก');
      return;
    }
    if (!form.teamId && !form.teamName) {
      setCreateError('กรุณาเลือกหรือกรอกชื่อทีมช่างก่อนบันทึก');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          woNumber: form.woNumber || undefined,
          date: form.woDate,
          poNumber: form.poNumber || undefined,
          poDate: form.poDate || undefined,
          quotationId: form.quotationId || undefined,
          teamId: form.teamId || undefined,
          teamName: form.teamName || undefined,
          status: form.statusCode,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          warrantyStartDate: form.warrantyStartDate || undefined,
          warrantyEndDate: form.warrantyEndDate || undefined,
          totalAmount: form.totalAmount,
          createdById: 'system',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const newWO = await res.json();
      setDialogOpen(false);
      setCreateError('');
      setForm({
        woNumber: '', woDate: new Date().toISOString().split('T')[0],
        poNumber: '', poDate: '',
        quotationId: '', teamId: '', teamName: '', statusCode: '',
        startDate: '', endDate: '',
        warrantyStartDate: '', warrantyEndDate: '',
        totalAmount: 0,
      });
      setSnackbar({ open: true, message: `สร้าง ${newWO.woNumber} เรียบร้อย`, severity: 'success' });
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง WO';
      setCreateError(msg.length > 150 ? 'ไม่สามารถสร้าง WO ได้ กรุณาตรวจสอบข้อมูลและลองใหม่' : msg);
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
                <TableRow sx={{ '& th': { fontSize: '12px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.2, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' } }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox checked={selected.length === data.length && data.length > 0}
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      onChange={toggleAll} size="small" />
                  </TableCell>
                  <TableCell sx={{ width: 36, textAlign: 'center' }}>#</TableCell>
                  <TableCell><div>เลขใบเสนอราคา</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>วันที่</div></TableCell>
                  <TableCell><div>ชื่อลูกค้า</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>สาขา</div></TableCell>
                  <TableCell>ชื่องาน</TableCell>
                  <TableCell>ผู้ติดต่อ</TableCell>
                  <TableCell align="right">ยอดเงิน</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell><div>เลข PO ช่าง</div></TableCell>
                  <TableCell><div>เริ่ม – สิ้นสุดงาน</div></TableCell>
                  <TableCell><div>ระยะเวลา</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>ประกัน</div></TableCell>
                  <TableCell><div>WO</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>วันที่</div></TableCell>
                  <TableCell><div>PO</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>วันที่</div></TableCell>
                  <TableCell><div>ใบแจ้งหนี้</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>วันที่</div></TableCell>
                  <TableCell><div>ใบกำกับภาษี</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>วันที่</div></TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 56 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredByDate.map((wo, idx) => {
                  const sc = statusConfig[wo.status] || fallbackStatus;
                  const isCancelled = wo.status === 'CANCELLED';
                  const displayTeam = wo.teamName || wo.team?.teamName || '-';
                  const subtotal = wo.quotation?.subtotal ? Number(wo.quotation.subtotal) : Number(wo.totalAmount);
                  return (
                    <TableRow key={wo.id} hover selected={selected.includes(wo.id)}
                      onClick={() => openViewDialog(wo)}
                      sx={{
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        opacity: isCancelled ? 0.5 : 1,
                        '&:hover': { bgcolor: '#F0F9FF' },
                        '& td': { fontSize: '13px', color: '#334155', py: 1.2, borderBottom: '1px solid #F1F5F9' },
                      }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(wo.id)} onChange={() => toggleSelect(wo.id)} size="small" />
                      </TableCell>
                      {/* # */}
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>{idx + 1}</TableCell>
                      {/* เลขใบเสนอราคา / วันที่ */}
                      <TableCell>
                        {wo.quotation ? (
                          <>
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>{wo.quotation.quotationNumber}</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{wo.quotation.date ? fmtDate(wo.quotation.date) : '-'}</Typography>
                          </>
                        ) : '-'}
                      </TableCell>
                      {/* ชื่อลูกค้า / สาขา */}
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{wo.quotation?.customerGroup?.groupName || '-'}</Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{wo.branch?.name || '-'}</Typography>
                      </TableCell>
                      {/* ชื่องาน */}
                      <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {wo.quotation?.projectName || wo.description || '-'}
                        </Typography>
                      </TableCell>
                      {/* ผู้ติดต่อ — ยังไม่มีข้อมูลใน API */}
                      <TableCell sx={{ fontSize: '12px', color: '#94A3B8' }}>-</TableCell>
                      {/* ยอดเงิน */}
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '13px !important',
                        color: isCancelled ? '#94A3B8' : '#1E293B',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}>
                        {fmt(subtotal)}
                      </TableCell>
                      {/* ทีมช่าง */}
                      <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', fontSize: '12px' }}>{displayTeam}</TableCell>
                      {/* เลข PO ช่าง */}
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>{wo.customerPO || '-'}</Typography>
                      </TableCell>
                      {/* เริ่ม – สิ้นสุดงาน */}
                      <TableCell>
                        <Typography sx={{ fontSize: '12px' }}>{wo.startDate ? fmtDate(wo.startDate) : '-'}</Typography>
                        <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>{wo.endDate ? fmtDate(wo.endDate) : '-'}</Typography>
                      </TableCell>
                      {/* ระยะเวลาประกัน */}
                      <TableCell>
                        <Typography sx={{ fontSize: '12px' }}>{wo.warrantyStartDate ? fmtDate(wo.warrantyStartDate) : '-'}</Typography>
                        <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>{wo.warrantyEndDate ? fmtDate(wo.warrantyEndDate) : '-'}</Typography>
                      </TableCell>
                      {/* WO / วันที่ — click เปิด dialog */}
                      <TableCell onClick={(e) => { e.stopPropagation(); openEditDialog(wo); }}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#EFF6FF' }, borderRadius: '6px', transition: 'background 0.15s' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{wo.woNumber}</Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(wo.date)}</Typography>
                      </TableCell>
                      {/* PO / วันที่ — click เปิด PO dialog */}
                      <TableCell onClick={(e) => openPoDialog(wo, e)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F5F3FF' }, borderRadius: '6px', transition: 'background 0.15s' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                          {wo.poNumber || <Box component="span" sx={{ color: '#CBD5E1', fontWeight: 400 }}>+ เพิ่ม PO</Box>}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{wo.poDate ? fmtDate(wo.poDate) : ''}</Typography>
                      </TableCell>
                      {/* ใบแจ้งหนี้ / วันที่ */}
                      <TableCell onClick={(e) => { e.stopPropagation(); router.push('/apps/invoices'); }}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0FDF4' }, borderRadius: '6px', transition: 'background 0.15s' }}>
                        {wo.invoices?.[0] ? (
                          <>
                            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>{wo.invoices[0].invoiceNumber}</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(wo.invoices[0].date)}</Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: '12px', color: '#CBD5E1', fontWeight: 400 }}>+ สร้างใบแจ้งหนี้</Typography>
                        )}
                      </TableCell>
                      {/* ใบกำกับภาษี / วันที่ */}
                      <TableCell onClick={(e) => { e.stopPropagation(); router.push('/apps/tax-invoices'); }}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#FFFBEB' }, borderRadius: '6px', transition: 'background 0.15s' }}>
                        {wo.invoices?.[0]?.taxInvoice ? (
                          <>
                            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#D97706' }}>{wo.invoices[0].taxInvoice.taxInvoiceNumber}</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(wo.invoices[0].taxInvoice.date)}</Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: '12px', color: '#CBD5E1', fontWeight: 400 }}>+ สร้างใบกำกับ</Typography>
                        )}
                      </TableCell>
                      {/* สถานะ */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Chip label={sc.label} size="small"
                          onClick={(e) => {
                            setStatusAnchor(e.currentTarget as HTMLElement);
                            setStatusChangeWO(wo);
                          }}
                          sx={{
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            bgcolor: sc.bgColor, color: sc.textColor,
                            border: `1px solid ${sc.borderColor}`, borderRadius: '8px',
                            transition: 'all 0.15s ease',
                            '&:hover': { filter: 'brightness(0.92)', transform: 'scale(1.05)' },
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

        {/* View / Edit */}
        {menuWO && (
          <>
            <MenuItem onClick={() => { handleMenuClose(); openViewDialog(menuWO); }} sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
              <ListItemText>ดูรายละเอียด</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); openEditDialog(menuWO); }} sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#F59E0B' }}>lucide:pencil</FuseSvgIcon></ListItemIcon>
              <ListItemText>แก้ไข</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}

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

      {/* ========== PO Quick-Edit Dialog ========== */}
      <Dialog open={poDialogOpen} onClose={() => setPoDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FuseSvgIcon size={18} sx={{ color: '#fff' }}>lucide:file-text</FuseSvgIcon>
          </Box>
          {poDialogWO?.poNumber ? 'แก้ไข PO' : 'เพิ่ม PO'} — {poDialogWO?.woNumber}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: '20px!important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="เลข PO" value={poForm.poNumber}
              onChange={(e) => setPoForm({ ...poForm, poNumber: e.target.value })}
              fullWidth size="medium" autoFocus
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <DatePickerField label="วันที่ PO" value={poForm.poDate}
              onChange={(v) => setPoForm({ ...poForm, poDate: v })} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setPoDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
            ยกเลิก
          </Button>
          <Button onClick={handlePoSave} variant="contained" disabled={poSaving}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #5B21B6)' } }}>
            {poSaving ? 'กำลังบันทึก...' : 'บันทึก PO'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Status Change Popover ========== */}
      <Popover
        open={Boolean(statusAnchor)}
        anchorEl={statusAnchor}
        onClose={() => { setStatusAnchor(null); setStatusChangeWO(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', py: 0.5, mt: 0.5 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            เปลี่ยนสถานะ
          </Typography>
          {statusChangeWO && (
            <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.25 }}>
              {statusChangeWO.woNumber}
            </Typography>
          )}
        </Box>
        {allStatuses.filter(s => s.isActive).map(s => {
          const isCurrentStatus = statusChangeWO?.status === s.code;
          return (
            <MenuItem
              key={s.code}
              onClick={async () => {
                if (!statusChangeWO || isCurrentStatus) return;
                setStatusAnchor(null);
                setActionLoading(true);
                try {
                  const res = await fetch(`/api/work-orders/${statusChangeWO.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: s.code }),
                  });
                  if (!res.ok) throw new Error('Failed');
                  setSnackbar({ open: true, message: `${statusChangeWO.woNumber} → ${s.name}`, severity: 'success' });
                  load();
                } catch {
                  setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
                } finally {
                  setActionLoading(false);
                  setStatusChangeWO(null);
                }
              }}
              sx={{
                py: 1, gap: 1.5, fontSize: '14px',
                bgcolor: isCurrentStatus ? `${s.bgColor}` : 'transparent',
                fontWeight: isCurrentStatus ? 700 : 500,
                '&:hover': { bgcolor: s.bgColor },
              }}
            >
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '14px', fontWeight: isCurrentStatus ? 700 : 500 }}>
                {s.name}
              </Typography>
              {isCurrentStatus && (
                <FuseSvgIcon size={16} sx={{ color: s.color, ml: 'auto' }}>lucide:check</FuseSvgIcon>
              )}
            </MenuItem>
          );
        })}
      </Popover>

      {/* ========== View/Edit Dialog ========== */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FuseSvgIcon sx={{ color: editMode === 'edit' ? '#F59E0B' : '#0284C7' }} size={24}>
              {editMode === 'edit' ? 'lucide:pencil' : 'lucide:eye'}
            </FuseSvgIcon>
            {editMode === 'edit' ? 'แก้ไข' : 'รายละเอียด'} {editWO?.woNumber}
          </Box>
          {editMode === 'view' && (
            <Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:pencil</FuseSvgIcon>}
              onClick={() => setEditMode('edit')}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#F59E0B', color: '#F59E0B', '&:hover': { bgcolor: '#FFFBEB', borderColor: '#D97706' } }}>
              แก้ไข
            </Button>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <div className="space-y-8 mt-8">
            {/* Info Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, bgcolor: '#F8FAFC', borderRadius: '12px', p: 2, border: '1px solid #E2E8F0' }}>
              <Box>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>เลข WO</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{editWO?.woNumber}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>วันที่ WO</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>{editWO ? fmtDate(editWO.date) : '-'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>อ้างอิงใบเสนอราคา</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0369A1' }}>{editWO?.quotation?.quotationNumber || '-'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>ลูกค้า</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>{editWO?.quotation?.customerGroup?.groupName || '-'}</Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>ชื่อโครงการ</Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#059669' }}>{editWO?.quotation?.projectName || editWO?.description || '-'}</Typography>
              </Box>
            </Box>

            {/* PO Number / Date */}
            <div className="grid grid-cols-2 gap-8">
              <TextField label="เลข PO" value={editForm.poNumber}
                onChange={(e) => setEditForm({ ...editForm, poNumber: e.target.value })}
                fullWidth size="medium" sx={fieldSx}
                InputProps={{ readOnly: editMode === 'view' }} />
              <DatePickerField label="วันที่ PO" value={editForm.poDate}
                onChange={(v) => setEditForm({ ...editForm, poDate: v })}
                readOnly={editMode === 'view'} />
            </div>

            {/* Status */}
            <FormControl fullWidth size="medium" disabled={editMode === 'view'}>
              <InputLabel>สถานะ</InputLabel>
              <Select value={editForm.statusCode}
                onChange={(e) => setEditForm({ ...editForm, statusCode: e.target.value })}
                label="สถานะ" sx={{ borderRadius: '10px' }}>
                {woStatuses.map(s => (
                  <MenuItem key={s.code} value={s.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Team */}
            <div className="grid grid-cols-2 gap-8">
              <FormControl fullWidth size="medium" disabled={editMode === 'view'}>
                <InputLabel>เลือกทีมช่าง</InputLabel>
                <Select value={editForm.teamId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const t = teams.find(x => x.id === tId);
                    setEditForm({ ...editForm, teamId: tId, teamName: t ? t.teamName : '' });
                  }}
                  label="เลือกทีมช่าง" sx={{ borderRadius: '10px' }}>
                  <MenuItem value="">- ไม่เลือก -</MenuItem>
                  {teams.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.teamName} ({t.leaderName})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="หรือ กรอกชื่อทีมช่าง" value={editForm.teamName}
                onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value, teamId: '' })}
                fullWidth size="medium" sx={fieldSx}
                InputProps={{ readOnly: editMode === 'view' }} />
            </div>

            {/* Start/End dates */}
            <div className="grid grid-cols-2 gap-8">
              <DatePickerField label="วันเริ่มงาน" value={editForm.startDate}
                onChange={(v) => setEditForm({ ...editForm, startDate: v })}
                readOnly={editMode === 'view'} />
              <DatePickerField label="วันสิ้นสุดงาน" value={editForm.endDate}
                onChange={(v) => setEditForm({ ...editForm, endDate: v })}
                readOnly={editMode === 'view'} />
            </div>

            {/* Warranty dates */}
            <div className="grid grid-cols-2 gap-8">
              <DatePickerField label="วันเริ่มประกัน" value={editForm.warrantyStartDate}
                onChange={(v) => setEditForm({ ...editForm, warrantyStartDate: v })}
                readOnly={editMode === 'view'} />
              <DatePickerField label="วันสิ้นสุดประกัน" value={editForm.warrantyEndDate}
                onChange={(v) => setEditForm({ ...editForm, warrantyEndDate: v })}
                readOnly={editMode === 'view'} />
            </div>

            {/* Total Amount */}
            <TextField label="ยอดรวม ก่อน VAT (บาท)" type="number" value={editForm.totalAmount}
              onChange={(e) => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })}
              fullWidth size="medium" sx={fieldSx}
              InputProps={{ readOnly: editMode === 'view' }} />

            {/* Description */}
            <TextField label="รายละเอียด/หมายเหตุ" value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth size="medium" multiline rows={2} sx={fieldSx}
              InputProps={{ readOnly: editMode === 'view' }} />
          </div>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '15px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
            {editMode === 'view' ? 'ปิด' : 'ยกเลิก'}
          </Button>
          {editMode === 'edit' && (
            <Button variant="contained" onClick={handleEditSave} disabled={editSaving}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontSize: '15px', px: 3, fontWeight: 700,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' },
              }}>
              {editSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </Button>
          )}
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
          {createError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1, borderRadius: '10px' }} onClose={() => setCreateError('')}>
              {createError}
            </Alert>
          )}
          <div className="space-y-8 mt-8">
            {/* Row 1: WO Number + Date | PO Number + Date */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-8">
                <TextField label="เลข WO (ระบบสร้างอัตโนมัติ)" value={form.woNumber}
                  onChange={(e) => setForm({ ...form, woNumber: e.target.value })}
                  fullWidth size="medium" sx={fieldSx}
                  placeholder="ว่างไว้ = ระบบสร้างอัตโนมัติ" />
                <DatePickerField label="วันที่ WO" value={form.woDate}
                  onChange={(v) => setForm({ ...form, woDate: v })} />
              </div>
              <div className="space-y-8">
                <TextField label="เลข PO" value={form.poNumber}
                  onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                  fullWidth size="medium" sx={fieldSx}
                  placeholder="เลข PO จากลูกค้า" />
                <DatePickerField label="วันที่ PO" value={form.poDate}
                  onChange={(v) => setForm({ ...form, poDate: v })} />
              </div>
            </div>

            {/* Row 2: Reference Quotation */}
            <FormControl fullWidth size="medium">
              <InputLabel>อ้างอิงใบเสนอราคา</InputLabel>
              <Select value={form.quotationId}
                onChange={(e) => {
                  const qId = e.target.value;
                  const q = quotations.find(x => x.id === qId);
                  setForm({
                    ...form,
                    quotationId: qId,
                    totalAmount: q ? Number(q.subtotal || q.totalAmount) : 0,
                  });
                }}
                label="อ้างอิงใบเสนอราคา" sx={{ borderRadius: '10px' }}>
                <MenuItem value="">- ค้นหาเพื่ออ้างอิง -</MenuItem>
                {quotations.map(q => (
                  <MenuItem key={q.id} value={q.id}>
                    {q.quotationNumber} — {q.customerGroup?.groupName} {q.projectName ? `(${q.projectName})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Row 3: Status (required) */}
            <FormControl fullWidth size="medium" required error={!form.statusCode}>
              <InputLabel>กำหนดสถานะ *</InputLabel>
              <Select value={form.statusCode}
                onChange={(e) => setForm({ ...form, statusCode: e.target.value })}
                label="กำหนดสถานะ *" sx={{ borderRadius: '10px' }}>
                {woStatuses.map(s => (
                  <MenuItem key={s.code} value={s.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {!form.statusCode && (
                <Typography sx={{ fontSize: '12px', color: '#DC2626', mt: 0.5, ml: 1.5 }}>บังคับให้ระบุ</Typography>
              )}
            </FormControl>

            {/* Row 4: Team - dropdown or free text */}
            <div className="grid grid-cols-2 gap-8">
              <FormControl fullWidth size="medium">
                <InputLabel>เลือกทีมช่าง</InputLabel>
                <Select value={form.teamId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const t = teams.find(x => x.id === tId);
                    setForm({ ...form, teamId: tId, teamName: t ? t.teamName : '' });
                  }}
                  label="เลือกทีมช่าง" sx={{ borderRadius: '10px' }}>
                  <MenuItem value="">- ไม่เลือก -</MenuItem>
                  {teams.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.teamName} ({t.leaderName})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="หรือ กรอกชื่อทีมช่าง" value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value, teamId: '' })}
                fullWidth size="medium" sx={fieldSx}
                placeholder="พิมพ์ชื่อทีมช่าง" />
            </div>

            {/* Row 5: Start/End dates */}
            <div className="grid grid-cols-2 gap-8">
              <DatePickerField label="วันเริ่มงาน" value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })} />
              <DatePickerField label="วันสิ้นสุดงาน" value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })} />
            </div>

            {/* Row 6: Warranty Start/End dates */}
            <div className="grid grid-cols-2 gap-8">
              <DatePickerField label="วันเริ่มประกัน" value={form.warrantyStartDate}
                onChange={(v) => setForm({ ...form, warrantyStartDate: v })} />
              <DatePickerField label="วันสิ้นสุดประกัน" value={form.warrantyEndDate}
                onChange={(v) => setForm({ ...form, warrantyEndDate: v })} />
            </div>

            {/* Row 7: Total Amount */}
            <TextField label="ยอดรวม ก่อน VAT (บาท)" type="number" value={form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
              fullWidth size="medium" sx={fieldSx}
              helperText="แสดงยอดค่างานก่อน VAT ขึ้นอัตโนมัติตามใบเสนอราคา"
              InputProps={{ readOnly: !!form.quotationId }} />
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
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} />
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default WorkOrdersPage;
