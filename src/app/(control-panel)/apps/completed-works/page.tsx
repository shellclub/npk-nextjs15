'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import { useAlert } from '@/components/shared/AlertProvider';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type CompletedWork = {
  id: string;
  completionDate: string;
  status: string;
  hasPhotos: boolean;
  hasWorkReceipt: boolean;
  workOrder: {
    id: string; woNumber: string; date: string; description?: string | null;
    totalAmount: number; status: string; poNumber?: string | null;
    quotation?: {
      quotationNumber: string; projectName?: string | null;
      customerGroup: { groupName: string };
    } | null;
    team?: { teamName: string } | null;
  };
  photos: { id: string; photoType: string }[];
  serviceItems: { id: string }[];
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  COMPLETED: { label: 'เสร็จสิ้น', bgColor: '#FEF3C7', textColor: '#D97706', borderColor: '#FCD34D' },
  PENDING_PAYMENT: { label: 'รอจ่ายค่าแรง', bgColor: '#DBEAFE', textColor: '#2563EB', borderColor: '#93C5FD' },
  PAID: { label: 'จ่ายแล้ว', bgColor: '#D1FAE5', textColor: '#059669', borderColor: '#6EE7B7' },
};

const filterOptions = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'PENDING_PAYMENT', label: 'รอจ่ายค่าแรง' },
  { value: 'PAID', label: 'จ่ายแล้ว' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function CompletedWorksPage() {
  const router = useRouter();
  const alert = useAlert();
  const [data, setData] = useState<CompletedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<CompletedWork | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const r = await fetch(`/api/completed-works?${params}`);
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: CompletedWork) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuItem(item);
  };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuItem(null); };

  const handleStatusUpdate = async (status: string, label: string) => {
    if (!menuItem) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/completed-works/${menuItem.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      alert.showSuccess('อัปเดตสถานะ', `${menuItem.workOrder.woNumber} → ${label}`);
      load();
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
    } finally { setActionLoading(false); }
  };

  // Check icon component
  const CheckIcon = ({ ok }: { ok: boolean }) => (
    <Box sx={{
      width: 24, height: 24, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: ok ? '#D1FAE5' : '#F1F5F9',
    }}>
      {ok ? (
        <FuseSvgIcon size={14} sx={{ color: '#059669' }}>lucide:check</FuseSvgIcon>
      ) : (
        <FuseSvgIcon size={14} sx={{ color: '#CBD5E1' }}>lucide:minus</FuseSvgIcon>
      )}
    </Box>
  );

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

          <Button variant="contained" startIcon={<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon>}
            onClick={() => router.push('/apps/completed-works/new')}
            sx={{
              ml: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(135deg, #059669, #047857)',
              '&:hover': { background: 'linear-gradient(135deg, #047857, #065F46)' },
            }}>
            สร้างใหม่
          </Button>

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
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม "สร้างใหม่" เพื่อเพิ่มข้อมูล</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '13px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.2, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ width: 40 }}>#</TableCell>
                  <TableCell>เลขที่นำส่ง/ใบสั่ง</TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>อ้างอิง QT</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>รายละเอียดงาน</TableCell>
                  <TableCell align="center" sx={{ width: 50 }}>
                    <Tooltip title="มีรูปภาพ" arrow><span>รูป</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 50 }}>
                    <Tooltip title="ใบรับงาน" arrow><span>ใบรับ</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>
                    <Tooltip title="Service Report" arrow><span>SR</span></Tooltip>
                  </TableCell>
                  <TableCell>ทีมช่าง</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((cw, idx) => {
                  const wo = cw.workOrder;
                  const sc = statusConfig[cw.status] || statusConfig['COMPLETED'];
                  const hasWorkPhotos = cw.photos.some(p => p.photoType === 'WORK');
                  const hasReceipt = cw.photos.some(p => p.photoType === 'RECEIPT');
                  const hasSR = cw.serviceItems.length > 0;

                  return (
                    <TableRow key={cw.id} hover
                      onClick={() => router.push(`/apps/completed-works/${cw.id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0FDF4' }, '& td': { fontSize: '13px', color: '#334155', py: 1.2, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{wo.woNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(cw.completionDate)}</TableCell>
                      <TableCell>
                        {wo.quotation?.quotationNumber ? (
                          <Chip label={wo.quotation.quotationNumber} size="small"
                            sx={{ fontSize: '11px', height: 22, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wo.quotation?.customerGroup?.groupName || '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                          {wo.quotation?.projectName || wo.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center"><CheckIcon ok={hasWorkPhotos} /></TableCell>
                      <TableCell align="center"><CheckIcon ok={hasReceipt} /></TableCell>
                      <TableCell align="center"><CheckIcon ok={hasSR} /></TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '14px !important' }}>
                        {fmt(wo.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={sc.label} size="small" sx={{
                          fontSize: '11px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor,
                          border: `1px solid ${sc.borderColor}`, borderRadius: '8px',
                        }} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, cw)} disabled={actionLoading}
                            sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#059669' } }}>
                            <FuseSvgIcon size={18}>lucide:ellipsis-vertical</FuseSvgIcon>
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
                {fmt(data.reduce((s, cw) => s + Number(cw.workOrder.totalAmount), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 220, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        {menuItem && (
          <>
            <MenuItem onClick={() => { router.push(`/apps/completed-works/${menuItem.id}`); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#3B82F6' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
              <ListItemText>ดูรายละเอียด / แก้ไข</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { window.open(`/completed-works/${menuItem.id}/print`, '_blank'); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:image</FuseSvgIcon></ListItemIcon>
              <ListItemText>พิมพ์รูปภาพ Report</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { window.open(`/completed-works/${menuItem.id}/service-report`, '_blank'); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#7C3AED' }}>lucide:file-text</FuseSvgIcon></ListItemIcon>
              <ListItemText>พิมพ์ Service Report</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            {menuItem.status === 'COMPLETED' && (
              <MenuItem onClick={() => handleStatusUpdate('PENDING_PAYMENT', 'รอจ่ายค่าแรง')} sx={{ py: 1.2, gap: 1.5 }}>
                <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#2563EB' }}>lucide:clock</FuseSvgIcon></ListItemIcon>
                <ListItemText>รอจ่ายค่าแรง</ListItemText>
              </MenuItem>
            )}
            {(menuItem.status === 'COMPLETED' || menuItem.status === 'PENDING_PAYMENT') && (
              <MenuItem onClick={() => handleStatusUpdate('PAID', 'จ่ายแล้ว')} sx={{ py: 1.2, gap: 1.5 }}>
                <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:banknote</FuseSvgIcon></ListItemIcon>
                <ListItemText>จ่ายแล้ว</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default CompletedWorksPage;
