'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

type Branch = { code: string; name: string };

type Customer = {
	id: string;
	groupName: string;
	headOfficeAddress: string;
	taxId: string;
	branches: Branch[];
	contactName: string;
	phone: string;
	email: string;
	isActive: boolean;
};

// Initial mock data
const initialCustomers: Customer[] = [
	{
		id: '1',
		groupName: 'บริษัท ศุภมิตร จำกัด',
		headOfficeAddress: '1468 ถนนพัฒนาการ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพฯ 10250',
		taxId: '0105528152401',
		branches: [
			{ code: 'store036', name: 'Lotuss 10089 H0539:Rayong A5' },
			{ code: 'store037', name: 'Lotuss 10090 H0540:Chonburi A3' },
		],
		contactName: 'Somchat Jeamsakul',
		phone: '098-9429891',
		email: 'somchat@suphamit.co.th',
		isActive: true,
	},
	{
		id: '2',
		groupName: 'บริษัท เซ็นทรัลพัฒนา จำกัด (มหาชน)',
		headOfficeAddress: '999/9 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
		taxId: '0107536000269',
		branches: [
			{ code: 'CPN001', name: 'Central World' },
			{ code: 'CPN002', name: 'Central Ladprao' },
			{ code: 'CPN003', name: 'Central Westgate' },
		],
		contactName: 'สมศรี จันทร์เพ็ญ',
		phone: '02-021-9999',
		email: 'somsri@centralpattana.co.th',
		isActive: true,
	},
	{
		id: '3',
		groupName: 'บริษัท โฮมโปร เซ็นเตอร์ จำกัด (มหาชน)',
		headOfficeAddress: '31 ซอยพัฒนาการ 20 แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
		taxId: '0107537001528',
		branches: [
			{ code: 'HP001', name: 'HomePro ราชพฤกษ์' },
			{ code: 'HP002', name: 'HomePro รังสิต' },
		],
		contactName: 'วิชัย เจริญสุข',
		phone: '02-331-8000',
		email: 'wichai@homepro.co.th',
		isActive: true,
	},
	{
		id: '4',
		groupName: 'บริษัท สยามพิวรรธน์ จำกัด',
		headOfficeAddress: '989 ถนนพระราม1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
		taxId: '0105525058291',
		branches: [
			{ code: 'SP001', name: 'Siam Paragon' },
		],
		contactName: 'นิภา สุวรรณ',
		phone: '02-610-8000',
		email: 'nipa@siampiwat.com',
		isActive: true,
	},
	{
		id: '5',
		groupName: 'โรงพยาบาลศุภมิตร',
		headOfficeAddress: '761 ถนนประชาธิปไตย อำเภอเมือง จังหวัดสุพรรณบุรี 72000',
		taxId: '0725534000161',
		branches: [
			{ code: 'SUPH01', name: 'สาขาหลัก สุพรรณบุรี' },
		],
		contactName: 'ดร.สมชาย วิโรจน์',
		phone: '035-523-444',
		email: 'admin@suphamit-hospital.co.th',
		isActive: true,
	},
	{
		id: '6',
		groupName: 'บริษัท เทสโก้ โลตัส จำกัด',
		headOfficeAddress: '629/1 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพฯ 10240',
		taxId: '0105534076624',
		branches: [
			{ code: 'TL001', name: 'สาขารังสิต' },
			{ code: 'TL002', name: 'สาขาบางนา' },
			{ code: 'TL003', name: 'สาขาพระราม 4' },
		],
		contactName: 'สุรชัย ธนะวัฒน์',
		phone: '02-797-7000',
		email: 'surachai@tesco.co.th',
		isActive: true,
	},
	{
		id: '7',
		groupName: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',
		headOfficeAddress: '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800',
		taxId: '0107536000293',
		branches: [
			{ code: 'SCG01', name: 'สำนักงานใหญ่' },
		],
		contactName: 'พิศาล สมบูรณ์',
		phone: '02-586-3333',
		email: 'pisan@scg.com',
		isActive: true,
	},
	{
		id: '8',
		groupName: 'บริษัท แสนสิริ จำกัด (มหาชน)',
		headOfficeAddress: '123/1 ซอยลาดพร้าว 38 แขวงจันทรเกษม เขตจตุจักร กรุงเทพฯ 10900',
		taxId: '0107537000041',
		branches: [
			{ code: 'SIRI01', name: 'สำนักงานใหญ่ ลาดพร้าว' },
			{ code: 'SIRI02', name: 'T77 Community' },
		],
		contactName: 'อภิชาติ จันทร์สว่าง',
		phone: '02-027-8888',
		email: 'apichat@sansiri.com',
		isActive: true,
	},
];

