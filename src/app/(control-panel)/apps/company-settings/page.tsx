'use client';

import { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
  '& .container': {
    maxWidth: '100%!important',
  },
}));

type BankAccount = {
	id: string;
	bank: string;
	branch: string;
	accountName: string;
	accountNumber: string;
	type: string;
};

type CompanyData = {
	nameTh: string;
	nameEn: string;
	addressTh: string;
	addressEn: string;
	taxId: string;
	phones: string[];
	fax: string;
	email: string;
	website: string;
	lineId: string;
	quotationPrefix: string;
	quotationNotes: string;
	warranty: string;
	validDays: string;
	vatPercent: string;
	bankAccounts: BankAccount[];
};

const initialCompanyData: CompanyData = {
	nameTh: 'บริษัท เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย จำกัด',
	nameEn: 'NPK SERVICE & SUPPLY CO.,LTD.',
	addressTh: 'สำนักงานใหญ่ : 210/19 หมู่ 4 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000',
	addressEn: 'Head Office : 210/19 Moo.4, Tambon Sanamchai, Amphur Mueang Suphanburi, Suphanburi 72000',
	taxId: '0105555161084',
	phones: ['09-8942-9891', '06-5961-9799', '09-3694-4591'],
	fax: '',
	email: 'npkservicesupply@gmail.com',
	website: '',
	lineId: '',
	quotationPrefix: 'QT',
	quotationNotes: 'บริษัทฯ มีความยินดีขอเสนอราคา',
	warranty: 'รับประกันผลงานตามเงื่อนไขของบริษัทฯ',
	validDays: '30',
	vatPercent: '7',
	bankAccounts: [
		{
			id: '1',
			bank: 'ธนาคารกสิกรไทย',
			branch: 'สาขาสุพรรณบุรี',
			accountName: 'บจ. เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย',
			accountNumber: 'xxx-x-xxxxx-x',
			type: 'ออมทรัพย์',
		},
		{
			id: '2',
			bank: 'ธนาคารกรุงเทพ',
			branch: 'สาขาสุพรรณบุรี',
			accountName: 'บจ. เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย',
			accountNumber: 'xxx-x-xxxxx-x',
			type: 'กระแสรายวัน',
		},
	],
};

const emptyBankForm = { bank: '', branch: '', accountName: '', accountNumber: '', type: 'ออมทรัพย์' };
type BankForm = typeof emptyBankForm;

const bankTypes = ['ออมทรัพย์', 'กระแสรายวัน', 'ออมทรัพย์พิเศษ', 'ฝากประจำ'];

const sectionTitleSx = {
	fontSize: '13px', fontWeight: 700, color: '#0EA5E9', mb: 0, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
};
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

