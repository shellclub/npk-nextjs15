'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
type Contact = { id: string; name: string; phone?: string | null; email?: string | null; position?: string | null };
type CustomerGroup = { id: string; groupName: string; headOfficeAddress?: string | null; contactName?: string | null; contactPhone?: string | null; taxId?: string | null; branches: Branch[]; contacts?: Contact[] };
type QuotationItem = {
  tempId: number;
  itemType: 'HEADER' | 'ITEM';
  parentIndex?: number;
  description: string;
  unit: string;
  quantity: number;
  materialPrice: number;
  labourPrice: number;
};
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
  const [revisionNumber, setRevisionNumber] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  const [customerGroupId, setCustomerGroupId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [vatPercent, setVatPercent] = useState(7);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [conditions, setConditions] = useState('');

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

  // ── Add Contact Dialog State ──
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactSaving, setNewContactSaving] = useState(false);
  const [newContactError, setNewContactError] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', position: '' });

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
        ? { ...item, description: suggestion.description, unit: suggestion.unit, materialPrice: suggestion.unitPrice }
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
        setRevisionNumber(q.revisionNumber || 0);
        setCurrentStatus(q.status);
        setCustomerGroupId(q.customerGroupId || '');
        setBranchId(q.branchId || '');
        setContactPerson(q.contactPerson || '');
        setContactPhone(q.contactPhone || '');
        setAddress(q.address || q.customerGroup?.headOfficeAddress || '');
        setProjectName(q.projectName || '');
        setDate(new Date(q.date).toISOString().split('T')[0]);
        setValidDays(q.validDays || 30);
        setVatPercent(Number(q.vatPercent) || 7);
        setDiscountAmount(Number(q.discountAmount) || 0);
        setConditions(q.conditions || q.warranty || q.notes || '');
        const loadedItems = (q.items || []).map((item: {
          itemType?: string; parentIndex?: number; description: string; unit: string;
          quantity: number; unitPrice: number; materialPrice?: number; labourPrice?: number;
        }, idx: number) => ({
          tempId: idx + 1,
          itemType: (item.itemType || 'ITEM') as 'HEADER' | 'ITEM',
          parentIndex: item.parentIndex ?? undefined,
          description: item.description,
          unit: item.unit || '',
          quantity: Number(item.quantity),
          materialPrice: Number(item.materialPrice || item.unitPrice || 0),
          labourPrice: Number(item.labourPrice || 0),
        }));

        if (loadedItems.length > 0) {
          setItems(loadedItems);
        } else {
          setItems([
            { tempId: 1, itemType: 'HEADER', description: '', unit: '', quantity: 0, materialPrice: 0, labourPrice: 0 },
            { tempId: 2, itemType: 'ITEM', parentIndex: 0, description: '', unit: 'งาน', quantity: 1, materialPrice: 0, labourPrice: 0 },
          ]);
        }
        setNextTempId(loadedItems.length + 1);
      })
      .catch(() => setError('ไม่พบใบเสนอราคานี้'))
      .finally(() => setLoadingData(false));
  }, [id]);

  const selectedCustomer = customers.find((c) => c.id === customerGroupId);
  const branches = selectedCustomer?.branches || [];
  const selectedCustomerContacts: Contact[] = selectedCustomer?.contacts || [];

  // Calculate subtotal from ITEM rows only
  const subtotal = items.reduce((sum, item) => {
    if (item.itemType === 'HEADER') return sum;
    return sum + item.quantity * item.materialPrice + item.quantity * item.labourPrice;
  }, 0);
  // discountAmount is entered directly as a fixed amount (Baht)
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPercent) / 100;
  const totalAmount = afterDiscount + vatAmount;

  const addHeader = () => {
    const newId = nextTempId;
    setNextTempId(newId + 1);
    setItems([...items, { tempId: newId, itemType: 'HEADER', description: '', unit: '', quantity: 0, materialPrice: 0, labourPrice: 0 }]);
  };

  const addSubItem = (headerIndex: number) => {
    const newId = nextTempId;
    setNextTempId(newId + 1);
    let insertAt = headerIndex + 1;
    for (let i = headerIndex + 1; i < items.length; i++) {
      if (items[i].itemType === 'ITEM' && items[i].parentIndex === headerIndex) {
        insertAt = i + 1;
      } else if (items[i].itemType === 'HEADER') {
        break;
      }
    }
    const newItem: QuotationItem = { tempId: newId, itemType: 'ITEM', parentIndex: headerIndex, description: '', unit: 'งาน', quantity: 1, materialPrice: 0, labourPrice: 0 };
    const newItems = [...items];
    newItems.splice(insertAt, 0, newItem);
    setItems(newItems);
  };

  const removeItem = (tempId: number) => {
    const item = items.find(i => i.tempId === tempId);
    if (!item) return;

    if (item.itemType === 'HEADER') {
      const headerIdx = items.indexOf(item);
      setItems(items.filter(i => i.tempId !== tempId && !(i.itemType === 'ITEM' && i.parentIndex === headerIdx)));
    } else {
      setItems(items.filter(i => i.tempId !== tempId));
    }
  };

  const updateItem = (tempId: number, field: keyof QuotationItem, value: string | number) => {
    setItems(items.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item)));
  };

  // Get display number for items
  const getItemDisplayNumbers = () => {
    let headerCount = 0;
    const subCounts: Record<number, number> = {};
    return items.map((item, idx) => {
      if (item.itemType === 'HEADER') {
        headerCount++;
        subCounts[idx] = 0;
        return `${headerCount}`;
      } else {
        const parentIdx = item.parentIndex ?? -1;
        if (parentIdx >= 0 && subCounts[parentIdx] !== undefined) {
          subCounts[parentIdx]++;
          let hNum = 0;
          for (let i = 0; i <= parentIdx; i++) {
            if (items[i].itemType === 'HEADER') hNum++;
          }
          return `${hNum}.${subCounts[parentIdx]}`;
        }
        return `${headerCount}.${++subCounts[Object.keys(subCounts).pop() as unknown as number] || 1}`;
      }
    });
  };

  const displayNumbers = getItemDisplayNumbers();

  // Force date change when discount is modified
  const handleDiscountChange = (val: number) => {
    setDiscountAmount(val);
    if (val > 0) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Display quotation number with Rev
  const displayQuotationNumber = revisionNumber > 0
    ? `${quotationNumber} Rev.${revisionNumber}`
    : quotationNumber;

  const handleSubmit = async (status?: string) => {
    setError('');
    if (!customerGroupId) { setError('กรุณาเลือกลูกค้า'); return; }
    if (items.filter(i => i.itemType === 'ITEM').some((item) => !item.description)) {
      setError('กรุณากรอกรายละเอียดรายการให้ครบ'); return;
    }

    setSaving(true);
    try {
      const processedItems = items.map((item, idx) => {
        if (item.itemType === 'HEADER') {
          return {
            itemType: item.itemType,
            description: item.description,
            unit: '',
            quantity: 0,
            materialPrice: 0,
            labourPrice: 0,
            parentIndex: undefined,
          };
        }
        let parentIdx: number | undefined;
        for (let i = idx - 1; i >= 0; i--) {
          if (items[i].itemType === 'HEADER') {
            parentIdx = i;
            break;
          }
        }
        return {
          itemType: item.itemType,
          parentIndex: parentIdx,
          description: item.description,
          unit: item.unit,
          quantity: Number(item.quantity),
          materialPrice: Number(item.materialPrice),
          labourPrice: Number(item.labourPrice),
        };
      });

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerGroupId, branchId: branchId || null, contactPerson, contactPhone,
          address: address || null, projectName, date,
          validDays, vatPercent, discountAmount, conditions,
          status: status || currentStatus,
          items: processedItems,
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

  // ── Add Contact Dialog Handlers ──
  const handleOpenAddContact = () => {
    setNewContact({ name: '', phone: '', email: '', position: '' });
    setNewContactError('');
    setAddContactOpen(true);
  };

  const handleSaveNewContact = async () => {
    setNewContactError('');
    if (!newContact.name.trim()) { setNewContactError('กรุณากรอกชื่อผู้ติดต่อ'); return; }
    if (!customerGroupId) { setNewContactError('กรุณาเลือกลูกค้าก่อน'); return; }

    setNewContactSaving(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContact, customerGroupId }),
      });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      fetchCustomers();
      setContactPerson(created.name);
      setContactPhone(created.phone || '');
      setAddContactOpen(false);
    } catch {
      setNewContactError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setNewContactSaving(false);
    }
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
        ใบเสนอราคา {'>'} แก้ไข {'>'} {displayQuotationNumber}
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
          เลขที่ {displayQuotationNumber}
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Autocomplete
                    freeSolo
                    options={selectedCustomerContacts}
                    getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
                    inputValue={contactPerson}
                    onInputChange={(_, val, reason) => {
                      if (reason === 'input') setContactPerson(val);
                    }}
                    onChange={(_, val) => {
                      if (val && typeof val !== 'string') {
                        setContactPerson(val.name);
                        setContactPhone(val.phone || '');
                      }
                    }}
                    renderOption={(props, option) => {
                      if (typeof option === 'string') return null;
                      return (
                        <ListItem {...props} key={option.id} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={option.name}
                            secondary={[option.position, option.phone].filter(Boolean).join(' • ')}
                            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
                            secondaryTypographyProps={{ fontSize: '11px', color: '#64748B' }}
                          />
                        </ListItem>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="ชื่อผู้ติดต่อ" placeholder="พิมพ์หรือเลือก..." />
                    )}
                    slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
                    fullWidth
                    disabled={!customerGroupId || isReadOnly}
                    noOptionsText="ไม่พบผู้ติดต่อ"
                  />
                  {customerGroupId && !isReadOnly && (
                    <Tooltip title="เพิ่มผู้ติดต่อใหม่" arrow>
                      <IconButton onClick={handleOpenAddContact}
                        sx={{
                          mt: '1px',
                          width: 44, height: 44, flexShrink: 0,
                          bgcolor: '#7C3AED', color: '#fff',
                          borderRadius: '10px',
                          '&:hover': { bgcolor: '#6D28D9' },
                        }}>
                        <FuseSvgIcon size={22}>lucide:user-plus</FuseSvgIcon>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <TextField label="เบอร์โทร" value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)} fullWidth disabled={isReadOnly} />
                <TextField label="ที่อยู่ (ไม่บังคับ)" value={address}
                  onChange={(e) => setAddress(e.target.value)} fullWidth disabled={isReadOnly}
                  multiline rows={2}
                  sx={{ gridColumn: { md: 'span 3' } }}
                  placeholder="ที่อยู่ลูกค้า" />
                <TextField label="ชื่อโครงการ / งาน" value={projectName}
                  onChange={(e) => setProjectName(e.target.value)} fullWidth disabled={isReadOnly}
                  InputProps={{ sx: { color: '#1D4ED8', fontWeight: 600 } }} />
                <TextField label="วันที่" type="date" value={date}
                  onChange={(e) => setDate(e.target.value)} fullWidth disabled={isReadOnly}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="ยืนยันราคา (วัน)" type="number" value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value))} fullWidth disabled={isReadOnly} />
              </Box>
            </Box>

            {/* ── Section 2: รายการสินค้า/บริการ ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SectionIcon gradient="linear-gradient(135deg, #22C55E, #16A34A)" icon="lucide:list" />
                รายละเอียดสินค้า/บริการ
              </Typography>

              <TableContainer sx={{ borderRadius: '10px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{
                      bgcolor: 'action.hover',
                      '& th': { fontWeight: 700, color: 'text.secondary', py: 1, borderBottom: '2px solid', borderColor: 'divider', fontSize: '12px' },
                    }}>
                      <TableCell align="center" sx={{ width: 50 }} rowSpan={2}>Item</TableCell>
                      <TableCell rowSpan={2}>Description</TableCell>
                      <TableCell align="center" sx={{ width: 60 }} rowSpan={2}>Qty</TableCell>
                      <TableCell align="center" sx={{ width: 70 }} rowSpan={2}>Unit</TableCell>
                      <TableCell align="center" colSpan={2} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>Price Unit/Baht</TableCell>
                      <TableCell align="center" colSpan={2} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>Total Price/Baht</TableCell>
                      <TableCell align="right" sx={{ width: 100 }} rowSpan={2}>Amount Baht</TableCell>
                      {!isReadOnly && <TableCell sx={{ width: 80 }} rowSpan={2} />}
                    </TableRow>
                    <TableRow sx={{
                      bgcolor: 'action.hover',
                      '& th': { fontWeight: 600, color: 'text.secondary', py: 0.5, fontSize: '11px', borderBottom: '2px solid', borderColor: 'divider' },
                    }}>
                      <TableCell align="center" sx={{ width: 100 }}>Material</TableCell>
                      <TableCell align="center" sx={{ width: 100 }}>Labour</TableCell>
                      <TableCell align="center" sx={{ width: 100 }}>Material</TableCell>
                      <TableCell align="center" sx={{ width: 100 }}>Labour</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => {
                      const isHeader = item.itemType === 'HEADER';
                      const matTotal = item.quantity * item.materialPrice;
                      const labTotal = item.quantity * item.labourPrice;
                      const amountTotal = matTotal + labTotal;

                      if (isHeader) {
                        return (
                          <TableRow key={item.tempId} sx={{ bgcolor: '#FFF8E1', '&:hover': { bgcolor: '#FFF3C4' } }}>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#D97706' }}>{displayNumbers[index]}</TableCell>
                            <TableCell colSpan={7}>
                              {isReadOnly ? (
                                <Typography fontWeight={700}>{item.description}</Typography>
                              ) : (
                                <TextField
                                  value={item.description}
                                  onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                                  placeholder="ชื่อหัวข้อหลัก"
                                  size="small" fullWidth
                                  sx={{ '& .MuiOutlinedInput-root': { fontWeight: 700 } }}
                                />
                              )}
                            </TableCell>
                            <TableCell />
                            {!isReadOnly && (
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="เพิ่มรายการย่อย" arrow>
                                    <IconButton size="small" onClick={() => addSubItem(index)}
                                      sx={{ color: '#059669', '&:hover': { bgcolor: '#D1FAE5' } }}>
                                      <FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton size="small" onClick={() => removeItem(item.tempId)}
                                    sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}>
                                    <FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
                                  </IconButton>
                                </Box>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow key={item.tempId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '12px' }}>
                            {displayNumbers[index]}
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? (
                              <Typography fontSize="13px">{item.description}</Typography>
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
                                        primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
                                        secondaryTypographyProps={{ fontSize: '11px', color: '#0284C7' }}
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
                            <TextField type="number" value={item.quantity}
                              onChange={(e) => updateItem(item.tempId, 'quantity', Number(e.target.value))}
                              size="small" fullWidth disabled={isReadOnly}
                              inputProps={{ min: 1, style: { textAlign: 'right', fontSize: '12px' } }} />
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? (
                              <Typography fontSize="12px" textAlign="center">{item.unit}</Typography>
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
                            <TextField type="number" value={item.materialPrice}
                              onChange={(e) => updateItem(item.tempId, 'materialPrice', Number(e.target.value))}
                              size="small" fullWidth disabled={isReadOnly}
                              inputProps={{ min: 0, step: 100, style: { textAlign: 'right', fontSize: '12px' } }} />
                          </TableCell>
                          <TableCell>
                            <TextField type="number" value={item.labourPrice}
                              onChange={(e) => updateItem(item.tempId, 'labourPrice', Number(e.target.value))}
                              size="small" fullWidth disabled={isReadOnly}
                              inputProps={{ min: 0, step: 100, style: { textAlign: 'right', fontSize: '12px' } }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                            {formatCurrency(matTotal)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                            {formatCurrency(labTotal)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                            {formatCurrency(amountTotal)}
                          </TableCell>
                          {!isReadOnly && (
                            <TableCell>
                              <IconButton size="small" onClick={() => removeItem(item.tempId)}
                                sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}>
                                <FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {!isReadOnly && (
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="warning"
                    startIcon={<FuseSvgIcon size={16}>lucide:folder-plus</FuseSvgIcon>}
                    onClick={addHeader}
                    sx={{ textTransform: 'none', fontWeight: 600, borderStyle: 'dashed', borderWidth: 2 }}>
                    เพิ่มหัวข้อหลัก
                  </Button>
                </Box>
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
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField type="number" value={discountAmount}
                        onChange={(e) => handleDiscountChange(Number(e.target.value))}
                        size="small" disabled={isReadOnly}
                        inputProps={{ min: 0, step: 100, style: { textAlign: 'right', width: '100px' } }}
                        sx={{ '& .MuiOutlinedInput-root': { minHeight: '36px' } }} />
                      <Typography color="text.secondary">บาท</Typography>
                    </Box>
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

            {/* ── Section 3: เงื่อนไข ── */}
            <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SectionIcon gradient="linear-gradient(135deg, #F59E0B, #D97706)" icon="lucide:message-square" />
                เงื่อนไข
              </Typography>

              <TextField label="เงื่อนไข" value={conditions}
                onChange={(e) => setConditions(e.target.value)} multiline rows={4} fullWidth disabled={isReadOnly}
                placeholder="ระบุเงื่อนไขการทำงาน เช่น เงื่อนไขการชำระเงิน, การรับประกัน, ระยะเวลาดำเนินการ" />
            </Box>

            {/* ── Section 4: รูปภาพก่อนทำงาน ── */}
            {id !== 'new' && (
              <PhotoSection quotationId={id} />
            )}

            {/* ── Section 5: Action Buttons ── */}
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
            <TextField label="ชื่อสาขา" value={newBranch.name}
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

      {/* ── Add Contact Dialog ── */}
      <Dialog open={addContactOpen} onClose={() => setAddContactOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, pb: 1,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FuseSvgIcon size={20} sx={{ color: '#fff' }}>lucide:user-plus</FuseSvgIcon>
          </Box>
          <Typography variant="h6" fontWeight={700}>เพิ่มผู้ติดต่อใหม่</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px!important' }}>
          {newContactError && (
            <Alert severity="error" sx={{ mb: 2 }}>{newContactError}</Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="ชื่อผู้ติดต่อ *" value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              fullWidth autoFocus />
            <TextField label="ตำแหน่ง" value={newContact.position}
              onChange={(e) => setNewContact({ ...newContact, position: e.target.value })} fullWidth />
            <TextField label="เบอร์โทร" value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} fullWidth />
            <TextField label="อีเมล" value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAddContactOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSaveNewContact} disabled={newContactSaving}
            startIcon={<FuseSvgIcon size={18}>lucide:check</FuseSvgIcon>}
            sx={{
              textTransform: 'none', fontWeight: 600,
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #5B21B6)' },
            }}>
            {newContactSaving ? 'กำลังบันทึก...' : 'เพิ่มผู้ติดต่อ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return <Root header={header} content={content} />;
}

// ── Photo Upload Section Component ──
type PhotoData = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  caption: string | null;
  photoType: string;
  uploadedBy: string | null;
  createdAt: string;
};

