'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Collapse from '@mui/material/Collapse';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

// ===== Types =====
type POItem = {
	id: string;
	description: string;
	qty: number;
	unit: string;
	unitPrice: number;
	amount: number;
};

type PurchaseOrder = {
	id: string;
	poNumber: string;
	date: string;
	dueDate: string;
	referenceNo: string;
	branchSite: string;
	contractorName: string;
	contractorAddress: string;
	contractorPhone: string;
	workName: string;
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vat3Percent: number;
	vat3Amount: number;
	vat7Percent: number;
	vat7Amount: number;
	grandTotal: number;
	paymentTerms: string[];
	notes: string;
	status: string;
	items: POItem[];
};

// ===== Mock Data =====
const mockTeams = [
	{ id: '1', name: 'คุณขวัญชัย มั่นคง', phone: '092-6492694', address: '' },
	{ id: '2', name: 'คุณสมศักดิ์ พงษ์ดี', phone: '081-345-6789', address: '' },
	{ id: '3', name: 'คุณวิเชียร ประสงค์ดี', phone: '085-789-0123', address: '' },
	{ id: '4', name: 'คุณสำราญ เจริญสุข', phone: '088-901-2345', address: '' },
];

const defaultPaymentTerms = [
	'ผู้รับจ้างทำงานตาม Poตามเลขที่อ้างอิง เสร็จให้ถ่ายสำเนา ใบรับงาน และส่งรูปภาพก่อน-หลังทำงาน มาทาง Line ของบริษัท และส่งตัวจริงตามที่กำหนด',
	'การจ่ายเงินบริษัทจะจ่ายให้ภายใน 15 วันหลังจากงานเสร็จสมบูรณ์และเอกสารครบตามที่กำหนด',
	'ผู้รับจ้างต้องรับประกันผลงานตามระเวลาที่กำหนด ตามราคานี้เท่านั้น',
];

