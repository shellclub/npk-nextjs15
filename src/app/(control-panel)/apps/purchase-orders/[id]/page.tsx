'use client';

import { ArrowLeft, CircleCheck, Download, FilePlus2, Lock, PencilLine, Printer, Wallet } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@/components/shared/AlertProvider';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	DataTable,
	Dialog,
	Field,
	IconButton,
	InfoCard,
	Input,
	PageHeader,
	PrintPreviewDialog,
	StatusBadge,
	TotalsBlock
} from '@/components/ui';
import {
	InstallmentEditor,
	newInstallmentRow,
	toInstallmentPayload,
	type InstallmentRow
} from '@/components/purchase-orders/InstallmentEditor';
import { POEditDialog } from '@/components/purchase-orders/POEditDialog';
import { COST_TYPE_LABEL } from '@/components/purchase-orders/po-math';
import { formatDateShort, formatMoney } from '@/lib/format';
import { FALLBACK, PO_STATUS } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type Item = {
	id: string;
	itemType: string;
	description: string;
	unit: string;
	quantity: number;
	materialPrice: number;
	labourPrice: number;
	totalMaterial: number;
	totalLabour: number;
	amount: number;
	isLocked: boolean;
	isAdjustment: boolean;
};
type PO = {
	id: string;
	poNumber: string;
	date: string;
	status: string;
	startDate?: string | null;
	endDate?: string | null;
	warrantyStartDate?: string | null;
	warrantyEndDate?: string | null;
	contractorQuoteUrl?: string | null;
	subtotal: number;
	discountPercent?: number;
	vatPercent?: number;
	whtPercent?: number;
	whtAmount?: number;
	totalAmount?: number;
	teamId?: string | null;
	costType?: string;
	costCategory?: string | null;
	payeeName?: string | null;
	warrantyMonths?: number | null;
	installments?: {
		id: string;
		seq: number;
		percent?: number | null;
		dueDate?: string | null;
		amount: number;
		retentionAmount: number;
		notes?: string | null;
		paymentVouchers: { id: string; voucherNumber: string; amount: number }[];
	}[];
	notes?: string | null;
	workOrder?: { woNumber: string } | null;
	quotation?: {
		id: string;
		quotationNumber: string;
		projectName?: string | null;
		customerGroup?: { groupName: string };
		branch?: { code?: string; name: string } | null;
	} | null;
	team?: { teamName: string; leaderName: string; leaderPhone?: string | null } | null;
	items: Item[];
	adjustments?: { id: string; adjustmentType: string; description: string; amount: number; createdAt: string }[];
};
type Edit = { materialPrice: string; labourPrice: string };

