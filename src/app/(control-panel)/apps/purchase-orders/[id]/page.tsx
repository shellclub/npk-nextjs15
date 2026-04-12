'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import DatePickerField from '@/components/shared/DatePickerField';

const Root = styled(FusePageCarded)(() => ({
	'& .container': { maxWidth: '100%!important' },
}));

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

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
type TeamOption = { id: string; teamName: string; leaderName: string; leaderPhone?: string; leaderAddress?: string };

function PurchaseOrderDetailPage() {
	const router = useRouter();
	const params = useParams();
	const poId = params?.id as string;

	const [po, setPo] = useState<PO | null>(null);
	const [loading, setLoading] = useState(true);
	const [mode, setMode] = useState<'view' | 'edit'>('view');
	const [saving, setSaving] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

	// Edit fields
	const [teams, setTeams] = useState<TeamOption[]>([]);
	const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [warrantyStart, setWarrantyStart] = useState('');
	const [warrantyEnd, setWarrantyEnd] = useState('');
	const [notes, setNotes] = useState('');

	// New adjustment
	const [addDesc, setAddDesc] = useState('');
	const [addAmount, setAddAmount] = useState('');
	const [deductDesc, setDeductDesc] = useState('');
	const [deductAmount, setDeductAmount] = useState('');

	const fetchPO = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/purchase-orders/${poId}`);
			if (!res.ok) throw new Error('Not found');
			const data = await res.json();
			setPo(data);
			// Set edit fields
			setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
			setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
			setWarrantyStart(data.warrantyStartDate ? data.warrantyStartDate.split('T')[0] : '');
			setWarrantyEnd(data.warrantyEndDate ? data.warrantyEndDate.split('T')[0] : '');
			setNotes(data.notes || '');
			if (data.team) setSelectedTeam(data.team);
		} catch { setPo(null); } finally { setLoading(false); }
	}, [poId]);

	useEffect(() => { fetchPO(); }, [fetchPO]);
	useEffect(() => {
		fetch('/api/technician-teams').then(r => r.json()).then(d => {
			if (Array.isArray(d)) setTeams(d);
		}).catch(() => {});
	}, []);

	const handleAddAdjustment = async (type: 'ADD' | 'DEDUCT') => {
		const desc = type === 'ADD' ? addDesc : deductDesc;
		const amt = type === 'ADD' ? parseFloat(addAmount) : parseFloat(deductAmount);
		if (!desc.trim() || isNaN(amt) || amt <= 0) {
			setSnackbar({ open: true, message: 'กรุณากรอกรายละเอียดและจำนวนเงิน', severity: 'error' });
			return;
		}
		try {
			await fetch(`/api/purchase-orders/${poId}/adjustments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ adjustmentType: type, description: desc, amount: amt }),
			});
			if (type === 'ADD') { setAddDesc(''); setAddAmount(''); }
			else { setDeductDesc(''); setDeductAmount(''); }
			fetchPO();
			setSnackbar({ open: true, message: 'เพิ่มรายการเรียบร้อย', severity: 'success' });
		} catch {
			setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
		}
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await fetch(`/api/purchase-orders/${poId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					teamId: selectedTeam?.id || null,
					startDate: startDate || null,
					endDate: endDate || null,
					warrantyStartDate: warrantyStart || null,
					warrantyEndDate: warrantyEnd || null,
					notes: notes || null,
				}),
			});
			setSnackbar({ open: true, message: 'บันทึกเรียบร้อย', severity: 'success' });
			setMode('view');
			fetchPO();
		} catch {
			setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
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
	const adjustments = po.adjustments || [];
	const totalAdds = adjustments.filter((a: PO) => a.adjustmentType === 'ADD').reduce((s: number, a: PO) => s + Number(a.amount), 0);
	const totalDeducts = adjustments.filter((a: PO) => a.adjustmentType === 'DEDUCT').reduce((s: number, a: PO) => s + Number(a.amount), 0);
	const grandTotal = totalAdds - totalDeducts;

	const customerName = po.quotation?.customerGroup?.groupName || po.workOrder?.quotation?.customerGroup?.groupName || '-';
	const branchName = po.quotation?.branch?.name || po.workOrder?.quotation?.branch?.name || '';
	const projectName = po.quotation?.projectName || po.workOrder?.quotation?.projectName || '';
	const refNo = po.quotation?.quotationNumber || po.workOrder?.quotation?.quotationNumber || '-';

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
					<div className="flex flex-1 items-center justify-end gap-12">
						{mode === 'view' && (
							<Button variant="outlined" size="large" onClick={() => setMode('edit')}
								startIcon={<FuseSvgIcon size={20}>lucide:pencil</FuseSvgIcon>}
								sx={{ borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 600, textTransform: 'none', borderColor: '#E2E8F0', color: '#0284C7' }}>แก้ไข</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
			<Box sx={{ px: { xs: 2, md: 3 }, py: 2, maxWidth: 900, mx: 'auto', width: '100%' }}>

				{/* ══════ Info Section ══════ */}
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
					<Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0EA5E9', mb: 1, textTransform: 'uppercase' }}>ข้อมูลอ้างอิง</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>ใบเสนอราคา:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0284C7' }}>{refNo}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>ลูกค้า:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{customerName}</Typography></Box>
							{branchName && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>สาขา:</Typography><Typography sx={{ fontSize: '13px' }}>{branchName}</Typography></Box>}
							{projectName && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>โครงการ:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{projectName}</Typography></Box>}
							{po.workOrder?.woNumber && <Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>WO:</Typography><Chip label={po.workOrder.woNumber} size="small" sx={{ fontSize: '12px', bgcolor: '#D1FAE5', color: '#166534', fontWeight: 600 }} /></Box>}
						</Box>
					</Paper>
					<Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }} elevation={0}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', mb: 1, textTransform: 'uppercase' }}>ข้อมูลช่าง / วันที่</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>ทีมช่าง:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{po.team?.leaderName || po.team?.teamName || '-'}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>วันที่:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.date)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>เริ่มงาน:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.startDate)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>สิ้นสุด:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.endDate)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>เริ่มประกัน:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.warrantyStartDate)}</Typography></Box>
							<Box sx={{ display: 'flex', gap: 1 }}><Typography sx={{ fontSize: '13px', color: '#94A3B8', width: 80 }}>สิ้นสุดประกัน:</Typography><Typography sx={{ fontSize: '13px' }}>{fmtDate(po.warrantyEndDate)}</Typography></Box>
						</Box>
					</Paper>
				</Box>

				{/* Contractor Quote */}
				{po.contractorQuoteUrl && (
					<Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', mb: 1, textTransform: 'uppercase' }}>ใบเสนอราคาช่าง</Typography>
						{po.contractorQuoteUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
							<img src={po.contractorQuoteUrl} alt="Contractor Quote" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
						) : (
							<a href={po.contractorQuoteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', fontWeight: 600 }}>
								📄 ดูไฟล์ใบเสนอราคาช่าง
							</a>
						)}
					</Box>
				)}

				{/* ══════ ยอดรวม ══════ */}
				<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '2px solid #0284C7', bgcolor: '#F0F9FF' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>ยอดค่างานรวม (บาท)</Typography>
						<Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>
							{fmt(po.totalAmount ? Number(po.totalAmount) : grandTotal)}
						</Typography>
					</Box>
					<Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.5 }}>
						งานเพิ่ม ({fmt(totalAdds)}) - งานลด ({fmt(totalDeducts)})
					</Typography>
				</Box>

				{/* ══════ Adjustments Table ══════ */}
				{adjustments.length > 0 && (
					<Box sx={{ mb: 3 }}>
						<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#475569', mb: 1 }}>รายการปรับยอด ({adjustments.length} รายการ)</Typography>
						<Table size="small" sx={{ '& td, & th': { fontSize: '13px', py: 0.8 } }}>
							<TableHead>
								<TableRow sx={{ '& th': { fontWeight: 700, color: '#475569', bgcolor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' } }}>
									<TableCell>#</TableCell>
									<TableCell>ประเภท</TableCell>
									<TableCell>รายละเอียด</TableCell>
									<TableCell align="right">จำนวนเงิน</TableCell>
									<TableCell>วันที่</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{adjustments.map((adj: PO, i: number) => (
									<TableRow key={adj.id || i} sx={{ '& td': { borderBottom: '1px solid #F1F5F9' } }}>
										<TableCell sx={{ color: '#94A3B8' }}>{i + 1}</TableCell>
										<TableCell>
											<Chip label={adj.adjustmentType === 'ADD' ? 'งานเพิ่ม' : 'งานลด'} size="small"
												sx={{ fontSize: '11px', fontWeight: 600, bgcolor: adj.adjustmentType === 'ADD' ? '#D1FAE5' : '#FEE2E2', color: adj.adjustmentType === 'ADD' ? '#166534' : '#DC2626' }} />
										</TableCell>
										<TableCell>{adj.description}</TableCell>
										<TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: adj.adjustmentType === 'ADD' ? '#059669' : '#DC2626' }}>
											{adj.adjustmentType === 'ADD' ? '+' : '-'}{fmt(adj.amount)}
										</TableCell>
										<TableCell sx={{ fontSize: '12px', color: '#94A3B8' }}>{fmtDate(adj.createdAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				)}

				{/* ══════ Add Adjustments (always available) ══════ */}
				<Box sx={{ mb: 2, p: 2, borderRadius: '12px', border: '1.5px solid #22C55E', bgcolor: '#FAFFF5' }}>
					<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', mb: 1.5 }}>เพิ่มรายการงานเพิ่ม</Typography>
					<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
						<TextField size="small" label="รายละเอียด" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} sx={{ flex: 2, ...fieldSx }} />
						<TextField size="small" label="จำนวนเงิน" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} sx={{ flex: 1, ...fieldSx }} inputProps={{ inputMode: 'decimal' }} />
						<Button variant="contained" size="medium" onClick={() => handleAddAdjustment('ADD')}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, mt: 0.3, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, minWidth: 80 }}>
							<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon> เพิ่ม
						</Button>
					</Box>
				</Box>

				<Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1.5px solid #DC2626', bgcolor: '#FFFBFB' }}>
					<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', mb: 1.5 }}>เพิ่มรายการงานลด</Typography>
					<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
						<TextField size="small" label="รายละเอียด" value={deductDesc} onChange={(e) => setDeductDesc(e.target.value)} sx={{ flex: 2, ...fieldSx }} />
						<TextField size="small" label="จำนวนเงิน" value={deductAmount} onChange={(e) => setDeductAmount(e.target.value)} sx={{ flex: 1, ...fieldSx }} inputProps={{ inputMode: 'decimal' }} />
						<Button variant="contained" size="medium" onClick={() => handleAddAdjustment('DEDUCT')}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, mt: 0.3, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, minWidth: 80 }}>
							<FuseSvgIcon size={18}>lucide:minus</FuseSvgIcon> ลด
						</Button>
					</Box>
				</Box>

				{/* ══════ Edit Mode Fields ══════ */}
				{mode === 'edit' && (
					<>
						<Divider sx={{ my: 3 }} />
						<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', mb: 2 }}>แก้ไขข้อมูล</Typography>

						<Box sx={{ mb: 2, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
							<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', mb: 1.5 }}>ทีมช่าง</Typography>
							<Autocomplete options={teams} getOptionLabel={(op) => `${op.leaderName} (${op.teamName})`}
								value={selectedTeam} onChange={(_, val) => setSelectedTeam(val)}
								renderInput={(params) => <TextField {...params} label="เลือกหัวหน้าทีม" sx={fieldSx} />} />
						</Box>

						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
							<DatePickerField label="เริ่มประกัน" value={warrantyStart} onChange={setWarrantyStart} />
							<DatePickerField label="สิ้นสุดประกัน" value={warrantyEnd} onChange={setWarrantyEnd} />
							<DatePickerField label="วันเริ่มงาน" value={startDate} onChange={setStartDate} />
							<DatePickerField label="วันสิ้นสุด" value={endDate} onChange={setEndDate} />
						</Box>

						<TextField label="หมายเหตุ" fullWidth multiline rows={2} value={notes}
							onChange={(e) => setNotes(e.target.value)} sx={{ mb: 3, ...fieldSx }} />

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 3 }}>
							<Button variant="outlined" size="large" onClick={() => setMode('view')}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 4, color: '#64748B', borderColor: '#E2E8F0' }}>ยกเลิก</Button>
							<Button variant="contained" size="large" onClick={handleSave} disabled={saving}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
								{saving ? 'กำลังบันทึก...' : 'บันทึก'}
							</Button>
						</Box>
					</>
				)}

				{/* Notes */}
				{po.notes && mode === 'view' && (
					<Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#D97706', mb: 0.5 }}>หมายเหตุ</Typography>
						<Typography sx={{ fontSize: '13px', color: '#475569' }}>{po.notes}</Typography>
					</Box>
				)}
			</Box>

			<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default PurchaseOrderDetailPage;
