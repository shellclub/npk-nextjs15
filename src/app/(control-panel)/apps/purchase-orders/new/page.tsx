'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import {
  SubItem, MainItem,
  mockTeams, defaultPaymentTerms,
  addPO, fmt,
} from '../po-store';

const Root = styled(FusePageCarded)(() => ({
  '& .container': { maxWidth: '100%!important' },
}));

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

// Helper: display number in text field — show '' when 0 so user can type fresh
const numVal = (v: number) => (v === 0 ? '' : String(v));
const parseNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };
const selectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

type POFormData = {
  contractorName: string;
  contractorPhone: string;
  contractorAddress: string;
  date: string;
  dueDate: string;
  referenceNo: string;
  branchSite: string;
  workName: string;
  notes: string;
  discountPercent: number;
  vat3Percent: number;
  vat7Percent: number;
  items: MainItem[];
};

const emptyForm: POFormData = {
  contractorName: '', contractorPhone: '', contractorAddress: '',
  date: new Date().toISOString().split('T')[0], dueDate: '', referenceNo: '', branchSite: '',
  workName: '', notes: '',
  discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
  items: [{
    id: '1', title: '',
    subItems: [{ id: '1-1', description: '', qty: 1, unit: '', materialUnitPrice: 0, labourUnitPrice: 0 }],
  }],
};

function NewPurchaseOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState<POFormData>(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const calcTotals = () => {
    let subtotal = 0;
    form.items.forEach(main => {
      main.subItems.forEach(sub => {
        subtotal += sub.qty * (sub.materialUnitPrice + sub.labourUnitPrice);
      });
    });
    const discountAmount = subtotal * form.discountPercent / 100;
    const afterDiscount = subtotal - discountAmount;
    const vat3Amount = afterDiscount * form.vat3Percent / 100;
    const vat7Amount = afterDiscount * form.vat7Percent / 100;
    const grandTotal = afterDiscount + vat7Amount - vat3Amount;
    return { subtotal, discountAmount, vat3Amount, vat7Amount, grandTotal };
  };

  const totals = calcTotals();

  const handleSelectTeam = (team: typeof mockTeams[0] | null) => {
    if (!team) return;
    setForm(prev => ({ ...prev, contractorName: team.name, contractorPhone: team.phone, contractorAddress: team.address }));
  };

  const addMainItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        id: String(Date.now()), title: '',
        subItems: [{ id: `${Date.now()}-1`, description: '', qty: 1, unit: '', materialUnitPrice: 0, labourUnitPrice: 0 }],
      }],
    }));
  };

  const removeMainItem = (mi: number) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== mi) }));
  };

  const updateMainTitle = (mi: number, title: string) => {
    setForm(prev => {
      const items = [...prev.items];
      items[mi] = { ...items[mi], title };
      return { ...prev, items };
    });
  };

  const addSubItem = (mi: number) => {
    setForm(prev => {
      const items = [...prev.items];
      const main = { ...items[mi] };
      main.subItems = [...main.subItems, { id: String(Date.now()), description: '', qty: 1, unit: '', materialUnitPrice: 0, labourUnitPrice: 0 }];
      items[mi] = main;
      return { ...prev, items };
    });
  };

  const removeSubItem = (mi: number, si: number) => {
    setForm(prev => {
      const items = [...prev.items];
      const main = { ...items[mi] };
      if (main.subItems.length <= 1) return prev;
      main.subItems = main.subItems.filter((_, i) => i !== si);
      items[mi] = main;
      return { ...prev, items };
    });
  };

  const updateSubItem = (mi: number, si: number, field: keyof SubItem, value: string | number) => {
    setForm(prev => {
      const items = [...prev.items];
      const main = { ...items[mi] };
      const subs = [...main.subItems];
      subs[si] = { ...subs[si], [field]: value };
      main.subItems = subs;
      items[mi] = main;
      return { ...prev, items };
    });
  };

  const handleSave = () => {
    if (!form.contractorName.trim()) {
      setSnackbar({ open: true, message: 'กรุณาระบุชื่อผู้รับจ้าง', severity: 'error' }); return;
    }
    if (!form.workName.trim()) {
      setSnackbar({ open: true, message: 'กรุณาระบุชื่องาน', severity: 'error' }); return;
    }

    // Save to shared store
    const newPO = addPO({
      date: form.date,
      dueDate: form.dueDate,
      referenceNo: form.referenceNo,
      branchSite: form.branchSite,
      contractorName: form.contractorName,
      contractorAddress: form.contractorAddress,
      contractorPhone: form.contractorPhone,
      workName: form.workName,
      discountPercent: form.discountPercent,
      vat3Percent: form.vat3Percent,
      vat7Percent: form.vat7Percent,
      paymentTerms: defaultPaymentTerms,
      notes: form.notes,
      items: form.items,
    });

    setSnackbar({ open: true, message: `สร้าง ${newPO.poNumber} เรียบร้อย`, severity: 'success' });
    setTimeout(() => router.push(`/apps/purchase-orders/${newPO.id}`), 1500);
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        เอกสาร {'>'} ใบสั่งซื้อให้ช่าง {'>'} สร้างใหม่
      </Typography>
      <div className="flex flex-auto items-center gap-8">
        <IconButton onClick={() => router.back()}>
          <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
        </IconButton>
        <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
          <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            สร้างใบสั่งซื้อให้ช่าง
          </Typography>
        </motion.span>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

          {/* Contractor */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FuseSvgIcon sx={{ color: '#0EA5E9' }} size={18}>lucide:user</FuseSvgIcon>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลผู้รับจ้าง</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
              <Autocomplete
                options={mockTeams} getOptionLabel={(op) => typeof op === 'string' ? op : op.name}
                onChange={(_, val) => { if (val && typeof val !== 'string') handleSelectTeam(val); }}
                inputValue={form.contractorName}
                onInputChange={(_, val) => setForm(p => ({ ...p, contractorName: val }))}
                freeSolo
                renderInput={(params) => <TextField {...params} label="ชื่อผู้รับจ้าง *" placeholder="เลือกจากทีมช่าง หรือพิมพ์ใหม่" sx={fieldSx} />}
              />
              <TextField label="เบอร์โทร" value={form.contractorPhone} onChange={(e) => setForm(p => ({ ...p, contractorPhone: e.target.value }))} sx={fieldSx} />
            </Box>
            <TextField label="ที่อยู่" fullWidth value={form.contractorAddress} onChange={(e) => setForm(p => ({ ...p, contractorAddress: e.target.value }))} sx={fieldSx} />
          </Box>

          {/* PO Info */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FuseSvgIcon sx={{ color: '#F59E0B' }} size={18}>lucide:file-text</FuseSvgIcon>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลใบสั่งซื้อ</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField label="วันที่ *" type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={fieldSx} />
              <TextField label="เลขอ้างอิง (WO/PO/ใบเสนอราคา)" value={form.referenceNo} onChange={(e) => setForm(p => ({ ...p, referenceNo: e.target.value }))} placeholder="เช่น QT-2568-0001" sx={fieldSx} />
              <TextField label="สาขา/สถานที่ปฏิบัติงาน" value={form.branchSite} onChange={(e) => setForm(p => ({ ...p, branchSite: e.target.value }))} sx={fieldSx} />
            </Box>
            <TextField label="ชื่องาน *" fullWidth value={form.workName} onChange={(e) => setForm(p => ({ ...p, workName: e.target.value }))} placeholder="เช่น งานปรับปรุงบันได รพ ศุภมิตร" sx={fieldSx} />
          </Box>

          {/* Items */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FuseSvgIcon sx={{ color: '#8B5CF6' }} size={18}>lucide:list</FuseSvgIcon>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>รายการงาน</Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={addMainItem}
                startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
                เพิ่มหัวข้อหลัก
              </Button>
            </Box>

            {form.items.map((main, mi) => (
              <Paper key={main.id} sx={{ mb: 2, borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
                <Box sx={{ bgcolor: '#F8FAFC', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7', minWidth: 24 }}>{mi + 1}</Typography>
                  <TextField size="small" fullWidth value={main.title} placeholder="ชื่อหัวข้อ เช่น ชั้นที่ 1 (ฝั่งขวา)"
                    onChange={(e) => updateMainTitle(mi, e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }} />
                  <Tooltip title="ลบหัวข้อ" arrow>
                    <IconButton size="small" onClick={() => removeMainItem(mi)} disabled={form.items.length <= 1}
                      sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' }, '&.Mui-disabled': { color: '#E2E8F0' } }}>
                      <FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ p: 2 }}>
                  {main.subItems.map((sub, si) => (
                    <Box key={sub.id} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', mt: 1.5, width: 36, textAlign: 'center', flexShrink: 0 }}>
                        {mi + 1}.{si + 1}
                      </Typography>
                      <TextField size="small" label="รายละเอียด" multiline maxRows={2} value={sub.description}
                        onChange={(e) => updateSubItem(mi, si, 'description', e.target.value)} sx={{ flex: 3, ...fieldSx }} />
                      <TextField size="small" label="Qty" value={numVal(sub.qty)}
                        onChange={(e) => updateSubItem(mi, si, 'qty', parseNum(e.target.value))}
                        onFocus={selectAll}
                        sx={{ width: 70, ...fieldSx }} inputProps={{ inputMode: 'decimal' }} />
                      <TextField size="small" label="Unit" value={sub.unit}
                        onChange={(e) => updateSubItem(mi, si, 'unit', e.target.value)} sx={{ width: 70, ...fieldSx }} />
                      <TextField size="small" label="Material" value={numVal(sub.materialUnitPrice)}
                        onChange={(e) => updateSubItem(mi, si, 'materialUnitPrice', parseNum(e.target.value))}
                        onFocus={selectAll}
                        sx={{ width: 100, ...fieldSx }} inputProps={{ inputMode: 'decimal' }} />
                      <TextField size="small" label="Labour" value={numVal(sub.labourUnitPrice)}
                        onChange={(e) => updateSubItem(mi, si, 'labourUnitPrice', parseNum(e.target.value))}
                        onFocus={selectAll}
                        sx={{ width: 100, ...fieldSx }} inputProps={{ inputMode: 'decimal' }} />
                      <TextField size="small" label="Amount" value={fmt(sub.qty * (sub.materialUnitPrice + sub.labourUnitPrice))}
                        InputProps={{ readOnly: true }}
                        sx={{ width: 110, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }} />
                      <IconButton size="small" onClick={() => removeSubItem(mi, si)} disabled={main.subItems.length <= 1}
                        sx={{ mt: 0.5, color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' }, '&.Mui-disabled': { color: '#E2E8F0' } }}>
                        <FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" onClick={() => addSubItem(mi)}
                    startIcon={<FuseSvgIcon size={14}>lucide:plus</FuseSvgIcon>}
                    sx={{ textTransform: 'none', fontSize: '12px', color: '#64748B', mt: 0.5 }}>
                    เพิ่มรายการย่อย
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0', minWidth: 380 }} elevation={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '14px', color: '#64748B' }}>Sub Total</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '14px', color: '#64748B' }}>Discount</Typography>
                    <TextField size="small" value={numVal(form.discountPercent)}
                      onChange={(e) => setForm(p => ({ ...p, discountPercent: parseNum(e.target.value) }))}
                      onFocus={selectAll}
                      sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      inputProps={{ inputMode: 'decimal' }}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                  </Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                    {totals.discountAmount > 0 ? `-${fmt(totals.discountAmount)}` : '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '14px', color: '#DC2626' }}>หัก ณ ที่จ่าย</Typography>
                    <TextField size="small" value={numVal(form.vat3Percent)}
                      onChange={(e) => setForm(p => ({ ...p, vat3Percent: parseNum(e.target.value) }))}
                      onFocus={selectAll}
                      sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      inputProps={{ inputMode: 'decimal' }}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                  </Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>-{fmt(totals.vat3Amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '14px', color: '#64748B' }}>VAT</Typography>
                    <TextField size="small" value={numVal(form.vat7Percent)}
                      onChange={(e) => setForm(p => ({ ...p, vat7Percent: parseNum(e.target.value) }))}
                      onFocus={selectAll}
                      sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      inputProps={{ inputMode: 'decimal' }}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                  </Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.vat7Amount)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Grand Total</Typography>
                  <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.grandTotal)} บาท</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          <TextField label="หมายเหตุ" fullWidth multiline rows={2} value={form.notes}
            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} sx={{ mb: 3, ...fieldSx }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 3 }}>
            <Button variant="outlined" size="large" onClick={() => router.back()}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>ยกเลิก</Button>
            <Button variant="contained" size="large" onClick={handleSave}
              startIcon={<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon>}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
              สร้างใบสั่งซื้อ
            </Button>
          </Box>

        </motion.div>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewPurchaseOrderPage;
