'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useAlert } from '@/components/shared/AlertProvider';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({
	'& .container': { maxWidth: '100%!important' },
}));

function fmt(n: number | string) {
	return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string | Date | null | undefined) {
	if (!d) return '-';
	return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
	DRAFT: { label: 'แบบร่าง', bgColor: '#F8FAFC', textColor: '#64748B', borderColor: '#CBD5E1' },
	APPROVED: { label: 'อนุมัติ', bgColor: '#ECFDF5', textColor: '#059669', borderColor: '#6EE7B7' },
	ORDERED: { label: 'สั่งซื้อแล้ว', bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#93C5FD' },
	RECEIVED: { label: 'รับแล้ว', bgColor: '#EEF2FF', textColor: '#4F46E5', borderColor: '#A5B4FC' },
	CANCELLED: { label: 'ยกเลิก', bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PO = any;

const thSx = {
	fontSize: '12px', fontWeight: 700, color: '#fff', py: 1.2, px: 1,
	bgcolor: '#1565C0 !important', borderBottom: '2px solid #0D47A1',
	whiteSpace: 'nowrap' as const,
};
const tdSx = { fontSize: '12.5px', py: 0.8, px: 1, borderBottom: '1px solid #E2E8F0' };
const inputSx = {
	'& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' },
	'& .MuiOutlinedInput-input': { py: '6px', px: '8px', textAlign: 'right' },
};

function PurchaseOrderDetailPage() {
	const router = useRouter();
	const params = useParams();
	const poId = params?.id as string;

	const [po, setPo] = useState<PO | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const alert = useAlert();

	// Price editing: { itemId: { materialPrice, labourPrice } }
	const [priceEdits, setPriceEdits] = useState<Record<string, { materialPrice: string; labourPrice: string }>>({});

	// Adjustment dialog
	const [adjOpen, setAdjOpen] = useState(false);
	const [adjDesc, setAdjDesc] = useState('');
	const [adjQty, setAdjQty] = useState('1');
	const [adjUnit, setAdjUnit] = useState('งาน');
	const [adjMat, setAdjMat] = useState('');
	const [adjLab, setAdjLab] = useState('');
	const [adjIsNegative, setAdjIsNegative] = useState(false);

	const fetchPO = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/purchase-orders/${poId}`);
			if (!res.ok) throw new Error('Not found');
			const data = await res.json();
			setPo(data);

			// Initialize price edits for unlocked items
			const edits: Record<string, { materialPrice: string; labourPrice: string }> = {};
			(data.items || []).forEach((it: PO) => {
				if (!it.isLocked && it.itemType === 'ITEM') {
					edits[it.id] = {
						materialPrice: Number(it.materialPrice) ? String(Number(it.materialPrice)) : '',
						labourPrice: Number(it.labourPrice) ? String(Number(it.labourPrice)) : '',
					};
				}
			});
			setPriceEdits(edits);
		} catch { setPo(null); } finally { setLoading(false); }
	}, [poId]);

	useEffect(() => { fetchPO(); }, [fetchPO]);

	// Import items from quotation
	const handleImport = async (replace = false) => {
		setSaving(true);
		try {
			const res = await fetch(`/api/purchase-orders/${poId}/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'import-from-quotation', replace }),
			});
			const data = await res.json();
			if (data.success) {
				alert.showSuccess('นำเข้าเรียบร้อย', 'รายการจากใบเสนอราคาถูกนำเข้าแล้ว');
				fetchPO();
			} else if (data.alreadyImported && !replace) {
				// Already has items — ask user to confirm re-import
				if (window.confirm('มีรายการอยู่แล้ว ต้องการรีเซ็ตและนำเข้าจากใบเสนอราคาใหม่หรือไม่?\n(รายการที่ยังไม่ได้ล็อคราคาจะถูกลบ)')) {
					await handleImport(true);
				}
			} else {
				alert.showError('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถนำเข้ารายการได้');
			}
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถนำเข้ารายการได้');
		} finally { setSaving(false); }
	};


	// Save prices & lock
	const handleSavePrices = async () => {
		setSaving(true);
		try {
			const items = Object.entries(priceEdits).map(([id, vals]) => ({
				id,
				materialPrice: parseFloat(vals.materialPrice) || 0,
				labourPrice: parseFloat(vals.labourPrice) || 0,
			}));
			const res = await fetch(`/api/purchase-orders/${poId}/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'save-prices', items }),
			});
			const data = await res.json();
			if (data.success) {
				alert.showSuccess('บันทึกเรียบร้อย', 'ราคาถูกบันทึกและล็อคแล้ว ไม่สามารถแก้ไขได้');
				fetchPO();
			} else {
				alert.showError('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกราคาได้');
			}
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกราคาได้');
		} finally { setSaving(false); }
	};

	// Add adjustment item
	const handleAddAdjustment = async () => {
		if (!adjDesc.trim()) {
			alert.showWarning('กรุณากรอกรายละเอียด');
			return;
		}
		setSaving(true);
		try {
			const qty = adjIsNegative ? -(Math.abs(parseFloat(adjQty) || 1)) : (parseFloat(adjQty) || 1);
			const res = await fetch(`/api/purchase-orders/${poId}/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'add-adjustment',
					description: adjDesc,
					quantity: qty,
					unit: adjUnit,
					materialPrice: parseFloat(adjMat) || 0,
					labourPrice: parseFloat(adjLab) || 0,
				}),
			});
			const data = await res.json();
			if (data.success) {
				alert.showSuccess('เพิ่มรายการเรียบร้อย', 'รายการปรับแก้ถูกบันทึกและล็อคแล้ว');
				setAdjOpen(false);
				setAdjDesc(''); setAdjQty('1'); setAdjUnit('งาน'); setAdjMat(''); setAdjLab(''); setAdjIsNegative(false);
				fetchPO();
			} else {
				alert.showError('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถเพิ่มรายการได้');
			}
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มรายการได้');
		} finally { setSaving(false); }
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<CircularProgress sx={{ color: '#38BDF8' }} />
			</Box>
		);
	}

	if (!po) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<Typography sx={{ fontSize: '18px', color: '#94A3B8' }}>ไม่พบข้อมูลใบสั่งซื้อ</Typography>
			</Box>
		);
	}

	const sc = statusConfig[po.status] || statusConfig.DRAFT;
	const items: PO[] = po.items || [];
	const hasItems = items.length > 0;
	const hasUnlockedItems = items.some((it: PO) => !it.isLocked && it.itemType === 'ITEM');

	const customerName = po.quotation?.customerGroup?.groupName || '-';
	const branchName = po.quotation?.branch?.name || '';
	const branchCode = po.quotation?.branch?.code || '';
	const projectName = po.quotation?.projectName || '';
	const refNo = po.quotation?.quotationNumber || '-';

	// Calculate live totals based on edits
	const calcLiveTotal = () => {
		let sub = 0;
		items.forEach((it: PO) => {
			if (it.itemType === 'HEADER') return;
			if (it.isLocked) {
				sub += Number(it.amount);
			} else if (priceEdits[it.id]) {
				const q = Number(it.quantity);
				const m = parseFloat(priceEdits[it.id].materialPrice) || 0;
				const l = parseFloat(priceEdits[it.id].labourPrice) || 0;
				sub += q * (m + l);
			}
		});
		return sub;
	};
	const liveSubtotal = hasItems ? calcLiveTotal() : Number(po.subtotal);
	const discPct = Number(po.discountPercent) || 0;
	const discAmt = liveSubtotal * discPct / 100;
	const afterDisc = liveSubtotal - discAmt;
	const vatPct = Number(po.vatPercent) || 0;
	const vatAmt = afterDisc * vatPct / 100;
	const grandTotal = afterDisc + vatAmt;

	// Render items table
	let headerIdx = 0;
	const renderItems = () => {
		return items.map((it: PO, idx: number) => {
			if (it.itemType === 'HEADER') {
				headerIdx++;
				return (
					<TableRow key={it.id} sx={{ bgcolor: '#F0F7FF' }}>
						<TableCell sx={{ ...tdSx, fontWeight: 700, color: '#1565C0' }}>{headerIdx}</TableCell>
						<TableCell colSpan={8} sx={{ ...tdSx, fontWeight: 700, color: '#1565C0' }}>
							{it.description}
							{it.isAdjustment && <Chip label="ปรับแก้" size="small" sx={{ ml: 1, fontSize: '10px', bgcolor: '#FEF3C7', color: '#D97706' }} />}
						</TableCell>
					</TableRow>
				);
			}

			const parentNum = it.parentIndex != null ? it.parentIndex + 1 : headerIdx;
			const subIdx = items.filter((x: PO, i: number) => i < idx && x.itemType === 'ITEM' && x.parentIndex === it.parentIndex).length + 1;
			const itemNum = `${parentNum}.${subIdx}`;

			const qty = Number(it.quantity);
			const isEditable = !it.isLocked && priceEdits[it.id];

			let matP = Number(it.materialPrice);
			let labP = Number(it.labourPrice);
			if (isEditable) {
				matP = parseFloat(priceEdits[it.id].materialPrice) || 0;
				labP = parseFloat(priceEdits[it.id].labourPrice) || 0;
			}
			const totalMat = qty * matP;
			const totalLab = qty * labP;
			const amount = totalMat + totalLab;

			const isNegativeQty = qty < 0;

			return (
				<TableRow key={it.id} sx={{
					bgcolor: it.isAdjustment ? (isNegativeQty ? '#FEF2F2' : '#F0FFF4') : 'transparent',
					'&:hover': { bgcolor: it.isAdjustment ? undefined : '#FAFBFD' },
				}}>
					<TableCell align="center" sx={{ ...tdSx, color: '#94A3B8', fontSize: '12px' }}>
						{it.isAdjustment ? (
							<Chip label={isNegativeQty ? '-' : '+'} size="small"
								sx={{ fontSize: '11px', fontWeight: 800, minWidth: 28,
									bgcolor: isNegativeQty ? '#FEE2E2' : '#D1FAE5',
									color: isNegativeQty ? '#DC2626' : '#059669',
								}} />
						) : itemNum}
					</TableCell>
					<TableCell sx={{ ...tdSx, maxWidth: 250 }}>
						{it.description}
						{it.isAdjustment && <Chip label="ปรับแก้" size="small" sx={{ ml: 1, fontSize: '10px', bgcolor: '#FEF3C7', color: '#D97706' }} />}
						{it.isLocked && !it.isAdjustment && (
							<Tooltip title="ล็อคแล้ว แก้ไขไม่ได้" arrow>
								<FuseSvgIcon size={14} sx={{ ml: 0.5, color: '#94A3B8', verticalAlign: 'middle' }}>lucide:lock</FuseSvgIcon>
							</Tooltip>
						)}
					</TableCell>
					<TableCell align="center" sx={{ ...tdSx, fontVariantNumeric: 'tabular-nums' }}>{qty}</TableCell>
					<TableCell align="center" sx={tdSx}>{it.unit}</TableCell>

					{/* Material Price */}
					<TableCell align="right" sx={tdSx}>
						{isEditable ? (
							<TextField size="small" value={priceEdits[it.id].materialPrice}
								onChange={(e) => setPriceEdits(prev => ({ ...prev, [it.id]: { ...prev[it.id], materialPrice: e.target.value } }))}
								sx={{ ...inputSx, width: 90 }} inputProps={{ inputMode: 'decimal' }} />
						) : (matP ? fmt(matP) : '-')}
					</TableCell>
					{/* Labour Price */}
					<TableCell align="right" sx={tdSx}>
						{isEditable ? (
							<TextField size="small" value={priceEdits[it.id].labourPrice}
								onChange={(e) => setPriceEdits(prev => ({ ...prev, [it.id]: { ...prev[it.id], labourPrice: e.target.value } }))}
								sx={{ ...inputSx, width: 90 }} inputProps={{ inputMode: 'decimal' }} />
						) : (labP ? fmt(labP) : '-')}
					</TableCell>
					{/* Total Material */}
					<TableCell align="right" sx={{ ...tdSx, fontVariantNumeric: 'tabular-nums' }}>
						{totalMat ? fmt(totalMat) : '-'}
					</TableCell>
					{/* Total Labour */}
					<TableCell align="right" sx={{ ...tdSx, fontVariantNumeric: 'tabular-nums' }}>
						{totalLab ? fmt(totalLab) : '-'}
					</TableCell>
					{/* Amount */}
					<TableCell align="right" sx={{ ...tdSx, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isNegativeQty ? '#DC2626' : '#1E293B' }}>
						{amount ? fmt(amount) : '-'}
					</TableCell>
				</TableRow>
			);
		});
	};

	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				เอกสาร {'>'} ใบสั่งซื้อให้ช่าง {'>'} {po.poNumber}
			</Typography>
			<div className="flex min-w-0 flex-auto flex-col gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-auto items-center gap-8">
					<IconButton onClick={() => router.push('/apps/purchase-orders')}>
						<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
					</IconButton>
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
							{po.poNumber}
						</Typography>
					</motion.span>
					<Chip label={sc.label} sx={{ fontSize: '13px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px' }} />
				</div>
				<div className="flex items-center gap-8">
					{po.quotationId && (
						<Tooltip title={hasItems ? 'นำเข้ารายการใหม่จากใบเสนอราคา (รีเซ็ตรายการที่ยังไม่ล็อค)' : 'นำเข้ารายการจากใบเสนอราคา'} arrow>
							<Button variant="outlined" size="medium"
								onClick={() => handleImport()}
								disabled={saving}
								startIcon={<FuseSvgIcon size={18}>lucide:download</FuseSvgIcon>}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#0EA5E9', color: '#0284C7', '&:hover': { bgcolor: '#F0F9FF' } }}>
								{hasItems ? 'นำเข้าใหม่' : 'นำเข้ารายการ'}
							</Button>
						</Tooltip>
					)}
					<Button variant="outlined" size="medium"
						onClick={() => router.push(`/apps/purchase-orders/${poId}/print`)}
						startIcon={<FuseSvgIcon size={18}>lucide:printer</FuseSvgIcon>}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>
						พิมพ์
					</Button>
					<Button variant="contained" size="medium"
						onClick={() => setAdjOpen(true)}
						startIcon={<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon>}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
						เพิ่ม/ลดรายการ
					</Button>
				</div>
			</div>
		</div>
	);


	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
			<Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>

				{/* ══════ Info Grid ══════ */}
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
					<Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0EA5E9', mb: 1, textTransform: 'uppercase' }}>ข้อมูลอ้างอิง</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>ใบเสนอราคา:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0284C7' }}>{refNo}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>ลูกค้า:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{customerName}</Typography></Box>
							{branchName && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>สาขา:</Typography><Typography sx={{ fontSize: '13px' }}>{branchCode} {branchName}</Typography></Box>}
							{projectName && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>โครงการ:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{projectName}</Typography></Box>}
							{po.workOrder?.woNumber && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>W/O:</Typography><Chip label={po.workOrder.woNumber} size="small" sx={{ fontSize: '12px', bgcolor: '#D1FAE5', color: '#166534', fontWeight: 600 }} /></Box>}
						</Box>
					</Paper>
					<Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', mb: 1, textTransform: 'uppercase' }}>ข้อมูลช่าง / วันที่</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>ทีมช่าง:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{po.team?.leaderName || '-'}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>วันที่:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.date)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>ประกัน:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.warrantyStartDate)} - {fmtDate(po.warrantyEndDate)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 90 }}>เริ่มงาน:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.startDate)} - {fmtDate(po.endDate)}</Typography></Box>
						</Box>
					</Paper>
				</Box>

				{/* ══════ No items → Import ══════ */}
				{!hasItems && po.quotationId && (
					<Box sx={{ textAlign: 'center', py: 5, mb: 3, borderRadius: '12px', border: '2px dashed #CBD5E1', bgcolor: '#FAFBFD' }}>
						<FuseSvgIcon size={48} sx={{ color: '#CBD5E1', mb: 1 }}>lucide:file-down</FuseSvgIcon>
						<Typography sx={{ fontSize: '16px', color: '#64748B', mb: 2 }}>ยังไม่มีรายการ — นำเข้าจากใบเสนอราคาที่อ้างอิง</Typography>
						<Button variant="contained" size="large" onClick={handleImport} disabled={saving}
							startIcon={<FuseSvgIcon size={20}>lucide:import</FuseSvgIcon>}
							sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}>
							{saving ? 'กำลังนำเข้า...' : 'นำเข้ารายการจากใบเสนอราคา'}
						</Button>
					</Box>
				)}

				{/* ══════ Items Table ══════ */}
				{hasItems && (
					<Box sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ ...thSx, width: 50, textAlign: 'center' }}>Item</TableCell>
									<TableCell sx={thSx}>Description</TableCell>
									<TableCell sx={{ ...thSx, width: 50, textAlign: 'center' }}>Qty</TableCell>
									<TableCell sx={{ ...thSx, width: 50, textAlign: 'center' }}>Unit</TableCell>
									<TableCell colSpan={2} sx={{ ...thSx, textAlign: 'center' }}>Price Unit/Baht</TableCell>
									<TableCell colSpan={2} sx={{ ...thSx, textAlign: 'center' }}>Total Price/Baht</TableCell>
									<TableCell sx={{ ...thSx, width: 100, textAlign: 'center' }}>Amount Baht</TableCell>
								</TableRow>
								<TableRow>
									<TableCell colSpan={4} sx={{ bgcolor: '#E3F2FD !important', py: 0 }} />
									<TableCell sx={{ bgcolor: '#E3F2FD !important', fontSize: '11px', fontWeight: 600, color: '#1565C0', textAlign: 'center', py: 0.5 }}>Material</TableCell>
									<TableCell sx={{ bgcolor: '#E3F2FD !important', fontSize: '11px', fontWeight: 600, color: '#1565C0', textAlign: 'center', py: 0.5 }}>Labour</TableCell>
									<TableCell sx={{ bgcolor: '#E3F2FD !important', fontSize: '11px', fontWeight: 600, color: '#1565C0', textAlign: 'center', py: 0.5 }}>Material</TableCell>
									<TableCell sx={{ bgcolor: '#E3F2FD !important', fontSize: '11px', fontWeight: 600, color: '#1565C0', textAlign: 'center', py: 0.5 }}>Labour</TableCell>
									<TableCell sx={{ bgcolor: '#E3F2FD !important', py: 0 }} />
								</TableRow>
							</TableHead>
							<TableBody>
								{renderItems()}
							</TableBody>
						</Table>

						{/* ══════ Summary ══════ */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderTop: '2px solid #E2E8F0', bgcolor: '#FAFBFD' }}>
							<Box sx={{ width: 280 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography sx={{ fontSize: '13px', color: '#64748B' }}>Sub Total</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(liveSubtotal)}</Typography></Box>
								{discPct > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography sx={{ fontSize: '13px', color: '#DC2626' }}>Discount {discPct}%</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{fmt(discAmt)}</Typography></Box>}
								{discPct > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography sx={{ fontSize: '13px', color: '#64748B' }}>After Discount</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(afterDisc)}</Typography></Box>}
								{vatPct > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography sx={{ fontSize: '13px', color: '#64748B' }}>Vat {vatPct}%</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(vatAmt)}</Typography></Box>}
								<Divider sx={{ my: 1 }} />
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#1565C0' }}>Grand Total</Typography><Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#1565C0', fontVariantNumeric: 'tabular-nums' }}>{fmt(grandTotal)}</Typography></Box>
							</Box>
						</Box>

						{/* Save button for unlocked items */}
						{hasUnlockedItems && (
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, borderTop: '1px solid #E2E8F0', gap: 1.5 }}>
								<Typography sx={{ flex: 1, fontSize: '13px', color: '#D97706', display: 'flex', alignItems: 'center', gap: 0.5 }}>
									<FuseSvgIcon size={16}>lucide:alert-triangle</FuseSvgIcon>
									กรอกราคาแล้วกดบันทึก — เมื่อบันทึกแล้วจะไม่สามารถแก้ไขราคาได้
								</Typography>
								<Button variant="contained" size="large" onClick={handleSavePrices} disabled={saving}
									sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
									{saving ? 'กำลังบันทึก...' : '💾 บันทึกราคา (ล็อค)'}
								</Button>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* ══════ Adjustment Dialog ══════ */}
			<Dialog open={adjOpen} onClose={() => setAdjOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>
					เพิ่ม / ลดรายการ (ปรับแก้)
				</DialogTitle>
				<DialogContent sx={{ pt: '8px !important' }}>
					<Typography sx={{ fontSize: '13px', color: '#64748B', mb: 2 }}>
						รายการนี้จะถูกล็อคทันทีหลังบันทึก ไม่สามารถแก้ไขได้ หากต้องการลบรายการเดิม ให้ใส่จำนวนติดลบ
					</Typography>
					<Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
						<Button variant={!adjIsNegative ? 'contained' : 'outlined'} onClick={() => setAdjIsNegative(false)}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, bgcolor: !adjIsNegative ? '#22C55E' : 'transparent', color: !adjIsNegative ? '#fff' : '#22C55E', borderColor: '#22C55E', '&:hover': { bgcolor: '#16A34A', color: '#fff' } }}>
							+ เพิ่มรายการ
						</Button>
						<Button variant={adjIsNegative ? 'contained' : 'outlined'} onClick={() => setAdjIsNegative(true)}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, bgcolor: adjIsNegative ? '#DC2626' : 'transparent', color: adjIsNegative ? '#fff' : '#DC2626', borderColor: '#DC2626', '&:hover': { bgcolor: '#B91C1C', color: '#fff' } }}>
							- ลดรายการ (ติดลบ)
						</Button>
					</Box>
					<TextField label="รายละเอียด" fullWidth value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
					<Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
						<TextField label="จำนวน" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} inputProps={{ inputMode: 'decimal' }} />
						<TextField label="หน่วย" value={adjUnit} onChange={(e) => setAdjUnit(e.target.value)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
					</Box>
					<Box sx={{ display: 'flex', gap: 1.5 }}>
						<TextField label="ค่าวัสดุ/หน่วย (Material)" value={adjMat} onChange={(e) => setAdjMat(e.target.value)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} inputProps={{ inputMode: 'decimal' }} />
						<TextField label="ค่าแรง/หน่วย (Labour)" value={adjLab} onChange={(e) => setAdjLab(e.target.value)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} inputProps={{ inputMode: 'decimal' }} />
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2, gap: 1 }}>
					<Button onClick={() => setAdjOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B' }}>ยกเลิก</Button>
					<Button variant="contained" onClick={handleAddAdjustment} disabled={saving}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3,
							background: adjIsNegative ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #22C55E, #16A34A)',
						}}>
						{saving ? 'กำลังบันทึก...' : (adjIsNegative ? '- บันทึกรายการลด' : '+ บันทึกรายการเพิ่ม')}
					</Button>
				</DialogActions>
			</Dialog>


		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default PurchaseOrderDetailPage;