const numCls =
	'h-10 w-28 rounded-lg border border-line-strong bg-surface px-2 text-right text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export default function PurchaseOrderDetailPage() {
	const { id } = useParams<{ id: string }>();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data: po, isLoading, isError } = useApi<PO>(`/api/purchase-orders/${id}`);
	const [edits, setEdits] = useState<Record<string, Edit>>({});
	const [busy, setBusy] = useState(false);
	const [print, setPrint] = useState(false);
	const [reimport, setReimport] = useState(false);
	const [editing, setEditing] = useState(false);
	const [instRows, setInstRows] = useState<InstallmentRow[] | null>(null);
	const [adj, setAdj] = useState<{
		negative: boolean;
		desc: string;
		qty: string;
		unit: string;
		mat: string;
		lab: string;
	} | null>(null);
	const refresh = () => qc.invalidateQueries({ queryKey: [`/api/purchase-orders/${id}`] });
	const items = useMemo(() => po?.items ?? [], [po]);

	// ค่าเริ่มต้นของช่องราคา = ราคาปัจจุบันของรายการที่ยังไม่ล็อก (ผู้ใช้แก้แล้วจะอยู่ใน edits)
	const priceOf = (it: Item, k: keyof Edit) => edits[it.id]?.[k] ?? (Number(it[k]) ? String(Number(it[k])) : '');
	const hasUnlocked = items.some((i) => !i.isLocked && i.itemType === 'ITEM');

	const live = useMemo(() => {
		const sub = items.reduce((s, it) => {
			if (it.itemType === 'HEADER') return s;

			if (it.isLocked) return s + Number(it.amount);

			const m = parseFloat(edits[it.id]?.materialPrice ?? String(it.materialPrice)) || 0;
			const l = parseFloat(edits[it.id]?.labourPrice ?? String(it.labourPrice)) || 0;

			return s + Number(it.quantity) * (m + l);
		}, 0);
		const sum = items.length ? sub : Number(po?.subtotal ?? 0);
		const disc = (sum * (Number(po?.discountPercent) || 0)) / 100;
		const after = sum - disc;
		const vat = (after * (Number(po?.vatPercent) || 0)) / 100;
		const wht = (after * (Number(po?.whtPercent) || 0)) / 100;

		return { sum, disc, after, vat, wht, total: after + vat - wht };
	}, [items, edits, po]);

	async function call(body: Record<string, unknown>, ok: [string, string]) {
		setBusy(true);

		try {
			const r = await sendJson(`/api/purchase-orders/${id}/items`, 'POST', body);

			if (r.success) {
				alert.showSuccess(...ok);
				setEdits({});
				await refresh();

				return r;
			}

			if (r.alreadyImported && !body.replace) setReimport(true);
			else alert.showError('เกิดข้อผิดพลาด', r.error);
		} catch (e) {
			const m = e instanceof Error ? e.message : '';

			// API ตอบ 400 พร้อม alreadyImported → sendJson โยน error; ถามยืนยันรีเซ็ตแทน
			if (m.includes('already') || m.includes('Items')) setReimport(true);
			else alert.showError('เกิดข้อผิดพลาด', m || undefined);
		} finally {
			setBusy(false);
		}

		return null;
	}

	async function setStatus(status: string) {
		setBusy(true);

		try {
			await sendJson(`/api/purchase-orders/${id}`, 'PATCH', { status });
			alert.showSuccess('อัปเดตสถานะเรียบร้อย');
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด');
		} finally {
			setBusy(false);
		}
	}

	if (isLoading) return <p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>;

	if (isError || !po?.id)
		return (
			<div className="flex flex-col items-center gap-4 py-20">
				<p role="alert">ไม่พบข้อมูลใบสั่งซื้อ</p>
				<Button href="/apps/purchase-orders">กลับรายการ</Button>
			</div>
		);

	const m = PO_STATUS[po.status] ?? FALLBACK;
	const q = po.quotation;
	let h = 0;
	let sub = 0;
	const labels = items.map((it) => {
		if (it.itemType === 'HEADER') {
			h++;
			sub = 0;

			return `${h}`;
		}

		sub++;

		return `${h}.${sub}`;
	});

	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label="กลับรายการ"
							href="/apps/purchase-orders"
						>
							<ArrowLeft size={22} />
						</IconButton>
						{po.poNumber}
					</span>
				}
				badge={
					<StatusBadge
						label={m.label}
						tone={m.tone}
					/>
				}
				subtitle={`วันที่ ${formatDateShort(po.date)}`}
				actions={
					<>
						{po.status === 'DRAFT' && (
							<Button
								variant="soft"
								icon={<CircleCheck size={18} />}
								disabled={busy}
								onClick={() => setStatus('APPROVED')}
							>
								อนุมัติ
							</Button>
						)}
						{po.status === 'APPROVED' && (
							<Button
								variant="soft"
								disabled={busy}
								onClick={() => setStatus('ORDERED')}
							>
								สั่งซื้อแล้ว
							</Button>
						)}
						{po.status === 'ORDERED' && (
							<Button
								variant="soft"
								disabled={busy}
								onClick={() => setStatus('RECEIVED')}
							>
								รับงานแล้ว
							</Button>
						)}
						<Button
							variant="outline"
							icon={<PencilLine size={18} />}
							onClick={() => setEditing(true)}
						>
							แก้ไข
						</Button>
						<Button
							variant="outline"
							icon={<Printer size={18} />}
							onClick={() => setPrint(true)}
						>
							พิมพ์
						</Button>
					</>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
				<InfoCard
					title="อ้างอิง"
					rows={[
						['ใบเสนอราคา', q?.quotationNumber ?? '-'],
						['WO', po.workOrder?.woNumber],
						['ลูกค้า', q?.customerGroup?.groupName ?? '-'],
						['สาขา', q?.branch ? `${q.branch.code ?? ''} ${q.branch.name}` : null],
						['โครงการ', q?.projectName]
					]}
				/>
				<InfoCard
					title="ทีมช่าง / กำหนดการ"
					rows={[
						['ประเภทต้นทุน', COST_TYPE_LABEL[po.costType ?? 'LABOUR']],
						['หมวดใบสำคัญจ่าย', po.costCategory],
						['ผู้รับเงิน', po.payeeName],
						['ทีมช่าง', po.team?.teamName ?? '-'],
						[
							'หัวหน้าทีม',
							po.team
								? `${po.team.leaderName}${po.team.leaderPhone ? ` (${po.team.leaderPhone})` : ''}`
								: null
						],
						['เริ่มงาน', formatDateShort(po.startDate)],
						['กำหนดเสร็จ', formatDateShort(po.endDate)],
						[
							'ประกัน',
							po.warrantyStartDate
								? `${formatDateShort(po.warrantyStartDate)} – ${formatDateShort(po.warrantyEndDate)}`
								: null
						],
						[
							'ใบเสนอราคาช่าง',
							po.contractorQuoteUrl ? (
								<a
									key="f"
									href={po.contractorQuoteUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1"
								>
									<Download
										size={14}
										aria-hidden="true"
									/>
									เปิดไฟล์
								</a>
							) : null
						],
						['หมายเหตุ', po.notes]
					]}
				/>
			</div>

			<Card>
				<CardHeader
					title="รายการงาน"
					action={
						<div className="flex flex-wrap gap-2">
							{q && (
								<Button
									variant="dashed"
									icon={<FilePlus2 size={18} />}
									disabled={busy}
									onClick={() =>
										call({ action: 'import-from-quotation' }, [
											'นำเข้าเรียบร้อย',
											'คัดลอกรายการและราคาจากใบเสนอราคาแล้ว'
										])
									}
								>
									{items.length ? 'นำเข้าจากใบเสนอราคาใหม่' : 'นำเข้ารายการจากใบเสนอราคา'}
								</Button>
							)}
							<Button
								variant="dashed"
								icon={<PencilLine size={18} />}
								onClick={() =>
									setAdj({ negative: false, desc: '', qty: '1', unit: 'งาน', mat: '', lab: '' })
								}
							>
								ปรับแก้รายการ
							</Button>
						</div>
					}
				/>
				<DataTable
					rows={items}
					rowKey={(i) => i.id}
					empty={q ? 'ยังไม่มีรายการ กด "นำเข้ารายการจากใบเสนอราคา" เพื่อเริ่ม' : 'ยังไม่มีรายการ'}
					columns={[
						{
							key: 'n',
							header: 'ลำดับ',
							cell: (it) => (
								<span
									className={
										it.itemType === 'HEADER' ? 'text-primary-ink font-semibold' : 'text-ink-muted'
									}
								>
									{labels[items.indexOf(it)]}
								</span>
							)
						},
						{
							key: 'd',
							header: 'รายละเอียด',
							className: 'min-w-56',
							cell: (it) =>
								it.itemType === 'HEADER' ? (
									<strong className="text-primary-ink">{it.description}</strong>
								) : (
									<span>
										{it.description}
										{it.isAdjustment && (
											<span className="bg-warn-soft text-warn ml-2 rounded-sm px-1.5 py-0.5 text-xs">
												ปรับแก้
											</span>
										)}
									</span>
								)
						},
						{
							key: 'q',
							header: 'จำนวน',
							align: 'right',
							cell: (it) => (it.itemType === 'HEADER' ? '' : `${Number(it.quantity)} ${it.unit}`)
						},
						{
							key: 'm',
							header: 'ค่าของ/หน่วย',
							money: true,
							cell: (it) =>
								it.itemType === 'HEADER' ? (
									''
								) : it.isLocked ? (
									formatMoney(it.materialPrice)
								) : (
									<input
										aria-label={`ค่าของต่อหน่วย ${labels[items.indexOf(it)]}`}
										type="number"
										className={numCls}
										value={priceOf(it, 'materialPrice')}
										onChange={(e) =>
											setEdits((p) => ({
												...p,
												[it.id]: {
													materialPrice: e.target.value,
													labourPrice: priceOf(it, 'labourPrice')
												}
											}))
										}
									/>
								)
						},
						{
							key: 'l',
							header: 'ค่าแรง/หน่วย',
							money: true,
							cell: (it) =>
								it.itemType === 'HEADER' ? (
									''
								) : it.isLocked ? (
									formatMoney(it.labourPrice)
								) : (
									<input
										aria-label={`ค่าแรงต่อหน่วย ${labels[items.indexOf(it)]}`}
										type="number"
										className={numCls}
										value={priceOf(it, 'labourPrice')}
										onChange={(e) =>
											setEdits((p) => ({
												...p,
												[it.id]: {
													materialPrice: priceOf(it, 'materialPrice'),
													labourPrice: e.target.value
												}
											}))
										}
									/>
								)
						},
						{
							key: 'a',
							header: 'จำนวนเงิน',
							money: true,
							cell: (it) =>
								it.itemType === 'HEADER'
									? ''
									: it.isLocked
										? formatMoney(it.amount)
										: formatMoney(
												Number(it.quantity) *
													((parseFloat(
														edits[it.id]?.materialPrice ?? String(it.materialPrice)
													) || 0) +
														(parseFloat(
															edits[it.id]?.labourPrice ?? String(it.labourPrice)
														) || 0))
											)
						},
						{
							key: 'k',
							header: 'ล็อก',
							align: 'center',
							cell: (it) =>
								it.itemType !== 'HEADER' && it.isLocked ? (
									<span title="ล็อกราคาแล้ว">
										<Lock
											size={16}
											aria-label="ล็อกราคาแล้ว"
											className="text-ink-muted mx-auto"
										/>
									</span>
								) : null
						}
					]}
				/>
				{hasUnlocked && (
					<div className="bg-warn-soft text-warn flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
						<span>ราคายังแก้ไขได้ — เมื่อกดบันทึกราคาจะถูกล็อกและแก้ไขไม่ได้</span>
						<Button
							disabled={busy}
							icon={<Lock size={18} />}
							onClick={() =>
								call(
									{
										action: 'save-prices',
										items: items
											.filter((i) => !i.isLocked && i.itemType === 'ITEM')
											.map((i) => ({
												id: i.id,
												materialPrice: parseFloat(priceOf(i, 'materialPrice')) || 0,
												labourPrice: parseFloat(priceOf(i, 'labourPrice')) || 0
											}))
									},
									['บันทึกเรียบร้อย', 'ราคาถูกบันทึกและล็อกแล้ว']
								)
							}
						>
							บันทึกราคาและล็อก
						</Button>
					</div>
				)}
				<TotalsBlock
					rows={[
						['รวมเป็นเงิน', formatMoney(live.sum)],
						...(Number(po.discountPercent)
							? ([[`ส่วนลด ${Number(po.discountPercent)}%`, `-${formatMoney(live.disc)}`]] as [
									string,
									string
								][])
							: []),
						[`VAT ${Number(po.vatPercent) || 0}%`, formatMoney(live.vat)],
						...(Number(po.whtPercent)
							? ([[`หัก ณ ที่จ่าย ${Number(po.whtPercent)}%`, `-${formatMoney(live.wht)}`]] as [
									string,
									string
								][])
							: [])
					]}
					grand={['ยอดรวมทั้งสิ้น', formatMoney(live.total)]}
				/>
			</Card>

			<Card>
				<CardHeader
					title="กำหนดการจ่ายเป็นงวด"
					action={
						instRows ? undefined : (
							<Button
								variant="soft"
								icon={<PencilLine size={18} />}
								onClick={() =>
									setInstRows(
										(po.installments ?? []).length
											? (po.installments ?? []).map((i) =>
													newInstallmentRow({
														id: i.id,
														percent: i.percent ? String(Number(i.percent)) : '',
														amount: i.percent ? '' : String(Number(i.amount)),
														dueDate: i.dueDate
															? new Date(i.dueDate).toISOString().split('T')[0]
															: '',
														retentionAmount: Number(i.retentionAmount)
															? String(Number(i.retentionAmount))
															: '',
														notes: i.notes ?? ''
													})
												)
											: [newInstallmentRow()]
									)
								}
							>
								แก้ไขงวด
							</Button>
						)
					}
				/>
				{instRows ? (
					<>
						<InstallmentEditor
							rows={instRows}
							onChange={setInstRows}
							total={Number(po.totalAmount) || live.total}
							lockedIds={(po.installments ?? []).filter((i) => i.paymentVouchers.length).map((i) => i.id)}
						/>
						<div className="flex justify-end gap-3">
							<Button
								variant="ghost"
								onClick={() => setInstRows(null)}
							>
								ยกเลิก
							</Button>
							<Button
								disabled={busy}
								onClick={async () => {
									setBusy(true);

									try {
										await sendJson(`/api/purchase-orders/${id}/installments`, 'PUT', {
											installments: toInstallmentPayload(instRows)
										});
										alert.showSuccess('บันทึกงวดจ่ายเรียบร้อย');
										setInstRows(null);
										await refresh();
									} catch (e) {
										alert.showError(
											'บันทึกงวดไม่สำเร็จ',
											e instanceof Error ? e.message : undefined
										);
									} finally {
										setBusy(false);
									}
								}}
							>
								บันทึกงวด
							</Button>
						</div>
					</>
				) : (
					<DataTable
						rows={po.installments ?? []}
						rowKey={(i) => i.id}
						empty="ยังไม่ได้กำหนดงวดจ่าย"
						columns={[
							{ key: 's', header: 'งวดที่', cell: (i) => `งวด ${i.seq}` },
							{ key: 'p', header: '%', cell: (i) => (i.percent ? `${Number(i.percent)}%` : '-') },
							{ key: 'd', header: 'วันครบกำหนด', cell: (i) => formatDateShort(i.dueDate) },
							{ key: 'a', header: 'ยอดเงิน', money: true, cell: (i) => formatMoney(i.amount) },
							{
								key: 'r',
								header: 'ยอดหัก/ประกัน',
								money: true,
								cell: (i) => (Number(i.retentionAmount) ? formatMoney(i.retentionAmount) : '-')
							},
							{
								key: 'v',
								header: 'ใบสำคัญจ่าย',
								cell: (i) =>
									i.paymentVouchers.length ? (
										<StatusBadge
											label={i.paymentVouchers.map((v) => v.voucherNumber).join(', ')}
											tone="success"
										/>
									) : (
										<Button
											variant="soft"
											icon={<Wallet size={16} />}
											href={`/apps/payment-vouchers/new?poId=${id}&installmentId=${i.id}`}
										>
											ออกใบสำคัญจ่าย
										</Button>
									)
							}
						]}
					/>
				)}
			</Card>

			{(po.adjustments?.length ?? 0) > 0 && (
				<Card>
					<CardHeader title="บันทึกการปรับยอด (ลบไม่ได้)" />
					<DataTable
						rows={po.adjustments ?? []}
						rowKey={(a) => a.id}
						columns={[
							{ key: 'd', header: 'วันที่', cell: (a) => formatDateShort(a.createdAt) },
							{
								key: 't',
								header: 'ประเภท',
								cell: (a) => (
									<StatusBadge
										label={a.adjustmentType === 'ADD' ? 'เพิ่ม' : 'ลด'}
										tone={a.adjustmentType === 'ADD' ? 'success' : 'danger'}
									/>
								)
							},
							{ key: 'x', header: 'รายละเอียด', cell: (a) => a.description },
							{
								key: 'a',
								header: 'จำนวนเงิน',
								money: true,
								cell: (a) => `${a.adjustmentType === 'ADD' ? '+' : '-'}${formatMoney(a.amount)}`
							}
						]}
					/>
				</Card>
			)}

			<Dialog
				open={!!adj}
				onClose={() => setAdj(null)}
				title="ปรับแก้รายการ"
				footer={
					<>
						<Button
							variant="ghost"
							onClick={() => setAdj(null)}
						>
							ยกเลิก
						</Button>
						<Button
							disabled={busy || !adj?.desc.trim()}
							onClick={async () => {
								if (!adj) return;

								const qn = Math.abs(parseFloat(adj.qty) || 1);
								const r = await call(
									{
										action: 'add-adjustment',
										description: adj.desc,
										quantity: adj.negative ? -qn : qn,
										unit: adj.unit,
										materialPrice: parseFloat(adj.mat) || 0,
										labourPrice: parseFloat(adj.lab) || 0
									},
									['เพิ่มรายการเรียบร้อย', 'รายการปรับแก้ถูกบันทึกและล็อกแล้ว']
								);

								if (r) setAdj(null);
							}}
						>
							เพิ่มรายการปรับแก้
						</Button>
					</>
				}
			>
				{adj && (
					<div className="grid grid-cols-2 gap-4">
						<div
							className="col-span-2 flex gap-2"
							role="group"
							aria-label="ประเภทการปรับแก้"
						>
							{[false, true].map((neg) => (
								<Button
									key={String(neg)}
									variant={adj.negative === neg ? 'primary' : 'outline'}
									aria-pressed={adj.negative === neg}
									onClick={() => setAdj({ ...adj, negative: neg })}
								>
									{neg ? 'ลดงาน (−)' : 'เพิ่มงาน (+)'}
								</Button>
							))}
						</div>
						<Field
							label="รายละเอียด"
							required
							className="col-span-2"
						>
							{(fid) => (
								<Input
									id={fid}
									value={adj.desc}
									onChange={(e) => setAdj({ ...adj, desc: e.target.value })}
								/>
							)}
						</Field>
						<Field label="จำนวน">
							{(fid) => (
								<Input
									id={fid}
									type="number"
									min="0"
									value={adj.qty}
									onChange={(e) => setAdj({ ...adj, qty: e.target.value })}
								/>
							)}
						</Field>
						<Field label="หน่วย">
							{(fid) => (
								<Input
									id={fid}
									value={adj.unit}
									onChange={(e) => setAdj({ ...adj, unit: e.target.value })}
								/>
							)}
						</Field>
						<Field label="ค่าของ/หน่วย">
							{(fid) => (
								<Input
									id={fid}
									type="number"
									min="0"
									value={adj.mat}
									onChange={(e) => setAdj({ ...adj, mat: e.target.value })}
								/>
							)}
						</Field>
						<Field label="ค่าแรง/หน่วย">
							{(fid) => (
								<Input
									id={fid}
									type="number"
									min="0"
									value={adj.lab}
									onChange={(e) => setAdj({ ...adj, lab: e.target.value })}
								/>
							)}
						</Field>
					</div>
				)}
			</Dialog>
			<ConfirmDialog
				open={reimport}
				danger
				title="นำเข้าจากใบเสนอราคาใหม่"
				message="มีรายการอยู่แล้ว ต้องการรีเซ็ตและนำเข้าจากใบเสนอราคาใหม่หรือไม่? (รายการที่ยังไม่ล็อกราคาจะถูกลบ)"
				confirmLabel="รีเซ็ตและนำเข้า"
				busy={busy}
				onClose={() => setReimport(false)}
				onConfirm={async () => {
					await call({ action: 'import-from-quotation', replace: true }, [
						'นำเข้าเรียบร้อย',
						'คัดลอกรายการและราคาจากใบเสนอราคาแล้ว'
					]);
					setReimport(false);
				}}
			/>
			<POEditDialog
				po={po}
				open={editing}
				onClose={() => setEditing(false)}
				onSaved={refresh}
			/>
			<PrintPreviewDialog
				open={print}
				onClose={() => setPrint(false)}
				title={po.poNumber}
				src={`/api/purchase-orders/${id}/pdf`}
			/>
		</>
	);
}
