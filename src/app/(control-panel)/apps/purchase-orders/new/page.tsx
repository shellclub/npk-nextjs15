'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useAlert } from '@/components/shared/AlertProvider';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RefResult = any;
type TeamOption = { id: string; teamName: string; leaderName: string; leaderPhone?: string; leaderAddress?: string };
type AdjustmentEntry = { adjustmentType: 'ADD' | 'DEDUCT'; description: string; amount: number };

function NewPurchaseOrderPage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const alert = useAlert();

	// Reference search
	const [refSearch, setRefSearch] = useState('');
	const [refResults, setRefResults] = useState<RefResult[]>([]);
	const [refLoading, setRefLoading] = useState(false);
	const [selectedRef, setSelectedRef] = useState<RefResult | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Team
	const [teams, setTeams] = useState<TeamOption[]>([]);
	const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);

	// Form fields
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [warrantyStart, setWarrantyStart] = useState('');
	const [warrantyEnd, setWarrantyEnd] = useState('');
	const [notes, setNotes] = useState('');

	// Contractor quote file
	const [quoteFile, setQuoteFile] = useState<File | null>(null);
	const [quotePreview, setQuotePreview] = useState('');

	// Adjustments (งานเพิ่ม/ลด)
	const [addDesc, setAddDesc] = useState('');
	const [addAmount, setAddAmount] = useState('');
	const [deductDesc, setDeductDesc] = useState('');
	const [deductAmount, setDeductAmount] = useState('');
	const [adjustments, setAdjustments] = useState<AdjustmentEntry[]>([]);

	// Calculate total
	const totalAdds = adjustments.filter(a => a.adjustmentType === 'ADD').reduce((s, a) => s + a.amount, 0);
	const totalDeducts = adjustments.filter(a => a.adjustmentType === 'DEDUCT').reduce((s, a) => s + a.amount, 0);
	const grandTotal = totalAdds - totalDeducts;

	// Fetch teams
	useEffect(() => {
		fetch('/api/technician-teams').then(r => r.json()).then(d => {
			if (Array.isArray(d)) setTeams(d);
		}).catch(() => {});
	}, []);

	// Search ref debounced
	const searchRef = useCallback(async (q: string) => {
		if (q.length < 2) { setRefResults([]); return; }
		setRefLoading(true);
		try {
			const res = await fetch(`/api/purchase-orders/search-ref?q=${encodeURIComponent(q)}`);
			const data = await res.json();
			setRefResults(Array.isArray(data) ? data : []);
		} catch { setRefResults([]); } finally { setRefLoading(false); }
	}, []);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => searchRef(refSearch), 300);
		return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
	}, [refSearch, searchRef]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setQuoteFile(file);
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = () => setQuotePreview(reader.result as string);
				reader.readAsDataURL(file);
			} else {
				setQuotePreview('');
			}
		}
	};

	const handleAddAdjustment = (type: 'ADD' | 'DEDUCT') => {
		const desc = type === 'ADD' ? addDesc : deductDesc;
		const amt = type === 'ADD' ? parseFloat(addAmount) : parseFloat(deductAmount);
		if (!desc.trim() || isNaN(amt) || amt <= 0) {
			alert.showWarning('กรุณากรอกรายละเอียด', 'กรุณากรอกรายละเอียดและจำนวนเงิน');
			return;
		}
		setAdjustments(prev => [...prev, { adjustmentType: type, description: desc, amount: amt }]);
		if (type === 'ADD') { setAddDesc(''); setAddAmount(''); }
		else { setDeductDesc(''); setDeductAmount(''); }
	};

	const handleSave = async () => {
		if (adjustments.length === 0) {
			alert.showWarning('กรุณาเพิ่มรายการ', 'ต้องมีรายการงานอย่างน้อย 1 รายการ');
			return;
		}

		setSaving(true);
		try {
			// Upload file first if exists
			let contractorQuoteUrl = '';
			// We'll upload after PO is created

			const body = {
				quotationId: selectedRef?.quotationId || null,
				workOrderId: selectedRef?.workOrderId || null,
				teamId: selectedTeam?.id || null,
				date: new Date().toISOString(),
				startDate: startDate || null,
				endDate: endDate || null,
				warrantyStartDate: warrantyStart || null,
				warrantyEndDate: warrantyEnd || null,
				totalAmount: grandTotal,
				notes: notes || null,
				adjustments,
			};

			const res = await fetch('/api/purchase-orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error('Failed to create PO');
			const newPO = await res.json();

			// Upload file if exists
			if (quoteFile) {
				const formData = new FormData();
				formData.append('file', quoteFile);
				await fetch(`/api/purchase-orders/${newPO.id}/upload`, {
					method: 'POST',
					body: formData,
				});
			}

			alert.showSuccess('สร้างเรียบร้อย', `${newPO.poNumber} ถูกสร้างแล้ว`);
			setTimeout(() => router.push('/apps/purchase-orders'), 1500);
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง PO ได้ กรุณาลองใหม่');
		} finally { setSaving(false); }
	};

	// Generate display PO number (preview)
	const now = new Date();
	const yy = String(now.getFullYear()).slice(-2);
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	const previewPO = `PO${yy}${mm}${dd}/Npk-XXX`;

	const header = (
		<div className="flex flex-auto flex-col py-4">
			<Typography sx={{ fontSize: '14px', color: '#94A3B8', mb: 0.5 }}>
				เอกสาร {'>'} ใบสั่งซื้อให้ช่าง {'>'} สร้างใหม่
			</Typography>
			<div className="flex flex-auto items-center justify-between">
				<div className="flex items-center gap-8">
					<IconButton onClick={() => router.back()}>
						<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
					</IconButton>
					<motion.span initial={{ x: -20 }} animate={{ x: 0, transition: { delay: 0.2 } }}>
						<Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#DC2626', letterSpacing: '-0.02em' }}>
							สร้าง ใบสั่งซื้อให้ช่าง ใหม่
						</Typography>
					</motion.span>
				</div>
				<Paper sx={{ px: 2, py: 1, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} elevation={0}>
					<Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>ใช้แบบที่</Typography>
					<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{previewPO}</Typography>
					<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>ยืนรับอัตโนมัติพร้อมวันที่ปัจจุบันที่สร้าง</Typography>
				</Paper>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
			<Box sx={{ px: { xs: 2, md: 3 }, py: 2, maxWidth: 900, mx: 'auto', width: '100%' }}>
				<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

					{/* ══════ 1. อ้างอิงใบเสนอราคา ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#0EA5E9' }} size={18}>lucide:search</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0EA5E9' }}>อ้างอิงใบเสนอราคา</Typography>
						</Box>
						<Autocomplete
							options={refResults}
							getOptionLabel={(op: RefResult) => op?.label || ''}
							loading={refLoading}
							onInputChange={(_, val) => setRefSearch(val)}
							onChange={(_, val) => setSelectedRef(val)}
							renderInput={(params) => (
								<TextField {...params} placeholder="ค้นหาด้วย เลขใบเสนอราคา, WO, PO หรือ ชื่อลูกค้า..."
									sx={fieldSx}
									InputProps={{
										...params.InputProps,
										endAdornment: (
											<>
												{refLoading ? <CircularProgress color="inherit" size={20} /> : null}
												{params.InputProps.endAdornment}
											</>
										),
									}}
								/>
							)}
							renderOption={(props, option) => (
								<li {...props} key={option.quotationId || option.workOrderId}>
									<Box>
										<Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{option.quotationNumber}</Typography>
										<Typography sx={{ fontSize: '12px', color: '#64748B' }}>
											{option.customerName} {option.branchName && `(${option.branchName})`}
											{option.woNumber && ` • WO: ${option.woNumber}`}
										</Typography>
										{option.projectName && (
											<Typography sx={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>{option.projectName}</Typography>
										)}
									</Box>
								</li>
							)}
							noOptionsText="ไม่พบข้อมูล"
						/>

						{/* Show selected reference info */}
						{selectedRef && (
							<Paper sx={{ mt: 2, p: 2, borderRadius: '10px', border: '1px solid #D1FAE5', bgcolor: '#F0FDF4' }} elevation={0}>
								<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ใบเสนอราคา</Typography>
										<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{selectedRef.quotationNumber}</Typography>
									</Box>
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ลูกค้า</Typography>
										<Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{selectedRef.customerName}</Typography>
									</Box>
									{selectedRef.branchName && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>สาขา</Typography>
											<Typography sx={{ fontSize: '13px' }}>{selectedRef.branchName}</Typography>
										</Box>
									)}
									{selectedRef.projectName && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ชื่อโครงการ</Typography>
											<Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{selectedRef.projectName}</Typography>
										</Box>
									)}
									{selectedRef.woNumber && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>เลข WO</Typography>
											<Chip label={selectedRef.woNumber} size="small" sx={{ fontSize: '12px', bgcolor: '#D1FAE5', color: '#166534', fontWeight: 600 }} />
										</Box>
									)}
									{selectedRef.poNumber && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>PO ลูกค้า</Typography>
											<Chip label={selectedRef.poNumber} size="small" sx={{ fontSize: '12px', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
										</Box>
									)}
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ยอดใบเสนอราคา</Typography>
										<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{fmt(selectedRef.subtotal)} บาท</Typography>
									</Box>
								</Box>

								{/* Items preview */}
								{selectedRef.items?.length > 0 && (
									<Box sx={{ mt: 1.5 }}>
										<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', mb: 0.5 }}>รายการงาน:</Typography>
										<Box sx={{ maxHeight: 150, overflow: 'auto', fontSize: '12px' }}>
											{selectedRef.items.filter((it: RefResult) => it.itemType !== 'HEADER').slice(0, 10).map((item: RefResult, i: number) => (
												<Typography key={item.id || i} sx={{ fontSize: '12px', color: '#475569', pl: 1 }}>
													• {item.description} {item.quantity > 0 && `(${item.quantity} ${item.unit || ''})`}
												</Typography>
											))}
											{selectedRef.items.length > 10 && (
												<Typography sx={{ fontSize: '12px', color: '#94A3B8', pl: 1 }}>... อีก {selectedRef.items.length - 10} รายการ</Typography>
											)}
										</Box>
									</Box>
								)}
							</Paper>
						)}
					</Box>

					{/* ══════ 2. ทีมช่าง ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#F59E0B' }} size={18}>lucide:users</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>ทีมช่าง</Typography>
						</Box>
						<Autocomplete
							options={teams}
							getOptionLabel={(op) => `${op.leaderName} (${op.teamName})`}
							value={selectedTeam}
							onChange={(_, val) => setSelectedTeam(val)}
							renderInput={(params) => <TextField {...params} label="เลือกหัวหน้าทีม" placeholder="เลือกหัวหน้าทีม" sx={fieldSx} />}
						/>
						{selectedTeam?.leaderAddress && (
							<TextField label="ที่อยู่" fullWidth value={selectedTeam.leaderAddress} InputProps={{ readOnly: true }}
								sx={{ mt: 1.5, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }} />
						)}
					</Box>

					{/* ══════ 3. วันประกัน ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#8B5CF6' }} size={18}>lucide:shield-check</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6' }}>วันประกัน</Typography>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
							<DatePickerField label="เริ่มประกัน" value={warrantyStart} onChange={setWarrantyStart} />
							<DatePickerField label="สิ้นสุดประกัน" value={warrantyEnd} onChange={setWarrantyEnd} />
						</Box>
					</Box>

					{/* ══════ 4. วันเริ่มงาน / สิ้นสุด ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#059669' }} size={18}>lucide:calendar</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>ระยะเวลางาน</Typography>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
							<DatePickerField label="วันเริ่มงาน" value={startDate} onChange={setStartDate} />
							<DatePickerField label="วันสิ้นสุด" value={endDate} onChange={setEndDate} />
						</Box>
					</Box>

					{/* ══════ 5. อัพโหลดใบเสนอราคาช่าง ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<FuseSvgIcon sx={{ color: '#0284C7' }} size={18}>lucide:upload</FuseSvgIcon>
							<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>อัพโหลด ใบเสนอราคาช่าง</Typography>
						</Box>
						<Box
							sx={{
								border: '2px dashed #CBD5E1', borderRadius: '10px', p: 3,
								display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
								bgcolor: '#FAFBFC', cursor: 'pointer',
								'&:hover': { borderColor: '#0284C7', bgcolor: '#F0F9FF' },
								transition: 'all 0.2s',
							}}
							onClick={() => document.getElementById('quote-file-input')?.click()}
						>
							<input id="quote-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
							{quoteFile ? (
								<>
									<FuseSvgIcon sx={{ color: '#22C55E' }} size={32}>lucide:check-circle</FuseSvgIcon>
									<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>{quoteFile.name}</Typography>
									{quotePreview && (
										<img src={quotePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 8 }} />
									)}
								</>
							) : (
								<>
									<FuseSvgIcon sx={{ color: '#94A3B8' }} size={40}>lucide:camera</FuseSvgIcon>
									<Typography sx={{ fontSize: '14px', color: '#94A3B8' }}>ถ่ายรูป หรือ เลือกไฟล์ (รูปภาพ, PDF)</Typography>
								</>
							)}
						</Box>
					</Box>

					{/* ══════ 6. ยอดค่างานรวม ══════ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '12px', border: '2px solid #0284C7', bgcolor: '#F0F9FF' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0284C7' }}>ยอดค่างานรวม (บาท)</Typography>
							<Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>
								{fmt(grandTotal)}
							</Typography>
						</Box>
						<Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.5 }}>
							แก้ไขไม่ได้ = งานเพิ่ม ({fmt(totalAdds)}) - งานลด ({fmt(totalDeducts)}) อัตโนมัติ
						</Typography>
					</Box>

					{/* ══════ 7. รายการปรับยอด ══════ */}
					{adjustments.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Table size="small" sx={{ '& td, & th': { fontSize: '13px', py: 0.8 } }}>
								<TableHead>
									<TableRow sx={{ '& th': { fontWeight: 700, color: '#475569', bgcolor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' } }}>
										<TableCell>#</TableCell>
										<TableCell>ประเภท</TableCell>
										<TableCell>รายละเอียด</TableCell>
										<TableCell align="right">จำนวนเงิน</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{adjustments.map((adj, i) => (
										<TableRow key={i} sx={{ '& td': { borderBottom: '1px solid #F1F5F9' } }}>
											<TableCell sx={{ color: '#94A3B8' }}>{i + 1}</TableCell>
											<TableCell>
												<Chip
													label={adj.adjustmentType === 'ADD' ? 'งานเพิ่ม' : 'งานลด'}
													size="small"
													sx={{
														fontSize: '11px', fontWeight: 600,
														bgcolor: adj.adjustmentType === 'ADD' ? '#D1FAE5' : '#FEE2E2',
														color: adj.adjustmentType === 'ADD' ? '#166534' : '#DC2626',
													}}
												/>
											</TableCell>
											<TableCell>{adj.description}</TableCell>
											<TableCell align="right" sx={{
												fontWeight: 600, fontVariantNumeric: 'tabular-nums',
												color: adj.adjustmentType === 'ADD' ? '#059669' : '#DC2626',
											}}>
												{adj.adjustmentType === 'ADD' ? '+' : '-'}{fmt(adj.amount)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					)}

					{/* ══════ 8. รายละเอียดงานเพิ่ม ══════ */}
					<Box sx={{ mb: 2, p: 2, borderRadius: '12px', border: '1.5px solid #22C55E', bgcolor: '#FAFFF5' }}>
						<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', mb: 1.5 }}>รายละเอียดงานเพิ่ม</Typography>
						<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
							<TextField size="small" label="รายละเอียด" value={addDesc}
								onChange={(e) => setAddDesc(e.target.value)} sx={{ flex: 2, ...fieldSx }}
								placeholder="เช่น งานเพิ่มเติมชั้น 3" />
							<TextField size="small" label="จำนวนเงินที่เพิ่ม" value={addAmount}
								onChange={(e) => setAddAmount(e.target.value)} sx={{ flex: 1, ...fieldSx }}
								inputProps={{ inputMode: 'decimal' }} placeholder="0.00" />
							<Button variant="contained" size="medium" onClick={() => handleAddAdjustment('ADD')}
								sx={{
									borderRadius: '10px', textTransform: 'none', fontWeight: 700, mt: 0.3,
									bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, minWidth: 80,
								}}>
								<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon> เพิ่ม
							</Button>
						</Box>
					</Box>

					{/* ══════ 9. รายละเอียดงานลด ══════ */}
					<Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1.5px solid #DC2626', bgcolor: '#FFFBFB' }}>
						<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', mb: 1.5 }}>รายละเอียดงานลด</Typography>
						<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
							<TextField size="small" label="รายละเอียด" value={deductDesc}
								onChange={(e) => setDeductDesc(e.target.value)} sx={{ flex: 2, ...fieldSx }}
								placeholder="เช่น ตัดงานชั้น 2 ออก" />
							<TextField size="small" label="จำนวนเงินที่ลด" value={deductAmount}
								onChange={(e) => setDeductAmount(e.target.value)} sx={{ flex: 1, ...fieldSx }}
								inputProps={{ inputMode: 'decimal' }} placeholder="0.00" />
							<Button variant="contained" size="medium" onClick={() => handleAddAdjustment('DEDUCT')}
								sx={{
									borderRadius: '10px', textTransform: 'none', fontWeight: 700, mt: 0.3,
									bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, minWidth: 80,
								}}>
								<FuseSvgIcon size={18}>lucide:minus</FuseSvgIcon> ลด
							</Button>
						</Box>
					</Box>

					{/* ══════ หมายเหตุ ══════ */}
					<TextField label="หมายเหตุ" fullWidth multiline rows={2} value={notes}
						onChange={(e) => setNotes(e.target.value)} sx={{ mb: 3, ...fieldSx }} />

					{/* ══════ Buttons ══════ */}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 3 }}>
						<Button variant="outlined" size="large" onClick={() => router.back()}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 4, color: '#64748B', borderColor: '#E2E8F0' }}>ยกเลิก</Button>
						<Button variant="contained" size="large" onClick={handleSave} disabled={saving}
							sx={{
								borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 4,
								background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
								'&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' },
							}}>
							{saving ? 'กำลังบันทึก...' : 'บันทึก'}
						</Button>
					</Box>

				</motion.div>
			</Box>

		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default NewPurchaseOrderPage;
