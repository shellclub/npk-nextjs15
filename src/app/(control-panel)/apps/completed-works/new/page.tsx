'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import { useAlert } from '@/components/shared/AlertProvider';
import DatePickerField from '@/components/shared/DatePickerField';

const Root = styled(FusePageCarded)(() => ({
  '& .container': { maxWidth: '100%!important' },
  '& .FusePageCarded-wrapper': { margin: 0, borderRadius: 0, boxShadow: 'none' },
  padding: 0,
}));

type WO = {
  id: string; woNumber: string; date: string; description?: string | null;
  totalAmount: number; status: string;
  quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
  team?: { teamName: string } | null;
};

function NewCompletedWorkPage() {
  const router = useRouter();
  const alert = useAlert();
  const [saving, setSaving] = useState(false);
  const [woList, setWoList] = useState<WO[]>([]);
  const [loadingWO, setLoadingWO] = useState(true);
  const [selectedWO, setSelectedWO] = useState<WO | null>(null);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Work Receipts
  const [receipts, setReceipts] = useState<File[]>([]);
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([]);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Service Report Items
  const [serviceItems, setServiceItems] = useState<{ itemNo: number; description: string }[]>([]);

  // Load completed-eligible work orders (status IN_PROGRESS or COMPLETED without completedWork)
  const fetchWO = useCallback(async () => {
    setLoadingWO(true);
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      // Filter WOs that don't have a completed work yet
      const eligible = (Array.isArray(data) ? data : []).filter(
        (w: WO) => w.status === 'IN_PROGRESS' || w.status === 'COMPLETED' || w.status === 'PENDING'
      );
      setWoList(eligible);
    } catch { setWoList([]); }
    finally { setLoadingWO(false); }
  }, []);

  useEffect(() => { fetchWO(); }, [fetchWO]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...previews]);
  };

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReceipts(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setReceiptPreviews(prev => [...prev, ...previews]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeReceipt = (idx: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== idx));
    setReceiptPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const addServiceItem = () => {
    setServiceItems(prev => [...prev, { itemNo: prev.length + 1, description: '' }]);
  };

  const updateServiceItem = (idx: number, description: string) => {
    setServiceItems(prev => prev.map((item, i) => i === idx ? { ...item, description } : item));
  };

  const removeServiceItem = (idx: number) => {
    setServiceItems(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, itemNo: i + 1 })));
  };

  const handleSave = async () => {
    if (!selectedWO) {
      alert.showWarning('กรุณาเลือก Work Order');
      return;
    }
    setSaving(true);
    try {
      // 1. Create completed work
      const res = await fetch('/api/completed-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWO.id,
          completionDate,
          notes,
          serviceItems: serviceItems.filter(s => s.description.trim()),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert.showError('เกิดข้อผิดพลาด', err.error || 'ไม่สามารถสร้างได้');
        setSaving(false);
        return;
      }
      const cw = await res.json();

      // 2. Upload photos
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach(f => fd.append('files', f));
        fd.append('photoType', 'WORK');
        await fetch(`/api/completed-works/${cw.id}/upload`, { method: 'POST', body: fd });
      }

      // 3. Upload receipts
      if (receipts.length > 0) {
        const fd = new FormData();
        receipts.forEach(f => fd.append('files', f));
        fd.append('photoType', 'RECEIPT');
        await fetch(`/api/completed-works/${cw.id}/upload`, { method: 'POST', body: fd });
      }

      alert.showSuccess('สร้างเรียบร้อย', `บันทึกงานเสร็จ ${selectedWO.woNumber} แล้ว`);
      setTimeout(() => router.push('/apps/completed-works'), 1500);
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้ กรุณาลองใหม่');
    } finally { setSaving(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        จัดการงาน {'>'} งานเสร็จแล้วทั้งหมด {'>'} สร้างใหม่
      </Typography>
      <div className="flex flex-auto items-center gap-8">
        <IconButton onClick={() => router.back()}>
          <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
        </IconButton>
        <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            สร้าง งานเสร็จแล้วทั้งหมด ใหม่
          </Typography>
        </motion.span>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
      <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 900 }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

          {/* Select Work Order */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 1 }}>
              เลือก Work Order *
            </Typography>
            <Autocomplete
              options={woList}
              loading={loadingWO}
              getOptionLabel={(opt) => `${opt.woNumber} — ${opt.quotation?.customerGroup?.groupName || ''} — ${opt.quotation?.projectName || opt.description || ''}`}
              value={selectedWO}
              onChange={(_, val) => setSelectedWO(val)}
              renderInput={(params) => (
                <TextField {...params} placeholder="ค้นหา WO..." />
              )}
              slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
              fullWidth
              noOptionsText="ไม่พบ Work Order"
            />
          </Box>

          {/* Photos Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 1 }}>
              อัพโหลด รูปภาพ
            </Typography>
            <Box sx={{
              border: '2px dashed #CBD5E1', borderRadius: '12px', p: 2, minHeight: 150,
              cursor: 'pointer', '&:hover': { borderColor: '#059669', bgcolor: '#F0FDF4' },
              transition: 'all 0.2s',
            }}
              onClick={() => photoInputRef.current?.click()}>
              <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoSelect} />
              {photoPreviews.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <FuseSvgIcon size={40} sx={{ color: '#94A3B8', mb: 1 }}>lucide:image-plus</FuseSvgIcon>
                  <Typography sx={{ color: '#64748B' }}>คลิกเพื่ออัพโหลดรูปภาพ</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {photoPreviews.map((src, i) => (
                    <Box key={i} sx={{ position: 'relative', width: 100, height: 100 }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#EF4444', color: '#fff', width: 22, height: 22, '&:hover': { bgcolor: '#DC2626' } }}>
                        <FuseSvgIcon size={12}>lucide:x</FuseSvgIcon>
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Work Receipt Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', mb: 1 }}>
              อัพโหลด ใบรับงาน
            </Typography>
            <Box sx={{
              border: '2px dashed #CBD5E1', borderRadius: '12px', p: 2, minHeight: 120,
              cursor: 'pointer', '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF' },
              transition: 'all 0.2s',
            }}
              onClick={() => receiptInputRef.current?.click()}>
              <input ref={receiptInputRef} type="file" accept="image/*,.pdf" multiple hidden onChange={handleReceiptSelect} />
              {receiptPreviews.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5 }}>
                  <FuseSvgIcon size={40} sx={{ color: '#94A3B8', mb: 1 }}>lucide:file-up</FuseSvgIcon>
                  <Typography sx={{ color: '#64748B' }}>คลิกเพื่ออัพโหลดใบรับงาน</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {receiptPreviews.map((src, i) => (
                    <Box key={i} sx={{ position: 'relative', width: 100, height: 100, bgcolor: '#F1F5F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {receipts[i]?.type?.startsWith('image/') ? (
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <FuseSvgIcon size={32} sx={{ color: '#64748B' }}>lucide:file-text</FuseSvgIcon>
                      )}
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeReceipt(i); }}
                        sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#EF4444', color: '#fff', width: 22, height: 22, '&:hover': { bgcolor: '#DC2626' } }}>
                        <FuseSvgIcon size={12}>lucide:x</FuseSvgIcon>
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Service Report Items */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                รายการ Service Report
              </Typography>
              <Button size="small" variant="outlined" startIcon={<FuseSvgIcon size={14}>lucide:plus</FuseSvgIcon>}
                onClick={addServiceItem}
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
                เพิ่มรายการ
              </Button>
            </Box>
            {serviceItems.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#64748B', minWidth: 30 }}>{item.itemNo}.</Typography>
                <TextField
                  value={item.description}
                  onChange={(e) => updateServiceItem(idx, e.target.value)}
                  placeholder="รายการแจ้งแก้ไข/ปรับปรุง/ซ่อมแซม"
                  size="small" fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <IconButton size="small" onClick={() => removeServiceItem(idx)}
                  sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
                  <FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
                </IconButton>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Date & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <DatePickerField label="วันที่เสร็จงาน" value={completionDate} onChange={(v) => setCompletionDate(v)} />
            <TextField label="หมายเหตุ" value={notes} onChange={(e) => setNotes(e.target.value)}
              multiline rows={2} fullWidth />
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button variant="outlined" onClick={() => router.back()}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 4 }}>
              ยกเลิก
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 5,
                background: 'linear-gradient(135deg, #059669, #047857)',
                '&:hover': { background: 'linear-gradient(135deg, #047857, #065F46)' },
              }}>
              บันทึก
            </Button>
          </Box>

        </motion.div>
      </Box>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewCompletedWorkPage;
