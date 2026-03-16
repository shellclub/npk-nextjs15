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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WorkOrder = {
  id: string; woNumber: string; date: string; description?: string | null; totalAmount: number; status: string;
  quotation?: { quotationNumber: string; customerGroup: { groupName: string } } | null;
  team?: { teamName: string; leaderName: string } | null;
};
type Quotation = { id: string; quotationNumber: string; customerGroup: { groupName: string }; totalAmount: number };
type Team = { id: string; teamName: string; leaderName: string };

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  PENDING: { label: 'รอดำเนินการ', bgColor: '#FEF3C7', textColor: '#D97706' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', bgColor: '#DBEAFE', textColor: '#2563EB' },
  COMPLETED: { label: 'เสร็จสิ้น', bgColor: '#D1FAE5', textColor: '#059669' },
  PAID: { label: 'จ่ายแล้ว', bgColor: '#E0E7FF', textColor: '#4F46E5' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#FEE2E2', textColor: '#DC2626' },
};
const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'PENDING', label: 'รอดำเนินการ' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' }, { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'PAID', label: 'จ่ายแล้ว' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

function WorkOrdersPage() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    quotationId: '', teamId: '', date: new Date().toISOString().split('T')[0],
    startDate: '', endDate: '', description: '', totalAmount: 0, notes: '',
  });

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
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/work-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, createdById: 'system' }) });
      if (!res.ok) throw new Error('Failed');
      setDialogOpen(false);
      setForm({ quotationId: '', teamId: '', date: new Date().toISOString().split('T')[0], startDate: '', endDate: '', description: '', totalAmount: 0, notes: '' });
      load();
    } catch { setError('เกิดข้อผิดพลาด'); } finally { setSaving(false); }
  };

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === data.length ? [] : data.map(d => d.id));

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>จัดการงาน {'>'} แสดงทั้งหมด</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>ตอบรับทำงาน (Work Order)</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '15px', bgcolor: statusFilter === 'ALL' ? '#E0F2FE' : '#F8FAFC', border: statusFilter === 'ALL' ? '1.5px solid #38BDF8' : '1px solid #E2E8F0', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 500, color: statusFilter === 'ALL' ? '#0284C7' : '#475569' }}>
                {statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '15px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField placeholder="ค้นหาเลขที่ WO, รายละเอียด..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large" onClick={openDialog}
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
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:clipboard-check</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มี Work Order</Typography>
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
                  <TableCell>เลขที่ WO</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(wo => {
                  const sc = statusConfig[wo.status] || statusConfig['PENDING'];
                  return (
                    <TableRow key={wo.id} hover selected={selected.includes(wo.id)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '15px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }}><Checkbox checked={selected.includes(wo.id)} onChange={() => toggleSelect(wo.id)} size="small" /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtDate(wo.date)}</TableCell>
                      <TableCell><Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>{wo.woNumber}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>{wo.quotation?.customerGroup?.groupName || '-'}</Typography>
                        {wo.description && <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>{wo.description}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '16px !important' }}>{fmt(wo.totalAmount)}</TableCell>
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
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(data.reduce((s, w) => s + Number(w.totalAmount), 0))}</Box> บาท</Typography>
          </Box>
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pb: 1 }}>สร้าง Work Order ใหม่</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
          <div className="space-y-16 mt-8">
            <FormControl fullWidth><InputLabel>อ้างอิงใบเสนอราคา</InputLabel>
              <Select value={form.quotationId} onChange={(e) => setForm({ ...form, quotationId: e.target.value })} label="อ้างอิงใบเสนอราคา" sx={{ borderRadius: '10px' }}>
                <MenuItem value="">- ไม่ระบุ -</MenuItem>
                {quotations.map(q => <MenuItem key={q.id} value={q.id}>{q.quotationNumber} — {q.customerGroup?.groupName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth><InputLabel>ทีมช่าง</InputLabel>
              <Select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} label="ทีมช่าง" sx={{ borderRadius: '10px' }}>
                <MenuItem value="">- ไม่ระบุ -</MenuItem>
                {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.teamName} ({t.leaderName})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="วันที่" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <div className="grid grid-cols-2 gap-16">
              <TextField label="วันเริ่มงาน" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
              <TextField label="วันสิ้นสุด" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </div>
            <TextField label="รายละเอียดงาน" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <TextField label="ยอดรวม (บาท)" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', fontSize: '15px' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ borderRadius: '10px', fontSize: '15px', px: 3, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default WorkOrdersPage;
