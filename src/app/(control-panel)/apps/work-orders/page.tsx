'use client';

import {
	Banknote,
	Ban,
	Columns3,
	Eye,
	List,
	Pencil,
	Play,
	Plus,
	Printer,
	Truck,
	CircleCheck,
	ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	ActionMenu,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	FilterField,
	FilterTabs,
	MoneyText,
	PageHeader,
	Pagination,
	PrintPreviewDialog,
	SearchInput,
	Segmented,
	Select,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { WorkOrderDialog } from '@/components/work-orders/WorkOrderDialog';
import { WORKFLOW_BADGE, isOverdue, type StatusConfig, type WorkOrder } from '@/components/work-orders/types';
import { formatDateShort, formatMoney, monthKey } from '@/lib/format';
import { sendJson, useApi } from '@/lib/use-api';

const PAGE_SIZE = 10;
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DAY = 86_400_000;
const DUE = [
	{ v: 'ALL', label: 'ทั้งหมด' },
	{ v: 'OVERDUE', label: 'เลยกำหนด' },
	{ v: '7D', label: 'ภายใน 7 วัน' },
	{ v: 'NONE', label: 'ไม่ระบุกำหนด' }
];

const poActive = (w: WorkOrder) => (w.purchaseOrders ?? []).filter((p) => p.status !== 'CANCELLED');

/** ขั้นตอนถัดไปของ WO ตามสถานะ/ข้อมูลที่มี */
function nextStep(w: WorkOrder): { label: string; href?: string; action?: 'assign' | 'pay' } | null {
	if (w.status === 'CANCELLED') return null;

	if (!w.teamId && !w.team) return { label: 'มอบหมายช่าง', action: 'assign' };

	if (w.status === 'COMPLETED') return { label: 'จ่ายช่าง', action: 'pay' };

	if (w.status === 'PAID')
		return w.invoices?.length ? null : { label: 'ออกใบแจ้งหนี้', href: `/apps/invoices/new?workOrderId=${w.id}` };

	if (!poActive(w).length)
		return { label: 'ออกใบสั่งซื้อช่าง', href: `/apps/purchase-orders/new?workOrderId=${w.id}` };

	return null;
}

function WorkOrdersList() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const sp = useSearchParams();
	const { data, isLoading } = useApi<WorkOrder[]>('/api/work-orders');
	const { data: statusData } = useApi<StatusConfig[]>('/api/work-order-statuses');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const statuses = useMemo(
		() => (Array.isArray(statusData) ? statusData.filter((s) => s.isActive) : []),
		[statusData]
	);
	const smap = useMemo(
		() => Object.fromEntries((Array.isArray(statusData) ? statusData : []).map((s) => [s.code, s])),
		[statusData]
	);
	const [tab, setTab] = useState('ALL');
	const [view, setView] = useState<'table' | 'board'>('table');
	const [q, setQ] = useState('');
	const [team, setTeam] = useState('ALL');
	const [due, setDue] = useState('ALL');
	const [year, setYear] = useState('ALL');
	const [month, setMonth] = useState('ALL');
	const [page, setPage] = useState(1);
	const [dlg, setDlg] = useState<{ mode: 'create' | 'edit'; wo?: WorkOrder } | null>(null);
	const [print, setPrint] = useState<WorkOrder | null>(null);
	const [cancel, setCancel] = useState<WorkOrder | null>(null);
	const [pay, setPay] = useState<WorkOrder | null>(null);
	const [busy, setBusy] = useState(false);
	const quotationParam = sp.get('quotationId') ?? '';

	useEffect(() => {
		if (quotationParam) setDlg({ mode: 'create' });
	}, [quotationParam]);

	const teams = useMemo(
		() => Array.from(new Set(list.map((w) => w.team?.teamName || w.teamName).filter(Boolean))) as string[],
		[list]
	);
	const years = useMemo(
		() =>
			Array.from(new Set(list.map((w) => monthKey(w.date).slice(0, 4))))
				.sort()
				.reverse(),
		[list]
	);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter((w) => {
			const mk = monthKey(w.date);
			const t = w.team?.teamName || w.teamName || '';
			const end = w.endDate ? new Date(w.endDate).getTime() : null;

			return (
				(tab === 'ALL' || w.status === tab) &&
				(team === 'ALL' || t === team) &&
				(year === 'ALL' || mk.slice(0, 4) === year) &&
				(month === 'ALL' || Number(mk.slice(5)) === Number(month)) &&
				(due === 'ALL' ||
					(due === 'OVERDUE' && isOverdue(w)) ||
					(due === 'NONE' && !end) ||
					(due === '7D' &&
						end !== null &&
						end >= Date.now() &&
						end - Date.now() <= 7 * DAY &&
						w.status !== 'CANCELLED')) &&
				(!k ||
					`${w.woNumber} ${w.poNumber ?? ''} ${w.quotation?.quotationNumber ?? ''} ${w.quotation?.customerGroup.groupName ?? ''} ${w.quotation?.projectName ?? ''} ${w.description ?? ''}`
						.toLowerCase()
						.includes(k))
			);
		});
	}, [list, tab, team, due, year, month, q]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const reset = () => setPage(1);
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/work-orders'] });
	const badge = (code: string) => {
		const s = smap[code];

		return (
			<StatusBadge
				label={s?.name ?? code}
				color={s?.color}
				bgColor={s?.bgColor}
			/>
		);
	};

	async function setStatus(w: WorkOrder, status: string, label: string) {
		setBusy(true);

		try {
			await sendJson(`/api/work-orders/${w.id}`, 'PATCH', { status });
			alert.showSuccess('อัปเดตสถานะ', `${w.woNumber} → ${label}`);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด');
		} finally {
			setBusy(false);
			setCancel(null);
		}
	}

	async function payContractor() {
		if (!pay) return;

		setBusy(true);

		try {
			const r = await sendJson(`/api/work-orders/${pay.id}/pay-contractor`, 'POST');
			setPay(null);
			router.push(`/apps/payment-vouchers/${r.paymentVoucher.id}`);
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		} finally {
			setBusy(false);
		}
	}

	function stepButton(w: WorkOrder) {
		const s = nextStep(w);

		if (!s) return null;

		if (s.href)
			return (
				<Button
					variant="soft"
					className="h-10 px-3"
					href={s.href}
				>
					{s.label}
				</Button>
			);

		return (
			<Button
				variant="soft"
				className="h-10 px-3"
				onClick={() => (s.action === 'pay' ? setPay(w) : setDlg({ mode: 'edit', wo: w }))}
			>
				{s.label}
			</Button>
		);
	}

	return (
		<>
			<PageHeader
				title="ตอบรับทำงาน (WO/PO)"
				subtitle="ติดตามงานตั้งแต่ตอบรับจากลูกค้า มอบหมายช่าง จนถึงวางบิล"
				actions={
					<Button
						icon={<Plus size={18} />}
						onClick={() => setDlg({ mode: 'create' })}
					>
						สร้าง WO ใหม่
					</Button>
				}
			/>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
				{statuses.map((s) => {
					const items = list.filter((w) => w.status === s.code);

					return (
						<div
							key={s.code}
							className="border-line bg-surface flex overflow-hidden rounded-xl border"
						>
							<span
								aria-hidden="true"
								className="w-1.5 shrink-0"
								style={{ backgroundColor: s.color }}
							/>
							<div className="px-4 py-3.5">
								<div className="text-ink-muted text-sm">{s.name}</div>
								<div className="font-display text-2xl font-semibold">{items.length} งาน</div>
								<div className="text-ink-muted text-[13px]">
									{formatMoney(
										items.reduce((a, w) => a + Number(w.totalAmount), 0),
										0
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<Card>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<FilterTabs
						tabs={[
							{ value: 'ALL', label: 'ทั้งหมด', count: list.length },
							...statuses.map((s) => ({
								value: s.code,
								label: s.name,
								count: list.filter((w) => w.status === s.code).length
							}))
						]}
						value={tab}
						onChange={(v) => {
							setTab(v);
							reset();
						}}
					/>
					<Segmented
						label="มุมมอง"
						value={view}
						onChange={(v) => setView(v as 'table' | 'board')}
						options={[
							{
								value: 'table',
								label: (
									<>
										<List
											size={16}
											aria-hidden="true"
										/>
										ตาราง
									</>
								)
							},
							{
								value: 'board',
								label: (
									<>
										<Columns3
											size={16}
											aria-hidden="true"
										/>
										บอร์ด
									</>
								)
							}
						]}
					/>
				</div>
				<div className="flex flex-wrap gap-4">
					<FilterField
						label="ค้นหา"
						className="min-w-64 flex-[2]"
					>
						{(id) => (
							<SearchInput
								id={id}
								value={q}
								onChange={(e) => {
									setQ(e.target.value);
									reset();
								}}
								placeholder="เลข WO, PO ลูกค้า, QT, ลูกค้า, งาน"
							/>
						)}
					</FilterField>
					<FilterField
						label="ทีมช่าง"
						className="min-w-44 flex-1"
					>
						{(id) => (
							<Select
								id={id}
								value={team}
								onChange={(e) => {
									setTeam(e.target.value);
									reset();
								}}
							>
								<option value="ALL">ทุกทีม</option>
								{teams.map((t) => (
									<option key={t}>{t}</option>
								))}
							</Select>
						)}
					</FilterField>
					<FilterField
						label="กำหนดเสร็จ"
						className="min-w-44 flex-1"
					>
						{(id) => (
							<Select
								id={id}
								value={due}
								onChange={(e) => {
									setDue(e.target.value);
									reset();
								}}
							>
								{DUE.map((d) => (
									<option
										key={d.v}
										value={d.v}
									>
										{d.label}
									</option>
								))}
							</Select>
						)}
					</FilterField>
					<FilterField
						label="ปี (พ.ศ.)"
						className="w-36"
					>
						{(id) => (
							<Select
								id={id}
								value={year}
								onChange={(e) => {
									setYear(e.target.value);
									reset();
								}}
							>
								<option value="ALL">ทุกปี</option>
								{years.map((y) => (
									<option
										key={y}
										value={y}
									>
										{Number(y) + 543}
									</option>
								))}
							</Select>
						)}
					</FilterField>
					<FilterField
						label="เดือน"
						className="w-36"
					>
						{(id) => (
							<Select
								id={id}
								value={month}
								onChange={(e) => {
									setMonth(e.target.value);
									reset();
								}}
							>
								<option value="ALL">ทุกเดือน</option>
								{MONTHS.map((m, i) => (
									<option
										key={m}
										value={i + 1}
									>
										{m}
									</option>
								))}
							</Select>
						)}
					</FilterField>
				</div>

				{view === 'table' ? (
					<>
						<DataTable
							loading={isLoading}
							rows={rows}
							rowKey={(r) => r.id}
							onRowClick={(r) => router.push(`/apps/work-orders/${r.id}`)}
							empty="ไม่พบงาน WO"
							columns={[
								{
									key: 'wo',
									header: 'เลขที่ WO',
									cell: (r) => (
										<TwoLine
											title={
												<Link
													href={`/apps/work-orders/${r.id}`}
													onClick={(e) => e.stopPropagation()}
												>
													{r.woNumber}
												</Link>
											}
											sub={formatDateShort(r.date)}
										/>
									)
								},
								{
									key: 'po',
									header: 'PO ลูกค้า / อ้างอิง QT',
									cell: (r) => (
										<TwoLine
											title={r.poNumber || '-'}
											sub={r.quotation?.quotationNumber}
										/>
									)
								},
								{
									key: 'c',
									header: 'ลูกค้า / งาน',
									cell: (r) => (
										<div>
											<TwoLine
												title={r.quotation?.customerGroup.groupName ?? '-'}
												sub={r.quotation?.projectName || r.description}
											/>
											{r.workflowType && WORKFLOW_BADGE[r.workflowType] && (
												<StatusBadge
													className="mt-1"
													label={WORKFLOW_BADGE[r.workflowType].label}
													tone={WORKFLOW_BADGE[r.workflowType].tone}
												/>
											)}
										</div>
									)
								},
								{
									key: 't',
									header: 'ทีมช่าง',
									cell: (r) =>
										r.team?.teamName ||
										r.teamName || <span className="text-ink-muted">ยังไม่มอบหมาย</span>
								},
								{
									key: 'e',
									header: 'กำหนดเสร็จ',
									cell: (r) =>
										isOverdue(r) ? (
											<span className="text-danger font-semibold whitespace-nowrap">
												{formatDateShort(r.endDate)}{' '}
												<span className="text-[13px]">เลยกำหนด</span>
											</span>
										) : (
											<span className="whitespace-nowrap">{formatDateShort(r.endDate)}</span>
										)
								},
								{
									key: 'a',
									header: 'มูลค่า',
									money: true,
									cell: (r) => <MoneyText value={r.totalAmount} />
								},
								{ key: 's', header: 'สถานะ', cell: (r) => badge(r.status) },
								{
									key: 'act',
									header: <span className="sr-only">ขั้นตอนถัดไป</span>,
									align: 'right',
									cell: (r) => (
										<div
											className="flex items-center justify-end gap-1"
											onClick={(e) => e.stopPropagation()}
										>
											{stepButton(r)}
											<ActionMenu
												disabled={busy}
												actions={[
													{
														label: 'ดูรายละเอียด',
														icon: Eye,
														onClick: () => router.push(`/apps/work-orders/${r.id}`)
													},
													{
														label: 'แก้ไข',
														icon: Pencil,
														hidden: r.status === 'CANCELLED',
														onClick: () => setDlg({ mode: 'edit', wo: r })
													},
													{
														label: 'เริ่มดำเนินการ',
														icon: Play,
														hidden: r.status !== 'PENDING',
														onClick: () => setStatus(r, 'IN_PROGRESS', 'กำลังดำเนินการ')
													},
													{
														label: 'งานเสร็จสิ้น',
														icon: CircleCheck,
														hidden: r.status !== 'IN_PROGRESS',
														onClick: () => setStatus(r, 'COMPLETED', 'เสร็จสิ้น')
													},
													{
														label: 'ออกใบสำคัญจ่ายช่าง',
														icon: Banknote,
														hidden: r.status !== 'COMPLETED',
														onClick: () => setPay(r)
													},
													{
														label: 'พิมพ์ใบตอบรับงาน',
														icon: Printer,
														hidden: r.status === 'CANCELLED',
														onClick: () => setPrint(r)
													},
													{
														label: 'ใบส่งมอบงาน',
														icon: Truck,
														hidden: r.status === 'CANCELLED',
														onClick: () =>
															window.open(
																`/api/work-orders/${r.id}/delivery-note`,
																'_blank'
															)
													},
													{
														label: 'ยกเลิก WO',
														icon: Ban,
														danger: true,
														hidden: r.status === 'CANCELLED' || r.status === 'PAID',
														onClick: () => setCancel(r)
													}
												]}
											/>
											<ChevronRight
												size={18}
												aria-hidden="true"
												className="text-ink-muted"
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
					</>
				) : (
					<div className="grid auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto pb-2">
						{statuses.map((s) => {
							const items = filtered.filter((w) => w.status === s.code);

							return (
								<section
									key={s.code}
									aria-label={s.name}
									className="bg-surface-2 flex flex-col gap-3 rounded-xl p-3"
								>
									<div className="flex items-center justify-between px-1">
										{badge(s.code)}
										<span className="text-ink-muted text-sm">{items.length}</span>
									</div>
									{items.length === 0 && <p className="text-ink-muted px-1 text-sm">ไม่มีงาน</p>}
									{items.map((w) => (
										<Link
											key={w.id}
											href={`/apps/work-orders/${w.id}`}
											className="bg-surface text-ink shadow-depth hover:shadow-lift hover:text-ink flex flex-col gap-1 rounded-2xl p-4 no-underline ring-1 ring-black/[0.04] motion-safe:transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5"
										>
											<span className="font-display text-primary-ink font-semibold">
												{w.woNumber}
											</span>
											<span
												className={
													isOverdue(w)
														? 'text-danger text-[13px] font-semibold'
														: 'text-ink-muted text-[13px]'
												}
											>
												กำหนดเสร็จ {formatDateShort(w.endDate)}
												{isOverdue(w) && ' · เลยกำหนด'}
											</span>
											<span className="font-semibold">
												{w.quotation?.projectName || w.description || '-'}
											</span>
											<span className="text-sm">
												{w.quotation?.customerGroup.groupName ?? '-'}
											</span>
											<span className="text-ink-muted flex justify-between text-[13px]">
												<span>{w.team?.teamName || w.teamName || 'ยังไม่มอบหมาย'}</span>
												<span className="text-ink font-semibold">
													{formatMoney(w.totalAmount, 0)}
												</span>
											</span>
										</Link>
									))}
								</section>
							);
						})}
					</div>
				)}
			</Card>

			<WorkOrderDialog
				open={!!dlg}
				mode={dlg?.mode ?? 'create'}
				wo={dlg?.wo}
				initialQuotationId={quotationParam}
				onClose={() => {
					setDlg(null);

					if (quotationParam) router.replace('/apps/work-orders');
				}}
			/>
			<PrintPreviewDialog
				open={!!print}
				onClose={() => setPrint(null)}
				title={print?.woNumber ?? ''}
				src={print ? `/api/work-orders/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!cancel}
				danger
				busy={busy}
				title="ยกเลิก WO"
				message={`ต้องการยกเลิก ${cancel?.woNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ยกเลิก WO"
				onClose={() => setCancel(null)}
				onConfirm={() => cancel && setStatus(cancel, 'CANCELLED', 'ยกเลิก')}
			/>
			<ConfirmDialog
				open={!!pay}
				busy={busy}
				title="ออกใบสำคัญจ่ายช่าง"
				message={`ออกใบสำคัญจ่ายและบันทึก ${pay?.woNumber ?? ''} เป็นจ่ายแล้ว?`}
				confirmLabel="ออกใบสำคัญจ่าย"
				onClose={() => setPay(null)}
				onConfirm={payContractor}
			/>
		</>
	);
}

export default function WorkOrdersPage() {
	return (
		<Suspense fallback={<p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>}>
			<WorkOrdersList />
		</Suspense>
	);
}
