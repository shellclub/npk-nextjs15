'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { useAlert } from '@/components/shared/AlertProvider';
import DatePickerField from '@/components/shared/DatePickerField';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const PAYMENT_METHODS = [
  { value: 'TRANSFER', label: 'โอนเงิน' },
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CHEQUE', label: 'เช็ค' },
];

const INCOME_TYPES = ['ค่าจ้าง', 'ค่าบริการ', 'ค่าเช่า', 'ค่าขนส่ง', 'ค่าโฆษณา', 'อื่นๆ'];
const TAX_RATES = [1, 2, 3, 5, 10, 15];

function NewPaymentVoucherPage() {
  const router = useRouter();
  const alert = useAlert();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [enableWht, setEnableWht] = useState(false);
  const [payeeTaxId, setPayeeTaxId] = useState('');
  const [payeeAddress, setPayeeAddress] = useState('');
  const [incomeType, setIncomeType] = useState('ค่าจ้าง');
  const [taxRate, setTaxRate] = useState(3);

  const taxAmount = useMemo(() => {
    const amt = Number(amount) || 0;
    return Math.round(amt * taxRate / 100 * 100) / 100;
  }, [amount, taxRate]);

  const handleSave = async () => {
    if (!payeeName.trim()) { alert.showWarning('กรุณาระบุชื่อผู้รับเงิน'); return; }
    if (!amount || Number(amount) <= 0) { alert.showWarning('กรุณาระบุจำนวนเงิน'); return; }
    if (enableWht && !payeeTaxId.trim()) { alert.showWarning('กรุณาระบุเลขผู้เสียภาษีผู้ถูกหัก'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        date, payeeName, amount: Number(amount), paymentMethod,
        bankName: bankName || null, chequeNumber: chequeNumber || null,
        description: description || null, notes: notes || null,
      };
      if (enableWht) {
        body.withholding = {
          payeeName, payeeTaxId, payeeAddress: payeeAddress || null,
          incomeType, taxRate, incomeAmount: Number(amount), taxAmount,
        };
      }
      const res = await fetch('/api/payment-vouchers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      const pv = await res.json();
      alert.showSuccess('สร้างใบสำคัญจ่ายเรียบร้อย', pv.voucherNumber);
      router.push(`/apps/payment-vouchers/${pv.id}`);
    } catch { alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบสำคัญจ่ายได้'); }
    finally { setSaving(false); }
  };

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>การเงิน &gt; ใบสำคัญจ่าย &gt; สร้างใหม่</Typography>
      <div className="flex items-center gap-8">
        <IconButton onClick={() => router.push('/apps/payment-vouchers')}><FuseSvgIcon>lucide:arrow-left</FuseSvgIcon></IconButton>
        <Typography sx={{ fontSize: '28px', fontWeight: 800 }}>สร้างใบสำคัญจ่าย</Typography>
      </div>
    </div>
  );

  const content = (
    <Paper className="p-6" elevation={0}>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <DatePickerField label="วันที่จ่ายเงิน" value={date} onChange={setDate} />
        <TextField label="ชื่อผู้รับเงิน *" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} sx={fieldSx} />
        <TextField label="จำนวนเงิน (บาท) *" value={amount} onChange={(e) => setAmount(e.target.value)} sx={fieldSx} inputProps={{ inputMode: 'decimal' }} />
        <TextField select label="วิธีจ่ายเงิน" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={fieldSx}>
          {PAYMENT_METHODS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        {(paymentMethod === 'TRANSFER' || paymentMethod === 'CHEQUE') && (
          <TextField label="ธนาคาร" value={bankName} onChange={(e) => setBankName(e.target.value)} sx={fieldSx} />
        )}
        {paymentMethod === 'CHEQUE' && (
          <TextField label="เลขที่เช็ค" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} sx={fieldSx} />
        )}
        <TextField label="รายละเอียดการจ่าย" value={description} onChange={(e) => setDescription(e.target.value)} sx={fieldSx} />
        <TextField label="หมายเหตุ" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={fieldSx} />

        <Divider />
        <FormControlLabel
          control={<Checkbox checked={enableWht} onChange={(e) => setEnableWht(e.target.checked)} sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }} />}
          label={<Typography sx={{ fontWeight: 600, color: '#7C3AED' }}>หักภาษี ณ ที่จ่าย (ออก 50 ทวิ)</Typography>}
        />
        {enableWht && (
          <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E9D5FF', bgcolor: '#FAF5FF' }} elevation={0}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', mb: 2 }}>ข้อมูลหัก ณ ที่จ่าย</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="เลขผู้เสียภาษีผู้ถูกหัก *" value={payeeTaxId} onChange={(e) => setPayeeTaxId(e.target.value)} sx={fieldSx} />
              <TextField label="ที่อยู่ผู้ถูกหัก" value={payeeAddress} onChange={(e) => setPayeeAddress(e.target.value)} sx={fieldSx} multiline rows={2} />
              <TextField select label="ประเภทเงินได้" value={incomeType} onChange={(e) => setIncomeType(e.target.value)} sx={fieldSx}>
                {INCOME_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="อัตราภาษี (%)" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} sx={{ ...fieldSx, flex: 1 }}>
                  {TAX_RATES.map(r => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                </TextField>
                <TextField label="ภาษีที่หัก (บาท)" value={taxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} sx={{ ...fieldSx, flex: 1 }} InputProps={{ readOnly: true }} />
              </Box>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <Button onClick={() => router.push('/apps/payment-vouchers')} sx={{ borderRadius: '10px', textTransform: 'none' }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            {saving ? 'กำลังบันทึก...' : enableWht ? 'บันทึก + ออก 50 ทวิ' : 'บันทึกใบสำคัญจ่าย'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return <Root header={header} content={content} scroll="content" />;
}

export default NewPaymentVoucherPage;
