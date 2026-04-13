'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import { useAlert } from '@/components/shared/AlertProvider';

const Root = styled(FusePageCarded)(() => ({
  '& .container': { maxWidth: '100%!important' },
  '& .FusePageCarded-wrapper': { margin: 0, borderRadius: 0, boxShadow: 'none' },
  padding: 0,
}));

type Photo = { id: string; fileName: string; fileUrl: string; photoType: string; createdAt: string };
type ServiceItem = { id: string; itemNo: number; description: string };
type CW = {
  id: string; completionDate: string; status: string; notes?: string | null;
  hasPhotos: boolean; hasWorkReceipt: boolean;
  workOrder: {
    id: string; woNumber: string; date: string; description?: string | null;
    totalAmount: number; poNumber?: string | null;
    quotation?: {
      quotationNumber: string; projectName?: string | null;
      customerGroup: { groupName: string };
    } | null;
    team?: { teamName: string } | null;
  };
  photos: Photo[];
  serviceItems: ServiceItem[];
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  COMPLETED: { label: 'เสร็จสิ้น', bgColor: '#FEF3C7', textColor: '#D97706' },
  PENDING_PAYMENT: { label: 'รอจ่ายค่าแรง', bgColor: '#DBEAFE', textColor: '#2563EB' },
  PAID: { label: 'จ่ายแล้ว', bgColor: '#D1FAE5', textColor: '#059669' },
};

function CompletedWorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const alert = useAlert();
  const [data, setData] = useState<CW | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/completed-works/${id}`);
      if (!res.ok) throw new Error('Not found');
      const d = await res.json();
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (files: FileList | null, photoType: string) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('files', f));
      fd.append('photoType', photoType);
      const res = await fetch(`/api/completed-works/${id}/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      alert.showSuccess('อัพโหลดสำเร็จ', `เพิ่ม ${files.length} ไฟล์แล้ว`);
      fetchData();
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัพโหลดได้');
    } finally {
      setUploading(false);
      // Reset input value so same file can be re-selected
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/completed-works/${id}/photos/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      alert.showSuccess('ลบสำเร็จ', `ลบรูป ${deleteTarget.fileName} แล้ว`);
      setDeleteTarget(null);
      fetchData();
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
    } finally { setDeleting(false); }
  };

  const openLightbox = (photos: Photo[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return <div className="w-full flex items-center justify-center py-80"><CircularProgress /></div>;
  }
  if (!data) {
    return <div className="w-full flex items-center justify-center py-80"><Typography>ไม่พบข้อมูล</Typography></div>;
  }

  const wo = data.workOrder;
  const sc = statusConfig[data.status] || statusConfig['COMPLETED'];
  const workPhotos = data.photos.filter(p => p.photoType === 'WORK');
  const receiptPhotos = data.photos.filter(p => p.photoType === 'RECEIPT');

  // Photo card component with hover actions
  const PhotoCard = ({ photo, allPhotos, index }: { photo: Photo; allPhotos: Photo[]; index: number }) => (
    <Box sx={{
      position: 'relative', width: 160, height: 160, borderRadius: '10px', overflow: 'hidden',
      border: '2px solid #E2E8F0', cursor: 'pointer',
      '&:hover .photo-overlay': { opacity: 1 },
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'scale(1.03)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
    }}>
      <img src={photo.fileUrl} alt={photo.fileName}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onClick={() => openLightbox(allPhotos, index)} />
      {/* Hover overlay */}
      <Box className="photo-overlay" sx={{
        position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
        opacity: 0, transition: 'opacity 0.2s',
      }}>
        <IconButton size="small" onClick={() => openLightbox(allPhotos, index)}
          sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
          <FuseSvgIcon size={18} sx={{ color: '#3B82F6' }}>lucide:zoom-in</FuseSvgIcon>
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(photo); }}
          sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
          <FuseSvgIcon size={18} sx={{ color: '#EF4444' }}>lucide:trash-2</FuseSvgIcon>
        </IconButton>
      </Box>
      {/* File name */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, px: 1, py: 0.5,
        bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {photo.fileName}
      </Box>
    </Box>
  );

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        จัดการงาน {'>'} งานเสร็จแล้วทั้งหมด {'>'} {wo.woNumber}
      </Typography>
      <div className="flex flex-auto items-center gap-8">
        <IconButton onClick={() => router.back()}>
          <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
        </IconButton>
        <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>
            {wo.woNumber}
          </Typography>
        </motion.span>
        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bgColor, color: sc.textColor, fontWeight: 600, ml: 1 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small"
          startIcon={<FuseSvgIcon size={16}>lucide:image</FuseSvgIcon>}
          onClick={() => window.open(`/completed-works/${id}/print`, '_blank')}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
          พิมพ์รูปภาพ
        </Button>
        <Button variant="outlined" size="small"
          startIcon={<FuseSvgIcon size={16}>lucide:file-text</FuseSvgIcon>}
          onClick={() => window.open(`/completed-works/${id}/service-report`, '_blank')}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, ml: 1 }}>
          Service Report
        </Button>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
      <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1100 }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

          {/* WO Info Card */}
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', p: 2.5, mb: 3, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>ลูกค้า</Typography>
                <Typography sx={{ fontWeight: 600 }}>{wo.quotation?.customerGroup?.groupName || '-'}</Typography></Box>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>โครงการ</Typography>
                <Typography sx={{ fontWeight: 600, color: '#059669' }}>{wo.quotation?.projectName || wo.description || '-'}</Typography></Box>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>ยอดรวม</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '18px' }}>{Number(wo.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</Typography></Box>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>อ้างอิง QT</Typography>
                <Typography sx={{ fontWeight: 500 }}>{wo.quotation?.quotationNumber || '-'}</Typography></Box>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>ทีมช่าง</Typography>
                <Typography sx={{ fontWeight: 500 }}>{wo.team?.teamName || '-'}</Typography></Box>
              <Box><Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>วันที่เสร็จงาน</Typography>
                <Typography sx={{ fontWeight: 500 }}>{new Date(data.completionDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography></Box>
            </Box>
          </Box>

          {/* ═══ Work Photos Section ═══ */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FuseSvgIcon size={18} sx={{ color: '#fff' }}>lucide:camera</FuseSvgIcon>
                </Box>
                รูปภาพงาน ({workPhotos.length})
              </Typography>
              <Button size="small" variant="contained" onClick={() => photoInputRef.current?.click()}
                startIcon={<FuseSvgIcon size={14}>lucide:plus</FuseSvgIcon>}
                disabled={uploading}
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  '&:hover': { background: 'linear-gradient(135deg, #047857, #065F46)' },
                }}>
                เพิ่มรูปภาพ
              </Button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => handleUpload(e.target.files, 'WORK')} />
            </Box>

            {workPhotos.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {workPhotos.map((p, idx) => (
                  <PhotoCard key={p.id} photo={p} allPhotos={workPhotos} index={idx} />
                ))}
                {/* Add more button */}
                <Box
                  onClick={() => photoInputRef.current?.click()}
                  sx={{
                    width: 160, height: 160, borderRadius: '10px',
                    border: '2px dashed #CBD5E1', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    '&:hover': { borderColor: '#059669', bgcolor: '#F0FDF4' },
                    transition: 'all 0.2s',
                  }}>
                  <FuseSvgIcon size={28} sx={{ color: '#94A3B8', mb: 0.5 }}>lucide:image-plus</FuseSvgIcon>
                  <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>เพิ่มรูปภาพ</Typography>
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => photoInputRef.current?.click()}
                sx={{
                  border: '2px dashed #CBD5E1', borderRadius: '12px', p: 4, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  '&:hover': { borderColor: '#059669', bgcolor: '#F0FDF4' },
                  transition: 'all 0.2s',
                }}>
                <FuseSvgIcon size={40} sx={{ color: '#94A3B8', mb: 1 }}>lucide:image-plus</FuseSvgIcon>
                <Typography sx={{ color: '#64748B' }}>คลิกเพื่ออัพโหลดรูปภาพ</Typography>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.5 }}>รองรับ JPG, PNG, WebP</Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* ═══ Receipt Photos Section ═══ */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FuseSvgIcon size={18} sx={{ color: '#fff' }}>lucide:file-check</FuseSvgIcon>
                </Box>
                ใบรับงาน ({receiptPhotos.length})
              </Typography>
              <Button size="small" variant="contained" onClick={() => receiptInputRef.current?.click()}
                startIcon={<FuseSvgIcon size={14}>lucide:plus</FuseSvgIcon>}
                disabled={uploading}
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  '&:hover': { background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
                }}>
                เพิ่มใบรับงาน
              </Button>
              <input ref={receiptInputRef} type="file" accept="image/*,.pdf" multiple hidden
                onChange={(e) => handleUpload(e.target.files, 'RECEIPT')} />
            </Box>

            {receiptPhotos.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {receiptPhotos.map((p, idx) => (
                  <PhotoCard key={p.id} photo={p} allPhotos={receiptPhotos} index={idx} />
                ))}
                <Box
                  onClick={() => receiptInputRef.current?.click()}
                  sx={{
                    width: 160, height: 160, borderRadius: '10px',
                    border: '2px dashed #CBD5E1', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF' },
                    transition: 'all 0.2s',
                  }}>
                  <FuseSvgIcon size={28} sx={{ color: '#94A3B8', mb: 0.5 }}>lucide:file-up</FuseSvgIcon>
                  <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>เพิ่มใบรับงาน</Typography>
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => receiptInputRef.current?.click()}
                sx={{
                  border: '2px dashed #CBD5E1', borderRadius: '12px', p: 4, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF' },
                  transition: 'all 0.2s',
                }}>
                <FuseSvgIcon size={40} sx={{ color: '#94A3B8', mb: 1 }}>lucide:file-up</FuseSvgIcon>
                <Typography sx={{ color: '#64748B' }}>คลิกเพื่ออัพโหลดใบรับงาน</Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* ═══ Service Report Items ═══ */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FuseSvgIcon size={18} sx={{ color: '#fff' }}>lucide:clipboard-list</FuseSvgIcon>
              </Box>
              Service Report ({data.serviceItems.length} รายการ)
            </Typography>
            {data.serviceItems.length > 0 ? (
              <Box sx={{ bgcolor: '#FAFBFC', borderRadius: '10px', border: '1px solid #E2E8F0', p: 2 }}>
                {data.serviceItems.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 1.5, py: 0.8, borderBottom: '1px solid #F1F5F9', '&:last-child': { borderBottom: 'none' } }}>
                    <Typography sx={{ fontWeight: 700, color: '#64748B', minWidth: 30 }}>{item.itemNo}.</Typography>
                    <Typography sx={{ fontSize: '14px' }}>{item.description}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: '#94A3B8' }}>ยังไม่มีรายการ Service Report</Typography>
            )}
          </Box>

          {/* Notes */}
          {data.notes && (
            <Box sx={{ bgcolor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FCD34D', p: 2, mb: 2 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#92400E', mb: 0.5 }}>หมายเหตุ</Typography>
              <Typography sx={{ fontSize: '14px', color: '#78350F' }}>{data.notes}</Typography>
            </Box>
          )}

        </motion.div>
      </Box>

      {/* ═══ Lightbox Dialog ═══ */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={false}
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', maxWidth: '90vw', maxHeight: '90vh' } }}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.85)' } } }}>
        {lightboxPhotos.length > 0 && (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={lightboxPhotos[lightboxIndex]?.fileUrl} alt=""
              style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />

            {/* Close button */}
            <IconButton onClick={() => setLightboxOpen(false)}
              sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
              <FuseSvgIcon size={20}>lucide:x</FuseSvgIcon>
            </IconButton>

            {/* Navigation */}
            {lightboxPhotos.length > 1 && (
              <>
                <IconButton
                  onClick={() => setLightboxIndex(prev => (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
                  sx={{ position: 'absolute', left: -50, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#fff' } }}>
                  <FuseSvgIcon size={24}>lucide:chevron-left</FuseSvgIcon>
                </IconButton>
                <IconButton
                  onClick={() => setLightboxIndex(prev => (prev + 1) % lightboxPhotos.length)}
                  sx={{ position: 'absolute', right: -50, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#fff' } }}>
                  <FuseSvgIcon size={24}>lucide:chevron-right</FuseSvgIcon>
                </IconButton>
              </>
            )}

            {/* Counter */}
            <Box sx={{
              position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 2, py: 0.5, borderRadius: '12px', fontSize: '13px',
            }}>
              {lightboxIndex + 1} / {lightboxPhotos.length}
            </Box>
          </Box>
        )}
      </Dialog>

      {/* ═══ Delete Confirm Dialog ═══ */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>
          ยืนยันลบรูปภาพ
        </DialogTitle>
        <DialogContent>
          {deleteTarget && (
            <Box sx={{ textAlign: 'center' }}>
              <img src={deleteTarget.fileUrl} alt="" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, objectFit: 'cover' }} />
              <Typography sx={{ mt: 1, fontSize: '14px', color: '#64748B' }}>
                {deleteTarget.fileName}
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '13px', color: '#EF4444' }}>
                การลบจะไม่สามารถเรียกคืนได้
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)}
            sx={{ borderRadius: '8px', textTransform: 'none' }}>
            ยกเลิก
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default CompletedWorkDetailPage;
