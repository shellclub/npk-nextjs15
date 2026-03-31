'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateQuotationPDF, QuotationPDFData } from '@/lib/pdf/quotation-pdf';
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
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
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
  branch?: { name: string; code?: string } | null;
  projectName?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
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
  CANCELLED: { label: 'ยกเลิก', bgColor: '#E5E7EB', textColor: '#9CA3AF' },
};

const statusOptions = [
  { value: 'ALL', label: 'แสดงทั้งหมด' },
  { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'SENT', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<string[]>([]);

  // Action menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuQuotation, setMenuQuotation] = useState<Quotation | null>(null);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Quotation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // PDF Preview popup
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfQuotationId, setPdfQuotationId] = useState('');
  const [pdfQuotationNumber, setPdfQuotationNumber] = useState('');

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuotationId, setShareQuotationId] = useState('');
  const [shareQuotationNumber, setShareQuotationNumber] = useState('');

  // Photo upload link dialog
  const [photoLinkOpen, setPhotoLinkOpen] = useState(false);
  const [photoLinkQuotationId, setPhotoLinkQuotationId] = useState('');
  const [photoLinkQuotationNumber, setPhotoLinkQuotationNumber] = useState('');
  const [photoLinkCopied, setPhotoLinkCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, q: Quotation) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuQuotation(q);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuQuotation(null);
  };

  // Edit
  const handleEdit = () => {
    if (menuQuotation) router.push(`/apps/quotations/${menuQuotation.id}`);
    handleMenuClose();
  };

  // Duplicate
  const handleDuplicate = async () => {
    if (!menuQuotation) return;
    setActionLoading(true);
    handleMenuClose();
    try {
      const res = await fetch(`/api/quotations/${menuQuotation.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      const newQ = await res.json();
      setSnackbar({ open: true, message: `สร้างซ้ำสำเร็จ → ${newQ.quotationNumber}`, severity: 'success' });
      fetchQuotations();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการสร้างซ้ำ', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Print → open PDF popup
  const handlePrint = () => {
    if (menuQuotation) {
      setPdfQuotationId(menuQuotation.id);
      setPdfQuotationNumber(menuQuotation.quotationNumber);
      setPdfOpen(true);
    }
    handleMenuClose();
  };

  // Download PDF → open PDF popup then trigger download
  const handleDownload = () => {
    if (menuQuotation) {
      setPdfQuotationId(menuQuotation.id);
      setPdfQuotationNumber(menuQuotation.quotationNumber);
      setPdfOpen(true);
    }
    handleMenuClose();
  };

  // Share → open share dialog
  const handleShare = () => {
    if (menuQuotation) {
      setShareQuotationId(menuQuotation.id);
      setShareQuotationNumber(menuQuotation.quotationNumber);
      setShareCopied(false);
      setShareOpen(true);
    }
    handleMenuClose();
  };

  // Photo Upload Link
  const handlePhotoLink = () => {
    if (menuQuotation) {
      setPhotoLinkQuotationId(menuQuotation.id);
      setPhotoLinkQuotationNumber(menuQuotation.quotationNumber);
      setPhotoLinkCopied(false);
      setPhotoLinkOpen(true);
    }
    handleMenuClose();
  };

  const photoUploadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/upload-photos/${photoLinkQuotationId}`
    : '';

  const handleCopyPhotoLink = async () => {
    try {
      await navigator.clipboard.writeText(photoUploadUrl);
      setPhotoLinkCopied(true);
      setTimeout(() => setPhotoLinkCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = photoUploadUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPhotoLinkCopied(true);
      setTimeout(() => setPhotoLinkCopied(false), 3000);
    }
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/quotation/${shareQuotationId}` 
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  // PDF popup actions
  const handlePdfPrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handlePdfDownload = async () => {
    if (!pdfQuotationId) return;
    try {
      // Fetch quotation data and photos in parallel
      const [res, photosRes] = await Promise.all([
        fetch(`/api/quotations/${pdfQuotationId}`),
        fetch(`/api/quotations/${pdfQuotationId}/photos`),
      ]);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const photos = photosRes.ok ? await photosRes.json() : [];

      // Convert photo URLs to base64 for embedding in PDF
      const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => resolve('');
          img.src = url;
        });
      };

      const photosWithImages = Array.isArray(photos) ? await Promise.all(
        photos.map(async (p: any) => ({
          fileUrl: p.fileUrl,
          caption: p.caption,
          photoType: p.photoType,
          uploadedBy: p.uploadedBy,
          imageData: await loadImageAsBase64(p.fileUrl),
        }))
      ) : [];

      const pdfData: QuotationPDFData = {
        quotationNumber: data.quotationNumber,
        revisionNumber: data.revisionNumber,
        date: data.date,
        projectName: data.projectName,
        customerPO: data.customerPO,
        address: data.address,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        subtotal: Number(data.subtotal),
        discountPercent: Number(data.discountPercent || 0),
        discountAmount: Number(data.discountAmount || 0),
        vatPercent: Number(data.vatPercent || 7),
        vatAmount: Number(data.vatAmount),
        totalAmount: Number(data.totalAmount),
        conditions: data.conditions,
        notes: data.notes,
        warranty: data.warranty,
        customerGroup: data.customerGroup,
        branch: data.branch,
        createdBy: data.createdBy,
        items: (data.items || []).map((item: any) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          materialPrice: Number(item.materialPrice || 0),
          labourPrice: Number(item.labourPrice || 0),
          parentIndex: item.parentIndex,
        })),
        photos: photosWithImages,
      };
      const doc = generateQuotationPDF(pdfData);
      const displayQN = (pdfData.revisionNumber || 0) > 0
        ? `${pdfData.quotationNumber}_Rev${pdfData.revisionNumber}`
        : pdfData.quotationNumber;
      doc.save(`ใบเสนอราคา_${displayQN}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  // Cancel
  const handleCancelClick = () => {
    setCancelTarget(menuQuotation);
    setCancelDialogOpen(true);
    handleMenuClose();
  };
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotations/${cancelTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel');
      setSnackbar({ open: true, message: `ยกเลิก ${cancelTarget.quotationNumber} เรียบร้อย`, severity: 'success' });
      fetchQuotations();
    } catch {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการยกเลิก', severity: 'error' });
    } finally {
      setActionLoading(false);
      setCancelDialogOpen(false);
      setCancelTarget(null);
    }
  };

  const header = (
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

  const content = (
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
                    fontSize: '14px', fontWeight: 700, color: '#475569',
                    borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC',
                    whiteSpace: 'nowrap',
                  },
                }}>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox checked={selected.length === quotations.length && quotations.length > 0}
                      indeterminate={selected.length > 0 && selected.length < quotations.length}
                      onChange={toggleSelectAll} size="small" />
                  </TableCell>
                  <TableCell sx={{ minWidth: 130 }}>เลขที่ / วันที่</TableCell>
                  <TableCell>ลูกค้า / สาขา</TableCell>
                  <TableCell>ชื่อโครงการ</TableCell>
                  <TableCell>ผู้ติดต่อ</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>ชื่อใบเสนอราคา</TableCell>
                  <TableCell align="right">ยอดรวม</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: 70 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((q, index) => {
                  const sc = statusConfig[q.status] || statusConfig['DRAFT'];
                  const isCancelled = q.status === 'CANCELLED';
                  return (
                    <TableRow key={q.id} hover selected={selected.includes(q.id)}
                      onClick={() => router.push(`/apps/quotations/${q.id}`)}
                      sx={{
                        cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' },
                        '& td': {
                          fontSize: '14px', color: isCancelled ? '#9CA3AF' : '#334155',
                          py: 1.2, borderBottom: '1px solid #F1F5F9',
                        },
                      }}>
                      <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(q.id)} onChange={() => toggleSelect(q.id)} size="small" />
                      </TableCell>
                      {/* เลขที่ / วันที่ */}
                      <TableCell>
                        <Typography sx={{
                          fontSize: '14px', fontWeight: 600,
                          color: isCancelled ? '#9CA3AF' : '#0284C7',
                          textDecoration: isCancelled ? 'line-through' : 'none',
                        }}>
                          {q.quotationNumber}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.25 }}>{fmtDate(q.date)}</Typography>
                      </TableCell>
                      {/* ลูกค้า / สาขา */}
                      <TableCell>
                        <Typography sx={{
                          fontSize: '14px', fontWeight: 500,
                          color: isCancelled ? '#9CA3AF' : '#334155',
                          textDecoration: isCancelled ? 'line-through' : 'none',
                        }}>
                          {q.customerGroup?.groupName}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.25 }}>
                          {q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'}
                        </Typography>
                      </TableCell>
                      {/* ชื่อโครงการ */}
                      <TableCell>
                        <Typography sx={{
                          fontSize: '13px', color: isCancelled ? '#9CA3AF' : '#475569',
                          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {q.projectName || '-'}
                        </Typography>
                      </TableCell>
                      {/* ผู้ติดต่อ / เบอร์โทร */}
                      <TableCell>
                        <Typography sx={{
                          fontSize: '13px', color: isCancelled ? '#9CA3AF' : '#475569',
                        }}>
                          {q.contactPerson || '-'}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.25 }}>
                          {q.contactPhone || ''}
                        </Typography>
                      </TableCell>
                      {/* ชื่อใบเสนอราคา */}
                      <TableCell>
                        <Typography sx={{
                          fontSize: '14px', color: isCancelled ? '#9CA3AF' : '#475569',
                          textDecoration: isCancelled ? 'line-through' : 'none',
                          maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {q.projectName || '-'}
                        </Typography>
                      </TableCell>
                      {/* ยอดรวม */}
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                        fontSize: '15px !important',
                        color: isCancelled ? '#D1D5DB !important' : '#1E293B !important',
                      }}>
                        {fmt(q.totalAmount)}
                      </TableCell>
                      {/* สถานะ */}
                      <TableCell align="center" sx={{ textDecoration: 'none !important' }}>
                        <Chip label={sc.label} size="small" sx={{
                          bgcolor: sc.bgColor, color: sc.textColor,
                          fontWeight: 600, fontSize: '12px', borderRadius: '8px', px: 0.5,
                          minWidth: 72,
                        }} />
                      </TableCell>
                      {/* จัดการ */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}
                        sx={{ textDecoration: 'none !important' }}>
                        <Tooltip title="จัดการ" arrow>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, q)} disabled={actionLoading}
                            sx={{
                              color: '#64748B', borderRadius: '8px',
                              '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' },
                            }}>
                            <FuseSvgIcon size={20}>lucide:menu</FuseSvgIcon>
                          </IconButton>
                        </Tooltip>
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
              ยอดรวมทั้งหมด{' '}
              <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0))}
              </Box>{' '}บาท
            </Typography>
          </Box>
        </>
      )}

      {/* ── FlowAccount-style Action Menu ── */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
        <MenuItem onClick={handleEdit} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:pencil</FuseSvgIcon></ListItemIcon>
          <ListItemText>แก้ไข</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePrint} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#475569' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
          <ListItemText>พิมพ์</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#475569' }}>lucide:share-2</FuseSvgIcon></ListItemIcon>
          <ListItemText>แชร์</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleDownload} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#475569' }}>lucide:download</FuseSvgIcon></ListItemIcon>
          <ListItemText>ดาวน์โหลด</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicate} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:copy</FuseSvgIcon></ListItemIcon>
          <ListItemText>สร้างซ้ำ</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePhotoLink} sx={{ py: 1.2, gap: 1.5 }}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#F59E0B' }}>lucide:camera</FuseSvgIcon></ListItemIcon>
          <ListItemText>แนบรูปภาพก่อนทำงาน</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleCancelClick} sx={{ py: 1.2, gap: 1.5, color: '#DC2626' }}
          disabled={menuQuotation?.status === 'CANCELLED'}>
          <ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#DC2626' }}>lucide:trash-2</FuseSvgIcon></ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: '#DC2626' }}>ลบ</ListItemText>
        </MenuItem>
      </Menu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700 }}>
          ยืนยันการยกเลิก
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '15px' }}>
            คุณต้องการยกเลิกใบเสนอราคา <strong>{cancelTarget?.quotationNumber}</strong> ใช่หรือไม่?<br />
            การยกเลิกจะไม่สามารถกู้คืนได้
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px', px: 3 }}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error" disabled={actionLoading}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', fontSize: '15px', fontWeight: 500 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── FlowAccount-style PDF Preview Dialog ── */}
      <Dialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            width: '90vw',
            maxWidth: '1100px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>
            {pdfQuotationNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setPdfOpen(false)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f1f5f9' },
              }}
            >
              ปิดหน้าต่าง
            </Button>
            <Button
              variant="contained"
              onClick={handlePdfPrint}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                '&:hover': { background: 'linear-gradient(135deg, #0369A1, #075985)' },
              }}
            >
              พิมพ์
            </Button>
            <Tooltip title="ดาวน์โหลด PDF" arrow>
              <IconButton
                onClick={handlePdfDownload}
                sx={{
                  bgcolor: '#f1f5f9',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#e2e8f0' },
                }}
              >
                <FuseSvgIcon size={20} sx={{ color: '#475569' }}>lucide:download</FuseSvgIcon>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* PDF Preview Iframe */}
        <Box sx={{ flex: 1, bgcolor: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
          <iframe
            id="pdf-preview-iframe"
            src={pdfQuotationId ? `/api/quotations/${pdfQuotationId}/pdf` : 'about:blank'}
            style={{
              flex: 1,
              border: 'none',
              background: '#fff',
              margin: '16px auto',
              maxWidth: '800px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              borderRadius: '4px',
            }}
            title="PDF Preview"
          />
        </Box>
      </Dialog>

      {/* ── Share Dialog ── */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: 500, maxWidth: 600, p: 0 } }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#0284C7', pb: 1 }}>
          แชร์เอกสาร {shareQuotationNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#333', mb: 0.5 }}>
            ลิงก์เอกสาร:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={shareUrl}
              slotProps={{ input: { readOnly: true, sx: { fontSize: '13px', fontFamily: 'monospace', bgcolor: '#f8fafc', borderRadius: '8px' } } }}
            />
            <Button
              variant="outlined"
              onClick={handleCopyLink}
              startIcon={<FuseSvgIcon size={16}>{shareCopied ? 'lucide:check' : 'lucide:copy'}</FuseSvgIcon>}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap',
                minWidth: 120, borderColor: shareCopied ? '#059669' : '#0284C7',
                color: shareCopied ? '#059669' : '#0284C7',
                '&:hover': { borderColor: shareCopied ? '#047857' : '#0369A1', bgcolor: shareCopied ? '#f0fdf4' : '#f0f9ff' },
              }}
            >
              {shareCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </Button>
          </Box>
          <Box
            component="a"
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              fontSize: '13px', color: '#0284C7', textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <FuseSvgIcon size={14}>lucide:external-link</FuseSvgIcon>
            พรีวิวเอกสาร
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShareOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}
          >
            ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Photo Upload Link Dialog ── */}
      <Dialog
        open={photoLinkOpen}
        onClose={() => setPhotoLinkOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', minWidth: 500, maxWidth: 600, p: 0 } }}
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuseSvgIcon size={24} sx={{ color: '#F59E0B' }}>lucide:camera</FuseSvgIcon>
          แนบรูปภาพก่อนทำงาน
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: '14px', color: '#64748B', mb: 2 }}>
            คัดลอกลิงก์ด้านล่างส่งให้ช่าง เพื่อให้ถ่ายรูปก่อนเริ่มทำงาน
          </Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#333', mb: 0.5 }}>
            เลขที่: {photoLinkQuotationNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={photoUploadUrl}
              slotProps={{ input: { readOnly: true, sx: { fontSize: '13px', fontFamily: 'monospace', bgcolor: '#f8fafc', borderRadius: '8px' } } }}
            />
            <Button
              variant="outlined"
              onClick={handleCopyPhotoLink}
              startIcon={<FuseSvgIcon size={16}>{photoLinkCopied ? 'lucide:check' : 'lucide:copy'}</FuseSvgIcon>}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap',
                minWidth: 120, borderColor: photoLinkCopied ? '#059669' : '#F59E0B',
                color: photoLinkCopied ? '#059669' : '#F59E0B',
                '&:hover': { borderColor: photoLinkCopied ? '#047857' : '#D97706', bgcolor: photoLinkCopied ? '#f0fdf4' : '#fffbeb' },
              }}
            >
              {photoLinkCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </Button>
          </Box>
          <Box
            component="a"
            href={photoUploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              fontSize: '13px', color: '#F59E0B', textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <FuseSvgIcon size={14}>lucide:external-link</FuseSvgIcon>
            เปิดหน้าอัพโหลดรูปภาพ
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setPhotoLinkOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}
          >
            ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return (
    <Root header={header} content={content} />
  );
}

export default QuotationsPage;
