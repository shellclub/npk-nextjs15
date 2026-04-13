'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

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

const statusOptions = [
	{ value: 'ALL', label: 'แสดงทั้งหมด' }, { value: 'DRAFT', label: 'แบบร่าง' },
	{ value: 'APPROVED', label: 'อนุมัติ' }, { value: 'ORDERED', label: 'สั่งซื้อแล้ว' },
	{ value: 'RECEIVED', label: 'รับแล้ว' }, { value: 'CANCELLED', label: 'ยกเลิก' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PO = any;

function PurchaseOrdersPage() {
	const router = useRouter();
	const [data, setData] = useState<PO[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

	// Action menu state
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuPO, setMenuPO] = useState<PO | null>(null);

	// Cancel dialog
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelTarget, setCancelTarget] = useState<PO | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Snackbar
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'ALL') params.set('status', statusFilter);
			if (search) params.set('search', search);
			const res = await fetch(`/api/purchase-orders?${params.toString()}`);
			const json = await res.json();
			setData(Array.isArray(json) ? json : []);
		} catch { setData([]); } finally { setLoading(false); }
	}, [statusFilter, search]);

	useEffect(() => { fetchData(); }, [fetchData]);

	// Calc PO total from adjustments
	const calcPOTotal = (po: PO) => {
		const adds = (po.adjustments || []).filter((a: PO) => a.adjustmentType === 'ADD').reduce((s: number, a: PO) => s + Number(a.amount), 0);
		const deducts = (po.adjustments || []).filter((a: PO) => a.adjustmentType === 'DEDUCT').reduce((s: number, a: PO) => s + Number(a.amount), 0);
		return adds - deducts;
	};

	// Menu handlers
	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, po: PO) => {
		event.stopPropagation();
		setMenuAnchor(event.currentTarget);
		setMenuPO(po);
	};
	const handleMenuClose = () => { setMenuAnchor(null); setMenuPO(null); };

	const handleEdit = () => {
		if (menuPO) router.push(`/apps/purchase-orders/${menuPO.id}`);
		handleMenuClose();
	};

	const handleApprove = async () => {
		if (!menuPO) return;
		setActionLoading(true);
		try {
			await fetch(`/api/purchase-orders/${menuPO.id}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'APPROVED' }),
			});
			setSnackbar({ open: true, message: `อนุมัติ ${menuPO.poNumber} เรียบร้อย`, severity: 'success' });
			fetchData();
		} catch {
			setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
		} finally { setActionLoading(false); handleMenuClose(); }
	};

	const handleCancelClick = () => {
		if (!menuPO) return;
		setCancelTarget(menuPO);
		setCancelOpen(true);
		handleMenuClose();
	};
	const handleCancelConfirm = async () => {
		if (!cancelTarget) return;
		setActionLoading(true);
		try {
			await fetch(`/api/purchase-orders/${cancelTarget.id}`, { method: 'DELETE' });
			setSnackbar({ open: true, message: `ยกเลิก ${cancelTarget.poNumber} เรียบร้อย`, severity: 'success' });
			fetchData();
		} catch {
			setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
		} finally { setActionLoading(false); setCancelOpen(false); }
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
							<Link href="/apps/purchase-orders/new" passHref>
								<Button variant="contained" size="large"
									startIcon={<FuseSvgIcon size={20}>lucide:plus</FuseSvgIcon>}
									sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', borderRadius: '12px', px: 3, py: 1, fontSize: '15px', fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.3)', '&:hover': { background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' } }}>
									สร้าง PO ใหม่
								</Button>
							</Link>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);

	// ===== CONTENT =====
	const content = (
		<Paper className="flex h-full w-full flex-auto flex-col overflow-hidden rounded-b-none" elevation={0}>
			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
					<CircularProgress sx={{ color: '#38BDF8' }} />
				</Box>
			) : data.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
					<FuseSvgIcon sx={{ color: '#CBD5E1', mb: 1 }} size={48}>lucide:shopping-cart</FuseSvgIcon>
					<Typography sx={{ fontSize: '16px', color: '#94A3B8' }}>ไม่พบรายการใบสั่งซื้อ</Typography>
				</Box>
			) : (
				<>
					<TableContainer sx={{ flex: 1 }}>
						<Table stickyHeader size="small">
							<TableHead>
								<TableRow sx={{
									'& th': {
										fontSize: '12px', fontWeight: 700, color: '#475569',
										borderBottom: '2px solid #E2E8F0', py: 1.2, bgcolor: '#F8FAFC',
										whiteSpace: 'nowrap',
									},
								}}>
									<TableCell sx={{ width: 36 }}>#</TableCell>
									<TableCell>เลขPO / วันที่</TableCell>
									<TableCell>ทีมช่าง</TableCell>
									<TableCell>ลูกค้า / สาขา</TableCell>
									<TableCell>เลขอ้างอิง</TableCell>
									<TableCell sx={{ bgcolor: '#F0FFF4 !important' }}>เลข WO / วันที่</TableCell>
									<TableCell sx={{ bgcolor: '#FFFFF0 !important' }}>PO ลูกค้า</TableCell>
									<TableCell>วันเริ่ม / สิ้นสุด</TableCell>
									<TableCell>ประกัน</TableCell>
									<TableCell align="right">ยอดรวม (บาท)</TableCell>
									<TableCell align="center">สถานะ</TableCell>
									<TableCell align="center" sx={{ width: 60 }}>จัดการ</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data.map((po: PO, index: number) => {
									const sc = statusConfig[po.status] || statusConfig.DRAFT;
									const isCancelled = po.status === 'CANCELLED';

									// Extract info from relations
									const teamName = po.team?.leaderName || po.team?.teamName || '-';
									const customerName = po.quotation?.customerGroup?.groupName
										|| po.workOrder?.quotation?.customerGroup?.groupName || '-';
									const branchName = po.quotation?.branch?.name
										|| po.workOrder?.quotation?.branch?.name || '';
									const refNo = po.quotation?.quotationNumber
										|| po.workOrder?.quotation?.quotationNumber || '-';
									const woNumber = po.workOrder?.woNumber || '';
									const woDate = po.workOrder?.date;
									const customerPO = po.workOrder?.poNumber || '';
									const projectName = po.quotation?.projectName
										|| po.workOrder?.quotation?.projectName || '';

									const poTotal = po.totalAmount ? Number(po.totalAmount) : calcPOTotal(po);

									return (
										<TableRow key={po.id} hover
											sx={{
												cursor: 'pointer', opacity: isCancelled ? 0.5 : 1,
												'&:hover': { bgcolor: '#F0F9FF' },
												'& td': { fontSize: '13px', color: '#334155', py: 0.8, borderBottom: '1px solid #F1F5F9' },
											}}
											onClick={() => router.push(`/apps/purchase-orders/${po.id}`)}>

											{/* # */}
											<TableCell sx={{ fontWeight: 500, color: '#94A3B8' }}>{index + 1}</TableCell>

											{/* เลขPO / วันที่ */}
											<TableCell>
												<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0284C7', textDecoration: isCancelled ? 'line-through' : 'none' }}>
													{po.poNumber}
												</Typography>
												<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(po.date)}</Typography>
											</TableCell>

											{/* ทีมช่าง */}
											<TableCell>
												<Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{teamName}</Typography>
											</TableCell>

											{/* ลูกค้า / สาขา */}
											<TableCell>
												<Typography sx={{ fontSize: '13px', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{customerName}
												</Typography>
												{branchName && (
													<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{branchName}</Typography>
												)}
											</TableCell>

											{/* เลขอ้างอิง */}
											<TableCell>
												{refNo !== '-' ? (
													<>
														<Chip label={refNo} size="small" sx={{ fontSize: '11px', height: 22, bgcolor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }} />
														{projectName && (
															<Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
																{projectName}
															</Typography>
														)}
													</>
												) : '-'}
											</TableCell>

											{/* เลข WO / วันที่ */}
											<TableCell sx={{ bgcolor: woNumber ? '#F0FFF4' : 'transparent' }}>
												{woNumber ? (
													<>
														<Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#15803D' }}>{woNumber}</Typography>
														<Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{fmtDate(woDate)}</Typography>
													</>
												) : '-'}
											</TableCell>

											{/* PO ลูกค้า */}
											<TableCell sx={{ bgcolor: customerPO ? '#FFFFF0' : 'transparent' }}>
												{customerPO ? (
													<Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#A16207' }}>{customerPO}</Typography>
												) : '-'}
											</TableCell>

											{/* วันเริ่ม / สิ้นสุด */}
											<TableCell>
												<Typography sx={{ fontSize: '11px', color: '#475569' }}>{fmtDate(po.startDate)}</Typography>
												<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(po.endDate)}</Typography>
											</TableCell>

											{/* ประกัน */}
											<TableCell>
												<Typography sx={{ fontSize: '11px', color: '#475569' }}>{fmtDate(po.warrantyStartDate)}</Typography>
												<Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(po.warrantyEndDate)}</Typography>
											</TableCell>

											{/* ยอดรวม */}
											<TableCell align="right" sx={{
												fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '14px !important',
												color: isCancelled ? '#94A3B8' : '#1E293B',
											}}>
												{fmt(poTotal)}
											</TableCell>

											{/* สถานะ */}
											<TableCell align="center">
												<Chip label={sc.label} size="small" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px', minWidth: 64 }} />
											</TableCell>

											{/* จัดการ */}
											<TableCell align="center" onClick={(e) => e.stopPropagation()}>
												<Tooltip title="จัดการ" arrow>
													<IconButton size="small" onClick={(e) => handleMenuOpen(e, po)} disabled={actionLoading}
														sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' } }}>
														<FuseSvgIcon size={18}>lucide:ellipsis-vertical</FuseSvgIcon>
													</IconButton>
												</Tooltip>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Footer */}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FAFBFC' }}>
						<Typography sx={{ fontSize: '14px', color: '#64748B' }}>แสดง {data.length} รายการ</Typography>
						<Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0284C7' }}>
							ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
								{fmt(data.filter((p: PO) => p.status !== 'CANCELLED').reduce((s: number, p: PO) => s + (p.totalAmount ? Number(p.totalAmount) : calcPOTotal(p)), 0))}
							</Box> บาท
						</Typography>
					</Box>
				</>
			)}

			{/* ========== Action Menu ========== */}
			<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
				<MenuItem onClick={handleEdit} sx={{ py: 1.2, gap: 1.5 }}>
					<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
					<ListItemText>ดูรายละเอียด</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => { handleMenuClose(); if (menuPO) router.push(`/apps/purchase-orders/${menuPO.id}/print`); }} sx={{ py: 1.2, gap: 1.5 }}>
					<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#8B5CF6' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
					<ListItemText>พิมพ์</ListItemText>
				</MenuItem>
				{menuPO && menuPO.status !== 'CANCELLED' && (
					<MenuItem onClick={handleEdit} sx={{ py: 1.2, gap: 1.5 }}>
						<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0EA5E9' }}>lucide:pencil</FuseSvgIcon></ListItemIcon>
						<ListItemText>แก้ไข</ListItemText>
					</MenuItem>
				)}
				{menuPO && menuPO.status === 'DRAFT' && (
					<MenuItem onClick={handleApprove} sx={{ py: 1.2, gap: 1.5 }}>
						<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#22C55E' }}>lucide:check-circle</FuseSvgIcon></ListItemIcon>
						<ListItemText>อนุมัติ</ListItemText>
					</MenuItem>
				)}
				{menuPO && menuPO.status !== 'CANCELLED' && menuPO.status !== 'RECEIVED' && (
					<>
						<Divider sx={{ my: 0.5 }} />
						<MenuItem onClick={handleCancelClick} sx={{ py: 1.2, gap: 1.5, color: '#DC2626' }}>
							<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#DC2626' }}>lucide:trash-2</FuseSvgIcon></ListItemIcon>
							<ListItemText primaryTypographyProps={{ color: '#DC2626' }}>ยกเลิก</ListItemText>
						</MenuItem>
					</>
				)}
			</Menu>

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
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setCancelOpen(false)} variant="outlined"
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}>
						ไม่ยกเลิก
					</Button>
					<Button onClick={handleCancelConfirm} variant="contained" disabled={actionLoading}
						sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
						{actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar */}
			<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
				<Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', fontSize: '14px', fontWeight: 500 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);

	return <Root header={header} content={content} scroll="content" />;
}

export default PurchaseOrdersPage;