const initialPOs: PurchaseOrder[] = [
	{
		id: '1', poNumber: 'PO2026/0001', date: '2024-11-26', dueDate: '',
		referenceNo: 'QT-2568-0001', branchSite: 'รพ ศุภมิตร',
		contractorName: 'คุณขวัญชัย', contractorAddress: '', contractorPhone: '092-6492694',
		workName: 'งานปรับปรุงบันได รพ ศุภมิตร', subtotal: 235558, discountPercent: 0, discountAmount: 0,
		vat3Percent: 3, vat3Amount: 7066.74, vat7Percent: 7, vat7Amount: 16489.06, grandTotal: 244980.32,
		paymentTerms: defaultPaymentTerms, notes: '', status: 'APPROVED',
		items: [
			{ id: '1', description: 'ชั้นที่ 1 (ฝั่งขวา)\n1.1 งานรื้อผนังเบาขนาดพื้นที่ 12.92 ตารางเมตรออก\n1.2 งานเสริมความกว้างบันไดด้วยเหล็กฉาก50x50x5mm พร้อมย้าย', qty: 1, unit: 'งาน', unitPrice: 235558, amount: 235558 },
		],
	},
	{
		id: '2', poNumber: 'PO2026/0002', date: '2024-12-02', dueDate: '2024-12-20',
		referenceNo: 'WO-2568-0015', branchSite: 'โลตัส สุพรรณบุรี',
		contractorName: 'คุณสมศักดิ์', contractorAddress: '', contractorPhone: '081-345-6789',
		workName: 'งานซ่อมระบบไฟฟ้า', subtotal: 45000, discountPercent: 0, discountAmount: 0,
		vat3Percent: 3, vat3Amount: 1350, vat7Percent: 7, vat7Amount: 3150, grandTotal: 47100,
		paymentTerms: defaultPaymentTerms, notes: '', status: 'DRAFT',
		items: [
			{ id: '1', description: 'งานเดินสายไฟใหม่ชั้น 2', qty: 1, unit: 'งาน', unitPrice: 25000, amount: 25000 },
			{ id: '2', description: 'งานติดตั้งตู้ MDB ใหม่', qty: 1, unit: 'ชุด', unitPrice: 20000, amount: 20000 },
		],
	},
	{
		id: '3', poNumber: 'PO2026/0003', date: '2024-12-05', dueDate: '2024-12-25',
		referenceNo: 'QT-2568-0012', branchSite: 'รพ เกษมราษฎร์)',
		contractorName: 'คุณวิเชียร', contractorAddress: '', contractorPhone: '085-789-0123',
		workName: 'งานซ่อมระบบประปา', subtotal: 78500, discountPercent: 5, discountAmount: 3925,
		vat3Percent: 3, vat3Amount: 2237.25, vat7Percent: 7, vat7Amount: 5220.25, grandTotal: 82032.50,
		paymentTerms: defaultPaymentTerms, notes: 'เร่งด่วน', status: 'ORDERED',
		items: [
			{ id: '1', description: 'งานซ่อมท่อน้ำรั่ว ห้องน้ำชั้น 3', qty: 1, unit: 'งาน', unitPrice: 35000, amount: 35000 },
			{ id: '2', description: 'งานเปลี่ยนปั๊มน้ำ', qty: 1, unit: 'ชุด', unitPrice: 28500, amount: 28500 },
			{ id: '3', description: 'งานเปลี่ยนวาล์วน้ำ', qty: 3, unit: 'ตัว', unitPrice: 5000, amount: 15000 },
		],
	},
	{
		id: '4', poNumber: 'PO2026/0004', date: '2024-12-10', dueDate: '2024-12-30',
		referenceNo: 'WO-2568-0020', branchSite: 'แม็คโคร สุพรรณบุรี',
		contractorName: 'คุณสำราญ', contractorAddress: '', contractorPhone: '088-901-2345',
		workName: 'งานทาสีภายนอกอาคาร', subtotal: 120000, discountPercent: 0, discountAmount: 0,
		vat3Percent: 3, vat3Amount: 3600, vat7Percent: 7, vat7Amount: 8400, grandTotal: 125400,
		paymentTerms: defaultPaymentTerms, notes: '', status: 'RECEIVED',
		items: [
			{ id: '1', description: 'งานทาสีภายนอก ด้านหน้าอาคาร', qty: 1, unit: 'งาน', unitPrice: 65000, amount: 65000 },
			{ id: '2', description: 'งานทาสีภายนอก ด้านข้างอาคาร', qty: 1, unit: 'งาน', unitPrice: 55000, amount: 55000 },
		],
	},
	{
		id: '5', poNumber: 'PO2026/0005', date: '2024-12-15', dueDate: '',
		referenceNo: '', branchSite: '',
		contractorName: 'คุณขวัญชัย', contractorAddress: '', contractorPhone: '092-6492694',
		workName: 'งานติดตั้งแอร์', subtotal: 35000, discountPercent: 0, discountAmount: 0,
		vat3Percent: 3, vat3Amount: 1050, vat7Percent: 7, vat7Amount: 2450, grandTotal: 36400,
		paymentTerms: defaultPaymentTerms, notes: '', status: 'CANCELLED',
		items: [
			{ id: '1', description: 'งานติดตั้งแอร์ Daikin 24000 BTU', qty: 2, unit: 'ชุด', unitPrice: 17500, amount: 35000 },
		],
	},
];

