'use client';

import { CircleCheck, Clock, Eye, Plus, Printer, Trash2 } from 'lucide-react';
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
	FilterTabs,
	MoneyText,
	Pagination,
	PageHeader,
	PrintPreviewDialog,
	SearchInput,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { formatDateShort, formatMoney } from '@/lib/format';
import { FALLBACK, INVOICE_STATUS } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type Invoice = {
	id: string;
	invoiceNumber: string;
	date: string;
	dueDate?: string | null;
	totalAmount: number;
	status: string;
	workOrder?: {
		woNumber: string;
		quotation?: { quotationNumber: string; customerGroup: { groupName: string } } | null;
	} | null;
};

const PAGE_SIZE = 10;
const TABS = ['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
type Tab = (typeof TABS)[number];

function isOverdue(i: Invoice) {
	return (
		i.status === 'OVERDUE' ||
		(['UNPAID', 'PARTIAL'].includes(i.status) && !!i.dueDate && new Date(i.dueDate) < new Date())
	);
}

export default function InvoicesPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data = [], isLoading } = useApi<Invoice[]>('/api/invoices');
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<Invoice | null>(null);
	const [cancel, setCancel] = useState<Invoice | null>(null);
	const [busy, setBusy] = useState(false);

	const list = Array.isArray(data) ? data : [];
	const counts = useMemo(() => {
		const c: Record<string, number> = { ALL: list.length };
		list.forEach((i) => {
			c[i.status] = (c[i.status] ?? 0) + 1;
		});

		return c;
	}, [list]);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(i) =>
				(tab === 'ALL' || i.status === tab) &&
				(!k ||
					`${i.invoiceNumber} ${i.workOrder?.woNumber ?? ''} ${i.workOrder?.quotation?.customerGroup.groupName ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, q]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const live = list.filter((i) => i.status !== 'CANCELLED');
	const unpaid = live.filter((i) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(i.status));
	const overdue = list.filter(isOverdue);
	const now = new Date();
	const thisMonth = (d: string) =>
		new Date(d).getMonth() === now.getMonth() && new Date(d).getFullYear() === now.getFullYear();
	const paidMonth = list.filter((i) => i.status === 'PAID' && thisMonth(i.date));
	const sum = (a: Invoice[]) => a.reduce((s, i) => s + Number(i.totalAmount), 0);
	const year = live.filter((i) => new Date(i.date).getFullYear() === now.getFullYear());

	async function setStatus(inv: Invoice, status: string, label: string) {
		setBusy(true);

		try {
			await sendJson(`/api/invoices/${inv.id}`, 'PATCH', { status });
			alert.showSuccess('อัปเดตสำเร็จ', `${inv.invoiceNumber} → ${label}`);
			await qc.invalidateQueries({ queryKey: ['/api/invoices'] });
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
		} finally {
			setBusy(false);
			setCancel(null);
		}
	}

	return (
		<>
			<PageHeader
				title="ใบแจ้งหนี้"
				subtitle="ติดตามการชำระเงินและวางบิลจากงานที่เสร็จแล้ว"
				actions={
					<Button
						href="/apps/invoices/new"
						icon={<Plus size={18} />}
					>
						สร้างใบแจ้งหนี้
					</Button>
				}
			/>

			<StatGrid>
				<StatCard
					tone="tint"
					label="ค้างชำระ"
					value={formatMoney(sum(unpaid), 0)}
					sub={`${unpaid.length} ใบ`}
				/>
				<StatCard
					tone="warn"
					color="danger"
					label="เกินกำหนด"
					value={`${overdue.length} ใบ`}
					sub={formatMoney(sum(overdue), 0)}
				/>
				<StatCard
					label="รับชำระเดือนนี้"
					color="success"
					value={formatMoney(sum(paidMonth), 0)}
					sub={`${paidMonth.length} ใบ`}
				/>
				<StatCard
					label="ออกทั้งปี"
					color="ink"
					value={formatMoney(sum(year), 0)}
					sub={`${year.length} ใบ`}
				/>
			</StatGrid>

			<Card>
				<FilterTabs
					tabs={TABS.map((t) => ({
						value: t,
						label: t === 'ALL' ? 'แสดงทั้งหมด' : INVOICE_STATUS[t].label,
						count: counts[t] ?? 0
					}))}
					value={tab}
					onChange={(v) => {
						setTab(v);
						setPage(1);
					}}
				/>
				<div className="border-line border-t pt-4">
					<label
						htmlFor="inv-search"
						className="font-display text-ink-muted mb-1.5 block text-[13px] font-medium"
					>
						ค้นหา
					</label>
					<SearchInput
						id="inv-search"
						value={q}
						onChange={(e) => {
							setQ(e.target.value);
							setPage(1);
						}}
						placeholder="เลขที่ใบแจ้งหนี้ ชื่อลูกค้า หรือเลข WO"
						className="max-w-xl"
					/>
				</div>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ยังไม่มีใบแจ้งหนี้"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/invoices/${r.id}`}
									className="font-semibold"
								>
									{r.invoiceNumber}
								</Link>
							)
						},
						{
							key: 'date',
							header: 'วันที่',
							cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span>
						},
						{
							key: 'due',
							header: 'ครบกำหนด',
							cell: (r) => (
								<span
									className={
										isOverdue(r) && r.status !== 'CANCELLED'
											? 'text-danger font-semibold whitespace-nowrap'
											: 'whitespace-nowrap'
									}
								>
									{formatDateShort(r.dueDate)}
								</span>
							)
						},
						{
							key: 'cust',
							header: 'ลูกค้า / WO',
							cell: (r) => (
								<TwoLine
									title={r.workOrder?.quotation?.customerGroup.groupName ?? '-'}
									sub={r.workOrder?.woNumber}
								/>
							)
						},
						{
							key: 'amt',
							header: 'ยอดรวม',
							money: true,
							cell: (r) => (
								<MoneyText
									value={r.totalAmount}
									className={r.status === 'CANCELLED' ? 'text-ink-muted line-through' : ''}
								/>
							)
						},
						{
							key: 'st',
							header: 'สถานะ',
							cell: (r) => {
								const m = INVOICE_STATUS[r.status] ?? FALLBACK;
								return (
									<StatusBadge
										label={m.label}
										tone={m.tone}
									/>
								);
							}
						},
						{
							key: 'act',
							header: <span className="sr-only">การดำเนินการ</span>,
							align: 'right',
							cell: (r) => (
								<ActionMenu
									disabled={busy}
									actions={[
										{
											label: 'ดูรายละเอียด',
											icon: Eye,
											onClick: () => router.push(`/apps/invoices/${r.id}`)
										},
										{ label: 'พิมพ์ใบแจ้งหนี้', icon: Printer, onClick: () => setPrint(r) },
										{
											label: 'ชำระแล้ว',
											icon: CircleCheck,
											hidden:
												r.status !== 'UNPAID' &&
												r.status !== 'PARTIAL' &&
												r.status !== 'OVERDUE',
											onClick: () => setStatus(r, 'PAID', 'ชำระแล้ว')
										},
										{
											label: 'ชำระบางส่วน',
											icon: Clock,
											hidden: r.status !== 'UNPAID',
											onClick: () => setStatus(r, 'PARTIAL', 'ชำระบางส่วน')
										},
										{
											label: 'ยกเลิก',
											icon: Trash2,
											danger: true,
											hidden: r.status === 'CANCELLED' || r.status === 'PAID',
											onClick: () => setCancel(r)
										}
									]}
								/>
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
				title={print?.invoiceNumber ?? ''}
				src={print ? `/api/invoices/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!cancel}
				danger
				busy={busy}
				title="ยกเลิกใบแจ้งหนี้"
				message={`ต้องการยกเลิก ${cancel?.invoiceNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ยกเลิกใบแจ้งหนี้"
				onClose={() => setCancel(null)}
				onConfirm={() => cancel && setStatus(cancel, 'CANCELLED', 'ยกเลิก')}
			/>
		</>
	);
}