function PhotoSection({ quotationId }: { quotationId: string }) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations/${quotationId}/photos`);
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch { setPhotos([]); }
  }, [quotationId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const previews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviewFiles(prev => [...prev, ...previews]);
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      previewFiles.forEach(pf => formData.append('photos', pf.file));
      formData.append('photoType', 'BEFORE');
      formData.append('uploadedBy', 'พนักงานออฟฟิศ');

      const res = await fetch(`/api/quotations/${quotationId}/photos`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      setMessage({ text: `อัพโหลดสำเร็จ ${previewFiles.length} รูป`, type: 'success' });
      previewFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);
      fetchPhotos();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการอัพโหลด', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('ต้องการลบรูปนี้?')) return;
    try {
      await fetch(`/api/quotations/${quotationId}/photos?photoId=${photoId}`, { method: 'DELETE' });
      fetchPhotos();
    } catch { /* ignore */ }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Box sx={{ px: { xs: 1, md: 2 }, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SectionIcon gradient="linear-gradient(135deg, #F59E0B, #EA580C)" icon="lucide:camera" />
          รูปภาพก่อนทำงาน
          {photos.length > 0 && (
            <Chip label={`${photos.length} รูป`} size="small" sx={{
              bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: '12px',
            }} />
          )}
        </Typography>

        {/* Drop Zone */}
        <Box
          onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('office-photo-input')?.click()}
          sx={{
            border: `2px dashed ${dragOver ? '#F59E0B' : '#E2E8F0'}`,
            borderRadius: '12px', p: 3, textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s',
            bgcolor: dragOver ? '#FFFBEB' : '#FAFBFC',
            '&:hover': { borderColor: '#F59E0B', bgcolor: '#FFFBEB' },
            mb: 2,
          }}
        >
          <input
            id="office-photo-input"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
          <FuseSvgIcon size={32} sx={{ color: '#F59E0B', mb: 1 }}>lucide:image-plus</FuseSvgIcon>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
            กดเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.5 }}>
            รองรับไฟล์ JPG, PNG, HEIC • ไม่จำกัดจำนวน
          </Typography>
        </Box>

        {/* Preview Files */}
        {previewFiles.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                เลือกแล้ว {previewFiles.length} รูป
              </Typography>
              <Button size="small" color="error" onClick={() => {
                previewFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
                setPreviewFiles([]);
              }} sx={{ textTransform: 'none', fontSize: '12px' }}>
                ล้างทั้งหมด
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1 }}>
              {previewFiles.map((pf, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={pf.preview}
                    alt={pf.file.name}
                    sx={{
                      width: '100%', height: 80, objectFit: 'cover',
                      borderRadius: '8px', border: '1px solid #E2E8F0',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      bgcolor: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                      width: 20, height: 20,
                      '&:hover': { bgcolor: '#DC2626' },
                    }}
                  >
                    <FuseSvgIcon size={12}>lucide:x</FuseSvgIcon>
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={<FuseSvgIcon size={16}>{uploading ? 'lucide:loader' : 'lucide:upload'}</FuseSvgIcon>}
              fullWidth
              sx={{
                mt: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                background: uploading
                  ? 'linear-gradient(135deg, #94A3B8, #64748B)'
                  : 'linear-gradient(135deg, #F59E0B, #EA580C)',
                boxShadow: uploading ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #EA580C, #C2410C)' },
              }}
            >
              {uploading ? 'กำลังอัพโหลด...' : `อัพโหลด ${previewFiles.length} รูป`}
            </Button>
          </Box>
        )}

        {/* Message */}
        {message && (
          <Alert severity={message.type} sx={{ mb: 2, borderRadius: '10px' }}>
            {message.text}
          </Alert>
        )}

        {/* Uploaded Photos Gallery */}
        {photos.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B', mb: 1 }}>
              รูปภาพที่อัพโหลดแล้ว ({photos.length})
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
              {photos.map((photo) => (
                <Box key={photo.id} sx={{
                  borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid #E2E8F0', bgcolor: '#fff',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                }}>
                  <Box
                    sx={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => setLightbox(photo.fileUrl)}
                  >
                    <Box
                      component="img"
                      src={photo.fileUrl}
                      alt={photo.fileName}
                      sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                    />
                    <Chip
                      label={photo.photoType === 'AFTER' ? 'หลังทำ' : 'ก่อนทำ'}
                      size="small"
                      sx={{
                        position: 'absolute', top: 4, right: 4,
                        bgcolor: photo.photoType === 'AFTER' ? 'rgba(34,197,94,0.9)' : 'rgba(56,189,248,0.9)',
                        color: '#fff', fontSize: '10px', fontWeight: 700, height: 20,
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 1 }}>
                    <Typography sx={{
                      fontSize: '11px', fontWeight: 500, color: '#475569',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {photo.caption || photo.fileName}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>
                        {formatSize(photo.fileSize)}
                      </Typography>
                      <Tooltip title="ลบรูป" arrow>
                        <IconButton size="small" onClick={() => handleDelete(photo.id)}
                          sx={{ color: '#EF4444', p: 0.25 }}>
                          <FuseSvgIcon size={14}>lucide:trash-2</FuseSvgIcon>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Lightbox */}
      <Dialog
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'transparent', boxShadow: 'none',
            maxWidth: '95vw', maxHeight: '95vh',
          },
        }}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.9)' } } }}
      >
        {lightbox && (
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={lightbox}
              alt="Preview"
              sx={{
                maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
                borderRadius: '8px', display: 'block',
              }}
            />
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{
                position: 'absolute', top: -16, right: -16,
                bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <FuseSvgIcon size={24}>lucide:x</FuseSvgIcon>
            </IconButton>
          </Box>
        )}
      </Dialog>
    </>
  );
}

export default EditQuotationPage;
