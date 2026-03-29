'use client';

import { useState } from 'react';
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
import Collapse from '@mui/material/Collapse';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import { motion } from 'motion/react';
import {
	PurchaseOrder,
	getAllPOs, updatePOStatus,
	fmt, fmtDate, calcPOTotals,
	statusConfig, statusOptions,
} from './po-store';

const Root = styled(FusePageCarded)(() => ({ '& .container': { maxWidth: '100%!important' } }));

// =============================================
// MAIN COMPONENT
// =============================================
function PurchaseOrdersPage() {
	const router = useRouter();
	const [data, setData] = useState<PurchaseOrder[]>(getAllPOs());
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [expandedId, setExpandedId] = useState<string | null>(null);

	// Action menu state
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuPO, setMenuPO] = useState<PurchaseOrder | null>(null);

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

	// Menu handlers
	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, po: PurchaseOrder) => {
		event.stopPropagation();
		setMenuAnchor(event.currentTarget);
		setMenuPO(po);
	};
	const handleMenuClose = () => { setMenuAnchor(null); setMenuPO(null); };

	// Edit navigates to detail page
	const handleEdit = () => {
		if (menuPO) router.push(`/apps/purchase-orders/${menuPO.id}`);
		handleMenuClose();
	};

	// Approve
	const handleApprove = () => {
		if (!menuPO) return;
		updatePOStatus(menuPO.id, 'APPROVED');
		setData(getAllPOs());
		setSnackbar({ open: true, message: `อนุมัติ ${menuPO.poNumber} เรียบร้อย`, severity: 'success' });
		handleMenuClose();
	};

	// Cancel
	const handleCancelClick = () => {
		if (!menuPO) return;
		setCancelTarget(menuPO);
		setCancelOpen(true);
		handleMenuClose();
	};
	const handleCancelConfirm = () => {
		if (!cancelTarget) return;
		updatePOStatus(cancelTarget.id, 'CANCELLED');
		setData(getAllPOs());
		setSnackbar({ open: true, message: `ยกเลิก ${cancelTarget.poNumber} เรียบร้อย`, severity: 'success' });
		setCancelOpen(false);
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
							const poTotals = calcPOTotals(po);
							return (
								<>
									<TableRow key={po.id} hover
										sx={{ cursor: 'pointer', opacity: isCancelled ? 0.5 : 1, '&:hover': { bgcolor: '#F0F9FF' }, '& td': { fontSize: '14px', color: '#334155', py: 1.2, borderBottom: '1px solid #F1F5F9' } }}
										onClick={() => router.push(`/apps/purchase-orders/${po.id}`)}>
										<TableCell sx={{ pl: 1 }}>
											<IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : po.id); }}
												sx={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
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
											{fmt(poTotals.grandTotal)}
										</TableCell>
										<TableCell align="center">
											<Chip label={sc.label} size="small" sx={{ fontSize: '12px', fontWeight: 600, bgcolor: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}`, borderRadius: '8px' }} />
										</TableCell>
										<TableCell align="center" onClick={(e) => e.stopPropagation()}>
											<Tooltip title="จัดการ" arrow>
												<IconButton size="small" onClick={(e) => handleMenuOpen(e, po)}
													sx={{ color: '#64748B', borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9', color: '#0284C7' } }}>
													<FuseSvgIcon size={20}>lucide:ellipsis-vertical</FuseSvgIcon>
												</IconButton>
											</Tooltip>
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
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(poTotals.subtotal)}</Typography>
																</Box>
																{poTotals.discountAmount > 0 && (
																	<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																		<Typography sx={{ fontSize: '13px', color: '#EF4444' }}>ส่วนลด {po.discountPercent}%</Typography>
																		<Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>-{fmt(poTotals.discountAmount)}</Typography>
																	</Box>
																)}
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '13px', color: '#DC2626' }}>หัก ณ ที่จ่าย {po.vat3Percent}%</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#DC2626' }}>-{fmt(poTotals.vat3Amount)}</Typography>
																</Box>
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '13px', color: '#64748B' }}>ภาษีมูลค่าเพิ่ม {po.vat7Percent}%</Typography>
																	<Typography sx={{ fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(poTotals.vat7Amount)}</Typography>
																</Box>
																<Divider sx={{ my: 0.5 }} />
																<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
																	<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>จำนวนเงินทั้งสิ้น</Typography>
																	<Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>{fmt(poTotals.grandTotal)} บาท</Typography>
																</Box>
															</Box>
														</Paper>
													</Box>
													{/* Items summary */}
													<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
														รายการงาน ({po.items.length} หัวข้อ)
													</Typography>
													{po.items.map((main, mi) => (
														<Box key={main.id} sx={{ mb: 1 }}>
															<Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{mi + 1}. {main.title}</Typography>
															{main.subItems.map((sub, si) => (
																<Typography key={sub.id} sx={{ fontSize: '12px', color: '#64748B', pl: 3 }}>
																	{mi + 1}.{si + 1} {sub.description} {sub.qty > 0 && `(${sub.qty} ${sub.unit})`}
																</Typography>
															))}
														</Box>
													))}
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
					ยอดรวม <Box component="span" sx={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(filtered.filter(p => p.status !== 'CANCELLED').reduce((s, p) => s + calcPOTotals(p).grandTotal, 0))}</Box> บาท
				</Typography>
			</Box>

			{/* ========== Action Menu ========== */}
			<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', py: 0.5 } } }}>
				<MenuItem onClick={handleEdit} sx={{ py: 1.2, gap: 1.5 }}>
					<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#0284C7' }}>lucide:eye</FuseSvgIcon></ListItemIcon>
					<ListItemText>ดูรายละเอียด</ListItemText>
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
						<MenuItem onClick={() => { router.push(`/apps/purchase-orders/${menuPO.id}/print`); handleMenuClose(); }} sx={{ py: 1.2, gap: 1.5 }}>
							<ListItemIcon><FuseSvgIcon size={18} sx={{ color: '#059669' }}>lucide:printer</FuseSvgIcon></ListItemIcon>
							<ListItemText>พิมพ์ใบสั่งซื้อ</ListItemText>
						</MenuItem>
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
