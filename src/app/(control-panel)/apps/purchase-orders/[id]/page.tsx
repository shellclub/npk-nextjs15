'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import {
  PurchaseOrder, SubItem, MainItem,
  mockTeams, defaultPaymentTerms,
  getPOById, updatePO,
  fmt, calcPOTotals, numberToThaiText,
} from '../po-store';

const Root = styled(FusePageCarded)(() => ({
  '& .container': { maxWidth: '100%!important' },
}));

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

// Helper: display number in text field — show '' when 0 so user can type fresh
const numVal = (v: number) => (v === 0 ? '' : String(v));
const parseNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };
const selectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

// ===== Print Document Component =====
function POPrintDocument({ po }: { po: PurchaseOrder }) {
  const totals = calcPOTotals(po);

  type Row = { type: 'work-name' } | { type: 'main'; index: number; title: string } | { type: 'sub'; mainIndex: number; subIndex: number; sub: SubItem };
  const allRows: Row[] = [];
  allRows.push({ type: 'work-name' });
  po.items.forEach((main, mi) => {
    allRows.push({ type: 'main', index: mi + 1, title: main.title });
    main.subItems.forEach((sub, si) => {
      allRows.push({ type: 'sub', mainIndex: mi + 1, subIndex: si + 1, sub });
    });
  });

  const ROWS_FIRST_PAGE = 18;
  const ROWS_PER_PAGE = 26;
  const pages: Row[][] = [];
  let cursor = 0;
  pages.push(allRows.slice(cursor, cursor + ROWS_FIRST_PAGE));
  cursor += ROWS_FIRST_PAGE;
  while (cursor < allRows.length) {
    pages.push(allRows.slice(cursor, cursor + ROWS_PER_PAGE));
    cursor += ROWS_PER_PAGE;
  }
  const totalPages = pages.length;
  const isLastPage = (pi: number) => pi === totalPages - 1;

  const thStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1px solid #ccc', padding: '5px', background: '#f0f4f8', textAlign: 'center', fontWeight: 700, fontSize: '10px', ...extra,
  });
  const tdStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1px solid #ddd', padding: '4px', ...extra,
  });

  return (
    <Box sx={{ bgcolor: '#e2e8f0', p: 3, minHeight: '100%', overflow: 'auto' }}>
      {pages.map((pageRows, pageIndex) => (
        <Box key={pageIndex} sx={{
          width: '210mm', minHeight: '297mm', mx: 'auto', mb: 3,
          bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          p: '15mm', position: 'relative', fontFamily: "'Sarabun', sans-serif",
          fontSize: '12px', color: '#333',
          '@media print': { boxShadow: 'none', mb: 0, pageBreakAfter: isLastPage(pageIndex) ? 'auto' : 'always' },
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
            <Box component="img" src="/assets/images/logo/npk-logo.png" sx={{ width: 80, height: 'auto' }} />
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700 }}>บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>NPK SERVICE & SUPPLY CO.,LTD.</Typography>
              <Typography sx={{ fontSize: '10px', color: '#555', lineHeight: 1.5 }}>
                สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000<br />
                Call : 09-8942-9891, 06-5961-9799, 09-3694-4591
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#0066cc', borderBottom: '2px solid #0066cc', pb: 0.5, mb: 1 }}>
            ใบสั่งซื้อให้ช่าง (Purchase Order)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 30px', mb: 1, fontSize: '11px' }}>
            <Box><b>ที่อยู่ :</b> {po.contractorAddress || '-'}</Box>
            <Box><b>ชื่อผู้รับจ้าง :</b> {po.contractorName}</Box>
            <Box><b>เลขอ้างอิง :</b> {po.referenceNo || '-'}</Box>
            <Box><b>เบอร์โทร :</b> {po.contractorPhone}</Box>
            <Box><b>สาขาที่ปฏิบัติงาน :</b> {po.branchSite || '-'}</Box>
            <Box />
          </Box>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thStyle({ width: 35 })}>Item</th>
                <th rowSpan={2} style={thStyle()}>Description</th>
                <th rowSpan={2} style={thStyle({ width: 40 })}>Qty</th>
                <th rowSpan={2} style={thStyle({ width: 40 })}>Unit</th>
                <th colSpan={2} style={thStyle()}>Price Unit/Baht</th>
                <th colSpan={2} style={thStyle()}>Total Price/Baht</th>
                <th rowSpan={2} style={thStyle({ width: 80 })}>Amount Baht</th>
              </tr>
              <tr>
                {['Material', 'Labour', 'Material', 'Labour'].map((label, i) => (
                  <th key={i} style={{ border: '1px solid #ccc', padding: '3px', background: '#f7f9fb', width: 65, textAlign: 'center', fontSize: '9px', fontWeight: 600 }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, ri) => {
                if (row.type === 'work-name') {
                  return (
                    <tr key={`wn-${ri}`}>
                      <td colSpan={8} style={tdStyle({ fontWeight: 700 })}>ชื่องาน : {po.workName}</td>
                      <td style={tdStyle({ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' })}>{fmt(totals.subtotal)}</td>
                    </tr>
                  );
                }
                if (row.type === 'main') {
                  return (
                    <tr key={`m-${ri}`}>
                      <td style={tdStyle({ textAlign: 'center', fontWeight: 600 })}>{row.index}</td>
                      <td colSpan={8} style={tdStyle({ fontWeight: 600 })}>{row.title}</td>
                    </tr>
                  );
                }
                if (row.type === 'sub') {
                  const mTotal = row.sub.qty * row.sub.materialUnitPrice;
                  const lTotal = row.sub.qty * row.sub.labourUnitPrice;
                  const amount = mTotal + lTotal;
                  const numTd = (v: number) => tdStyle({ textAlign: 'right', fontVariantNumeric: 'tabular-nums' });
                  return (
                    <tr key={`s-${ri}`}>
                      <td style={tdStyle({ textAlign: 'center' })} />
                      <td style={tdStyle({ paddingLeft: 16 })}>{row.mainIndex}.{row.subIndex} {row.sub.description}</td>
                      <td style={tdStyle({ textAlign: 'center' })}>{row.sub.qty || ''}</td>
                      <td style={tdStyle({ textAlign: 'center' })}>{row.sub.unit || ''}</td>
                      <td style={numTd(row.sub.materialUnitPrice)}>{row.sub.materialUnitPrice ? fmt(row.sub.materialUnitPrice) : '-'}</td>
                      <td style={numTd(row.sub.labourUnitPrice)}>{row.sub.labourUnitPrice ? fmt(row.sub.labourUnitPrice) : '-'}</td>
                      <td style={numTd(mTotal)}>{mTotal ? fmt(mTotal) : '-'}</td>
                      <td style={numTd(lTotal)}>{lTotal ? fmt(lTotal) : '-'}</td>
                      <td style={numTd(amount)}>{amount ? fmt(amount) : '-'}</td>
                    </tr>
                  );
                }
                return null;
              })}
              {Array.from({ length: Math.max(0, (pageIndex === 0 ? ROWS_FIRST_PAGE : ROWS_PER_PAGE) - pageRows.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  {Array.from({ length: 9 }).map((_, ci) => (
                    <td key={ci} style={tdStyle({ height: 22 })}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Last page: totals & signatures */}
          {isLastPage(pageIndex) && (
            <>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1, fontSize: '10px', lineHeight: 1.6 }}>
                  <b>เงื่อนไขการชำระเงิน :</b>
                  <ol style={{ paddingLeft: 18, margin: '4px 0' }}>
                    {po.paymentTerms.map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                  {po.notes && <Box><b>หมายเหตุ :</b> {po.notes}</Box>}
                </Box>
                <table style={{ borderCollapse: 'collapse', fontSize: '11px', minWidth: 260 }}>
                  <tbody>
                    {[
                      { label: 'Sub Total', value: fmt(totals.subtotal) },
                      ...(totals.discountAmount > 0 ? [{ label: 'Discount', value: `-${fmt(totals.discountAmount)}`, color: '#dc2626' }] : []),
                      { label: `Vat ${po.vat3Percent}%`, value: fmt(totals.vat3Amount) },
                      { label: `Vat ${po.vat7Percent}%`, value: fmt(totals.vat7Amount) },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#0066cc' }}>{r.label}</td>
                        <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, minWidth: 100, color: (r as any).color || 'inherit' }}>{r.value}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f0f4f8' }}>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#0066cc' }}>Grand Total</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(totals.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              <Box sx={{ textAlign: 'right', fontSize: '10px', mt: 0.5, color: '#555' }}>
                {numberToThaiText(totals.grandTotal)}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mt: 5, fontSize: '11px', textAlign: 'center' }}>
                <Box>
                  <Box sx={{ mb: 0.5 }}>ในนาม <b style={{ color: '#dc2626' }}>{po.contractorName}</b></Box>
                  <Box sx={{ mt: 5, borderTop: '1px solid #999', pt: 1, mx: 3 }}>
                    ผู้อนุมัติรับสั่งจ้าง<br />วันที่......../........./..........
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ fontSize: '10px' }}>ในนาม บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด</Box>
                  <Box component="img" src="/assets/images/logo/npk-logo.png" sx={{ width: 60, height: 'auto', mx: 'auto', display: 'block', my: 1 }} />
                  <Box sx={{ fontSize: '10px' }}>
                    ผู้อนุมัติ<br />มนต์เทียน เรืองเดชอังกูร<br />กรรมการผู้จัดการ<br />วันที่......../........./..........
                  </Box>
                </Box>
              </Box>
            </>
          )}

          <Box sx={{ position: 'absolute', bottom: '10mm', right: '15mm', fontSize: '10px', color: '#999' }}>
            หน้า {pageIndex + 1}/{totalPages}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ===== FORM Component =====
function POForm({ po, onSave, onCancel }: { po: PurchaseOrder; onSave: (data: PurchaseOrder) => void; onCancel: () => void }) {
  const [form, setForm] = useState<PurchaseOrder>(po);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const totals = calcPOTotals(form);

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
    if (!form.contractorName.trim()) { setSnackbar({ open: true, message: 'กรุณาระบุชื่อผู้รับจ้าง', severity: 'error' }); return; }
    if (!form.workName.trim()) { setSnackbar({ open: true, message: 'กรุณาระบุชื่องาน', severity: 'error' }); return; }
    onSave(form);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {/* Contractor */}
        <Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
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
        <Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FuseSvgIcon sx={{ color: '#F59E0B' }} size={18}>lucide:file-text</FuseSvgIcon>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลใบสั่งซื้อ</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField label="วันที่ *" type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={fieldSx} />
            <TextField label="เลขอ้างอิง" value={form.referenceNo} onChange={(e) => setForm(p => ({ ...p, referenceNo: e.target.value }))} sx={fieldSx} />
            <TextField label="สาขา/สถานที่ปฏิบัติงาน" value={form.branchSite} onChange={(e) => setForm(p => ({ ...p, branchSite: e.target.value }))} sx={fieldSx} />
          </Box>
          <TextField label="ชื่องาน *" fullWidth value={form.workName} onChange={(e) => setForm(p => ({ ...p, workName: e.target.value }))} sx={fieldSx} />
        </Box>

        {/* Items */}
        <Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
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
                  sx={{ textTransform: 'none', fontSize: '12px', color: '#64748B', mt: 0.5 }}>เพิ่มรายการย่อย</Button>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" size="large" onClick={onCancel}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>ยกเลิก</Button>
          <Button variant="contained" size="large" onClick={handleSave}
            startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
            บันทึก</Button>
        </Box>
      </motion.div>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ===== MAIN PAGE =====
function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poId = params?.id as string;

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const found = getPOById(poId);
    if (found) setPo(found);
  }, [poId]);

  const handleSave = (data: PurchaseOrder) => {
    updatePO(data.id, data);
    setPo(data);
    setMode('view');
  };

  if (!po) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Typography sx={{ fontSize: '18px', color: '#94A3B8' }}>ไม่พบข้อมูลใบสั่งซื้อ</Typography>
      </Box>
    );
  }

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
        เอกสาร {'>'} ใบสั่งซื้อให้ช่าง {'>'} {po.poNumber}
      </Typography>
      <div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-auto items-center gap-8">
          <IconButton onClick={() => router.push('/apps/purchase-orders')}>
            <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
          </IconButton>
          <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              {po.poNumber} - {po.workName}
            </Typography>
          </motion.span>
          <div className="flex flex-1 items-center justify-end gap-12">
            {mode === 'view' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }} className="flex gap-8">
                <Button variant="outlined" size="large" onClick={() => setMode('edit')}
                  startIcon={<FuseSvgIcon size={20}>lucide:pencil</FuseSvgIcon>}
                  sx={{ borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 600, textTransform: 'none', borderColor: '#E2E8F0', color: '#0284C7' }}>แก้ไข</Button>
                <Button variant="contained" size="large" onClick={() => setPrintOpen(true)}
                  startIcon={<FuseSvgIcon size={20}>lucide:printer</FuseSvgIcon>}
                  sx={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(2,132,199,0.3)' }}>พิมพ์</Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
      {mode === 'edit' ? (
        <POForm po={po} onSave={handleSave} onCancel={() => setMode('view')} />
      ) : (
        <POPrintDocument po={po} />
      )}

      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} fullWidth
        PaperProps={{ sx: { borderRadius: '16px', width: '95vw', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{po.poNumber}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPrintOpen(false)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}>ปิด</Button>
            <Button variant="contained" onClick={() => window.print()}
              startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}>พิมพ์</Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <POPrintDocument po={po} />
        </Box>
      </Dialog>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default PurchaseOrderDetailPage;