const emptyForm = {
	groupName: '',
	headOfficeAddress: '',
	taxId: '',
	contactName: '',
	phone: '',
	email: '',
};

type FormData = typeof emptyForm;

function CustomersPage() {
	const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
	const [searchText, setSearchText] = useState('');
	const [showInactive, setShowInactive] = useState(false);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<FormData>(emptyForm);
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

	// Branch dialog state
	const [branchDialogOpen, setBranchDialogOpen] = useState(false);
	const [managingCustomerId, setManagingCustomerId] = useState<string | null>(null);
	const [newBranchCode, setNewBranchCode] = useState('');
	const [newBranchName, setNewBranchName] = useState('');

	// Disable confirmation dialog
	const [disableDialogOpen, setDisableDialogOpen] = useState(false);
	const [disableTarget, setDisableTarget] = useState<Customer | null>(null);

	// Snackbar
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

	// Filter
	const filteredCustomers = customers.filter((c) => {
		const matchSearch =
			c.groupName.toLowerCase().includes(searchText.toLowerCase()) ||
			c.contactName.toLowerCase().includes(searchText.toLowerCase()) ||
			c.phone.includes(searchText) ||
			c.taxId.includes(searchText) ||
			c.email.toLowerCase().includes(searchText.toLowerCase());
		const matchActive = showInactive ? true : c.isActive;
		return matchSearch && matchActive;
	});

	// Form validation
	const validateForm = (): boolean => {
		const errors: Partial<Record<keyof FormData, string>> = {};
		if (!form.groupName.trim()) errors.groupName = 'กรุณาระบุชื่อกลุ่มลูกค้า';
		if (!form.taxId.trim()) errors.taxId = 'กรุณาระบุเลขผู้เสียภาษี';
		if (!form.headOfficeAddress.trim()) errors.headOfficeAddress = 'กรุณาระบุที่อยู่สำนักงานใหญ่';
		if (!form.contactName.trim()) errors.contactName = 'กรุณาระบุชื่อผู้ติดต่อ';
		if (!form.phone.trim()) errors.phone = 'กรุณาระบุเบอร์โทร';
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Open create dialog
	const handleCreate = () => {
		setForm(emptyForm);
		setFormErrors({});
		setDialogMode('create');
		setEditingId(null);
		setDialogOpen(true);
	};

	// Open edit dialog
	const handleEdit = (customer: Customer) => {
		setForm({
			groupName: customer.groupName,
			headOfficeAddress: customer.headOfficeAddress,
			taxId: customer.taxId,
			contactName: customer.contactName,
			phone: customer.phone,
			email: customer.email,
		});
		setFormErrors({});
		setDialogMode('edit');
		setEditingId(customer.id);
		setDialogOpen(true);
	};

	// Save (create or edit)
	const handleSave = () => {
		if (!validateForm()) return;

		if (dialogMode === 'create') {
			const newCustomer: Customer = {
				id: String(Date.now()),
				...form,
				branches: [],
				isActive: true,
			};
			setCustomers((prev) => [...prev, newCustomer]);
			setSnackbar({ open: true, message: `เพิ่มลูกค้า "${form.groupName}" เรียบร้อยแล้ว`, severity: 'success' });
		} else if (editingId) {
			setCustomers((prev) =>
				prev.map((c) =>
					c.id === editingId ? { ...c, ...form } : c
				)
			);
			setSnackbar({ open: true, message: `แก้ไขข้อมูล "${form.groupName}" เรียบร้อยแล้ว`, severity: 'success' });
		}
		setDialogOpen(false);
	};

	// Disable / Enable customer
	const handleDisableClick = (customer: Customer) => {
		setDisableTarget(customer);
		setDisableDialogOpen(true);
	};

	const handleDisableConfirm = () => {
		if (!disableTarget) return;
		const newStatus = !disableTarget.isActive;
		setCustomers((prev) =>
			prev.map((c) =>
				c.id === disableTarget.id ? { ...c, isActive: newStatus } : c
			)
		);
		setSnackbar({
			open: true,
			message: newStatus
				? `เปิดใช้งาน "${disableTarget.groupName}" เรียบร้อยแล้ว`
				: `ปิดใช้งาน "${disableTarget.groupName}" เรียบร้อยแล้ว`,
			severity: newStatus ? 'success' : 'info',
		});
		setDisableDialogOpen(false);
		setDisableTarget(null);
	};

	// Branch management
	const handleManageBranches = (customer: Customer) => {
		setManagingCustomerId(customer.id);
		setNewBranchCode('');
		setNewBranchName('');
		setBranchDialogOpen(true);
	};

	const handleAddBranch = () => {
		if (!newBranchCode.trim() || !newBranchName.trim() || !managingCustomerId) return;
		setCustomers((prev) =>
			prev.map((c) =>
				c.id === managingCustomerId
					? { ...c, branches: [...c.branches, { code: newBranchCode.trim(), name: newBranchName.trim() }] }
					: c
			)
		);
		setNewBranchCode('');
		setNewBranchName('');
		setSnackbar({ open: true, message: 'เพิ่มสาขาเรียบร้อยแล้ว', severity: 'success' });
	};

	const handleRemoveBranch = (branchCode: string) => {
		if (!managingCustomerId) return;
		setCustomers((prev) =>
			prev.map((c) =>
				c.id === managingCustomerId
					? { ...c, branches: c.branches.filter((b) => b.code !== branchCode) }
					: c
			)
		);
	};

	const managingCustomer = customers.find((c) => c.id === managingCustomerId);

	// Form field change handler
	const handleFieldChange = (field: keyof FormData, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				ข้อมูลหลัก {'>'} ข้อมูลลูกค้า
			</Typography>
			<div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-auto items-center gap-8">
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
							ข้อมูลลูกค้า
						</Typography>
					</motion.span>
					<div className="flex flex-1 items-center justify-end gap-12">
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={showInactive}
									onChange={(e) => setShowInactive(e.target.checked)}
								/>
							}
							label={<Typography sx={{ fontSize: '13px', color: '#64748B' }}>แสดงที่ปิดใช้งาน</Typography>}
						/>
						<TextField placeholder="ค้นหาจากชื่อลูกค้า, เลขภาษี, เบอร์โทร..." value={searchText}
							onChange={(e) => setSearchText(e.target.value)} size="small"
							sx={{
								minWidth: 340,
								'& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '15px', bgcolor: '#F8FAFC' },
							}}
							InputProps={{
								startAdornment: <InputAdornment position="start"><FuseSvgIcon size={20} color="action">lucide:search</FuseSvgIcon></InputAdornment>,
								endAdornment: searchText ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchText('')}><FuseSvgIcon size={16}>lucide:x</FuseSvgIcon></IconButton></InputAdornment> : null,
							}} />
						<motion.div className="flex grow-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
							<Button variant="contained" size="large" onClick={handleCreate}
								startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
								sx={{
									borderRadius: '10px', textTransform: 'none', fontWeight: 700,
									fontSize: '15px', px: 3, py: 1, bgcolor: '#0EA5E9',
									'&:hover': { bgcolor: '#0284C7' },
								}}>
								เพิ่มลูกค้า
							</Button>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
			{filteredCustomers.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
					<FuseSvgIcon sx={{ color: '#CBD5E1', mb: 2 }} size={64}>lucide:users</FuseSvgIcon>
					<Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>ไม่พบข้อมูลลูกค้า</Typography>
					<Typography sx={{ fontSize: '15px', color: '#94A3B8', mt: 1 }}>กดปุ่ม "เพิ่มลูกค้า" เพื่อเริ่มเพิ่มข้อมูล</Typography>
				</Box>
			) : (
				<TableContainer sx={{ flex: 1 }}>
					<Table stickyHeader>
						<TableHead>
							<TableRow sx={{
								'& th': {
									fontSize: '14px', fontWeight: 700, color: '#475569',
									borderBottom: '2px solid #E2E8F0', py: 1.5, bgcolor: '#F8FAFC',
									whiteSpace: 'nowrap',
								},
							}}>
								<TableCell align="center" sx={{ width: 50 }}>#</TableCell>
								<TableCell>กลุ่มลูกค้า</TableCell>
								<TableCell>สำนักงานใหญ่</TableCell>
								<TableCell>สาขา</TableCell>
								<TableCell>ผู้ติดต่อ</TableCell>
								<TableCell>เบอร์โทร</TableCell>
								<TableCell>อีเมล</TableCell>
								<TableCell align="center" sx={{ width: 120 }}>จัดการ</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredCustomers.map((customer, index) => {
								const isInactive = !customer.isActive;
								return (
									<TableRow key={customer.id} hover
										sx={{
											cursor: 'pointer', '&:hover': { bgcolor: '#F0F9FF' },
											opacity: isInactive ? 0.5 : 1,
											'& td': {
												fontSize: '14px', color: isInactive ? '#9CA3AF' : '#334155',
												py: 1.2, borderBottom: '1px solid #F1F5F9',
											},
										}}>
										<TableCell align="center" sx={{ fontWeight: 500, color: '#94A3B8 !important' }}>
											{index + 1}
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<div>
													<Typography sx={{
														fontSize: '14px', fontWeight: 600,
														color: isInactive ? '#9CA3AF' : '#0284C7',
														textDecoration: isInactive ? 'line-through' : 'none',
													}}>
														{customer.groupName}
													</Typography>
													<Typography sx={{ fontSize: '12px', color: '#94A3B8', mt: 0.25 }}>
														เลขผู้เสียภาษี: {customer.taxId}
													</Typography>
												</div>
												{isInactive && (
													<Chip label="ปิดใช้งาน" size="small"
														sx={{ fontSize: '11px', height: 20, bgcolor: '#FEE2E2', color: '#DC2626' }} />
												)}
											</Box>
										</TableCell>
										<TableCell>
											<Typography sx={{ fontSize: '13px', color: isInactive ? '#D1D5DB' : '#64748B', maxWidth: 280 }}>
												{customer.headOfficeAddress}
											</Typography>
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
												{customer.branches.map((branch) => (
													<Chip
														key={branch.code}
														label={`${branch.code}: ${branch.name}`}
														size="small"
														sx={{
															fontSize: '12px', fontWeight: 500, height: 24,
															bgcolor: isInactive ? '#F3F4F6' : '#E0F2FE',
															color: isInactive ? '#9CA3AF' : '#0284C7',
															border: isInactive ? '1px solid #E5E7EB' : '1px solid #BAE6FD',
														}}
													/>
												))}
												{customer.isActive && (
													<Chip
														label="+ สาขา"
														size="small"
														onClick={(e) => { e.stopPropagation(); handleManageBranches(customer); }}
														sx={{
															fontSize: '11px', height: 24, cursor: 'pointer',
															bgcolor: 'transparent', color: '#94A3B8',
															border: '1px dashed #CBD5E1',
															'&:hover': { bgcolor: '#F8FAFC', borderColor: '#0EA5E9', color: '#0EA5E9' },
														}}
													/>
												)}
											</Box>
										</TableCell>
										<TableCell>
											<Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
												{customer.contactName}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography sx={{ fontSize: '14px', color: '#64748B' }}>
												{customer.phone}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography sx={{ fontSize: '13px', color: '#64748B' }}>
												{customer.email}
											</Typography>
										</TableCell>
										<TableCell align="center">
											<Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
												<Tooltip title="แก้ไข" arrow>
													<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
														sx={{ color: '#0EA5E9', '&:hover': { bgcolor: '#E0F2FE' } }}>
														<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>
													</IconButton>
												</Tooltip>
												<Tooltip title="จัดการสาขา" arrow>
													<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleManageBranches(customer); }}
														sx={{ color: '#8B5CF6', '&:hover': { bgcolor: '#EDE9FE' } }}>
														<FuseSvgIcon size={18}>lucide:git-branch</FuseSvgIcon>
													</IconButton>
												</Tooltip>
												<Tooltip title={customer.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} arrow>
													<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDisableClick(customer); }}
														sx={{
															color: customer.isActive ? '#EF4444' : '#22C55E',
															'&:hover': { bgcolor: customer.isActive ? '#FEE2E2' : '#DCFCE7' },
														}}>
														<FuseSvgIcon size={18}>
															{customer.isActive ? 'lucide:ban' : 'lucide:check-circle'}
														</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</Box>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* ========== Create/Edit Dialog ========== */}
			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
				PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{
					fontSize: '20px', fontWeight: 700, color: '#1E293B',
					display: 'flex', alignItems: 'center', gap: 1, pb: 1,
				}}>
					<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={24}>
						{dialogMode === 'create' ? 'lucide:user-plus' : 'lucide:user-cog'}
					</FuseSvgIcon>
					{dialogMode === 'create' ? 'เพิ่มลูกค้าใหม่' : 'แก้ไขข้อมูลลูกค้า'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3 }}>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
						{/* Section: Company Info */}
						<Box sx={{ gridColumn: { md: 'span 2' } }}>
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								ข้อมูลบริษัท
							</Typography>
						</Box>
						<TextField
							label="ชื่อกลุ่มลูกค้า / บริษัท *"
							fullWidth
							value={form.groupName}
							onChange={(e) => handleFieldChange('groupName', e.target.value)}
							error={!!formErrors.groupName}
							helperText={formErrors.groupName}
							placeholder="เช่น บริษัท เอบีซี จำกัด"
							sx={{ gridColumn: { md: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>
						<TextField
							label="เลขผู้เสียภาษี *"
							fullWidth
							value={form.taxId}
							onChange={(e) => handleFieldChange('taxId', e.target.value)}
							error={!!formErrors.taxId}
							helperText={formErrors.taxId}
							placeholder="เช่น 0105528152401"
							inputProps={{ maxLength: 13 }}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>
						<Box /> {/* Spacer */}
						<TextField
							label="ที่อยู่สำนักงานใหญ่ *"
							fullWidth
							multiline
							rows={3}
							value={form.headOfficeAddress}
							onChange={(e) => handleFieldChange('headOfficeAddress', e.target.value)}
							error={!!formErrors.headOfficeAddress}
							helperText={formErrors.headOfficeAddress}
							placeholder="เช่น 123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110"
							sx={{ gridColumn: { md: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>

						{/* Section: Contact */}
						<Box sx={{ gridColumn: { md: 'span 2' }, mt: 1 }}>
							<Divider sx={{ mb: 2 }} />
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								ข้อมูลผู้ติดต่อ
							</Typography>
						</Box>
						<TextField
							label="ชื่อผู้ติดต่อ *"
							fullWidth
							value={form.contactName}
							onChange={(e) => handleFieldChange('contactName', e.target.value)}
							error={!!formErrors.contactName}
							helperText={formErrors.contactName}
							placeholder="เช่น คุณสมชาย ใจดี"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>
						<TextField
							label="เบอร์โทร *"
							fullWidth
							value={form.phone}
							onChange={(e) => handleFieldChange('phone', e.target.value)}
							error={!!formErrors.phone}
							helperText={formErrors.phone}
							placeholder="เช่น 081-234-5678"
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>
						<TextField
							label="อีเมล"
							fullWidth
							value={form.email}
							onChange={(e) => handleFieldChange('email', e.target.value)}
							placeholder="เช่น somchai@example.com"
							sx={{ gridColumn: { md: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
						/>
					</Box>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
					<Button onClick={() => setDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleSave} variant="contained"
						startIcon={<FuseSvgIcon size={18}>{dialogMode === 'create' ? 'lucide:plus' : 'lucide:save'}</FuseSvgIcon>}
						sx={{
							borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3,
							bgcolor: '#0EA5E9', '&:hover': { bgcolor: '#0284C7' },
						}}>
						{dialogMode === 'create' ? 'เพิ่มลูกค้า' : 'บันทึกการแก้ไข'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Branch Management Dialog ========== */}
			<Dialog open={branchDialogOpen} onClose={() => setBranchDialogOpen(false)} maxWidth="sm" fullWidth
				PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{
					fontSize: '20px', fontWeight: 700, color: '#1E293B',
					display: 'flex', alignItems: 'center', gap: 1, pb: 1,
				}}>
					<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={24}>lucide:git-branch</FuseSvgIcon>
					จัดการสาขา
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3 }}>
					{managingCustomer && (
						<>
							<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#475569', mb: 2 }}>
								{managingCustomer.groupName}
							</Typography>

							{/* Existing branches */}
							<Box sx={{ mb: 3 }}>
								{managingCustomer.branches.length > 0 ? (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
										{managingCustomer.branches.map((branch) => (
											<Box key={branch.code} sx={{
												display: 'flex', alignItems: 'center', justifyContent: 'space-between',
												p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0',
											}}>
												<Box>
													<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
														{branch.code}
													</Typography>
													<Typography sx={{ fontSize: '13px', color: '#64748B' }}>
														{branch.name}
													</Typography>
												</Box>
												<Tooltip title="ลบสาขานี้" arrow>
													<IconButton size="small" onClick={() => handleRemoveBranch(branch.code)}
														sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
														<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</Box>
										))}
									</Box>
								) : (
									<Typography sx={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', py: 3 }}>
										ยังไม่มีสาขา
									</Typography>
								)}
							</Box>

							{/* Add new branch */}
							<Divider sx={{ mb: 2 }} />
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
								เพิ่มสาขาใหม่
							</Typography>
							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
								<TextField
									label="รหัสสาขา"
									size="small"
									value={newBranchCode}
									onChange={(e) => setNewBranchCode(e.target.value)}
									placeholder="เช่น BRN001"
									sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
								/>
								<TextField
									label="ชื่อสาขา"
									size="small"
									fullWidth
									value={newBranchName}
									onChange={(e) => setNewBranchName(e.target.value)}
									placeholder="เช่น สาขาสุพรรณบุรี"
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
								/>
								<Button variant="contained" onClick={handleAddBranch}
									disabled={!newBranchCode.trim() || !newBranchName.trim()}
									sx={{
										borderRadius: '8px', textTransform: 'none', fontWeight: 600,
										minWidth: 80, bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' },
									}}>
									เพิ่ม
								</Button>
							</Box>
						</>
					)}
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setBranchDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ปิด
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Disable/Enable Confirmation Dialog ========== */}
			<Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth
				PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{
					fontSize: '18px', fontWeight: 700, color: '#1E293B',
					display: 'flex', alignItems: 'center', gap: 1,
				}}>
					<FuseSvgIcon sx={{ color: disableTarget?.isActive ? '#EF4444' : '#22C55E' }} size={24}>
						{disableTarget?.isActive ? 'lucide:ban' : 'lucide:check-circle'}
					</FuseSvgIcon>
					{disableTarget?.isActive ? 'ยืนยันการปิดใช้งาน' : 'ยืนยันการเปิดใช้งาน'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2.5 }}>
					{disableTarget?.isActive ? (
						<>
							<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1.5 }}>
								คุณต้องการปิดใช้งานลูกค้า:
							</Typography>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 2 }}>
								"{disableTarget?.groupName}"
							</Typography>
							<Alert severity="warning" sx={{ borderRadius: '10px' }}>
								<Typography sx={{ fontSize: '13px' }}>
									ลูกค้าที่ปิดใช้งานจะไม่แสดงในรายการ แต่ข้อมูลยังคงอยู่ในระบบและสามารถเปิดใช้งานได้อีกครั้ง
								</Typography>
							</Alert>
						</>
					) : (
						<>
							<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1.5 }}>
								คุณต้องการเปิดใช้งานลูกค้า:
							</Typography>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
								"{disableTarget?.groupName}"
							</Typography>
						</>
					)}
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setDisableDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleDisableConfirm} variant="contained"
						sx={{
							borderRadius: '10px', textTransform: 'none', fontWeight: 700,
							bgcolor: disableTarget?.isActive ? '#EF4444' : '#22C55E',
							'&:hover': { bgcolor: disableTarget?.isActive ? '#DC2626' : '#16A34A' },
						}}>
						{disableTarget?.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Snackbar ========== */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					severity={snackbar.severity}
					variant="filled"
					onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
					sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return (
		<Root
			header={header}
			content={content}
			scroll="content"
		/>
	);
}

export default CustomersPage;
