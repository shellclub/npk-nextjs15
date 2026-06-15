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

function fmt(n: number) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

type InvoiceOption = {
  id: string; invoiceNumber: string; subtotal: number; vatAmount: number; totalAmount: number; status: string;
  taxInvoice?: { id: string } | null;
  workOrder?: { woNumber: string; quotation?: { customerGroup?: { groupName: string }; projectName?: string } | null } | null;
};

function NewTaxInvoicePage() {
  const router = useRouter();
  const alert = useAlert();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<InvoiceOption | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const searchInvoices = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set('search', q);
      const res = await fetch(`/api/invoices?${p}`);
      const data = await res.json();
      setOptions((Array.isArray(data) ? data : []).filter((i: InvoiceOption) => i.status !== 'CANCELLED' && !i.taxInvoice));
    } catch { setOptions([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInvoices(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, searchInvoices]);

  const handleSave = async () => {
    if (!selected) { alert.showWarning('กรุณาเลือกใบแจ้งหนี้'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selected.id, date, notes: notes || null,
          subtotal: Number(selected.subtotal), vatAmount: Number(selected.vatAmount), totalAmount: Number(selected.totalAmount),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const ti = await res.json();
      alert.showSuccess('สร้างใบกำกับภาษีเรียบร้อย', ti.taxInvoiceNumber);
      router.push(`/apps/tax-invoices/${ti.id}`);
    } catch { alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบกำกับภาษีได้'); }
    finally { setSaving(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบกำกับภาษี &gt; สร้างใหม่</Typography>
      <div className="flex items-center gap-8">
        <IconButton onClick={() => router.push('/apps/tax-invoices')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
        <Typography sx={{ fontSize: '28px', fontWeight: 800 }}>สร้างใบกำกับภาษี</Typography>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Autocomplete options={options} loading={loading} value={selected} onChange={(_, v) => setSelected(v)} onInputChange={(_, v) => setSearch(v)}
          getOptionLabel={(o) => `${o.invoiceNumber} — ${o.workOrder?.quotation?.customerGroup?.groupName || ''} — ${fmt(o.totalAmount)} บาท`}
          renderInput={(params) => <TextField {...params} label="เลือกใบแจ้งหนี้ *" sx={fieldSx} />}
          noOptionsText="ไม่พบใบแจ้งหนี้ที่ยังไม่มีใบกำกับภาษี" />
        <DatePickerField label="วันที่ใบกำกับภาษี" value={date} onChange={setDate} />
        <TextField label="หมายเหตุ" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={fieldSx} />
        {selected && (
          <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub Total</span><strong>{fmt(selected.subtotal)}</strong></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT</span><strong>{fmt(selected.vatAmount)}</strong></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#16A34A', fontWeight: 800 }}><span>Grand Total</span><span>{fmt(selected.totalAmount)}</span></Box>
          </Paper>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => router.push('/apps/tax-invoices')} sx={{ borderRadius: '10px', textTransform: 'none' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !selected}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกใบกำกับภาษี'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewTaxInvoicePage;