function CompanySettingsPage() {
	const [data, setData] = useState<CompanyData>(initialCompanyData);

	// Logo upload
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [logoUrl, setLogoUrl] = useState<string>('/assets/images/logo/npk-logo.png');
	const [logoUploading, setLogoUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	// Bank dialog
	const [bankDialogOpen, setBankDialogOpen] = useState(false);
	const [bankDialogMode, setBankDialogMode] = useState<'create' | 'edit'>('create');
	const [editingBankId, setEditingBankId] = useState<string | null>(null);
	const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm);
	const [bankFormErrors, setBankFormErrors] = useState<Partial<Record<keyof BankForm, string>>>({});

	// Delete bank dialog
	const [deleteBankOpen, setDeleteBankOpen] = useState(false);
	const [deleteBankTarget, setDeleteBankTarget] = useState<BankAccount | null>(null);

	// Snackbar
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

	// Logo upload handler
	const handleLogoUpload = async (file: File) => {
		if (!file.type.startsWith('image/png')) {
			setSnackbar({ open: true, message: 'รองรับเฉพาะไฟล์ PNG เท่านั้น', severity: 'error' });
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setSnackbar({ open: true, message: 'ขนาดไฟล์ต้องไม่เกิน 5 MB', severity: 'error' });
			return;
		}
		setLogoUploading(true);
		try {
			const formData = new FormData();
			formData.append('logo', file);
			const res = await fetch('/api/company/logo', { method: 'POST', body: formData });
			const result = await res.json();
			if (res.ok && result.url) {
				setLogoUrl(result.url);
				setSnackbar({ open: true, message: 'อัปโหลดโลโก้สำเร็จ', severity: 'success' });
			} else {
				setSnackbar({ open: true, message: result.error || 'เกิดข้อผิดพลาด', severity: 'error' });
			}
		} catch {
			setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการอัปโหลด', severity: 'error' });
		} finally {
			setLogoUploading(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleLogoUpload(file);
		e.target.value = '';
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files?.[0];
		if (file) handleLogoUpload(file);
	};

	// Field change
	const handleChange = (field: keyof CompanyData, value: string) => {
		setData((prev) => ({ ...prev, [field]: value }));
	};

	// Phone management
	const handlePhoneChange = (index: number, value: string) => {
		setData((prev) => {
			const phones = [...prev.phones];
			phones[index] = value;
			return { ...prev, phones };
		});
	};

	const handleAddPhone = () => {
		setData((prev) => ({ ...prev, phones: [...prev.phones, ''] }));
	};

	const handleRemovePhone = (index: number) => {
		if (data.phones.length <= 1) return;
		setData((prev) => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
	};

	// Bank CRUD
	const handleCreateBank = () => {
		setBankForm(emptyBankForm);
		setBankFormErrors({});
		setBankDialogMode('create');
		setEditingBankId(null);
		setBankDialogOpen(true);
	};

	const handleEditBank = (account: BankAccount) => {
		setBankForm({ bank: account.bank, branch: account.branch, accountName: account.accountName, accountNumber: account.accountNumber, type: account.type });
		setBankFormErrors({});
		setBankDialogMode('edit');
		setEditingBankId(account.id);
		setBankDialogOpen(true);
	};

	const validateBankForm = (): boolean => {
		const errors: Partial<Record<keyof BankForm, string>> = {};
		if (!bankForm.bank.trim()) errors.bank = 'กรุณาระบุชื่อธนาคาร';
		if (!bankForm.accountNumber.trim()) errors.accountNumber = 'กรุณาระบุเลขที่บัญชี';
		if (!bankForm.accountName.trim()) errors.accountName = 'กรุณาระบุชื่อบัญชี';
		setBankFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSaveBank = () => {
		if (!validateBankForm()) return;
		if (bankDialogMode === 'create') {
			setData((prev) => ({
				...prev,
				bankAccounts: [...prev.bankAccounts, { id: String(Date.now()), ...bankForm }],
			}));
			setSnackbar({ open: true, message: 'เพิ่มบัญชีธนาคารเรียบร้อยแล้ว', severity: 'success' });
		} else if (editingBankId) {
			setData((prev) => ({
				...prev,
				bankAccounts: prev.bankAccounts.map((a) => a.id === editingBankId ? { ...a, ...bankForm } : a),
			}));
			setSnackbar({ open: true, message: 'แก้ไขบัญชีธนาคารเรียบร้อยแล้ว', severity: 'success' });
		}
		setBankDialogOpen(false);
	};

	const handleDeleteBankClick = (account: BankAccount) => {
		setDeleteBankTarget(account);
		setDeleteBankOpen(true);
	};

	const handleDeleteBankConfirm = () => {
		if (!deleteBankTarget) return;
		setData((prev) => ({
			...prev,
			bankAccounts: prev.bankAccounts.filter((a) => a.id !== deleteBankTarget.id),
		}));
		setSnackbar({ open: true, message: 'ลบบัญชีธนาคารเรียบร้อยแล้ว', severity: 'success' });
		setDeleteBankOpen(false);
		setDeleteBankTarget(null);
	};

	const handleSaveAll = () => {
		setSnackbar({ open: true, message: 'บันทึกข้อมูลบริษัทเรียบร้อยแล้ว', severity: 'success' });
	};

	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				ตั้งค่าระบบ {'>'} ข้อมูลบริษัท
			</Typography>
			<div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-auto items-center gap-8">
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
							ข้อมูลบริษัท
						</Typography>
					</motion.span>
					<div className="flex flex-1 items-center justify-end gap-12">
						<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}>
							<Button variant="contained" size="large" onClick={handleSaveAll}
								startIcon={<FuseSvgIcon size={20}>lucide:save</FuseSvgIcon>}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, py: 1, bgcolor: '#0EA5E9', '&:hover': { bgcolor: '#0284C7' } }}>
								บันทึกข้อมูล
							</Button>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
			<Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

				{/* ===== Section 0: Company Logo ===== */}
				<Paper sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
					<Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E2E8F0' }}>
						<FuseSvgIcon sx={{ color: '#F59E0B' }} size={22}>lucide:image</FuseSvgIcon>
						<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>โลโก้บริษัท</Typography>
						<Chip label="แสดงในหัวใบเสนอราคา" size="small" sx={{ ml: 1, fontSize: '11px', height: 22, bgcolor: '#FEF3C7', color: '#D97706' }} />
					</Box>
					<Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
						{/* Logo Preview */}
						<Box sx={{
							width: 160, height: 160, borderRadius: '12px', border: '2px solid #E2E8F0',
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							bgcolor: '#FAFAFA', overflow: 'hidden', flexShrink: 0,
							position: 'relative',
						}}>
							{logoUploading ? (
								<CircularProgress size={40} sx={{ color: '#0EA5E9' }} />
							) : (
								<Box
									component="img"
									src={logoUrl}
									alt="Company Logo"
									sx={{
										maxWidth: '90%', maxHeight: '90%', objectFit: 'contain',
									}}
									onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							)}
						</Box>

						{/* Upload area */}
						<Box
							onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
							sx={{
								flex: 1, minHeight: 140, borderRadius: '12px',
								border: dragOver ? '2px dashed #0EA5E9' : '2px dashed #CBD5E1',
								bgcolor: dragOver ? '#F0F9FF' : '#FAFAFA',
								display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
								cursor: 'pointer', transition: 'all 0.2s',
								'&:hover': { bgcolor: '#F0F9FF', borderColor: '#0EA5E9' },
							}}
						>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png"
								style={{ display: 'none' }}
								onChange={handleFileSelect}
							/>
							<FuseSvgIcon sx={{ color: dragOver ? '#0EA5E9' : '#94A3B8', mb: 1 }} size={36}>lucide:upload-cloud</FuseSvgIcon>
							<Typography sx={{ fontSize: '15px', fontWeight: 600, color: dragOver ? '#0284C7' : '#475569', mb: 0.5 }}>
								{dragOver ? 'ปล่อยเพื่ออัปโหลด' : 'คลิกหรือลากไฟล์มาวาง'}
							</Typography>
							<Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>
								รองรับไฟล์ PNG เท่านั้น (ไม่เกิน 5 MB)
							</Typography>
							<Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
								startIcon={<FuseSvgIcon size={16}>lucide:upload</FuseSvgIcon>}
								sx={{ mt: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
								เลือกไฟล์
							</Button>
						</Box>
					</Box>
				</Paper>

				{/* ===== Section 1: Company Identity ===== */}
				<Paper sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
					<Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E2E8F0' }}>
						<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={22}>lucide:building-2</FuseSvgIcon>
						<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>ข้อมูลบริษัท</Typography>
						<Chip label="แสดงในหัวใบเสนอราคา" size="small" sx={{ ml: 1, fontSize: '11px', height: 22, bgcolor: '#DBEAFE', color: '#2563EB' }} />
					</Box>
					<Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
						<TextField label="ชื่อบริษัท (ภาษาไทย) *" fullWidth value={data.nameTh}
							onChange={(e) => handleChange('nameTh', e.target.value)} sx={fieldSx} />
						<TextField label="ชื่อบริษัท (ภาษาอังกฤษ) *" fullWidth value={data.nameEn}
							onChange={(e) => handleChange('nameEn', e.target.value)} sx={fieldSx} />
						<TextField label="ที่อยู่ (ภาษาไทย) *" fullWidth multiline rows={3} value={data.addressTh}
							onChange={(e) => handleChange('addressTh', e.target.value)}
							sx={{ gridColumn: { md: 'span 2' }, ...fieldSx }} />
						<TextField label="ที่อยู่ (ภาษาอังกฤษ)" fullWidth multiline rows={3} value={data.addressEn}
							onChange={(e) => handleChange('addressEn', e.target.value)}
							sx={{ gridColumn: { md: 'span 2' }, ...fieldSx }} />
						<TextField label="เลขประจำตัวผู้เสียภาษี *" fullWidth value={data.taxId}
							onChange={(e) => handleChange('taxId', e.target.value)}
							inputProps={{ maxLength: 13 }}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:hash</FuseSvgIcon></InputAdornment> }}
							sx={fieldSx} />
						<TextField label="อีเมล" fullWidth value={data.email}
							onChange={(e) => handleChange('email', e.target.value)}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:mail</FuseSvgIcon></InputAdornment> }}
							sx={fieldSx} />
					</Box>
				</Paper>

				{/* ===== Section 2: Contact ===== */}
				<Paper sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
					<Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<FuseSvgIcon sx={{ color: '#22C55E' }} size={22}>lucide:phone</FuseSvgIcon>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>ข้อมูลติดต่อ</Typography>
							<Chip label="แสดงในใบเสนอราคา" size="small" sx={{ ml: 1, fontSize: '11px', height: 22, bgcolor: '#DCFCE7', color: '#16A34A' }} />
						</Box>
						<Button variant="outlined" size="small" onClick={handleAddPhone}
							startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
							เพิ่มเบอร์
						</Button>
					</Box>
					<Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
						{data.phones.map((phone, index) => (
							<TextField key={index} label={`เบอร์โทร ${index + 1}`} fullWidth value={phone}
								onChange={(e) => handlePhoneChange(index, e.target.value)}
								InputProps={{
									startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:phone</FuseSvgIcon></InputAdornment>,
									endAdornment: index > 0 ? (
										<InputAdornment position="end">
											<IconButton size="small" onClick={() => handleRemovePhone(index)}
												sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
												<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
											</IconButton>
										</InputAdornment>
									) : null,
								}}
								sx={fieldSx} />
						))}
						<TextField label="แฟกซ์" fullWidth value={data.fax}
							onChange={(e) => handleChange('fax', e.target.value)}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:printer</FuseSvgIcon></InputAdornment> }}
							sx={fieldSx} />
						<TextField label="เว็บไซต์" fullWidth value={data.website}
							onChange={(e) => handleChange('website', e.target.value)}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:globe</FuseSvgIcon></InputAdornment> }}
							sx={fieldSx} />
						<TextField label="Line ID" fullWidth value={data.lineId}
							onChange={(e) => handleChange('lineId', e.target.value)}
							InputProps={{ startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18} color="action">lucide:message-circle</FuseSvgIcon></InputAdornment> }}
							sx={fieldSx} />
					</Box>
				</Paper>

				{/* ===== Section 3: Quotation Defaults ===== */}
				<Paper sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
					<Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E2E8F0' }}>
						<FuseSvgIcon sx={{ color: '#F59E0B' }} size={22}>lucide:file-text</FuseSvgIcon>
						<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>ค่าเริ่มต้นใบเสนอราคา</Typography>
						<Chip label="ใช้เป็นค่าเริ่มต้นอัตโนมัติ" size="small" sx={{ ml: 1, fontSize: '11px', height: 22, bgcolor: '#FEF3C7', color: '#D97706' }} />
					</Box>
					<Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
						<TextField label="รหัสนำหน้าเอกสาร" fullWidth value={data.quotationPrefix}
							onChange={(e) => handleChange('quotationPrefix', e.target.value)}
							helperText="เช่น QT → QT-2568-0001"
							sx={fieldSx} />
						<TextField label="อายุใบเสนอราคา (วัน)" fullWidth value={data.validDays}
							onChange={(e) => handleChange('validDays', e.target.value)}
							type="number"
							InputProps={{ endAdornment: <InputAdornment position="end">วัน</InputAdornment> }}
							sx={fieldSx} />
						<TextField label="อัตราภาษีมูลค่าเพิ่ม" fullWidth value={data.vatPercent}
							onChange={(e) => handleChange('vatPercent', e.target.value)}
							type="number"
							InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
							sx={fieldSx} />
						<Box /> {/* Spacer */}
						<TextField label="ข้อความเปิดใบเสนอราคา" fullWidth multiline rows={2} value={data.quotationNotes}
							onChange={(e) => handleChange('quotationNotes', e.target.value)}
							helperText="แสดงก่อนตารางรายการสินค้า"
							sx={{ gridColumn: { md: 'span 2' }, ...fieldSx }} />
						<TextField label="เงื่อนไขรับประกันเริ่มต้น" fullWidth multiline rows={2} value={data.warranty}
							onChange={(e) => handleChange('warranty', e.target.value)}
							helperText="แสดงท้ายใบเสนอราคา"
							sx={{ gridColumn: { md: 'span 2' }, ...fieldSx }} />
					</Box>
				</Paper>

				{/* ===== Section 4: Bank Accounts ===== */}
				<Paper sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }} elevation={0}>
					<Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={22}>lucide:landmark</FuseSvgIcon>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>บัญชีธนาคาร</Typography>
							<Chip label={`${data.bankAccounts.length} บัญชี`} size="small" sx={{ ml: 1, fontSize: '11px', height: 22, bgcolor: '#EDE9FE', color: '#7C3AED' }} />
						</Box>
						<Button variant="outlined" size="small" onClick={handleCreateBank}
							startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
							เพิ่มบัญชี
						</Button>
					</Box>
					<Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
						{data.bankAccounts.length === 0 ? (
							<Box sx={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
								<FuseSvgIcon sx={{ color: '#CBD5E1', mb: 1 }} size={48}>lucide:credit-card</FuseSvgIcon>
								<Typography sx={{ fontSize: '15px', color: '#94A3B8' }}>ยังไม่มีบัญชีธนาคาร กดปุ่ม "เพิ่มบัญชี" เพื่อเพิ่ม</Typography>
							</Box>
						) : (
							data.bankAccounts.map((account) => (
								<Card key={account.id} variant="outlined" sx={{ borderRadius: '10px', borderColor: '#E2E8F0', '&:hover': { borderColor: '#BAE6FD', boxShadow: '0 2px 8px rgba(14,165,233,0.08)' }, transition: 'all 0.2s' }}>
									<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
										<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={20}>lucide:building</FuseSvgIcon>
												<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{account.bank}</Typography>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												<Chip label={account.type} size="small" sx={{ fontSize: '11px', height: 22, bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600 }} />
												<Tooltip title="แก้ไข" arrow>
													<IconButton size="small" onClick={() => handleEditBank(account)}
														sx={{ color: '#0EA5E9', '&:hover': { bgcolor: '#E0F2FE' } }}>
														<FuseSvgIcon size={16}>lucide:pencil</FuseSvgIcon>
													</IconButton>
												</Tooltip>
												<Tooltip title="ลบ" arrow>
													<IconButton size="small" onClick={() => handleDeleteBankClick(account)}
														sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
														<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</Box>
										</Box>
										<Divider sx={{ mb: 1.5 }} />
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>สาขา:</Typography>
												<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{account.branch}</Typography>
											</Box>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>ชื่อบัญชี:</Typography>
												<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{account.accountName}</Typography>
											</Box>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80, flexShrink: 0 }}>เลขที่:</Typography>
												<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7', letterSpacing: '0.05em' }}>{account.accountNumber}</Typography>
											</Box>
										</Box>
									</CardContent>
								</Card>
							))
						)}
					</Box>
				</Paper>
			</Box>

			{/* ========== Bank Dialog ========== */}
			<Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
					<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={24}>lucide:landmark</FuseSvgIcon>
					{bankDialogMode === 'create' ? 'เพิ่มบัญชีธนาคาร' : 'แก้ไขบัญชีธนาคาร'}
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 3 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
							<TextField label="ชื่อธนาคาร *" fullWidth value={bankForm.bank}
								onChange={(e) => { setBankForm(p => ({ ...p, bank: e.target.value })); if (bankFormErrors.bank) setBankFormErrors(p => ({ ...p, bank: undefined })); }}
								error={!!bankFormErrors.bank} helperText={bankFormErrors.bank}
								placeholder="เช่น ธนาคารกสิกรไทย" sx={fieldSx} />
							<TextField label="สาขา" fullWidth value={bankForm.branch}
								onChange={(e) => setBankForm(p => ({ ...p, branch: e.target.value }))}
								placeholder="เช่น สาขาสุพรรณบุรี" sx={fieldSx} />
						</Box>
						<TextField label="ชื่อบัญชี *" fullWidth value={bankForm.accountName}
							onChange={(e) => { setBankForm(p => ({ ...p, accountName: e.target.value })); if (bankFormErrors.accountName) setBankFormErrors(p => ({ ...p, accountName: undefined })); }}
							error={!!bankFormErrors.accountName} helperText={bankFormErrors.accountName}
							placeholder="เช่น บจ. เอ็นพีเค เซอร์วิส แอนด์ ซัพพลาย" sx={fieldSx} />
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
							<TextField label="เลขที่บัญชี *" fullWidth value={bankForm.accountNumber}
								onChange={(e) => { setBankForm(p => ({ ...p, accountNumber: e.target.value })); if (bankFormErrors.accountNumber) setBankFormErrors(p => ({ ...p, accountNumber: undefined })); }}
								error={!!bankFormErrors.accountNumber} helperText={bankFormErrors.accountNumber}
								placeholder="เช่น 123-4-56789-0" sx={fieldSx} />
							<TextField label="ประเภทบัญชี" fullWidth select value={bankForm.type}
								onChange={(e) => setBankForm(p => ({ ...p, type: e.target.value }))}
								sx={fieldSx}>
								{bankTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
							</TextField>
						</Box>
					</Box>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
					<Button onClick={() => setBankDialogOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 3, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleSaveBank} variant="contained"
						startIcon={<FuseSvgIcon size={18}>{bankDialogMode === 'create' ? 'lucide:plus' : 'lucide:save'}</FuseSvgIcon>}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 3, bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}>
						{bankDialogMode === 'create' ? 'เพิ่มบัญชี' : 'บันทึก'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ========== Delete Bank Dialog ========== */}
			<Dialog open={deleteBankOpen} onClose={() => setDeleteBankOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
					<FuseSvgIcon sx={{ color: '#EF4444' }} size={24}>lucide:trash-2</FuseSvgIcon>
					ยืนยันการลบบัญชี
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2.5 }}>
					<Typography sx={{ fontSize: '15px', color: '#475569', mb: 1 }}>คุณต้องการลบบัญชี:</Typography>
					<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 0.5 }}>"{deleteBankTarget?.bank}"</Typography>
					<Typography sx={{ fontSize: '14px', color: '#64748B' }}>เลขที่: {deleteBankTarget?.accountNumber}</Typography>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setDeleteBankOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button onClick={handleDeleteBankConfirm} variant="contained"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
						ลบบัญชี
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar */}
			<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default CompanySettingsPage;
