'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

type Branch = {
  id: string;
  code: string;
  name: string;
};

type CustomerGroup = {
  id: string;
  groupName: string;
  contactName?: string | null;
  taxId?: string | null;
  branches: Branch[];
};

type QuotationItem = {
  tempId: number;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function NewQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [customerGroupId, setCustomerGroupId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validDays, setValidDays] = useState(30);
  const [vatPercent, setVatPercent] = useState(7);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('รับประกันงานติดตั้ง 1 ปี');

  // Items
  const [items, setItems] = useState<QuotationItem[]>([
    { tempId: 1, description: '', unit: 'งาน', quantity: 1, unitPrice: 0 },
  ]);
  let nextTempId = items.length + 1;

  // Load customers
  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  }, []);

  // Derived values
  const selectedCustomer = customers.find((c) => c.id === customerGroupId);
  const branches = selectedCustomer?.branches || [];

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPercent) / 100;
  const totalAmount = afterDiscount + vatAmount;

  // Item handlers
  const addItem = () => {
    setItems([
      ...items,
      { tempId: nextTempId++, description: '', unit: 'งาน', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (tempId: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (tempId: number, field: keyof QuotationItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  // Submit
  const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
    setError('');

    if (!customerGroupId) {
      setError('กรุณาเลือกลูกค้า');
      return;
    }
    if (items.some((item) => !item.description)) {
      setError('กรุณากรอกรายละเอียดรายการให้ครบ');
      return;
    }

    setSaving(true);
    try {
      // Use a default user ID for now (first user in system)
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerGroupId,
          branchId: branchId || null,
          contactPerson,
          projectName,
          date,
          validDays,
          vatPercent,
          discountPercent,
          notes,
          warranty,
          status,
          createdById: 'system', // Will be replaced with actual auth user
          items: items.map((item) => ({
            description: item.description,
            unit: item.unit,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      router.push('/apps/quotations');
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full p-24 md:p-32 max-w-1200 mx-auto">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-24"
      >
        <div className="flex items-center gap-12">
          <IconButton onClick={() => router.back()}>
            <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
          </IconButton>
          <div>
            <Typography className="text-28 font-bold">สร้างใบเสนอราคา</Typography>
            <Typography color="text.secondary" className="text-14">
              กรอกข้อมูลเพื่อสร้างใบเสนอราคาใหม่
            </Typography>
          </div>
        </div>
      </motion.div>

      {error && (
        <Alert severity="error" className="mb-24 rounded-xl" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Customer & Project Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <Paper className="rounded-2xl shadow-sm p-24 mb-24">
          <Typography className="text-18 font-bold mb-16 flex items-center gap-8">
            <FuseSvgIcon size={20}>lucide:building-2</FuseSvgIcon>
            ข้อมูลลูกค้า
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <FormControl fullWidth>
              <InputLabel>เลือกลูกค้า *</InputLabel>
              <Select
                value={customerGroupId}
                onChange={(e) => {
                  setCustomerGroupId(e.target.value);
                  setBranchId('');
                }}
                label="เลือกลูกค้า *"
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.groupName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>เลือกสาขา</InputLabel>
              <Select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                label="เลือกสาขา"
                disabled={!customerGroupId}
              >
                <MenuItem value="">- ไม่ระบุ -</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.code}: {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="ผู้ติดต่อ"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              fullWidth
            />

            <TextField
              label="ชื่อโครงการ / งาน"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
            />

            <TextField
              label="วันที่"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="เสนอราคามีผล (วัน)"
              type="number"
              value={validDays}
              onChange={(e) => setValidDays(Number(e.target.value))}
              fullWidth
            />
          </div>
        </Paper>
      </motion.div>

      {/* Items Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Paper className="rounded-2xl shadow-sm p-24 mb-24">
          <div className="flex items-center justify-between mb-16">
            <Typography className="text-18 font-bold flex items-center gap-8">
              <FuseSvgIcon size={20}>lucide:list</FuseSvgIcon>
              รายการสินค้า/บริการ
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
              onClick={addItem}
              className="rounded-lg"
            >
              เพิ่มรายการ
            </Button>
          </div>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-bold w-48 text-center">#</TableCell>
                  <TableCell className="font-bold">รายละเอียด</TableCell>
                  <TableCell className="font-bold w-100">หน่วย</TableCell>
                  <TableCell className="font-bold w-100" align="right">จำนวน</TableCell>
                  <TableCell className="font-bold w-140" align="right">ราคา/หน่วย</TableCell>
                  <TableCell className="font-bold w-140" align="right">จำนวนเงิน</TableCell>
                  <TableCell className="font-bold w-48" />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.tempId}>
                    <TableCell align="center" className="text-14">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.description}
                        onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                        placeholder="รายละเอียดสินค้า/บริการ"
                        fullWidth
                        size="small"
                        variant="standard"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.unit}
                        onChange={(e) => updateItem(item.tempId, 'unit', e.target.value)}
                        size="small"
                        variant="standard"
                        fullWidth
                      >
                        <MenuItem value="งาน">งาน</MenuItem>
                        <MenuItem value="ชุด">ชุด</MenuItem>
                        <MenuItem value="ตัว">ตัว</MenuItem>
                        <MenuItem value="เครื่อง">เครื่อง</MenuItem>
                        <MenuItem value="ชิ้น">ชิ้น</MenuItem>
                        <MenuItem value="เมตร">เมตร</MenuItem>
                        <MenuItem value="ตร.ม.">ตร.ม.</MenuItem>
                        <MenuItem value="จุด">จุด</MenuItem>
                        <MenuItem value="ล็อต">ล็อต</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.tempId, 'quantity', Number(e.target.value))}
                        size="small"
                        variant="standard"
                        inputProps={{ min: 1, style: { textAlign: 'right' } }}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.tempId, 'unitPrice', Number(e.target.value))}
                        size="small"
                        variant="standard"
                        inputProps={{ min: 0, step: 100, style: { textAlign: 'right' } }}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell align="right" className="font-semibold text-14 tabular-nums">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(item.tempId)}
                        disabled={items.length <= 1}
                        color="error"
                      >
                        <FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Divider className="my-16" />
          <div className="flex justify-end">
            <div className="w-full max-w-360 space-y-8">
              <div className="flex justify-between text-15">
                <span>ยอดรวมก่อน VAT</span>
                <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-15">
                <Box className="flex items-center gap-8">
                  <span>ส่วนลด</span>
                  <TextField
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    size="small"
                    variant="standard"
                    inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: '48px' } }}
                  />
                  <span>%</span>
                </Box>
                <span className="text-red-500 tabular-nums">-{formatCurrency(discountAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-15">
                <Box className="flex items-center gap-8">
                  <span>VAT</span>
                  <TextField
                    type="number"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(Number(e.target.value))}
                    size="small"
                    variant="standard"
                    inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: '48px' } }}
                  />
                  <span>%</span>
                </Box>
                <span className="tabular-nums">{formatCurrency(vatAmount)}</span>
              </div>

              <Divider />

              <div className="flex justify-between text-18 font-bold">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-blue-600 tabular-nums">{formatCurrency(totalAmount)} บาท</span>
              </div>
            </div>
          </div>
        </Paper>
      </motion.div>

      {/* Notes & Warranty */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Paper className="rounded-2xl shadow-sm p-24 mb-24">
          <Typography className="text-18 font-bold mb-16 flex items-center gap-8">
            <FuseSvgIcon size={20}>lucide:message-square</FuseSvgIcon>
            หมายเหตุ & เงื่อนไข
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <TextField
              label="หมายเหตุ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="เงื่อนไขรับประกัน"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </div>
        </Paper>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-end gap-12 mb-32"
      >
        <Button
          variant="outlined"
          size="large"
          onClick={() => router.back()}
          className="rounded-xl px-24"
        >
          ยกเลิก
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => handleSubmit('DRAFT')}
          disabled={saving}
          startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
          className="rounded-xl px-24"
        >
          บันทึกแบบร่าง
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => handleSubmit('SENT')}
          disabled={saving}
          startIcon={<FuseSvgIcon size={18}>lucide:send</FuseSvgIcon>}
          className="rounded-xl px-24"
        >
          บันทึก & ส่ง
        </Button>
      </motion.div>
    </div>
  );
}

export default NewQuotationPage;
