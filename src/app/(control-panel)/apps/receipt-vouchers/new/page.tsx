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
import MenuItem from '@mui/material/MenuItem';
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
  id: string; invoiceNumber: string; totalAmount: number; status: string;
  receiptVoucher?: { id: string } | null;
  workOrder?: { woNumber: string; quotation?: { customerGroup?: { groupName: string } } | null } | null;
};

const PAYMENT_METHODS = [
  { value: 'TRANSFER', label: 'โอนเงิน' },
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CHEQUE', label: 'เช็ค' },
];

function NewReceiptVoucherPage() {
  const router = useRouter();
  const alert = useAlert();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<InvoiceOption | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [notes, setNotes] = useState('');

  const searchInvoices = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set('search', q);
      const res = await fetch(`/api/invoices?${p}`);
      const data = await res.json();
      setOptions((Array.isArray(data) ? data : []).filter((i: InvoiceOption) => i.status !== 'CANCELLED' && !i.receiptVoucher));
    } catch { setOptions([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInvoices(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, searchInvoices]);

  useEffect(() => {
    if (selected) setAmount(String(Number(selected.totalAmount)));
  }, [selected]);

  const handleSave = async () => {
    if (!selected) { alert.showWarning('กรุณาเลือกใบแจ้งหนี้'); return; }
    if (!amount || Number(amount) <= 0) { alert.showWarning('กรุณาระบุจำนวนเงิน'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/receipt-vouchers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selected.id, date, amount: Number(amount), paymentMethod,
          bankName: bankName || null, chequeNumber: chequeNumber || null, notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const rv = await res.json();
      alert.showSuccess('สร้างใบสำคัญรับเรียบร้อย', rv.voucherNumber);
      router.push(`/apps/receipt-vouchers/${rv.id}`);
    } catch { alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบสำคัญรับได้'); }
    finally { setSaving(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบสำคัญรับ &gt; สร้างใหม่</Typography>
      <div className="flex items-center gap-8">
        <IconButton onClick={() => router.push('/apps/receipt-vouchers')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
        <Typography sx={{ fontSize: '28px', fontWeight: 800 }}>สร้างใบสำคัญรับ</Typography>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Autocomplete options={options} loading={loading} value={selected} onChange={(_, v) => setSelected(v)} onInputChange={(_, v) => setSearch(v)}
          getOptionLabel={(o) => `${o.invoiceNumber} — ${o.workOrder?.quotation?.customerGroup?.groupName || ''}`}
          renderInput={(params) => <TextField {...params} label="เลือกใบแจ้งหนี้ *" sx={fieldSx} />} />
        <DatePickerField label="วันที่รับเงิน" value={date} onChange={setDate} />
        <TextField label="จำนวนเงิน (บาท) *" value={amount} onChange={(e) => setAmount(e.target.value)} sx={fieldSx} inputProps={{ inputMode: 'decimal' }} />
        <TextField select label="วิธีชำระเงิน" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={fieldSx}>
          {PAYMENT_METHODS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        {(paymentMethod === 'TRANSFER' || paymentMethod === 'CHEQUE') && (
          <TextField label="ธนาคาร" value={bankName} onChange={(e) => setBankName(e.target.value)} sx={fieldSx} />
        )}
        {paymentMethod === 'CHEQUE' && (
          <TextField label="เลขที่เช็ค" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} sx={fieldSx} />
        )}
        <TextField label="หมายเหตุ" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={fieldSx} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <Button onClick={() => router.push('/apps/receipt-vouchers')} sx={{ borderRadius: '10px', textTransform: 'none' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !selected}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกใบสำคัญรับ'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewReceiptVoucherPage;
