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
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type WOStatus = {
  id: string; name: string; code: string; color: string; bgColor: string;
  sortOrder: number; isDefault: boolean; isActive: boolean;
};

const defaultColors = [
  { color: '#D97706', bgColor: '#FEF3C7', label: 'เหลือง' },
  { color: '#2563EB', bgColor: '#DBEAFE', label: 'น้ำเงิน' },
  { color: '#059669', bgColor: '#D1FAE5', label: 'เขียว' },
  { color: '#4F46E5', bgColor: '#E0E7FF', label: 'ม่วง' },
  { color: '#DC2626', bgColor: '#FEE2E2', label: 'แดง' },
  { color: '#0891B2', bgColor: '#CFFAFE', label: 'ฟ้า' },
  { color: '#EA580C', bgColor: '#FFF7ED', label: 'ส้ม' },
  { color: '#64748B', bgColor: '#F1F5F9', label: 'เทา' },
];

function WorkOrderStatusesPage() {
  const [data, setData] = useState<WOStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<WOStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', color: '#64748B', bgColor: '#F1F5F9', isDefault: false });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work-order-statuses');
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', code: '', color: '#64748B', bgColor: '#F1F5F9', isDefault: false });
    setDialogOpen(true);
  };

  const openEdit = (item: WOStatus) => {
    setEditItem(item);
    setForm({ name: item.name, code: item.code, color: item.color, bgColor: item.bgColor, isDefault: item.isDefault });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      setSnackbar({ open: true, message: 'กรุณากรอกชื่อและรหัสสถานะ', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const url = editItem ? `/api/work-order-statuses/${editItem.id}` : '/api/work-order-statuses';
      const method = editItem ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      setSnackbar({ open: true, message: editItem ? 'แก้ไขสำเร็จ' : 'เพิ่มสถานะสำเร็จ', severity: 'success' });
      setDialogOpen(false);
      load();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'เกิดข้อผิดพลาด', severity: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบสถานะ "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/work-order-statuses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: `ลบ "${name}" แล้ว`, severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบ', severity: 'error' });
    }
  };

  const handleToggleActive = async (item: WOStatus) => {
    try {
      await fetch(`/api/work-order-statuses/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      load();
    } catch { /* ignore */ }
  };

  const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        ตั้งค่า {'>'} สถานะ Work Order
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              ตั้งค่าสถานะ Work Order
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large" onClick={openCreate}
                startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                sx={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  borderRadius: '12px', px: 3.5, py: 1.2, fontSize: '16px', fontWeight: 600,
                  textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' },
                }}>
                เพิ่มสถานะใหม่
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#38BDF8' }} />
        </Box>
      ) : (
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  fontSize: '14px', fontWeight: 700, color: '#475569',
                  borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC', whiteSpace: 'nowrap',
                },
              }}>
                <TableCell sx={{ width: 60 }}>#</TableCell>
                <TableCell>ชื่อสถานะ</TableCell>
                <TableCell>รหัส (Code)</TableCell>
                <TableCell>ตัวอย่าง</TableCell>
                <TableCell align="center">ลำดับ</TableCell>
                <TableCell align="center">ค่าเริ่มต้น</TableCell>
                <TableCell align="center">เปิดใช้งาน</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={item.id} hover sx={{
                  opacity: item.isActive ? 1 : 0.5,
                  '& td': { fontSize: '14px', color: '#334155', py: 1.5, borderBottom: '1px solid #F1F5F9' },
                }}>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>{item.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', fontFamily: 'monospace', color: '#64748B', bgcolor: '#F8FAFC', px: 1, py: 0.25, borderRadius: '6px', display: 'inline-block' }}>
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.name} size="small" sx={{
                      fontSize: '12px', fontWeight: 600,
                      bgcolor: item.bgColor, color: item.color,
                      border: `1px solid ${item.color}20`, borderRadius: '8px',
                    }} />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{item.sortOrder}</TableCell>
                  <TableCell align="center">
                    {item.isDefault && (
                      <Chip label="ค่าเริ่มต้น" size="small" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#DBEAFE', color: '#2563EB' }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={item.isActive} onChange={() => handleToggleActive(item)} size="small"
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22C55E' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#BBF7D0' } }} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="แก้ไข" arrow>
                        <IconButton size="small" onClick={() => openEdit(item)}
                          sx={{ color: '#0284C7', '&:hover': { bgcolor: '#F0F9FF' } }}>
                          <FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ" arrow>
                        <IconButton size="small" onClick={() => handleDelete(item.id, item.name)}
                          sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                          <FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon sx={{ color: editItem ? '#0284C7' : '#22C55E' }} size={24}>
            {editItem ? 'lucide:pencil' : 'lucide:plus-circle'}
          </FuseSvgIcon>
          {editItem ? 'แก้ไขสถานะ' : 'เพิ่มสถานะใหม่'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <div className="space-y-16 mt-8">
            <TextField label="ชื่อสถานะ *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth sx={fieldSx} placeholder="เช่น รอดำเนินการ" />
            <TextField label="รหัส (Code) *" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              fullWidth sx={fieldSx} placeholder="เช่น PENDING"
              disabled={!!editItem}
              helperText={editItem ? 'ไม่สามารถแก้ไข Code ได้' : 'ใช้ตัวอักษรภาษาอังกฤษ A-Z และ _'} />

            {/* Color Picker */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 1 }}>
                เลือกสี
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {defaultColors.map((c) => (
                  <Tooltip key={c.label} title={c.label} arrow>
                    <Box
                      onClick={() => setForm({ ...form, color: c.color, bgColor: c.bgColor })}
                      sx={{
                        width: 36, height: 36, borderRadius: '10px', cursor: 'pointer',
                        bgcolor: c.bgColor, border: form.color === c.color ? `3px solid ${c.color}` : '2px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        '&:hover': { transform: 'scale(1.1)' },
                      }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: c.color }} />
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {/* Preview */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 1 }}>ตัวอย่าง</Typography>
              <Chip label={form.name || 'ชื่อสถานะ'} size="small" sx={{
                fontSize: '13px', fontWeight: 600,
                bgcolor: form.bgColor, color: form.color,
                border: `1px solid ${form.color}30`, borderRadius: '8px', px: 1,
              }} />
            </Box>
          </div>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
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

export default WorkOrderStatusesPage;
