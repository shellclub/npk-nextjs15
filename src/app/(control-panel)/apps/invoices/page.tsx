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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import { useAlert } from '@/components/shared/AlertProvider';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

type Invoice = {
  id: string; invoiceNumber: string; date: string; dueDate?: string | null;
  subtotal: number; vatAmount: number; totalAmount: number; status: string;
  workOrder?: { woNumber: string; quotation?: { quotationNumber: string; customerGroup: { groupName: string } } | null } | null;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  UNPAID:    { label: 'ยังไม่ชำระ', bgColor: '#FEF3C7', textColor: '#D97706', borderColor: '#FDE68A' },
  PARTIAL:   { label: 'ชำระบางส่วน', bgColor: '#E0F2FE', textColor: '#0284C7', borderColor: '#BAE6FD' },
  PAID:      { label: 'ชำระแล้ว', bgColor: '#D1FAE5', textColor: '#059669', borderColor: '#6EE7B7' },
  OVERDUE:   { label: 'เกินกำหนด', bgColor: '#FEE2E2', textColor: '#DC2626', borderColor: '#FCA5A5' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#F3F4F6', textColor: '#6B7280', borderColor: '#D1D5DB' },
};
const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' },
  { value: 'UNPAID', label: 'ยังไม่ชำระ' },
  { value: 'PARTIAL', label: 'ชำระบางส่วน' },
  { value: 'PAID', label: 'ชำระแล้ว' },
  { value: 'OVERDUE', label: 'เกินกำหนด' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string | null | undefined) { if (!d) return '-'; return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

function InvoicesPage() {
  const router = useRouter();
  const alert = useAlert();
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuInv, setMenuInv] = useState<Invoice | null>(null);

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  // Print preview dialog
  const [printOpen, setPrintOpen] = useState(false);
  const [printId, setPrintId] = useState('');
  const [printNumber, setPrintNumber] = useState('');

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

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, inv: Invoice) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuInv(inv); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuInv(null); };

  const handleStatusUpdate = async (status: string, label: string) => {
    if (!menuInv) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/invoices/${menuInv.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      alert.showSuccess(`อัปเดตสำเร็จ`, `${menuInv.invoiceNumber} → ${label}`);
      load();
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
    } finally { setActionLoading(false); }
  };

  const handleCancelClick = () => {
    if (!menuInv) return;
    setCancelTarget(menuInv);
    setCancelOpen(true);
    handleMenuClose();
  };
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await fetch(`/api/invoices/${cancelTarget.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      alert.showSuccess('ยกเลิกเรียบร้อย', `${cancelTarget.invoiceNumber} ถูกยกเลิกแล้ว`);
      load();
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกได้');
    } finally { setActionLoading(false); setCancelOpen(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน {'>'} ใบแจ้งหนี้</Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>ใบแจ้งหนี้</Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '14px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 500 }}>
                {statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '14px' }}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField placeholder="ค้นหาเลขที่ใบแจ้งหนี้, ลูกค้า..." value={search}
              onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '14px', bgcolor: '#F8FAFC' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
              <Button variant="contained" size="large"
                onClick={() => router.push('/apps/invoices/new')}
                startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
                sx={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(14,165,233,0.35)', '&:hover': { background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' } }}>
                + สร้างใบแจ้งหนี้
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#38BDF8' }} /></Box>
      ) : data.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:receipt</FuseSvgIcon>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ยังไม่มีใบแจ้งหนี้</Typography>
          <Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม &quot;+ สร้างใบแจ้งหนี้&quot; เพื่อสร้างรายการ</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: '13px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.2, bgcolor: '#F8FAFC', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ width: 40 }}>#</TableCell>
                  <TableCell>เลขที่</TableCell>
                  <TableCell>วันที่</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>WO อ้างอิง</TableCell>
                  <TableCell>ครบกำหนด</TableCell>
                  <TableCell align="right">ยอดรวม (บาท)</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((inv, idx) => {
                  const sc = statusConfig[inv.status] || statusConfig['UNPAID'];
                  const customerName = inv.workOrder?.quotation?.customerGroup?.groupName || '-';
                  const isCancelled = inv.status === 'CANCELLED';
                  return (
                    <TableRow key={inv.id} hover
                      onClick={() => router.push(`/apps/invoices/${inv.id}`)}
                      sx={{ cursor: 'pointer', opacity: isCancelled ? 0.5 : 1, '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '13px', color: '#334155', py: 0.8, borderBottom: '1px solid #F1F5F9' } }}>
                      <TableCell sx={{ fontWeight: 500, color: '#94A3B8' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0284C7' }}>{inv.invoiceNumber}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{customerName}</TableCell>
                      <TableCell>
                        {inv.workOrder?.woNumber ? (
                          <Chip label={inv.workOrder.woNumber} size="small" sx={{ fontSize: '11px', height: 22, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: inv.status === 'OVERDUE' ? '#DC2626' : undefined, fontWeight: inv.status === 'OVERDUE' ? 700 : 400 }}>
                        {fmtDate(inv.dueDate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '14px !important', color: isCancelled ? '#94A3B8' : '#1E293B', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                        {fmt(inv.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={sc.label} size="small" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px', minWidth: 72 }} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, inv)} disabled={actionLoading}
                            sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' } }}>
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
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
              ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(data.filter(i => i.status !== 'CANCELLED').reduce((s, i) => s + Number(i.totalAmount), 0))}
              </Box> บาท
            </Typography>
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 220, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={() => { if (menuInv) router.push(`/apps/invoices/${menuInv.id}`); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
          <ListItemText>ดูรายละเอียด</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuInv) { setPrintId(menuInv.id); setPrintNumber(menuInv.invoiceNumber); setPrintOpen(true); } handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#8B5CF6' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
          <ListItemText>พิมพ์ใบแจ้งหนี้</ListItemText>
        </MenuItem>
        {menuInv && menuInv.status === 'UNPAID' && (
          <MenuItem onClick={() => handleStatusUpdate('PAID', 'ชำระแล้ว')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
            <ListItemText>ชำระแล้ว</ListItemText>
          </MenuItem>
        )}
        {menuInv && menuInv.status === 'UNPAID' && (
          <MenuItem onClick={() => handleStatusUpdate('PARTIAL', 'ชำระบางส่วน')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:clock</FuseSvgIcon></ListItemIcon>
            <ListItemText>ชำระบางส่วน</ListItemText>
          </MenuItem>
        )}
        {menuInv && menuInv.status === 'PARTIAL' && (
          <MenuItem onClick={() => handleStatusUpdate('PAID', 'ชำระแล้ว')} sx={{ py: 1.2, gap: 1.5 }}>
            <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
            <ListItemText>ชำระครบแล้ว</ListItemText>
          </MenuItem>
        )}
        {menuInv && menuInv.status !== 'CANCELLED' && menuInv.status !== 'PAID' && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleCancelClick} sx={{ py: 1.2, gap: 1.5, color: '#DC2626' }}>
              <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#DC2626' }}>lucide:trash-2</FuseSvgIcon></ListItemIcon>
              <ListItemText primaryTypographyProps={{ color: '#DC2626' }}>ยกเลิก</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon sx={{ color: '#EF4444' }} size={24}>lucide:alert-triangle</FuseSvgIcon>
          ยืนยันการยกเลิก
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography sx={{ fontSize: '15px', color: '#475569', mb: 1 }}>คุณต้องการยกเลิกใบแจ้งหนี้:</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{cancelTarget?.invoiceNumber}</Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>ไม่ยกเลิก</Button>
          <Button onClick={handleCancelConfirm} variant="contained" disabled={actionLoading} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>{actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return (
    <>
      <Root header={header} content={content} scroll="content" />

      {/* Print Preview Dialog */}
      <Dialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{printNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPrintOpen(false)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#64748B', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F1F5F9' } }}>
              ปิดหน้าต่าง
            </Button>
            <Button variant="contained"
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
              onClick={() => { const f = document.getElementById('inv-print-iframe') as HTMLIFrameElement; f?.contentWindow?.print(); }}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg,#0284C7,#0369A1)', '&:hover': { background: 'linear-gradient(135deg,#0369A1,#075985)' } }}>
              พิมพ์
            </Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
          <iframe
            id="inv-print-iframe"
            src={printOpen && printId ? `/api/invoices/${printId}/pdf` : 'about:blank'}
            style={{ flex: 1, border: 'none', background: '#fff', margin: '16px auto', maxWidth: '800px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: '4px' }}
            title="Print Preview"
          />
        </Box>
      </Dialog>
    </>
  );
}

export default InvoicesPage;
