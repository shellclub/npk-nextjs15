'use client';
import { styled } from '@mui/material/styles';
import { memo, useState, useEffect, useCallback } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useUser from '@auth/useUser';
import DatePickerField from '@/components/shared/DatePickerField';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useRouter, usePathname } from 'next/navigation';

const FloatingButton = styled('div')(() => ({
	position: 'absolute',
	height: 44,
	width: 44,
	right: 0,
	top: 160,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	overflow: 'hidden',
	borderTopLeftRadius: 10,
	borderBottomLeftRadius: 10,
	zIndex: 999,
	cursor: 'pointer',
	background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
	color: '#fff',
	boxShadow: '0 4px 14px rgba(2,132,199,0.4)',
	transition: 'all 0.2s ease',
	'&:hover': {
		width: 48,
		background: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
		boxShadow: '0 6px 20px rgba(2,132,199,0.5)',
	},
}));

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };
const today = () => new Date().toISOString().split('T')[0];

type WOStatus = { id: string; name: string; code: string; color: string; bgColor: string; isActive: boolean; isDefault?: boolean };

const menuItems = [
	{
		group: 'เอกสาร',
		items: [
			{ icon: 'lucide:file-text', label: 'ใบเสนอราคา', url: '/apps/quotations' },
			{ icon: 'lucide:clipboard-check', label: 'ออก WO (ใบตอบรับงาน)', action: 'wo' as const },
			{ icon: 'lucide:file-input', label: 'ออก PO (เลขสั่งซื้อ)', action: 'po' as const },
			{ icon: 'lucide:shopping-cart', label: 'ใบสั่งซื้อให้ช่าง', url: '/apps/purchase-orders' },
		],
	},
	{
		group: 'การเงิน',
		items: [
			{ icon: 'lucide:receipt', label: 'ใบแจ้งหนี้', url: '/apps/invoices' },
			{ icon: 'lucide:file-badge', label: 'ใบกำกับภาษี', url: '/apps/tax-invoices' },
			{ icon: 'lucide:download', label: 'ใบสำคัญรับ', url: '/apps/receipt-vouchers' },
			{ icon: 'lucide:upload', label: 'ใบสำคัญจ่าย', url: '/apps/payment-vouchers' },
			{ icon: 'lucide:file-spreadsheet', label: 'ออก 50 ทวิ', url: '/apps/withholding-tax' },
		],
	},
	{
		group: 'จัดการงาน',
		items: [
			{ icon: 'lucide:circle-check', label: 'งานเสร็จแล้วทั้งหมด', url: '/apps/completed-works' },
			{ icon: 'lucide:clock', label: 'งานเสร็จรอจ่ายช่าง', url: '/apps/pending-payments' },
		],
	},
	{
		group: 'ข้อมูลหลัก',
		items: [
			{ icon: 'lucide:building-2', label: 'ข้อมูลลูกค้า', url: '/apps/customers' },
			{ icon: 'lucide:hard-hat', label: 'ข้อมูลทีมช่าง', url: '/apps/technicians' },
			{ icon: 'lucide:settings', label: 'ข้อมูลบริษัท', url: '/apps/company-settings' },
			{ icon: 'lucide:tags', label: 'ตั้งค่าสถานะ WO', url: '/apps/work-order-statuses' },
		],
	},
];

/**
 * Work order command menu - replaces the old theme configurator.
 */
