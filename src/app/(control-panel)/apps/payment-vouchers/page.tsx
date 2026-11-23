'use client';

import { Eye, Plus, Printer, Trash2 } from 'lucide-react';
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
	MoneyText,
	PageHeader,
	Pagination,
	PrintPreviewDialog,
	SearchInput,
	Select,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { formatDateShort, formatMoney, monthKey } from '@/lib/format';
import { FALLBACK, PAYMENT_METHOD } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type Payment = {
	id: string;
	voucherNumber: string;
	date: string;
	payeeName: string;
	description?: string | null;
	amount: number;
	paymentMethod: string;
	withholdingTax?: { whtNumber: string; incomeType: string; taxAmount: number } | null;
};

const PAGE_SIZE = 10;
const TABS = ['ALL', 'TRANSFER', 'CHEQUE', 'CASH'] as const;
type Tab = (typeof TABS)[number];
const INCOME_TYPES = ['ค่าจ้าง', 'ค่าบริการ', 'ค่าเช่า', 'ค่าขนส่ง', 'ค่าโฆษณา', 'อื่นๆ'];
const sum = (a: Payment[]) => a.reduce((s, r) => s + Number(r.amount), 0);

export default function PaymentVouchersPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<Payment[]>('/api/payment-vouchers');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [income, setIncome] = useState('ALL');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<Payment | null>(null);
	const [del, setDel] = useState<Payment | null>(null);

	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(r) =>
				(tab === 'ALL' || r.paymentMethod === tab) &&
				(income === 'ALL' || r.withholdingTax?.incomeType === income) &&
				(!k || `${r.voucherNumber} ${r.payeeName} ${r.description ?? ''}`.toLowerCase().includes(k))
		);
	}, [list, tab, q, income]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const nowKey = monthKey(new Date());
	const withheld = list.filter((r) => r.withholdingTax);

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`/api/payment-vouchers/${del.id}`, 'DELETE');
			alert.showSuccess('ลบเรียบร้อย', del.voucherNumber);
			await qc.invalidateQueries({ queryKey: ['/api/payment-vouchers'] });
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
		}

		setDel(null);
	}

	return (
		<>
			<PageHeader
				title="ใบสำคัญจ่าย"
				subtitle="บันทึกการจ่ายเงินให้ช่างและผู้รับเงิน พร้อมหัก ณ ที่จ่าย"
				actions={
					<Button
						href="/apps/payment-vouchers/new"
						icon={<Plus size={18} />}
					>
						ออกใบสำคัญจ่าย
					</Button>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="จ่ายเดือนนี้"
					value={formatMoney(sum(list.filter((r) => monthKey(r.date) === nowKey)), 0)}
				/>
				<StatCard
					label="จ่ายปีนี้"
					color="ink"
					value={formatMoney(sum(list.filter((r) => monthKey(r.date).slice(0, 4) === nowKey.slice(0, 4))), 0)}
				/>
				<StatCard
					label="มีหัก ณ ที่จ่าย"
					color="info"
					value={`${withheld.length} ใบ`}
					sub={`ภาษีที่หัก ${formatMoney(
						withheld.reduce((s, r) => s + Number(r.withholdingTax?.taxAmount ?? 0), 0),
						0
					)}`}
				/>
			</StatGrid>
			<Card>
				<FilterTabs
					tabs={TABS.map((t) => ({
						value: t,
						label: t === 'ALL' ? 'ทั้งหมด' : PAYMENT_METHOD[t].label,
						count: t === 'ALL' ? list.length : list.filter((r) => r.paymentMethod === t).length
					}))}
					value={tab}
					onChange={(v) => {
						setTab(v);
						setPage(1);
					}}
					label="กรองตามวิธีจ่าย"
				/>
				<div className="flex flex-wrap gap-4">
					<FilterField
						label="ค้นหา"
						className="min-w-64 flex-1"
					>
						{(id) => (
							<SearchInput
								id={id}
								value={q}
								onChange={(e) => {
									setQ(e.target.value);
									setPage(1);
								}}
								placeholder="เลขที่ ผู้รับเงิน หรือรายละเอียด"
							/>
						)}
					</FilterField>
					<FilterField
						label="ประเภทเงินได้"
						className="w-56"
					>
						{(id) => (
							<Select
								id={id}
								value={income}
								onChange={(e) => {
									setIncome(e.target.value);
									setPage(1);
								}}
							>
								<option value="ALL">ทุกประเภท</option>
								{INCOME_TYPES.map((t) => (
									<option key={t}>{t}</option>
								))}
							</Select>
						)}
					</FilterField>
				</div>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ยังไม่มีใบสำคัญจ่าย"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/payment-vouchers/${r.id}`}
									className="font-semibold"
								>
									{r.voucherNumber}
								</Link>
							)
						},
						{
							key: 'd',
							header: 'วันที่',
							cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span>
						},
						{
							key: 'p',
							header: 'ผู้รับเงิน',
							cell: (r) => (
								<TwoLine
									title={r.payeeName}
									sub={r.description}
								/>
							)
						},
						{
							key: 'm',
							header: 'วิธีจ่าย',
							cell: (r) => {
								const m = PAYMENT_METHOD[r.paymentMethod] ?? FALLBACK;
								return (
									<StatusBadge
										label={m.label}
										tone={m.tone}
									/>
								);
							}
						},
						{
							key: 'w',
							header: 'หัก ณ ที่จ่าย',
							cell: (r) =>
								r.withholdingTax ? (
									<StatusBadge
										label="50 ทวิ"
										tone="info"
									/>
								) : (
									<span className="text-ink-muted">ไม่หัก</span>
								)
						},
						{ key: 'a', header: 'จำนวนเงิน', money: true, cell: (r) => <MoneyText value={r.amount} /> },
						{
							key: 'act',
							header: <span className="sr-only">การดำเนินการ</span>,
							align: 'right',
							cell: (r) => (
								<ActionMenu
									actions={[
										{
											label: 'ดูรายละเอียด',
											icon: Eye,
											onClick: () => router.push(`/apps/payment-vouchers/${r.id}`)
										},
										{ label: 'พิมพ์ใบสำคัญจ่าย', icon: Printer, onClick: () => setPrint(r) },
										{ label: 'ลบ', icon: Trash2, danger: true, onClick: () => setDel(r) }
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
				title={print?.voucherNumber ?? ''}
				src={print ? `/api/payment-vouchers/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!del}
				danger
				title="ลบใบสำคัญจ่าย"
				message={`ต้องการลบ ${del?.voucherNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
