'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
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
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': { maxWidth: '100%!important' },
  '& .FusePageCarded-wrapper': {
    margin: 0,
    borderRadius: 0,
    boxShadow: 'none',
  },
  padding: 0,
}));

type Branch = { id: string; code: string; name: string };
type CustomerGroup = { id: string; groupName: string; contactName?: string | null; taxId?: string | null; branches: Branch[] };
type QuotationItem = { tempId: number; description: string; unit: string; quantity: number; unitPrice: number };
type ItemSuggestion = { description: string; unit: string; unitPrice: number };

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'แบบร่าง', bgColor: '#F3F4F6', textColor: '#6B7280' },
  SENT: { label: 'รออนุมัติ', bgColor: '#FEF3C7', textColor: '#D97706' },
  APPROVED: { label: 'อนุมัติ', bgColor: '#D1FAE5', textColor: '#059669' },
  REJECTED: { label: 'ปฏิเสธ', bgColor: '#FEE2E2', textColor: '#DC2626' },
  CANCELLED: { label: 'ยกเลิก', bgColor: '#E5E7EB', textColor: '#9CA3AF' },
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SectionIcon = ({ gradient, icon }: { gradient: string; icon: string }) => (
  <Box sx={{
    width: 32, height: 32, borderRadius: '8px',
    background: gradient,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <FuseSvgIcon size={18} sx={{ color: '#fff' }}>{icon}</FuseSvgIcon>
  </Box>
);

function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  const [customerGroupId, setCustomerGroupId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [vatPercent, setVatPercent] = useState(7);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('');

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [nextTempId, setNextTempId] = useState(1);

  // ── Add Customer Dialog State ──
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerSaving, setNewCustomerSaving] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    groupName: '', headOfficeAddress: '', taxId: '', contactName: '', contactPhone: '', contactEmail: '',
  });

  // ── Add Branch Dialog State ──
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranchSaving, setNewBranchSaving] = useState(false);
  const [newBranchError, setNewBranchError] = useState('');
  const [newBranch, setNewBranch] = useState({ code: '', name: '', address: '', contactName: '', contactPhone: '' });

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ── Item Autocomplete ──
  const [itemSuggestions, setItemSuggestions] = useState<ItemSuggestion[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unitOptions = ['งาน','ชุด','ตัว','เครื่อง','ชิ้น','เมตร','ตร.ม.','จุด','ล็อต','ชม.','วัน','เดือน','ปี','แพ็ค'];

  const searchItems = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 1) { setItemSuggestions([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/quotation-items/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setItemSuggestions(Array.isArray(data) ? data : []);
      } catch { setItemSuggestions([]); }
    }, 300);
  }, []);

  const handleSelectSuggestion = (tempId: number, suggestion: ItemSuggestion) => {
    setItems(prev => prev.map(item =>
      item.tempId === tempId
        ? { ...item, description: suggestion.description, unit: suggestion.unit, unitPrice: suggestion.unitPrice }
        : item
    ));
    setItemSuggestions([]);
  };

  useEffect(() => {
    setLoadingData(true);
    fetch(`/api/quotations/${id}`)
      .then((res) => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then((q) => {
        setQuotationNumber(q.quotationNumber);
        setCurrentStatus(q.status);
        setCustomerGroupId(q.customerGroupId || '');
        setBranchId(q.branchId || '');
        setContactPerson(q.contactPerson || '');
        setProjectName(q.projectName || '');
        setDate(new Date(q.date).toISOString().split('T')[0]);
        setValidDays(q.validDays || 30);
        setVatPercent(Number(q.vatPercent) || 7);
        setDiscountPercent(Number(q.discountPercent) || 0);
        setNotes(q.notes || '');
        setWarranty(q.warranty || '');
        const loadedItems = (q.items || []).map((item: { description: string; unit: string; quantity: number; unitPrice: number }, idx: number) => ({
          tempId: idx + 1, description: item.description, unit: item.unit,
          quantity: Number(item.quantity), unitPrice: Number(item.unitPrice),
        }));
        setItems(loadedItems.length > 0 ? loadedItems : [{ tempId: 1, description: '', unit: 'งาน', quantity: 1, unitPrice: 0 }]);
        setNextTempId(loadedItems.length + 1);
      })
      .catch(() => setError('ไม่พบใบเสนอราคานี้'))
      .finally(() => setLoadingData(false));
  }, [id]);

  const selectedCustomer = customers.find((c) => c.id === customerGroupId);
  const branches = selectedCustomer?.branches || [];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPercent) / 100;
  const totalAmount = afterDiscount + vatAmount;

  const addItem = () => {
    const newId = nextTempId;
    setNextTempId(newId + 1);
    setItems([...items, { tempId: newId, description: '', unit: 'งาน', quantity: 1, unitPrice: 0 }]);
  };
  const removeItem = (tempId: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.tempId !== tempId));
  };
  const updateItem = (tempId: number, field: keyof QuotationItem, value: string | number) => {
    setItems(items.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (status?: string) => {
    setError('');
    if (!customerGroupId) { setError('กรุณาเลือกลูกค้า'); return; }
    if (items.some((item) => !item.description)) { setError('กรุณากรอกรายละเอียดรายการให้ครบ'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerGroupId, branchId: branchId || null, contactPerson, projectName, date,
          validDays, vatPercent, discountPercent, notes, warranty,
          status: status || currentStatus,
          items: items.map((item) => ({
            description: item.description, unit: item.unit,
            quantity: Number(item.quantity), unitPrice: Number(item.unitPrice),
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

  // ── Add Customer Dialog Handlers ──
  const handleOpenAddCustomer = () => {
    setNewCustomer({ groupName: '', headOfficeAddress: '', taxId: '', contactName: '', contactPhone: '', contactEmail: '' });
    setNewCustomerError('');
    setAddCustomerOpen(true);
  };

  const handleSaveNewCustomer = async () => {
    setNewCustomerError('');
    if (!newCustomer.groupName.trim()) { setNewCustomerError('กรุณากรอกชื่อลูกค้า'); return; }
    if (!newCustomer.headOfficeAddress.trim()) { setNewCustomerError('กรุณากรอกที่อยู่'); return; }

    setNewCustomerSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      fetchCustomers();
      setCustomerGroupId(created.id);
      setBranchId('');
      setContactPerson(created.contactName || '');
      setAddCustomerOpen(false);
    } catch {
      setNewCustomerError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setNewCustomerSaving(false);
    }
  };

  // ── Add Branch Dialog Handlers ──
  const handleOpenAddBranch = () => {
    setNewBranch({ code: '', name: '', address: '', contactName: '', contactPhone: '' });
    setNewBranchError('');
    setAddBranchOpen(true);
  };

  const handleSaveNewBranch = async () => {
    setNewBranchError('');
    if (!newBranch.code.trim()) { setNewBranchError('กรุณากรอกรหัสสาขา'); return; }
    if (!newBranch.name.trim()) { setNewBranchError('กรุณากรอกชื่อสาขา'); return; }

    setNewBranchSaving(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBranch, customerGroupId }),
      });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      fetchCustomers();
      setBranchId(created.id);
      setAddBranchOpen(false);
    } catch {
      setNewBranchError('เกิดข้อผิดพลาดในการบันทึก');
    }
    setNewBranchSaving(false);
  };

  if (loadingData) {
    return (
      <div className="w-full flex items-center justify-center py-80">
        <CircularProgress />
      </div>
    );
  }

  const sc = statusConfig[currentStatus] || statusConfig['DRAFT'];
  const isReadOnly = currentStatus === 'CANCELLED';

  const header = (
    <div className="flex flex-auto flex-col py-4">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        ใบเสนอราคา {'>'} แก้ไข {'>'} {quotationNumber}
      </Typography>
      <div className="flex flex-auto items-center gap-8">
        <IconButton onClick={() => router.back()}>
          <FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
        </IconButton>
        <motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
          <Typography variant="h5" fontWeight={800}>
            แก้ไขใบเสนอราคา
          </Typography>
        </motion.span>
        <Chip label={sc.label} size="small" sx={{
          bgcolor: sc.bgColor, color: sc.textColor, fontWeight: 600, ml: 1,
        }} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          เลขที่ {quotationNumber}
        </Typography>
      </div>
    </div>
  );

  const content = (
    <Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {isReadOnly && (
          <Alert severity="warning" sx={{ mb: 2 }}>ใบเสนอราคานี้ถูกยกเลิกแล้ว ไม่สามารถแก้ไขได้</Alert>
        )}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

            {/* ── Section 1: ข้อมูลลูกค้า ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SectionIcon gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" icon="lucide:building-2" />
                ข้อมูลลูกค้า
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {/* Customer searchable select with Add button */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(opt) => opt.groupName}
                    value={customers.find(c => c.id === customerGroupId) || null}
                    onChange={(_, val) => { setCustomerGroupId(val?.id || ''); setBranchId(''); }}
                    renderInput={(params) => (
                      <TextField {...params} label="ค้นหาลูกค้า *" placeholder="พิมพ์ชื่อบริษัท..." />
                    )}
                    slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
                    fullWidth
                    disabled={isReadOnly}
                    noOptionsText="ไม่พบลูกค้า"
                  />
                  {!isReadOnly && (
                    <Tooltip title="เพิ่มลูกค้าใหม่" arrow>
                      <IconButton onClick={handleOpenAddCustomer}
                        sx={{
                          mt: '1px',
                          width: 44, height: 44, flexShrink: 0,
                          bgcolor: 'primary.main', color: 'primary.contrastText',
                          borderRadius: '10px',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}>
                        <FuseSvgIcon size={22}>lucide:user-plus</FuseSvgIcon>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {/* Branch searchable select with Add button */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Autocomplete
                    options={branches}
                    getOptionLabel={(opt) => `${opt.code}: ${opt.name}`}
                    value={branches.find(b => b.id === branchId) || null}
                    onChange={(_, val) => setBranchId(val?.id || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="ค้นหาสาขา" placeholder="พิมพ์รหัสหรือชื่อสาขา..." />
                    )}
                    slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
                    fullWidth
                    disabled={!customerGroupId || isReadOnly}
                    noOptionsText="ไม่มีสาขา"
                  />
                  {customerGroupId && !isReadOnly && (
                    <Tooltip title="เพิ่มสาขาใหม่" arrow>
                      <IconButton onClick={handleOpenAddBranch}
                        sx={{
                          mt: '1px',
                          width: 44, height: 44, flexShrink: 0,
                          bgcolor: '#059669', color: '#fff',
                          borderRadius: '10px',
                          '&:hover': { bgcolor: '#047857' },
                        }}>
                        <FuseSvgIcon size={22}>lucide:plus</FuseSvgIcon>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <TextField label="ผู้ติดต่อ" value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)} fullWidth disabled={isReadOnly} />
                <TextField label="ชื่อโครงการ / งาน" value={projectName}
                  onChange={(e) => setProjectName(e.target.value)} fullWidth disabled={isReadOnly} />
                <TextField label="วันที่" type="date" value={date}
                  onChange={(e) => setDate(e.target.value)} fullWidth disabled={isReadOnly}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="เสนอราคามีผล (วัน)" type="number" value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value))} fullWidth disabled={isReadOnly} />
              </Box>
            </Box>

            {/* ── Section 2: รายการสินค้า/บริการ ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SectionIcon gradient="linear-gradient(135deg, #22C55E, #16A34A)" icon="lucide:list" />
                รายการสินค้า/บริการ
              </Typography>

              <TableContainer sx={{ borderRadius: '10px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{
                      bgcolor: 'action.hover',
                      '& th': { fontWeight: 700, color: 'text.secondary', py: 1.5, borderBottom: '2px solid', borderColor: 'divider' },
                    }}>
                      <TableCell align="center" sx={{ width: 50 }}>#</TableCell>
                      <TableCell>รายละเอียด</TableCell>
                      <TableCell sx={{ width: 110 }}>หน่วย</TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>จำนวน</TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>ราคา/หน่วย</TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>จำนวนเงิน</TableCell>
                      {!isReadOnly && <TableCell sx={{ width: 50 }} />}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.tempId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                        <TableCell>
                          {isReadOnly ? (
                            <TextField value={item.description} fullWidth size="small" disabled />
                          ) : (
                            <Autocomplete
                              freeSolo
                              options={itemSuggestions}
                              getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.description}
                              filterOptions={(x) => x}
                              inputValue={item.description}
                              onInputChange={(_, val, reason) => {
                                if (reason === 'input') {
                                  updateItem(item.tempId, 'description', val);
                                  searchItems(val);
                                }
                              }}
                              onChange={(_, val) => {
                                if (val && typeof val !== 'string') {
                                  handleSelectSuggestion(item.tempId, val);
                                }
                              }}
                              renderOption={(props, option) => {
                                if (typeof option === 'string') return null;
                                return (
                                  <ListItem {...props} key={option.description} sx={{ py: 0.5 }}>
                                    <ListItemText
                                      primary={option.description}
                                      secondary={`${option.unit} — ฿${formatCurrency(option.unitPrice)}`}
                                      primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                                      secondaryTypographyProps={{ fontSize: '12px', color: '#0284C7' }}
                                    />
                                  </ListItem>
                                );
                              }}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="พิมพ์เพื่อค้นหา..." size="small" fullWidth />
                              )}
                              slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', mt: 0.5 } } }}
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isReadOnly ? (
                            <TextField value={item.unit} size="small" fullWidth disabled />
                          ) : (
                            <Autocomplete
                              freeSolo
                              options={unitOptions}
                              value={item.unit}
                              onChange={(_, val) => { if (val) updateItem(item.tempId, 'unit', val); }}
                              onInputChange={(_, val, reason) => {
                                if (reason === 'input') updateItem(item.tempId, 'unit', val);
                              }}
                              renderInput={(params) => (
                                <TextField {...params} size="small" fullWidth />
                              )}
                              slotProps={{ paper: { sx: { borderRadius: '10px', mt: 0.5 } } }}
                              size="small"
                              disableClearable
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField type="number" value={item.quantity}
                            onChange={(e) => updateItem(item.tempId, 'quantity', Number(e.target.value))}
                            size="small" fullWidth disabled={isReadOnly}
                            inputProps={{ min: 1, style: { textAlign: 'right' } }} />
                        </TableCell>
                        <TableCell>
                          <TextField type="number" value={item.unitPrice}
                            onChange={(e) => updateItem(item.tempId, 'unitPrice', Number(e.target.value))}
                            size="small" fullWidth disabled={isReadOnly}
                            inputProps={{ min: 0, step: 100, style: { textAlign: 'right' } }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell>
                            <IconButton size="small" onClick={() => removeItem(item.tempId)} disabled={items.length <= 1}
                              sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}>
                              <FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {!isReadOnly && (
                <Button variant="outlined" color="success"
                  startIcon={<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon>}
                  onClick={addItem}
                  sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, borderStyle: 'dashed', borderWidth: 2 }}>
                  เพิ่มรายการ
                </Button>
              )}

              {/* Totals */}
              <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{
                  width: '100%', maxWidth: 420,
                  bgcolor: 'background.default', borderRadius: '12px', p: 2.5,
                  border: '1px solid', borderColor: 'divider',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography color="text.secondary">ยอดรวมก่อน VAT</Typography>
                    <Typography fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography color="text.secondary">ส่วนลด</Typography>
                      <TextField type="number" value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        size="small" disabled={isReadOnly}
                        inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: '48px' } }}
                        sx={{ '& .MuiOutlinedInput-root': { minHeight: '36px' } }} />
                      <Typography color="text.secondary">%</Typography>
                    </Box>
                    <Typography fontWeight={600} color="error.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      -{formatCurrency(discountAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography color="text.secondary">VAT</Typography>
                      <TextField type="number" value={vatPercent}
                        onChange={(e) => setVatPercent(Number(e.target.value))}
                        size="small" disabled={isReadOnly}
                        inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: '48px' } }}
                        sx={{ '& .MuiOutlinedInput-root': { minHeight: '36px' } }} />
                      <Typography color="text.secondary">%</Typography>
                    </Box>
                    <Typography fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(vatAmount)}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>ยอดรวมสุทธิ</Typography>
                    <Typography variant="h5" fontWeight={800} color="info.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(totalAmount)} <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>บาท</Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* ── Section 3: หมายเหตุ & เงื่อนไข ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SectionIcon gradient="linear-gradient(135deg, #F59E0B, #D97706)" icon="lucide:message-square" />
                หมายเหตุ & เงื่อนไข
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField label="หมายเหตุ" value={notes}
                  onChange={(e) => setNotes(e.target.value)} multiline rows={3} fullWidth disabled={isReadOnly} />
                <TextField label="เงื่อนไขรับประกัน" value={warranty}
                  onChange={(e) => setWarranty(e.target.value)} multiline rows={3} fullWidth disabled={isReadOnly} />
              </Box>
            </Box>

            {/* ── Section 4: Action Buttons ── */}
            {!isReadOnly && (
              <Box sx={{
                px: { xs: 1, md: 2 }, py: 2,
                display: 'flex', justifyContent: 'flex-end', gap: 1.5,
              }}>
                <Button variant="outlined" size="large" onClick={() => router.back()}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}>
                  ยกเลิก
                </Button>
                <Button variant="outlined" color="primary" size="large"
                  onClick={() => handleSubmit('DRAFT')} disabled={saving}
                  startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  บันทึกแบบร่าง
                </Button>
                <Button variant="contained" color="primary" size="large"
                  onClick={() => handleSubmit('SENT')} disabled={saving}
                  startIcon={<FuseSvgIcon size={18}>lucide:send</FuseSvgIcon>}
                  sx={{
                    textTransform: 'none', fontWeight: 600,
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                    '&:hover': { background: 'linear-gradient(135deg, #2563EB, #1E40AF)' },
                  }}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก & ส่ง'}
                </Button>
              </Box>
            )}
        </motion.div>
      </Box>

      {/* ── Add Customer Dialog ── */}
      <Dialog open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, pb: 1,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FuseSvgIcon size={20} sx={{ color: '#fff' }}>lucide:user-plus</FuseSvgIcon>
          </Box>
          <Typography variant="h6" fontWeight={700}>เพิ่มลูกค้าใหม่</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px!important' }}>
          {newCustomerError && (
            <Alert severity="error" sx={{ mb: 2 }}>{newCustomerError}</Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="ชื่อบริษัท / ลูกค้า *" value={newCustomer.groupName}
              onChange={(e) => setNewCustomer({ ...newCustomer, groupName: e.target.value })}
              fullWidth sx={{ gridColumn: { sm: 'span 2' } }} autoFocus />
            <TextField label="ที่อยู่สำนักงานใหญ่ *" value={newCustomer.headOfficeAddress}
              onChange={(e) => setNewCustomer({ ...newCustomer, headOfficeAddress: e.target.value })}
              fullWidth multiline rows={2} sx={{ gridColumn: { sm: 'span 2' } }} />
            <TextField label="เลขผู้เสียภาษี" value={newCustomer.taxId}
              onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })} fullWidth />
            <TextField label="ชื่อผู้ติดต่อ" value={newCustomer.contactName}
              onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })} fullWidth />
            <TextField label="เบอร์โทร" value={newCustomer.contactPhone}
              onChange={(e) => setNewCustomer({ ...newCustomer, contactPhone: e.target.value })} fullWidth />
            <TextField label="อีเมล" value={newCustomer.contactEmail}
              onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAddCustomerOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSaveNewCustomer} disabled={newCustomerSaving}
            startIcon={<FuseSvgIcon size={18}>lucide:check</FuseSvgIcon>}
            sx={{
              textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              '&:hover': { background: 'linear-gradient(135deg, #2563EB, #1E40AF)' },
            }}>
            {newCustomerSaving ? 'กำลังบันทึก...' : 'เพิ่มลูกค้า'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Branch Dialog ── */}
      <Dialog open={addBranchOpen} onClose={() => setAddBranchOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, pb: 1,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FuseSvgIcon sx={{ color: '#fff' }} size={22}>lucide:map-pin</FuseSvgIcon>
          </Box>
          เพิ่มสาขาใหม่
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {newBranchError && <Alert severity="error" sx={{ mb: 2 }}>{newBranchError}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="รหัสสาขา *" value={newBranch.code}
              onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })} fullWidth />
            <TextField label="ชื่อสาขา *" value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} fullWidth />
            <TextField label="ที่อยู่" value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
              fullWidth multiline rows={2} sx={{ gridColumn: { sm: 'span 2' } }} />
            <TextField label="ชื่อผู้ติดต่อ" value={newBranch.contactName}
              onChange={(e) => setNewBranch({ ...newBranch, contactName: e.target.value })} fullWidth />
            <TextField label="เบอร์โทร" value={newBranch.contactPhone}
              onChange={(e) => setNewBranch({ ...newBranch, contactPhone: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAddBranchOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSaveNewBranch} disabled={newBranchSaving}
            startIcon={<FuseSvgIcon size={18}>lucide:check</FuseSvgIcon>}
            sx={{
              textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #047857)',
              '&:hover': { background: 'linear-gradient(135deg, #047857, #065F46)' },
            }}>
            {newBranchSaving ? 'กำลังบันทึก...' : 'เพิ่มสาขา'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

export default EditQuotationPage;
