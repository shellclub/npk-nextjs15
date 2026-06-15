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
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import Fade from '@mui/material/Fade';
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

type POLineItem = {
	tempId: number;
	itemType: 'HEADER' | 'ITEM';
	description: string;
	unit: string;
	quantity: number;
	materialPrice: number;
	labourPrice: number;
	amount: number; // computed (0 for HEADERs)
	fromQuotation: boolean;
};

type POGroup = {
	id: number;
	team: TeamOption | null;
	selectedItems: Set<number>; // tempId ของรายการที่เลือก
	notes: string;
	startDate: string;
	endDate: string;
	warrantyStart: string;
	warrantyEnd: string;
};

let lineCounter = 0;
const nextId = () => ++lineCounter;

function computeAmount(item: Omit<POLineItem, 'amount'>): number {
	if (item.itemType === 'HEADER') return 0;
	const unit = item.materialPrice + item.labourPrice;
	return unit * item.quantity;
}

function NewPurchaseOrderPage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
	const showMsg = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
		setSnackbar({ open: true, message, severity });
		if (severity !== 'error') {
			setTimeout(() => setSnackbar(p => ({ ...p, open: false })), 3000);
		}
	};

	// Reference search
	const [refSearch, setRefSearch] = useState('');
	const [refResults, setRefResults] = useState<RefResult[]>([]);
	const [refLoading, setRefLoading] = useState(false);
	const [selectedRef, setSelectedRef] = useState<RefResult | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	// Team list
	const [teams, setTeams] = useState<TeamOption[]>([]);

	// Line items (editable table from quotation)
	const [lineItems, setLineItems] = useState<POLineItem[]>([]);

	// PO groups (each group = one team with selected items)
	const [poGroups, setPoGroups] = useState<POGroup[]>([
		{ id: 1, team: null, selectedItems: new Set(), notes: '', startDate: '', endDate: '', warrantyStart: '', warrantyEnd: '' },
	]);

	// Upload
	const [quoteFile, setQuoteFile] = useState<File | null>(null);

	// Notes
	const [globalNotes, setGlobalNotes] = useState('');

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

	// When a quotation is selected → populate line items (include HEADERs)
	const handleSelectRef = (val: RefResult | null) => {
		setSelectedRef(val);
		if (!val || !val.items?.length) {
			setLineItems([]);
			return;
		}
		const newItems: POLineItem[] = val.items.map((it: RefResult) => {
			const isHeader = it.itemType === 'HEADER';
			const matP = isHeader ? 0 : Number(it.materialPrice || it.unitPrice || 0);
			const labP = isHeader ? 0 : Number(it.labourPrice || 0);
			const qty = isHeader ? 0 : Number(it.quantity || 1);
			const item = {
				tempId: nextId(),
				itemType: (isHeader ? 'HEADER' : 'ITEM') as 'HEADER' | 'ITEM',
				description: it.description || '',
				unit: isHeader ? '' : (it.unit || ''),
				quantity: qty,
				materialPrice: matP,
				labourPrice: labP,
				fromQuotation: true,
			};
			return { ...item, amount: computeAmount(item) };
		});
		setLineItems(newItems);
		// Auto-select all ITEM (not HEADER) for group 1
		const itemIds = new Set(newItems.filter(it => it.itemType === 'ITEM').map(it => it.tempId));
		setPoGroups(prev => prev.map((g, i) =>
			i === 0 ? { ...g, selectedItems: itemIds } : g
		));
	};

	// --- Line item CRUD ---
	const updateLineItem = (tempId: number, field: keyof POLineItem, value: string | number) => {
		setLineItems(prev => prev.map(it => {
			if (it.tempId !== tempId) return it;
			const updated = { ...it, [field]: value };
			updated.amount = computeAmount(updated);
			return updated;
		}));
	};

	const addLineItem = () => {
		const newItem: POLineItem = {
			tempId: nextId(),
			itemType: 'ITEM',
			description: '',
			unit: '',
			quantity: 1,
			materialPrice: 0,
			labourPrice: 0,
			amount: 0,
			fromQuotation: false,
		};
		setLineItems(prev => [...prev, newItem]);
		// Add to all groups by default
		setPoGroups(prev => prev.map(g => ({
			...g,
			selectedItems: new Set([...g.selectedItems, newItem.tempId]),
		})));
	};

	const removeLineItem = (tempId: number) => {
		setLineItems(prev => prev.filter(it => it.tempId !== tempId));
		setPoGroups(prev => prev.map(g => {
			const s = new Set(g.selectedItems);
			s.delete(tempId);
			return { ...g, selectedItems: s };
		}));
	};

	// --- PO Group management ---
	const addPoGroup = () => {
		const allIds = new Set(lineItems.map(it => it.tempId));
		setPoGroups(prev => [...prev, {
			id: Date.now(),
			team: null,
			selectedItems: allIds, // default: all items
			notes: '',
			startDate: '',
			endDate: '',
			warrantyStart: '',
			warrantyEnd: '',
		}]);
	};

	const removePoGroup = (id: number) => {
		setPoGroups(prev => prev.filter(g => g.id !== id));
	};

	const updateGroup = (id: number, field: keyof POGroup, value: unknown) => {
		setPoGroups(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
	};

	const toggleGroupItem = (groupId: number, tempId: number) => {
		setPoGroups(prev => prev.map(g => {
			if (g.id !== groupId) return g;
			const s = new Set(g.selectedItems);
			if (s.has(tempId)) s.delete(tempId); else s.add(tempId);
			return { ...g, selectedItems: s };
		}));
	};

	const selectAllForGroup = (groupId: number) => {
		const all = new Set(lineItems.filter(it => it.itemType === 'ITEM').map(it => it.tempId));
		setPoGroups(prev => prev.map(g => g.id === groupId ? { ...g, selectedItems: all } : g));
	};

	const clearAllForGroup = (groupId: number) => {
		setPoGroups(prev => prev.map(g => g.id === groupId ? { ...g, selectedItems: new Set() } : g));
	};

	// Compute total for a group (ITEM only)
	const groupTotal = (g: POGroup) =>
		lineItems.filter(it => it.itemType === 'ITEM' && g.selectedItems.has(it.tempId)).reduce((s, it) => s + it.amount, 0);

	// Count selectable (non-HEADER) items
	const selectableItems = lineItems.filter(it => it.itemType === 'ITEM');

	// --- Save: creates one PO per group ---
	const handleSave = async () => {
		if (selectableItems.length === 0) { showMsg('กรุณาเพิ่มรายการงานอย่างน้อย 1 รายการ', 'warning'); return; }
		if (poGroups.some(g => g.selectedItems.size === 0)) { showMsg('ทีมช่างทุกกลุ่มต้องมีรายการงานอย่างน้อย 1 รายการ', 'warning'); return; }

		setSaving(true);
		try {
			for (const group of poGroups) {
				// Collect selected ITEM tempIds
				const selectedSet = group.selectedItems;

				// Build items for this group:
				// Include all HEADERs that have at least one selected ITEM after them,
				// and only selected ITEMs
				const groupItemIds = new Set(lineItems
					.filter(it => it.itemType === 'ITEM' && selectedSet.has(it.tempId))
					.map(it => it.tempId));

				// Walk lineItems: include HEADER if any following item (until next HEADER) is selected
				const filteredItems: typeof lineItems = [];
				for (let i = 0; i < lineItems.length; i++) {
					const it = lineItems[i];
					if (it.itemType === 'HEADER') {
						// Check if any ITEM between this header and the next header is selected
						let hasSelected = false;
						for (let j = i + 1; j < lineItems.length; j++) {
							if (lineItems[j].itemType === 'HEADER') break;
							if (groupItemIds.has(lineItems[j].tempId)) { hasSelected = true; break; }
						}
						if (hasSelected) filteredItems.push(it);
					} else if (groupItemIds.has(it.tempId)) {
						filteredItems.push(it);
					}
				}

				const total = filteredItems.filter(it => it.itemType === 'ITEM').reduce((s, it) => s + it.amount, 0);

				const body = {
					quotationId: selectedRef?.quotationId || null,
					workOrderId: selectedRef?.workOrderId || null,
					teamId: group.team?.id || null,
					date: new Date().toISOString(),
					startDate: group.startDate || null,
					endDate: group.endDate || null,
					warrantyStartDate: group.warrantyStart || null,
					warrantyEndDate: group.warrantyEnd || null,
					subtotal: total,
					totalAmount: total,
					notes: group.notes || globalNotes || null,
					// Send real items (HEADER + ITEM rows) — saved as PurchaseOrderItem
					items: filteredItems.map((it, idx) => ({
						itemOrder: idx,
						itemType: it.itemType,
						description: it.description,
						unit: it.unit,
						quantity: it.itemType === 'HEADER' ? 0 : it.quantity,
						materialPrice: it.itemType === 'HEADER' ? 0 : it.materialPrice,
						labourPrice: it.itemType === 'HEADER' ? 0 : it.labourPrice,
					})),
				};

				const res = await fetch('/api/purchase-orders', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				});
				if (!res.ok) throw new Error('Failed');
			}

			showMsg(`สร้าง ${poGroups.length} ใบสั่งซื้อเรียบร้อยแล้ว`, 'success');
			setTimeout(() => router.push('/apps/purchase-orders'), 1500);
		} catch {
			showMsg('ไม่สามารถสร้าง PO ได้ กรุณาลองใหม่', 'error');
		} finally { setSaving(false); }
	};


	// Generate preview PO number
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
					<Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>เลขที่ (ตัวอย่าง)</Typography>
					<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{previewPO}</Typography>
					<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>สร้างอัตโนมัติเมื่อบันทึก</Typography>
				</Paper>
			</div>
		</div>
	);

	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-auto rounded-b-none" elevation={0}>
			<Box sx={{ px: { xs: 2, md: 3 }, py: 2, maxWidth: 1100, mx: 'auto', width: '100%' }}>
				<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

					{/* ══ 1. อ้างอิงใบเสนอราคา ══ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '14px', border: '1px solid #E2E8F0', bgcolor: '#FAFBFC' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<FuseSvgIcon sx={{ color: '#fff' }} size={16}>lucide:search</FuseSvgIcon>
							</Box>
							<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7' }}>อ้างอิงใบเสนอราคา</Typography>
						</Box>
						<Autocomplete
							options={refResults}
							getOptionLabel={(op: RefResult) => op?.label || ''}
							loading={refLoading}
							onInputChange={(_, val) => setRefSearch(val)}
							onChange={(_, val) => handleSelectRef(val)}
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
						{selectedRef && (
							<Paper sx={{ mt: 2, p: 2, borderRadius: '10px', border: '1px solid #D1FAE5', bgcolor: '#F0FDF4' }} elevation={0}>
								<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1 }}>
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ใบเสนอราคา</Typography>
										<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7' }}>{selectedRef.quotationNumber}</Typography>
									</Box>
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ลูกค้า</Typography>
										<Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{selectedRef.customerName}</Typography>
									</Box>
									{selectedRef.projectName && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>โครงการ</Typography>
											<Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{selectedRef.projectName}</Typography>
										</Box>
									)}
									{selectedRef.woNumber && (
										<Box>
											<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>เลข WO</Typography>
											<Chip label={selectedRef.woNumber} size="small" sx={{ bgcolor: '#D1FAE5', color: '#166534', fontWeight: 700, fontSize: '12px' }} />
										</Box>
									)}
									<Box>
										<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>ยอดใบเสนอ</Typography>
										<Typography sx={{ fontSize: '15px', fontWeight: 700 }}>{fmt(selectedRef.subtotal)} บาท</Typography>
									</Box>
								</Box>
							</Paper>
						)}
					</Box>

					{/* ══ 2. รายการงาน (editable table) ══ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<FuseSvgIcon sx={{ color: '#fff' }} size={16}>lucide:list</FuseSvgIcon>
								</Box>
								<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>รายการงาน</Typography>
								<Chip label={`${selectableItems.length} รายการ`} size="small" sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 600, fontSize: '11px' }} />
							</Box>
							<Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
								onClick={addLineItem}
								sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#7C3AED', color: '#7C3AED', '&:hover': { bgcolor: '#EDE9FE' } }}>
								เพิ่มรายการ
							</Button>
						</Box>

						{lineItems.length === 0 ? (
							<Box sx={{ py: 4, textAlign: 'center', color: '#94A3B8' }}>
								<FuseSvgIcon size={40} sx={{ mb: 1, color: '#CBD5E1' }}>lucide:clipboard-list</FuseSvgIcon>
								<Typography sx={{ fontSize: '14px' }}>ยังไม่มีรายการ — เลือกใบเสนอราคาด้านบน หรือกด "+ เพิ่มรายการ"</Typography>
							</Box>
						) : (
							<Box sx={{ overflowX: 'auto' }}>
								<Table size="small" sx={{ '& td, & th': { fontSize: '13px', py: 0.8 }, minWidth: 750 }}>
									<TableHead>
										<TableRow sx={{ '& th': { fontWeight: 700, color: '#475569', bgcolor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap' } }}>
											<TableCell sx={{ width: 36, textAlign: 'center' }}>#</TableCell>
											<TableCell>รายละเอียด</TableCell>
											<TableCell sx={{ width: 70 }}>หน่วย</TableCell>
											<TableCell sx={{ width: 80 }} align="right">จำนวน</TableCell>
											<TableCell sx={{ width: 110 }} align="right">ราคาวัสดุ</TableCell>
											<TableCell sx={{ width: 110 }} align="right">ค่าแรง</TableCell>
											<TableCell sx={{ width: 120 }} align="right">รวม</TableCell>
											<TableCell sx={{ width: 44 }}></TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{lineItems.map((item, idx) => {
										const isHeader = item.itemType === 'HEADER';
										if (isHeader) {
											// HEADER row — yellow background, spans all columns
											return (
												<TableRow key={item.tempId} sx={{ bgcolor: '#FFF8E1', '& td': { borderBottom: '1px solid #FDE68A' } }}>
													<TableCell sx={{ textAlign: 'center', color: '#D97706', fontWeight: 800, fontSize: '12px !important' }}>
														{idx + 1}
													</TableCell>
													<TableCell colSpan={5}>
														<TextField
															value={item.description} size="small" fullWidth
															onChange={(e) => updateLineItem(item.tempId, 'description', e.target.value)}
															placeholder="ชื่อหัวข้อ"
															sx={{
																'& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: '#92400E' },
																'& fieldset': { border: '1px solid transparent' },
																'&:hover fieldset': { border: '1px solid #FDE68A' },
															}}
														/>
													</TableCell>
													<TableCell align="right" sx={{ color: '#D97706', fontWeight: 700 }}>—</TableCell>
													<TableCell align="center">
														<Tooltip title="ลบหัวข้อ">
															<IconButton size="small" onClick={() => removeLineItem(item.tempId)}
																sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
																<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
															</IconButton>
														</Tooltip>
													</TableCell>
												</TableRow>
											);
										}
										// ITEM row — normal editable
										return (
											<TableRow key={item.tempId}
												sx={{
													'& td': { borderBottom: '1px solid #F1F5F9' },
													bgcolor: item.fromQuotation ? 'transparent' : '#FFFBEB',
												}}>
												<TableCell sx={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</TableCell>
												<TableCell>
													<TextField
														value={item.description} size="small" fullWidth
														onChange={(e) => updateLineItem(item.tempId, 'description', e.target.value)}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px' }, '& fieldset': { border: '1px solid transparent' }, '&:hover fieldset': { border: '1px solid #E2E8F0' }, '& .Mui-focused fieldset': { border: '1px solid #7C3AED !important' } }}
														placeholder="รายละเอียดงาน"
													/>
												</TableCell>
												<TableCell>
													<TextField
														value={item.unit} size="small"
														onChange={(e) => updateLineItem(item.tempId, 'unit', e.target.value)}
														sx={{ width: 60, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px' }, '& fieldset': { border: '1px solid transparent' }, '&:hover fieldset': { border: '1px solid #E2E8F0' } }}
														placeholder="หน่วย"
													/>
												</TableCell>
												<TableCell align="right">
													<TextField
														value={item.quantity} size="small" type="number"
														onChange={(e) => updateLineItem(item.tempId, 'quantity', Number(e.target.value))}
														inputProps={{ style: { textAlign: 'right' }, min: 0 }}
														sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px' }, '& fieldset': { border: '1px solid transparent' }, '&:hover fieldset': { border: '1px solid #E2E8F0' } }}
													/>
												</TableCell>
												<TableCell align="right">
													<TextField
														value={item.materialPrice} size="small" type="number"
														onChange={(e) => updateLineItem(item.tempId, 'materialPrice', Number(e.target.value))}
														inputProps={{ style: { textAlign: 'right' }, min: 0 }}
														sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px' }, '& fieldset': { border: '1px solid transparent' }, '&:hover fieldset': { border: '1px solid #E2E8F0' } }}
													/>
												</TableCell>
												<TableCell align="right">
													<TextField
														value={item.labourPrice} size="small" type="number"
														onChange={(e) => updateLineItem(item.tempId, 'labourPrice', Number(e.target.value))}
														inputProps={{ style: { textAlign: 'right' }, min: 0 }}
														sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '13px' }, '& fieldset': { border: '1px solid transparent' }, '&:hover fieldset': { border: '1px solid #E2E8F0' } }}
													/>
												</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#1E293B', whiteSpace: 'nowrap' }}>
													{fmt(item.amount)}
												</TableCell>
												<TableCell align="center">
													<Tooltip title="ลบรายการ">
														<IconButton size="small" onClick={() => removeLineItem(item.tempId)}
															sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
															<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												</TableCell>
											</TableRow>
										);
									})}
									</TableBody>
								</Table>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, px: 1 }}>
									<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
										ยอดรวมทั้งหมด: <Box component="span" sx={{ color: '#7C3AED', fontSize: '16px' }}>{fmt(lineItems.filter(it => it.itemType === 'ITEM').reduce((s, it) => s + it.amount, 0))}</Box> บาท
									</Typography>
								</Box>
							</Box>
						)}
					</Box>

					{/* ══ 3. กลุ่มทีมช่าง (หลายทีมได้) ══ */}
					<Box sx={{ mb: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<FuseSvgIcon sx={{ color: '#fff' }} size={16}>lucide:users</FuseSvgIcon>
								</Box>
								<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#D97706' }}>ทีมช่าง & การแบ่งงาน</Typography>
								<Chip label={`${poGroups.length} ทีม`} size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '11px' }} />
							</Box>
							<Button variant="outlined" size="small" startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
								onClick={addPoGroup}
								sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#F59E0B', color: '#D97706', '&:hover': { bgcolor: '#FEF3C7' } }}>
								+ เพิ่มทีม
							</Button>
						</Box>
						<Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontSize: '13px' }}>
							แต่ละทีมจะสร้าง <strong>ใบสั่งซื้อแยก</strong> — เลือกรายการงานที่ต้องการให้แต่ละทีมรับผิดชอบ
						</Alert>

						{poGroups.map((group, gIdx) => {
							const groupLineItems = lineItems.filter(it => group.selectedItems.has(it.tempId));
							const total = groupLineItems.reduce((s, it) => s + it.amount, 0);
							return (
								<Paper key={group.id} elevation={0} sx={{
									mb: 2, borderRadius: '14px',
									border: `2px solid ${gIdx === 0 ? '#F59E0B' : '#E2E8F0'}`,
									overflow: 'hidden',
								}}>
									{/* Group header */}
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, bgcolor: gIdx === 0 ? '#FFFBEB' : '#FAFBFC', borderBottom: '1px solid #E2E8F0' }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
												<Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{gIdx + 1}</Typography>
											</Box>
											<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#92400E' }}>
												ใบสั่งซื้อที่ {gIdx + 1}
											</Typography>
											<Chip label={`ยอด ${fmt(total)} บาท`} size="small"
												sx={{ bgcolor: total > 0 ? '#D1FAE5' : '#F1F5F9', color: total > 0 ? '#166534' : '#64748B', fontWeight: 700, fontSize: '12px' }} />
										</Box>
										{poGroups.length > 1 && (
											<IconButton size="small" onClick={() => removePoGroup(group.id)}
												sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
												<FuseSvgIcon size={18}>lucide:x</FuseSvgIcon>
											</IconButton>
										)}
									</Box>

									<Box sx={{ p: 2.5 }}>
										{/* Team selector */}
										<Autocomplete
											options={teams}
											getOptionLabel={(op) => `${op.leaderName} (${op.teamName})`}
											value={group.team}
											onChange={(_, val) => updateGroup(group.id, 'team', val)}
											renderInput={(params) => (
												<TextField {...params} label="เลือกทีมช่าง" placeholder="เลือกทีมช่าง" sx={fieldSx}
													InputProps={{ ...params.InputProps, startAdornment: <FuseSvgIcon size={18} sx={{ color: '#F59E0B', mr: 0.5 }}>lucide:user-check</FuseSvgIcon> }}
												/>
											)}
											sx={{ mb: 2 }}
										/>
										{group.team?.leaderAddress && (
											<TextField label="ที่อยู่ทีมช่าง" fullWidth value={group.team.leaderAddress} InputProps={{ readOnly: true }}
												sx={{ mb: 2, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }} />
										)}

										{/* Item selection for this group */}
										{lineItems.length > 0 && (
											<Box sx={{ mb: 2 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
													<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
														เลือกรายการงาน ({group.selectedItems.size}/{selectableItems.length})
													</Typography>
													<Box sx={{ display: 'flex', gap: 1 }}>
														<Button size="small" onClick={() => selectAllForGroup(group.id)}
															sx={{ fontSize: '11px', textTransform: 'none', color: '#0284C7', minWidth: 0 }}>เลือกทั้งหมด</Button>
														<Button size="small" onClick={() => clearAllForGroup(group.id)}
															sx={{ fontSize: '11px', textTransform: 'none', color: '#94A3B8', minWidth: 0 }}>ยกเลิกทั้งหมด</Button>
													</Box>
												</Box>
												<Box sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
													{lineItems.map((item, idx) => {
														const isHeader = item.itemType === 'HEADER';
														if (isHeader) {
															// HEADER: show as a non-selectable section label
															return (
																<Box key={item.tempId}
																	sx={{
																		display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.7,
																		bgcolor: '#FFF8E1',
																		borderBottom: idx < lineItems.length - 1 ? '1px solid #FDE68A' : 'none',
																	}}>
																	<FuseSvgIcon size={14} sx={{ color: '#D97706', flexShrink: 0 }}>lucide:chevron-right</FuseSvgIcon>
																	<Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#92400E', flex: 1 }}>
																		{item.description || '(หัวข้อ)'}
																	</Typography>
																</Box>
															);
														}
														// ITEM: show with checkbox
														const checked = group.selectedItems.has(item.tempId);
														return (
															<Box key={item.tempId}
																onClick={() => toggleGroupItem(group.id, item.tempId)}
																sx={{
																	display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.8,
																	cursor: 'pointer', transition: 'all 0.15s',
																	bgcolor: checked ? '#EFF6FF' : 'transparent',
																	borderBottom: idx < lineItems.length - 1 ? '1px solid #F1F5F9' : 'none',
																	'&:hover': { bgcolor: checked ? '#DBEAFE' : '#F8FAFC' },
																}}>
																<Checkbox checked={checked} size="small" sx={{ p: 0, color: '#CBD5E1', '&.Mui-checked': { color: '#2563EB' } }} />
																<Typography sx={{ fontSize: '13px', flex: 1, color: checked ? '#1E293B' : '#94A3B8' }}>
																	{idx + 1}. {item.description || '(ไม่มีชื่อ)'}
																	{item.unit && <Box component="span" sx={{ color: '#94A3B8', ml: 0.5 }}>({item.quantity} {item.unit})</Box>}
																</Typography>
																<Typography sx={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: checked ? '#2563EB' : '#CBD5E1', whiteSpace: 'nowrap' }}>
																	{fmt(item.amount)} ฿
																</Typography>
															</Box>
														);
													})}
												</Box>
											</Box>
										)}

										{/* Dates */}
										<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
											<DatePickerField label="วันเริ่มงาน" value={group.startDate}
												onChange={(v) => updateGroup(group.id, 'startDate', v)} />
											<DatePickerField label="วันสิ้นสุด" value={group.endDate}
												onChange={(v) => updateGroup(group.id, 'endDate', v)} />
											<DatePickerField label="เริ่มประกัน" value={group.warrantyStart}
												onChange={(v) => updateGroup(group.id, 'warrantyStart', v)} />
											<DatePickerField label="สิ้นสุดประกัน" value={group.warrantyEnd}
												onChange={(v) => updateGroup(group.id, 'warrantyEnd', v)} />
										</Box>

										<TextField label="หมายเหตุ (สำหรับทีมนี้)" fullWidth multiline rows={2}
											value={group.notes}
											onChange={(e) => updateGroup(group.id, 'notes', e.target.value)}
											sx={fieldSx} />

										{/* Group total summary */}
										<Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Typography sx={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
												ยอดรวมใบสั่งซื้อนี้ ({group.selectedItems.size} รายการ)
											</Typography>
											<Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#166534', fontVariantNumeric: 'tabular-nums' }}>
												{fmt(groupTotal(group))} บาท
											</Typography>
										</Box>
									</Box>
								</Paper>
							);
						})}
					</Box>

					{/* ══ 4. อัพโหลดใบเสนอราคาช่าง ══ */}
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,#0284C7,#0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<FuseSvgIcon sx={{ color: '#fff' }} size={16}>lucide:upload</FuseSvgIcon>
							</Box>
							<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7' }}>อัพโหลดใบเสนอราคาช่าง (ถ้ามี)</Typography>
						</Box>
						<Box sx={{ border: '2px dashed #CBD5E1', borderRadius: '10px', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: '#FAFBFC', cursor: 'pointer', '&:hover': { borderColor: '#0284C7', bgcolor: '#F0F9FF' }, transition: 'all 0.2s' }}
							onClick={() => document.getElementById('quote-file-input')?.click()}>
							<input id="quote-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => setQuoteFile(e.target.files?.[0] || null)} />
							{quoteFile ? (
								<>
									<FuseSvgIcon sx={{ color: '#22C55E' }} size={32}>lucide:check-circle</FuseSvgIcon>
									<Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>{quoteFile.name}</Typography>
								</>
							) : (
								<>
									<FuseSvgIcon sx={{ color: '#94A3B8' }} size={40}>lucide:camera</FuseSvgIcon>
									<Typography sx={{ fontSize: '14px', color: '#94A3B8' }}>ถ่ายรูป หรือ เลือกไฟล์ (รูปภาพ, PDF)</Typography>
								</>
							)}
						</Box>
					</Box>

					{/* ══ หมายเหตุทั่วไป ══ */}
					<TextField label="หมายเหตุทั่วไป" fullWidth multiline rows={2}
						value={globalNotes} onChange={(e) => setGlobalNotes(e.target.value)}
						sx={{ mb: 3, ...fieldSx }} />

					{/* ══ Summary ══ */}
					<Box sx={{ mb: 3, p: 2, borderRadius: '14px', border: '2px solid #0284C7', bgcolor: '#F0F9FF' }}>
						<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0284C7', mb: 1 }}>สรุปการสร้างใบสั่งซื้อ</Typography>
						{poGroups.map((g, i) => (
							<Box key={g.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
								<Typography sx={{ fontSize: '13px', color: '#475569' }}>
									ใบที่ {i + 1}: {g.team ? `${g.team.leaderName} (${g.team.teamName})` : <Box component="span" sx={{ color: '#F59E0B' }}>ยังไม่ได้เลือกทีม</Box>}
									{' '}— {g.selectedItems.size} รายการ
								</Typography>
								<Typography sx={{ fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0284C7' }}>
									{fmt(groupTotal(g))} บาท
								</Typography>
							</Box>
						))}
						<Divider sx={{ my: 1 }} />
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7' }}>ยอดรวมทั้งหมด</Typography>
							<Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>
								{fmt(poGroups.reduce((s, g) => s + groupTotal(g), 0))} บาท
							</Typography>
						</Box>
					</Box>

					{/* ══ Buttons ══ */}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 3 }}>
						<Button variant="outlined" size="large" onClick={() => router.back()}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '15px', px: 4, color: '#64748B', borderColor: '#E2E8F0' }}>
							ยกเลิก
						</Button>
						<Button variant="contained" size="large" onClick={handleSave} disabled={saving}
							sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '15px', px: 4, background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
							{saving ? 'กำลังบันทึก...' : `บันทึก ${poGroups.length > 1 ? `(${poGroups.length} ใบ)` : ''}`}
						</Button>
					</Box>

				</motion.div>
			</Box>
		</Paper>
	);

	return (
		<>
			<Root header={header} content={content} scroll="content" />

			{/* SweetAlert-style modal — renders above all layout layers */}
			<Dialog
				open={snackbar.open}
				onClose={() => setSnackbar(p => ({ ...p, open: false }))}
				TransitionComponent={Fade}
				PaperProps={{
					sx: {
						borderRadius: '20px',
						px: 4, py: 4,
						minWidth: 320,
						maxWidth: 420,
						textAlign: 'center',
						boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
					},
				}}
				slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.35)' } } }}
			>
				{/* Icon */}
				<Box sx={{
					width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					bgcolor:
						snackbar.severity === 'success' ? '#D1FAE5' :
						snackbar.severity === 'error' ? '#FEE2E2' : '#FEF3C7',
				}}>
					<FuseSvgIcon size={36} sx={{
						color:
							snackbar.severity === 'success' ? '#059669' :
							snackbar.severity === 'error' ? '#DC2626' : '#D97706',
					}}>
						{snackbar.severity === 'success' ? 'lucide:check-circle' :
							snackbar.severity === 'error' ? 'lucide:x-circle' : 'lucide:alert-triangle'}
					</FuseSvgIcon>
				</Box>

				{/* Title */}
				<Typography sx={{
					fontSize: '18px', fontWeight: 800, mb: 1,
					color:
						snackbar.severity === 'success' ? '#059669' :
						snackbar.severity === 'error' ? '#DC2626' : '#D97706',
				}}>
					{snackbar.severity === 'success' ? 'สำเร็จ' :
						snackbar.severity === 'error' ? 'เกิดข้อผิดพลาด' : 'แจ้งเตือน'}
				</Typography>

				{/* Message */}
				<Typography sx={{ fontSize: '15px', color: '#475569', mb: 3, lineHeight: 1.6 }}>
					{snackbar.message}
				</Typography>

				{/* OK Button */}
				<Button
					variant="contained"
					fullWidth
					onClick={() => setSnackbar(p => ({ ...p, open: false }))}
					sx={{
						borderRadius: '12px', textTransform: 'none', fontWeight: 700,
						fontSize: '15px', py: 1.2,
						background:
							snackbar.severity === 'success' ? 'linear-gradient(135deg,#22C55E,#16A34A)' :
							snackbar.severity === 'error' ? 'linear-gradient(135deg,#EF4444,#DC2626)' :
							'linear-gradient(135deg,#F59E0B,#D97706)',
						'&:hover': { opacity: 0.9 },
					}}
				>
					ตกลง
				</Button>
			</Dialog>
		</>
	);
}

export default NewPurchaseOrderPage;