// ===== Helpers =====
const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
	DRAFT: { label: 'แบบร่าง', bgColor: '#F8FAFC', textColor: '#64748B', borderColor: '#CBD5E1' },
	APPROVED: { label: 'อนุมัติ', bgColor: '#ECFDF5', textColor: '#059669', borderColor: '#6EE7B7' },
	ORDERED: { label: 'สั่งซื้อแล้ว', bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#93C5FD' },
	RECEIVED: { label: 'รับแล้ว', bgColor: '#EEF2FF', textColor: '#4F46E5', borderColor: '#A5B4FC' },
	CANCELLED: { label: 'ยกเลิก', bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5' },
};
const statusOptions = [
	{ value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'DRAFT', label: 'แบบร่าง' },
	{ value: 'APPROVED', label: 'อนุมัติ' }, { value: 'ORDERED', label: 'สั่งซื้อแล้ว' },
	{ value: 'RECEIVED', label: 'รับแล้ว' },
];

function fmt(n: number | string) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { if (!d) return '-'; return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }); }

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

// ===== Empty PO Form =====
type POForm = {
	contractorName: string; contractorPhone: string; contractorAddress: string;
	date: string; dueDate: string; referenceNo: string; branchSite: string;
	workName: string; notes: string;
	discountPercent: number;
	vat3Percent: number; vat7Percent: number;
	items: POItem[];
};
const emptyPOForm: POForm = {
	contractorName: '', contractorPhone: '', contractorAddress: '',
	date: new Date().toISOString().split('T')[0], dueDate: '', referenceNo: '', branchSite: '',
	workName: '', notes: '',
	discountPercent: 0, vat3Percent: 3, vat7Percent: 7,
	items: [{ id: '1', description: '', qty: 1, unit: 'งาน', unitPrice: 0, amount: 0 }],
};

