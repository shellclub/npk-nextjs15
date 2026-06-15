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
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { useAlert } from '@/components/shared/AlertProvider';
import DatePickerField from '@/components/shared/DatePickerField';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

function fmt(n: number) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type WOOption = {
  id: string;
  woNumber: string;
  status?: string;
  quotation?: {
    quotationNumber: string;
    projectName?: string | null;
    subtotal: number;
    vatPercent: number;
    vatAmount: number;
    totalAmount: number;
    customerGroup?: { groupName: string } | null;
  } | null;
  invoices?: { id: string }[];
};

function NewInvoicePage() {
  const router = useRouter();
  const alert = useAlert();
  const [saving, setSaving] = useState(false);
  const [woSearch, setWoSearch] = useState('');
  const [woOptions, setWoOptions] = useState<WOOption[]>([]);
  const [woLoading, setWoLoading] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WOOption | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  const searchWO = useCallback(async (q: string) => {
    if (q.length < 1) { setWoOptions([]); return; }
    setWoLoading(true);
    try {
      const res = await fetch(`/api/work-orders?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).filter(
        (wo: WOOption) => wo.status !== 'CANCELLED' && (!wo.invoices || wo.invoices.length === 0)
      );
      setWoOptions(list);
    } catch { setWoOptions([]); } finally { setWoLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchWO(woSearch), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [woSearch, searchWO]);

  const q = selectedWO?.quotation;
  const subtotal = Number(q?.subtotal || 0);
  const vatPercent = Number(q?.vatPercent ?? 7);
  const vatAmount = Number(q?.vatAmount || 0);
  const totalAmount = Number(q?.totalAmount || 0);

  const handleSave = async () => {
    if (!selectedWO) {
      alert.showWarning('กรุณาเลือก Work Order อ้างอิง');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWO.id,
          date,
          dueDate,
          subtotal,
          vatPercent,
          vatAmount,
          totalAmount,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const inv = await res.json();
      alert.showSuccess('สร้างใบแจ้งหนี้เรียบร้อย', inv.invoiceNumber);
      router.push(`/apps/invoices/${inv.id}`);
    } catch {
      alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบแจ้งหนี้ได้');
    } finally { setSaving(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบแจ้งหนี้ &gt; สร้างใหม่</Typography>
      <div className="flex items-center gap-8">
        <IconButton onClick={() => router.push('/apps/invoices')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>สร้างใบแจ้งหนี้</Typography>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none p-6" elevation={0}>
      <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Autocomplete
          options={woOptions}
          loading={woLoading}
          getOptionLabel={(o) => `${o.woNumber} — ${o.quotation?.customerGroup?.groupName || ''} — ${o.quotation?.projectName || ''}`}
          value={selectedWO}
          onChange={(_, v) => setSelectedWO(v)}
          onInputChange={(_, v) => setWoSearch(v)}
          renderInput={(params) => (
            <TextField {...params} label="เลือก Work Order (WO) อ้างอิง *" placeholder="ค้นหา WO, ลูกค้า..."
              sx={fieldSx} InputProps={{ ...params.InputProps, endAdornment: (<>{woLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }} />
          )}
          noOptionsText={woSearch.length < 1 ? 'พิมพ์เพื่อค้นหา WO' : 'ไม่พบ WO ที่ยังไม่มีใบแจ้งหนี้'}
        />

        {selectedWO && (
          <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} elevation={0}>
            <Typography sx={{ fontSize: '13px', color: '#64748B', mb: 1 }}>ข้อมูลอ้างอิง</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '13px' }}>
              <div><strong>WO:</strong> {selectedWO.woNumber}</div>
              <div><strong>ใบเสนอราคา:</strong> {q?.quotationNumber || '-'}</div>
              <div><strong>ลูกค้า:</strong> {q?.customerGroup?.groupName || '-'}</div>
              <div><strong>โครงการ:</strong> {q?.projectName || '-'}</div>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <DatePickerField label="วันที่ใบแจ้งหนี้" value={date} onChange={setDate} />
          <DatePickerField label="ครบกำหนดชำระ" value={dueDate} onChange={setDueDate} />
        </Box>

        <TextField label="หมายเหตุ" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={fieldSx} />

        {selectedWO && (
          <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><span>Sub Total</span><strong>{fmt(subtotal)}</strong></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><span>VAT {vatPercent}%</span><strong>{fmt(vatAmount)}</strong></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#0284C7' }}><span>Grand Total</span><strong>{fmt(totalAmount)}</strong></Box>
            <Typography sx={{ fontSize: '12px', color: '#64748B', mt: 1 }}>* ยอดดึงจากใบเสนอราคาอ้างอิง</Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <Button onClick={() => router.push('/apps/invoices')} sx={{ borderRadius: '10px', textTransform: 'none' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !selectedWO}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)' }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกใบแจ้งหนี้'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewInvoicePage;
