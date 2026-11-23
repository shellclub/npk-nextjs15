'use client';

import { Ban, CircleCheck, Eye, Pencil, Plus, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	ActionMenu,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	FilterField,
	FilterTabs,
	IconButton,
	MoneyText,
	PageHeader,
	Pagination,
	PrintPreviewDialog,
	SearchInput,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { COST_TYPE_LABEL, quotationMargins, summarizePO, type POItemLite } from '@/components/purchase-orders/po-math';
import { formatMoney, monthKey } from '@/lib/format';
import { FALLBACK, PO_STATUS } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type PO = {
	id: string;
	poNumber: string;
	date: string;
	status: string;
	contractorQuoteUrl?: string | null;
	quotationId?: string | null;
	costType?: string;
	payeeName?: string | null;
	workOrder?: {
		woNumber: string;
		description?: string | null;
		quotation?: {
			projectName?: string | null;
			customerGroup?: { groupName: string };
			branch?: { name: string } | null;
		} | null;
	} | null;
	quotation?: {
		projectName?: string | null;
		subtotal?: number | string | null;
		customerGroup?: { groupName: string };
		branch?: { name: string } | null;
	} | null;
	team?: { teamName: string; leaderName?: string } | null;
	items?: POItemLite[];
};

const PAGE_SIZE = 10;
const TABS = ['ALL', 'DRAFT', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'] as const;
const ref = (p: PO) => p.quotation ?? p.workOrder?.quotation;

export default function PurchaseOrdersPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<PO[]>('/api/purchase-orders');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState('ALL');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<PO | null>(null);
	const [cancel, setCancel] = useState<PO | null>(null);
	const [busy, setBusy] = useState(false);

	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(p) =>
				(tab === 'ALL' || p.status === tab) &&
				(!k ||
					`${p.poNumber} ${p.team?.teamName ?? ''} ${p.workOrder?.woNumber ?? ''} ${ref(p)?.projectName ?? ''} ${ref(p)?.customerGroup?.groupName ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, q]);
	const margins = useMemo(() => quotationMargins(list), [list]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const year = monthKey(new Date()).slice(0, 4);
	const live = list.filter((p) => p.status !== 'CANCELLED');
	const net = (a: PO[]) => a.reduce((s, p) => s + summarizePO(p.items).net, 0);
	const adjNet = live.reduce((s, p) => {
		const x = summarizePO(p.items);
		return s + x.add - x.deduct;
	}, 0);
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/purchase-orders'] });

	async function approve(p: PO) {
		setBusy(true);

		try {
			await sendJson(`/api/purchase-orders/${p.id}`, 'PATCH', { status: 'APPROVED' });
			alert.showSuccess('อนุมัติเรียบร้อย', p.poNumber);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติได้ กรุณาลองใหม่');
		} finally {
			setBusy(false);
		}
	}

	async function doCancel() {
		if (!cancel) return;

		setBusy(true);

		try {
			await sendJson(`/api/purchase-orders/${cancel.id}`, 'DELETE');
			alert.showSuccess('ยกเลิกเรียบร้อย', cancel.poNumber);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่');
		} finally {
			setBusy(false);
			setCancel(null);
		}
	}

	return (
		<>
			<PageHeader
				title="ใบสั่งซื้อให้ช่าง"
				subtitle="ใบสั่งงานให้ทีมช่าง พร้อมยอดงานเพิ่ม/ลดที่ตรวจสอบย้อนหลังได้"
				actions={
					<Button
						href="/apps/purchase-orders/new"
						icon={<Plus size={18} />}
					>
						สร้างใบสั่งซื้อ
					</Button>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="ใบสั่งซื้อปีนี้"
					value={`${live.filter((p) => monthKey(p.date).slice(0, 4) === year).length} ใบ`}
					sub={formatMoney(net(live.filter((p) => monthKey(p.date).slice(0, 4) === year)), 0)}
				/>
				<StatCard
					label="แบบร่าง / อนุมัติ"
					color="info"
					value={`${list.filter((p) => p.status === 'DRAFT').length} / ${list.filter((p) => p.status === 'APPROVED').length}`}
				/>
				<StatCard
					label="สั่งซื้อแล้ว"
					color="success"
					value={`${list.filter((p) => p.status === 'ORDERED').length} ใบ`}
				/>
				<StatCard
					tone="warn"
					color="warn"
					label="ยอดปรับแก้สุทธิ"
					value={formatMoney(adjNet, 0)}
					sub="ลบรายการปรับแก้ไม่ได้ (เก็บเป็นหลักฐาน)"
				/>
			</StatGrid>
			<Card>
				<FilterTabs
					tabs={TABS.map((t) => ({
						value: t,
						label: t === 'ALL' ? 'แสดงทั้งหมด' : (PO_STATUS[t] ?? FALLBACK).label,
						count: t === 'ALL' ? list.length : list.filter((p) => p.status === t).length
					}))}
					value={tab}
					onChange={(v) => {
						setTab(v);
						setPage(1);
					}}
				/>
				<FilterField
					label="ค้นหา"
					className="max-w-xl"
				>
					{(id) => (
						<SearchInput
							id={id}
							value={q}
							onChange={(e) => {
								setQ(e.target.value);
								setPage(1);
							}}
							placeholder="เลข PO ทีมช่าง WO ลูกค้า หรือโครงการ"
						/>
					)}
				</FilterField>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ยังไม่มีใบสั่งซื้อ"
					columns={[
						{
							key: 'no',
							header: 'เลข PO ช่าง',
							cell: (r) => (
								<Link
									href={`/apps/purchase-orders/${r.id}`}
									className="font-semibold whitespace-nowrap"
								>
									{r.poNumber}
								</Link>
							)
						},
						{
							key: 'p',
							header: 'ชื่องาน / ลูกค้า สาขา',
							cell: (r) => (
								<TwoLine
									title={ref(r)?.projectName || r.workOrder?.description || '-'}
									sub={`${ref(r)?.customerGroup?.groupName ?? '-'}${ref(r)?.branch?.name ? ` · ${ref(r)?.branch?.name}` : ''}`}
								/>
							)
						},
						{
							key: 't',
							header: 'ทีมช่าง / ผู้ติดต่อ',
							cell: (r) => (
								<TwoLine
									title={
										r.team
											? `${r.team.teamName}${r.team.leaderName ? ` / ${r.team.leaderName}` : ''}`
											: (r.payeeName ?? '-')
									}
									sub={COST_TYPE_LABEL[r.costType ?? 'LABOUR']}
								/>
							)
						},
						{
							key: 'm',
							header: 'ค่าของ',
							money: true,
							cell: (r) => formatMoney(summarizePO(r.items).material)
						},
						{
							key: 'l',
							header: 'ค่าแรง',
							money: true,
							cell: (r) => formatMoney(summarizePO(r.items).labour)
						},
						{
							key: 'a',
							header: 'ยอดงานเพิ่ม',
							money: true,
							cell: (r) => (
								<MoneyText
									value={summarizePO(r.items).add}
									sign="+"
								/>
							)
						},
						{
							key: 'd',
							header: 'ยอดงานลด',
							money: true,
							cell: (r) => (
								<MoneyText
									value={summarizePO(r.items).deduct}
									sign="-"
								/>
							)
						},
						{
							key: 'n',
							header: 'สรุปค่างาน',
							money: true,
							cell: (r) => <MoneyText value={summarizePO(r.items).net} />
						},
						{
							key: 'gap',
							header: 'ส่วนต่างจากเสนอราคา',
							money: true,
							cell: (r) =>
								r.quotationId && margins.has(r.quotationId) ? (
									<span
										className={
											(margins.get(r.quotationId) ?? 0) < 0 ? 'text-danger font-semibold' : ''
										}
									>
										{formatMoney(margins.get(r.quotationId))}
									</span>
								) : (
									'-'
								)
						},
						{
							key: 's',
							header: 'สถานะ',
							cell: (r) => {
								const m = PO_STATUS[r.status] ?? FALLBACK;
								return (
									<StatusBadge
										label={m.label}
										tone={m.tone}
									/>
								);
							}
						},
						{
							key: 'f',
							header: 'แนบเอกสาร',
							cell: (r) =>
								r.contractorQuoteUrl ? (
									<a
										href={r.contractorQuoteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="bg-tint rounded-sm px-2 py-0.5 text-sm"
									>
										ใบเสนอราคาช่าง
									</a>
								) : (
									<span className="text-ink-muted">-</span>
								)
						},
						{
							key: 'act',
							header: <span className="sr-only">จัดการ</span>,
							align: 'right',
							cell: (r) => (
								<div className="flex items-center justify-end">
									<IconButton
										aria-label={`ดู ${r.poNumber}`}
										href={`/apps/purchase-orders/${r.id}`}
									>
										<Eye size={18} />
									</IconButton>
									<IconButton
										aria-label={`พิมพ์ ${r.poNumber}`}
										onClick={() => setPrint(r)}
									>
										<Printer size={18} />
									</IconButton>
									<ActionMenu
										disabled={busy}
										actions={[
											{
												label: 'แก้ไข',
												icon: Pencil,
												hidden: r.status === 'CANCELLED',
												onClick: () => router.push(`/apps/purchase-orders/${r.id}`)
											},
											{
												label: 'อนุมัติ',
												icon: CircleCheck,
												hidden: r.status !== 'DRAFT',
												onClick: () => approve(r)
											},
											{
												label: 'ยกเลิกใบสั่งซื้อ',
												icon: Ban,
												danger: true,
												hidden: r.status === 'CANCELLED',
												onClick: () => setCancel(r)
											}
										]}
									/>
								</div>
							)
						}
					]}
				/>
				<Pagination
					page={page}
					pageSize={PAGE_SIZE}
					total={filtered.length}
					onChange={setPage}
				/>
			</Card>
			<PrintPreviewDialog
				open={!!print}
				onClose={() => setPrint(null)}
				title={print?.poNumber ?? ''}
				src={print ? `/api/purchase-orders/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!cancel}
				danger
				busy={busy}
				title="ยกเลิกใบสั่งซื้อ"
				message={`ต้องการยกเลิก ${cancel?.poNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ยกเลิกใบสั่งซื้อ"
				onClose={() => setCancel(null)}
				onConfirm={doCancel}
			/>
		</>
	);
}