function Configurator() {
	const { isGuest } = useUser();
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// WO/PO popup state
	const [popupType, setPopupType] = useState<'wo' | 'po' | null>(null);
	const [popupSaving, setPopupSaving] = useState(false);
	const [statuses, setStatuses] = useState<WOStatus[]>([]);
	const [popupForm, setPopupForm] = useState({
		statusCode: '',
		number: '',
		date: today(),
		notes: '',
	});
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

	// Only show on quotation detail/edit/create pages (not the list page)
	const isQuotationDetailPage = pathname.startsWith('/apps/quotations/');

	// Load statuses when popup opens
	useEffect(() => {
		if (popupType) {
			fetch('/api/work-order-statuses').then(r => r.json()).then(d => {
				const active = (Array.isArray(d) ? d : []).filter((s: WOStatus) => s.isActive);
				setStatuses(active);
				const def = active.find((s: WOStatus) => s.isDefault);
				if (def) setPopupForm(prev => ({ ...prev, statusCode: def.code }));
			}).catch(() => setStatuses([]));
		}
	}, [popupType]);

	if (isGuest || !isQuotationDetailPage) {
		return null;
	}

	const handleNavigate = (url: string) => {
		router.push(url);
		setOpen(false);
	};

	const handleMenuClick = (item: typeof menuItems[0]['items'][0]) => {
		if ('url' in item && item.url) {
			handleNavigate(item.url);
		} else if ('action' in item) {
			setOpen(false);
			setPopupType(item.action as 'wo' | 'po');
			setPopupForm({ statusCode: '', number: '', date: today(), notes: '' });
		}
	};

	const handlePopupClose = () => {
		setPopupType(null);
		setPopupForm({ statusCode: '', number: '', date: today(), notes: '' });
	};

	// Extract quotationId from pathname (e.g. /apps/quotations/abc123 or /apps/quotations/abc123/edit)
	const getQuotationId = () => {
		const parts = pathname.split('/');
		const qIdx = parts.indexOf('quotations');
		if (qIdx >= 0 && parts[qIdx + 1] && parts[qIdx + 1] !== 'create') {
			return parts[qIdx + 1];
		}
		return null;
	};

	const handlePopupSave = async () => {
		if (!popupForm.statusCode) {
			setSnackbar({ open: true, message: 'กรุณาเลือกสถานะ', severity: 'error' });
			return;
		}
		if (!popupForm.number) {
			setSnackbar({ open: true, message: `กรุณากรอกเลข ${popupType === 'wo' ? 'WO' : 'PO'}`, severity: 'error' });
			return;
		}

		setPopupSaving(true);
		try {
			const quotationId = getQuotationId();

			if (popupType === 'wo') {
				// Create WO via API
				const body: Record<string, unknown> = {
					woNumber: popupForm.number,
					woDate: popupForm.date,
					statusCode: popupForm.statusCode,
					notes: popupForm.notes || null,
				};
				if (quotationId) body.quotationId = quotationId;

				const res = await fetch('/api/work-orders', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				});
				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error(err.error || 'Failed');
				}
				setSnackbar({ open: true, message: `สร้าง WO ${popupForm.number} เรียบร้อย`, severity: 'success' });
			} else {
				// Update PO on existing WO (find WO by quotationId and patch)
				const quotationId = getQuotationId();
				if (quotationId) {
					// Find WOs linked to this quotation
					const woRes = await fetch(`/api/work-orders?quotationId=${quotationId}`);
					const wos = await woRes.json();
					const woList = Array.isArray(wos) ? wos : [];
					if (woList.length > 0) {
						// Update the first WO with PO info
						const res = await fetch(`/api/work-orders/${woList[0].id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								poNumber: popupForm.number,
								poDate: popupForm.date,
								status: popupForm.statusCode,
								notes: popupForm.notes || null,
							}),
						});
						if (!res.ok) throw new Error('Failed');
						setSnackbar({ open: true, message: `บันทึก PO ${popupForm.number} เรียบร้อย`, severity: 'success' });
					} else {
						// No WO found — create one with PO info
						const res = await fetch('/api/work-orders', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								woNumber: `WO-PO-${popupForm.number}`,
								woDate: popupForm.date,
								poNumber: popupForm.number,
								poDate: popupForm.date,
								statusCode: popupForm.statusCode,
								notes: popupForm.notes || null,
								quotationId,
							}),
						});
						if (!res.ok) throw new Error('Failed');
						setSnackbar({ open: true, message: `สร้าง PO ${popupForm.number} เรียบร้อย`, severity: 'success' });
					}
				} else {
					setSnackbar({ open: true, message: 'ไม่พบใบเสนอราคาที่อ้างอิง', severity: 'error' });
				}
			}
			handlePopupClose();
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
		} finally {
			setPopupSaving(false);
		}
	};

	const isWO = popupType === 'wo';
	const popupTitle = isWO ? 'ออกเลข WO (ใบตอบรับงาน)' : 'ออกเลข PO (เลขสั่งซื้อ)';
	const popupIcon = isWO ? 'lucide:clipboard-check' : 'lucide:file-input';
	const popupColor = isWO ? '#0284C7' : '#7C3AED';

	return (
		<>
			<FloatingButton onClick={() => setOpen(true)}>
				<FuseSvgIcon size={22}>lucide:layout-list</FuseSvgIcon>
			</FloatingButton>

			<Drawer
				anchor="right"
				open={open}
				onClose={() => setOpen(false)}
				PaperProps={{
					sx: {
						width: 320,
						borderTopLeftRadius: '16px',
						borderBottomLeftRadius: '16px',
						bgcolor: '#FFFFFF',
						boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
					},
				}}
			>
				{/* Header */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						px: 2.5,
						py: 2,
						borderBottom: '1px solid #F1F5F9',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<FuseSvgIcon size={22} sx={{ color: '#0284C7' }}>
							lucide:layout-list
						</FuseSvgIcon>
						<Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
							คำสั่งงาน
						</Typography>
					</Box>
					<IconButton
						onClick={() => setOpen(false)}
						size="small"
						sx={{
							color: '#94A3B8',
							'&:hover': { bgcolor: '#F1F5F9', color: '#475569' },
						}}
					>
						<FuseSvgIcon size={20}>lucide:x</FuseSvgIcon>
					</IconButton>
				</Box>

				{/* Menu Content */}
				<Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
					{menuItems.map((group, gIdx) => (
						<Box key={group.group}>
							<Typography
								sx={{
									fontSize: '11px',
									fontWeight: 700,
									color: '#94A3B8',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									px: 2.5,
									pt: gIdx === 0 ? 1 : 2,
									pb: 0.5,
								}}
							>
								{group.group}
							</Typography>
							<List disablePadding>
								{group.items.map((item, iIdx) => {
									const isAction = 'action' in item;
									const actionColor = isAction && item.action === 'wo' ? '#0284C7' : isAction && item.action === 'po' ? '#7C3AED' : undefined;
									return (
										<ListItemButton
											key={iIdx}
											onClick={() => handleMenuClick(item)}
											sx={{
												px: 2.5,
												py: 1.2,
												mx: 1,
												borderRadius: '10px',
												...(isAction && {
													bgcolor: actionColor === '#7C3AED' ? '#F5F3FF' : '#EFF6FF',
													border: `1px solid ${actionColor}20`,
													mb: 0.5,
												}),
												'&:hover': {
													bgcolor: isAction ? (actionColor === '#7C3AED' ? '#EDE9FE' : '#DBEAFE') : '#F0F9FF',
													'& .MuiListItemIcon-root': { color: actionColor || '#0284C7' },
													'& .MuiListItemText-primary': { color: actionColor || '#0284C7' },
												},
											}}
										>
											<ListItemIcon sx={{ minWidth: 36, color: isAction ? actionColor : '#64748B' }}>
												<FuseSvgIcon size={20}>{item.icon}</FuseSvgIcon>
											</ListItemIcon>
											<ListItemText
												primary={item.label}
												primaryTypographyProps={{
													fontSize: '14px',
													fontWeight: isAction ? 600 : 500,
													color: isAction ? actionColor : '#334155',
												}}
											/>
											{isAction && (
												<FuseSvgIcon size={16} sx={{ color: '#94A3B8' }}>lucide:chevron-right</FuseSvgIcon>
											)}
										</ListItemButton>
									);
								})}
							</List>
							{gIdx < menuItems.length - 1 && (
								<Divider sx={{ mx: 2.5, my: 1, borderColor: '#F1F5F9' }} />
							)}
						</Box>
					))}
				</Box>
			</Drawer>

			{/* ========== WO / PO Popup Dialog ========== */}
			<Dialog open={Boolean(popupType)} onClose={handlePopupClose} maxWidth="sm" fullWidth
				PaperProps={{ sx: { borderRadius: '16px' } }}>
				<DialogTitle sx={{ fontSize: '20px', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
					<FuseSvgIcon sx={{ color: popupColor }} size={24}>{popupIcon}</FuseSvgIcon>
					{popupTitle}
				</DialogTitle>
				<Divider />
				<DialogContent>
					<div className="space-y-16 mt-12">
						{/* 1. เลือกสถานะ */}
						<FormControl fullWidth size="small" required error={!popupForm.statusCode}>
							<InputLabel>กำหนดสถานะ **</InputLabel>
							<Select
								value={popupForm.statusCode}
								onChange={(e) => setPopupForm({ ...popupForm, statusCode: e.target.value })}
								label="กำหนดสถานะ **"
								sx={{ borderRadius: '10px' }}
							>
								{statuses.map(s => (
									<MenuItem key={s.code} value={s.code}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
											{s.name}
										</Box>
									</MenuItem>
								))}
							</Select>
							{!popupForm.statusCode && (
								<Typography sx={{ fontSize: '12px', color: '#DC2626', mt: 0.5, ml: 1.5 }}>บังคับเลือก</Typography>
							)}
						</FormControl>

						{/* 2. กรอกเลข WO/PO */}
						<TextField
							label={isWO ? 'เลข WO *' : 'เลข PO *'}
							value={popupForm.number}
							onChange={(e) => setPopupForm({ ...popupForm, number: e.target.value })}
							fullWidth size="small" sx={fieldSx}
							required
							placeholder={isWO ? 'เช่น WO-260401-001' : 'เช่น PO-260401-001'}
							helperText={isWO ? 'กรอกเลขที่ WO ใบตอบรับงาน' : 'กรอกเลขที่ PO จากลูกค้า'}
						/>

						{/* 3. เลือกวันที่ */}
						<DatePickerField
							label={isWO ? 'วันที่ WO' : 'วันที่ PO'}
							value={popupForm.date}
							onChange={(v) => setPopupForm({ ...popupForm, date: v })}
							helperText="มีค่าเริ่มต้นเป็นวันปัจจุบัน"
						/>

						{/* 4. กรอกหมายเหตุ */}
						<TextField
							label="หมายเหตุ / คอมเมนต์"
							value={popupForm.notes}
							onChange={(e) => setPopupForm({ ...popupForm, notes: e.target.value })}
							fullWidth size="small" multiline rows={3} sx={fieldSx}
							placeholder="บันทึกข้อความเพิ่มเติม..."
						/>
					</div>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={handlePopupClose} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '15px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ยกเลิก
					</Button>
					<Button variant="contained" onClick={handlePopupSave} disabled={popupSaving}
						sx={{
							borderRadius: '10px', textTransform: 'none', fontSize: '15px', px: 3, fontWeight: 700,
							background: isWO
								? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
								: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
							'&:hover': {
								background: isWO
									? 'linear-gradient(135deg, #0369A1 0%, #075985 100%)'
									: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
							},
						}}>
						{popupSaving ? 'กำลังบันทึก...' : `บันทึก${isWO ? ' WO' : ' PO'}`}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar */}
			<Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity}
					sx={{ width: '100%', borderRadius: '10px', fontWeight: 600 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
}

export default memo(Configurator);