// =============================================
// MAIN COMPONENT
// =============================================
function PurchaseOrdersPage() {
	const [data, setData] = useState<PurchaseOrder[]>(initialPOs);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [expandedId, setExpandedId] = useState<string | null>(null);

	// Create/Edit dialog
	const [formOpen, setFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<POForm>(emptyPOForm);

	// Cancel dialog
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelTarget, setCancelTarget] = useState<PurchaseOrder | null>(null);

	// Snackbar
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

	// Derived
	const filtered = data.filter(po => {
		if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
		if (search) {
			const s = search.toLowerCase();
			return po.poNumber.toLowerCase().includes(s) || po.contractorName.toLowerCase().includes(s) || po.workName.toLowerCase().includes(s) || po.referenceNo.toLowerCase().includes(s);
		}
		return true;
	});

	// ===== Calculated totals for form =====
	const calcTotals = (f: POForm) => {
		const subtotal = f.items.reduce((s, it) => s + it.amount, 0);
		const discountAmount = subtotal * f.discountPercent / 100;
		const afterDiscount = subtotal - discountAmount;
		const vat3Amount = afterDiscount * f.vat3Percent / 100;
		const vat7Amount = afterDiscount * f.vat7Percent / 100;
		const grandTotal = afterDiscount + vat7Amount - vat3Amount;
		return { subtotal, discountAmount, vat3Amount, vat7Amount, grandTotal };
	};

	// ===== Form handlers =====
	const handleCreate = () => {
		setForm(emptyPOForm);
		setFormMode('create');
		setEditingId(null);
		setFormOpen(true);
	};

	const handleEdit = (po: PurchaseOrder) => {
		setForm({
			contractorName: po.contractorName, contractorPhone: po.contractorPhone, contractorAddress: po.contractorAddress,
			date: po.date, dueDate: po.dueDate, referenceNo: po.referenceNo, branchSite: po.branchSite,
			workName: po.workName, notes: po.notes,
			discountPercent: po.discountPercent, vat3Percent: po.vat3Percent, vat7Percent: po.vat7Percent,
			items: po.items.map(it => ({ ...it })),
		});
		setFormMode('edit');
		setEditingId(po.id);
		setFormOpen(true);
	};

	const handleFormItemChange = (index: number, field: keyof POItem, value: string | number) => {
		setForm(prev => {
			const items = [...prev.items];
			const item = { ...items[index], [field]: value };
			if (field === 'qty' || field === 'unitPrice') {
				item.amount = Number(item.qty) * Number(item.unitPrice);
			}
			items[index] = item;
			return { ...prev, items };
		});
	};

	const handleAddItem = () => {
		setForm(prev => ({
			...prev,
			items: [...prev.items, { id: String(Date.now()), description: '', qty: 1, unit: 'งาน', unitPrice: 0, amount: 0 }],
		}));
	};

	const handleRemoveItem = (index: number) => {
		if (form.items.length <= 1) return;
		setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
	};

	const handleSave = () => {
		if (!form.contractorName.trim()) {
			setSnackbar({ open: true, message: 'กรุณาระบุชื่อผู้รับจ้าง', severity: 'error' });
			return;
		}
		if (form.items.some(it => !it.description.trim())) {
			setSnackbar({ open: true, message: 'กรุณาระบุรายละเอียดรายการทุกรายการ', severity: 'error' });
			return;
		}
		const totals = calcTotals(form);
		if (formMode === 'create') {
			const nextNum = data.length + 1;
			const newPO: PurchaseOrder = {
				id: String(Date.now()),
				poNumber: `PO2026/${String(nextNum).padStart(4, '0')}`,
				...form,
				...totals,
				paymentTerms: defaultPaymentTerms,
				status: 'DRAFT',
			};
			setData(prev => [newPO, ...prev]);
			setSnackbar({ open: true, message: `สร้างใบสั่งซื้อ ${newPO.poNumber} เรียบร้อย`, severity: 'success' });
		} else if (editingId) {
			setData(prev => prev.map(po => po.id === editingId ? {
				...po, ...form, ...totals,
			} : po));
			setSnackbar({ open: true, message: 'แก้ไขใบสั่งซื้อเรียบร้อย', severity: 'success' });
		}
		setFormOpen(false);
	};

	// Cancel / Approve
	const handleCancelClick = (po: PurchaseOrder) => { setCancelTarget(po); setCancelOpen(true); };
	const handleCancelConfirm = () => {
		if (!cancelTarget) return;
		setData(prev => prev.map(p => p.id === cancelTarget.id ? { ...p, status: 'CANCELLED' } : p));
		setSnackbar({ open: true, message: `ยกเลิก ${cancelTarget.poNumber} เรียบร้อย`, severity: 'success' });
		setCancelOpen(false);
	};
	const handleApprove = (po: PurchaseOrder) => {
		setData(prev => prev.map(p => p.id === po.id ? { ...p, status: 'APPROVED' } : p));
		setSnackbar({ open: true, message: `อนุมัติ ${po.poNumber} เรียบร้อย`, severity: 'success' });
	};

	// Select team
	const handleSelectTeam = (team: typeof mockTeams[0] | null) => {
		if (!team) return;
		setForm(prev => ({ ...prev, contractorName: team.name, contractorPhone: team.phone, contractorAddress: team.address }));
	};

	// ===== HEADER =====
	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				เอกสาร {'>'} ใบสั่งซื้อให้ช่าง
			</Typography>
			<div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-auto items-center gap-8">
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
							ใบสั่งซื้อให้ช่าง (PO)
						</Typography>
					</motion.span>
					<div className="flex flex-1 items-center justify-end gap-12">
						<FormControl size="small" sx={{ minWidth: 140 }}>
							<Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
								sx={{ borderRadius: '10px', fontSize: '14px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 500 }}>
								{statusOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '14px' }}>{o.label}</MenuItem>)}
							</Select>
						</FormControl>
						<TextField placeholder="ค้นหา PO, ผู้รับจ้าง, ชื่องาน..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
							sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '14px', bgcolor: '#F8FAFC' } }}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:search</FuseSvgIcon></InputAdornment> }} />
						<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
							<Button variant="contained" size="large" onClick={handleCreate}
								startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
								sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.3)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
								สร้าง PO ใหม่
							</Button>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);

	// ===== CONTENT =====
	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
			<TableContainer sx={{ flex: 1 }}>
				<Table stickyHeader>
					<TableHead>
						<TableRow sx={{ '& th': { fontSize: '14px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC' } }}>
							<TableCell sx={{ width: 40 }} />
							<TableCell sx={{ width: 50 }}>#</TableCell>
							<TableCell>เลขที่ PO</TableCell>
							<TableCell>วันที่</TableCell>
							<TableCell>เลขอ้างอิง</TableCell>
							<TableCell>ชื่อผู้รับจ้าง</TableCell>
							<TableCell>ชื่องาน / โครงการ</TableCell>
							<TableCell align="right">ยอดรวม (บาท)</TableCell>
							<TableCell align="center">สถานะ</TableCell>
							<TableCell align="center" sx={{ width: 140 }}>จัดการ</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.length === 0 ? (
							<TableRow>
								<TableCell colSpan={10} sx={{ py: 8, textAlign: 'center' }}>
									<FuseSvgIcon sx={{ color: '#CBD5E1', mb: 1 }} size={48}>lucide:shopping-cart</FuseSvgIcon>
									<Typography sx={{ fontSize: '16px', color: '#94A3B8' }}>ไม่พบรายการใบสั่งซื้อ</Typography>
								</TableCell>
							</TableRow>
						) : filtered.map((po, index) => {
							const sc = statusConfig[po.status] || statusConfig.DRAFT;
							const isExpanded = expandedId === po.id;
							const isCancelled = po.status === 'CANCELLED';
							return (
								<>
									<TableRow key={po.id} hover
										sx={{ cursor: 'pointer', opacity: isCancelled ? 0.5 : 1, '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '14px', color: '#334155', py: 1.2, borderBottom: '1px solid #F1F5F9' } }}
										onClick={() => setExpandedId(isExpanded ? null : po.id)}>
										<TableCell sx={{ pl: 1 }}>
											<IconButton size="small" sx={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
												<FuseSvgIcon size={16}>lucide:chevron-right</FuseSvgIcon>
											</IconButton>
										</TableCell>
										<TableCell sx={{ fontWeight: 500 }}>{index + 1}</TableCell>
										<TableCell>
											<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{po.poNumber}</Typography>
										</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(po.date)}</TableCell>
										<TableCell>
											{po.referenceNo ? (
												<Chip label={po.referenceNo} size="small" sx={{ fontSize: '12px', height: 24, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
											) : '-'}
										</TableCell>
										<TableCell sx={{ fontWeight: 500 }}>{po.contractorName}</TableCell>
										<TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{po.workName || '-'}
										</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '15px !important', color: isCancelled ? '#94A3B8' : '#1E293B' }}>
											{fmt(po.grandTotal)}
										</TableCell>
										<TableCell align="center">
											<Chip label={sc.label} size="small" sx={{ fontSize: '12px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px' }} />
										</TableCell>
										<TableCell align="center" onClick={(e) => e.stopPropagation()}>
											<Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
												{po.status === 'DRAFT' && (
													<Tooltip title="อนุมัติ" arrow>
														<IconButton size="small" onClick={() => handleApprove(po)} sx={{ color: '#22C55E', '&:hover': { bgcolor: '#DCFCE7' } }}>
															<FuseSvgIcon size={18}>lucide:check-circle</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												)}
												{!isCancelled && (
													<Tooltip title="แก้ไข" arrow>
														<IconButton size="small" onClick={() => handleEdit(po)} sx={{ color: '#0EA5E9', '&:hover': { bgcolor: '#E0F2FE' } }}>
															<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												)}
												{!isCancelled && po.status !== 'RECEIVED' && (
													<Tooltip title="ยกเลิก" arrow>
														<IconButton size="small" onClick={() => handleCancelClick(po)} sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
															<FuseSvgIcon size={18}>lucide:ban</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												)}
											</Box>
										</TableCell>
									</TableRow>
									{/* Expanded detail */}
									<TableRow key={`${po.id}-detail`}>
										<TableCell colSpan={10} sx={{ py: 0, borderBottom: isExpanded ? '2px solid #E2E8F0' : 'none' }}>
											<Collapse in={isExpanded} timeout="auto" unmountOnExit>
												<Box sx={{ py: 2, px: 2 }}>
													<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
														<Paper sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0' }} elevation={0}>
															<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลผู้รับจ้าง</Typography>
															<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
																<Box sx={{ display: 'flex', gap: 1 }}>
																	<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>ชื่อ:</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{po.contractorName}</Typography>
																</Box>
																<Box sx={{ display: 'flex', gap: 1 }}>
																	<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>เบอร์โทร:</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{po.contractorPhone || '-'}</Typography>
																</Box>
																{po.branchSite && (
																	<Box sx={{ display: 'flex', gap: 1 }}>
																		<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>สถานที่:</Typography>
																		<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{po.branchSite}</Typography>
																	</Box>
																)}
															</Box>
														</Paper>
														<Paper sx={{ p: 2, borderRadius: '10px', border: '1px solid #E2E8F0' }} elevation={0}>
															<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>สรุปยอด</Typography>
															<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '13px', color: '#64748B' }}>ราคาเป็นเงิน</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(po.subtotal)}</Typography>
																</Box>
																{po.discountAmount > 0 && (
																	<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																		<Typography sx={{ fontSize: '13px', color: '#EF4444' }}>ส่วนลด {po.discountPercent}%</Typography>
																		<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>-{fmt(po.discountAmount)}</Typography>
																	</Box>
																)}
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '13px', color: '#DC2626' }}>หัก ณ ที่จ่าย {po.vat3Percent}%</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#DC2626' }}>-{fmt(po.vat3Amount)}</Typography>
																</Box>
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '13px', color: '#64748B' }}>ภาษีมูลค่าเพิ่ม {po.vat7Percent}%</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(po.vat7Amount)}</Typography>
																</Box>
																<Divider sx={{ my: 0.5 }} />
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>จำนวนเงินทั้งสิ้น</Typography>
																	<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>{fmt(po.grandTotal)} บาท</Typography>
																</Box>
															</Box>
														</Paper>
													</Box>
													{/* Items table */}
													<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
														รายการสินค้า/บริการ ({po.items.length} รายการ)
													</Typography>
													<Table size="small" sx={{ '& td, & th': { fontSize: '13px', py: 0.8 } }}>
														<TableHead>
															<TableRow sx={{ '& th': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' } }}>
																<TableCell sx={{ width: 40 }}>#</TableCell>
																<TableCell>รายละเอียด</TableCell>
																<TableCell align="center" sx={{ width: 60 }}>จำนวน</TableCell>
																<TableCell align="center" sx={{ width: 60 }}>หน่วย</TableCell>
																<TableCell align="right" sx={{ width: 100 }}>ราคา/หน่วย</TableCell>
																<TableCell align="right" sx={{ width: 100 }}>จำนวนเงิน</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{po.items.map((item, i) => (
																<TableRow key={item.id}>
																	<TableCell>{i + 1}</TableCell>
																	<TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</TableCell>
																	<TableCell align="center">{item.qty}</TableCell>
																	<TableCell align="center">{item.unit}</TableCell>
																	<TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(item.unitPrice)}</TableCell>
																	<TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.amount)}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</Box>
											</Collapse>
										</TableCell>
									</TableRow>
								</>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
			{/* Footer summary */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FAFBFC' }}>
				<Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {filtered.length} จาก {data.length} รายการ</Typography>
				<Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
					ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(filtered.filter(p => p.status !== 'CANCELLED').reduce((s, p) => s + p.grandTotal, 0))}</Box> บาท
				</Typography>
			</Box>

			{/* ========== CREATE/EDIT DIALOG ========== */}
			<Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}>
				<DialogTitle sx={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
					<FuseSvgIcon sx={{ color: '#22C55E' }} size={28}>lucide:shopping-cart</FuseSvgIcon>
					{formMode === 'create' ? 'สร้างใบสั่งซื้อใหม่' : 'แก้ไขใบสั่งซื้อ'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3, pb: 2 }}>
					{/* ---- Section: Contractor Info ---- */}
					<Box sx={{ mb: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={18}>lucide:user</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลผู้รับจ้าง</Typography>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
							<Autocomplete
								options={mockTeams}
								getOptionLabel={(op) => op.name}
								onChange={(_, val) => handleSelectTeam(val)}
								inputValue={form.contractorName}
								onInputChange={(_, val) => setForm(p => ({ ...p, contractorName: val }))}
								freeSolo
								renderInput={(params) => <TextField {...params} label="ชื่อผู้รับจ้าง *" placeholder="เลือกจากทีมช่าง หรือพิมพ์ใหม่" sx={fieldSx} />}
							/>
							<TextField label="เบอร์โทร" value={form.contractorPhone}
								onChange={(e) => setForm(p => ({ ...p, contractorPhone: e.target.value }))} sx={fieldSx} />
							<TextField label="ที่อยู่" value={form.contractorAddress}
								onChange={(e) => setForm(p => ({ ...p, contractorAddress: e.target.value }))} sx={fieldSx} />
						</Box>
					</Box>

					{/* ---- Section: PO Info ---- */}
					<Box sx={{ mb: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#F59E0B' }} size={18}>lucide:file-text</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ข้อมูลใบสั่งซื้อ</Typography>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
							<TextField label="วันที่ *" type="date" value={form.date}
								onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
								InputLabelProps={{ shrink: true }} sx={fieldSx} />
							<TextField label="วันครบกำหนด" type="date" value={form.dueDate}
								onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))}
								InputLabelProps={{ shrink: true }} sx={fieldSx} />
							<TextField label="เลขอ้างอิง (WO/PO/ใบเสนอราคา)" value={form.referenceNo}
								onChange={(e) => setForm(p => ({ ...p, referenceNo: e.target.value }))}
								placeholder="เช่น QT-2568-0001" sx={fieldSx} />
							<TextField label="สาขา/สถานที่ปฏิบัติงาน" value={form.branchSite}
								onChange={(e) => setForm(p => ({ ...p, branchSite: e.target.value }))} sx={fieldSx} />
						</Box>
						<TextField label="ชื่องาน / โครงการ" fullWidth value={form.workName}
							onChange={(e) => setForm(p => ({ ...p, workName: e.target.value }))}
							placeholder="เช่น งานปรับปรุงบันได รพ ศุภมิตร" sx={fieldSx} />
					</Box>

					{/* ---- Section: Items ---- */}
					<Box sx={{ mb: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={18}>lucide:list</FuseSvgIcon>
								<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>รายการสินค้า/บริการ</Typography>
							</Box>
							<Button variant="outlined" size="small" onClick={handleAddItem}
								startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
								sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
								เพิ่มรายการ
							</Button>
						</Box>
						{form.items.map((item, idx) => (
							<Box key={item.id} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
								<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', mt: 2, width: 24, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</Typography>
								<TextField label="รายละเอียด *" multiline maxRows={3} value={item.description}
									onChange={(e) => handleFormItemChange(idx, 'description', e.target.value)}
									sx={{ flex: 3, ...fieldSx }} />
								<TextField label="จำนวน" type="number" value={item.qty}
									onChange={(e) => handleFormItemChange(idx, 'qty', Number(e.target.value))}
									sx={{ width: 90, ...fieldSx }} inputProps={{ min: 0, step: 1 }} />
								<TextField label="หน่วย" value={item.unit}
									onChange={(e) => handleFormItemChange(idx, 'unit', e.target.value)}
									sx={{ width: 80, ...fieldSx }} />
								<TextField label="ราคา/หน่วย" type="number" value={item.unitPrice}
									onChange={(e) => handleFormItemChange(idx, 'unitPrice', Number(e.target.value))}
									sx={{ width: 130, ...fieldSx }} inputProps={{ min: 0 }} />
								<TextField label="จำนวนเงิน" value={fmt(item.amount)} InputProps={{ readOnly: true }}
									sx={{ width: 130, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }} />
								<IconButton onClick={() => handleRemoveItem(idx)} disabled={form.items.length <= 1}
									sx={{ mt: 1, color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' }, '&.Mui-disabled': { color: '#E2E8F0' } }}>
									<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
								</IconButton>
							</Box>
						))}
					</Box>

					{/* ---- Section: Totals ---- */}
					<Box sx={{ mb: 2 }}>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0', minWidth: 380 }} elevation={0}>
								{(() => {
									const totals = calcTotals(form);
									return (
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<Typography sx={{ fontSize: '14px', color: '#64748B' }}>ราคาเป็นเงิน</Typography>
												<Typography sx={{ fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.subtotal)}</Typography>
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography sx={{ fontSize: '14px', color: '#64748B' }}>ส่วนลด</Typography>
													<TextField size="small" type="number" value={form.discountPercent}
														onChange={(e) => setForm(p => ({ ...p, discountPercent: Number(e.target.value) }))}
														sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
														inputProps={{ min: 0, max: 100 }}
														InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
												</Box>
												<Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
													{totals.discountAmount > 0 ? `-${fmt(totals.discountAmount)}` : '-'}
												</Typography>
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography sx={{ fontSize: '14px', color: '#DC2626' }}>หัก ณ ที่จ่าย</Typography>
													<TextField size="small" type="number" value={form.vat3Percent}
														onChange={(e) => setForm(p => ({ ...p, vat3Percent: Number(e.target.value) }))}
														sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
														inputProps={{ min: 0 }}
														InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
												</Box>
												<Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>-{fmt(totals.vat3Amount)}</Typography>
											</Box>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography sx={{ fontSize: '14px', color: '#64748B' }}>ภาษีมูลค่าเพิ่ม</Typography>
													<TextField size="small" type="number" value={form.vat7Percent}
														onChange={(e) => setForm(p => ({ ...p, vat7Percent: Number(e.target.value) }))}
														sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
														inputProps={{ min: 0 }}
														InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
												</Box>
												<Typography sx={{ fontSize: '14px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.vat7Amount)}</Typography>
											</Box>
											<Divider />
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>จำนวนเงินทั้งสิ้น</Typography>
												<Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>{fmt(totals.grandTotal)} บาท</Typography>
											</Box>
										</Box>
									);
								})()}
							</Paper>
						</Box>
					</Box>

					{/* Notes */}
					<TextField label="หมายเหตุ" fullWidth multiline rows={2} value={form.notes}
						onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
						sx={fieldSx} />
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
					<Button onClick={() => setFormOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleSave} variant="contained"
						startIcon={<FuseSvgIcon size={18}>{formMode === 'create' ? 'lucide:plus' : 'lucide:save'}</FuseSvgIcon>}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
						{formMode === 'create' ? 'สร้างใบสั่งซื้อ' : 'บันทึก'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== CANCEL DIALOG ========== */}
			<Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
					<FuseSvgIcon sx={{ color: '#EF4444' }} size={24}>lucide:alert-triangle</FuseSvgIcon>
					ยืนยันการยกเลิก
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2.5 }}>
					<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1 }}>คุณต้องการยกเลิกใบสั่งซื้อ:</Typography>
					<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>{cancelTarget?.poNumber}</Typography>
					<Typography sx={{ fontSize: '14px', color: '#64748B', mt: 0.5 }}>{cancelTarget?.workName}</Typography>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setCancelOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ไม่ยกเลิก
					</Button>
					<Button onClick={handleCancelConfirm} variant="contained"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
						ยืนยันยกเลิก
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar */}
			<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default PurchaseOrdersPage;
