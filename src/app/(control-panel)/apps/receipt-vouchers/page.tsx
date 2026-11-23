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
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { formatDateShort, formatMoney, monthKey } from '@/lib/format';
import { FALLBACK, PAYMENT_METHOD } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type Receipt = {
	id: string;
	voucherNumber: string;
	date: string;
	amount: number;
	paymentMethod: string;
	bankName?: string | null;
	chequeNumber?: string | null;
	chequeDate?: string | null;
	invoice?: {
		invoiceNumber: string;
		workOrder?: { quotation?: { customerGroup: { groupName: string } } | null } | null;
	} | null;
};

const PAGE_SIZE = 10;
const TABS = ['ALL', 'TRANSFER', 'CHEQUE', 'CASH'] as const;
type Tab = (typeof TABS)[number];
const sum = (a: Receipt[]) => a.reduce((s, r) => s + Number(r.amount), 0);

export default function ReceiptVouchersPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<Receipt[]>('/api/receipt-vouchers');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<Receipt | null>(null);
	const [del, setDel] = useState<Receipt | null>(null);

	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(r) =>
				(tab === 'ALL' || r.paymentMethod === tab) &&
				(!k ||
					`${r.voucherNumber} ${r.invoice?.invoiceNumber ?? ''} ${r.invoice?.workOrder?.quotation?.customerGroup.groupName ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, q]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const nowKey = monthKey(new Date());
	const pendingCheques = list.filter(
		(r) => r.paymentMethod === 'CHEQUE' && r.chequeDate && new Date(r.chequeDate) > new Date()
	);

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`/api/receipt-vouchers/${del.id}`, 'DELETE');
			alert.showSuccess('ลบเรียบร้อย', del.voucherNumber);
			await qc.invalidateQueries({ queryKey: ['/api/receipt-vouchers'] });
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
		}

		setDel(null);
	}

	return (
		<>
			<PageHeader
				title="ใบสำคัญรับ"
				subtitle="บันทึกการรับเงินจากลูกค้า"
				actions={
					<Button
						href="/apps/receipt-vouchers/new"
						icon={<Plus size={18} />}
					>
						ออกใบสำคัญรับ
					</Button>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="รับเดือนนี้"
					value={formatMoney(sum(list.filter((r) => monthKey(r.date) === nowKey)), 0)}
				/>
				<StatCard
					label="รับปีนี้"
					color="success"
					value={formatMoney(sum(list.filter((r) => monthKey(r.date).slice(0, 4) === nowKey.slice(0, 4))), 0)}
				/>
				<StatCard
					tone="warn"
					color="warn"
					label="เช็ครอเคลียร์"
					value={`${pendingCheques.length} ใบ`}
					sub={formatMoney(sum(pendingCheques), 0)}
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
					label="กรองตามวิธีชำระ"
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
							placeholder="เลขที่ ลูกค้า หรือใบแจ้งหนี้"
						/>
					)}
				</FilterField>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ยังไม่มีใบสำคัญรับ"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/receipt-vouchers/${r.id}`}
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
							key: 'c',
							header: 'ลูกค้า / ใบแจ้งหนี้',
							cell: (r) => (
								<TwoLine
									title={r.invoice?.workOrder?.quotation?.customerGroup.groupName ?? '-'}
									sub={r.invoice?.invoiceNumber}
								/>
							)
						},
						{
							key: 'm',
							header: 'วิธีชำระ',
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
							key: 'b',
							header: 'ธนาคาร / เช็ค',
							cell: (r) => (
								<TwoLine
									title={r.bankName || '-'}
									sub={r.chequeNumber ? `เช็ค ${r.chequeNumber}` : undefined}
								/>
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
											onClick: () => router.push(`/apps/receipt-vouchers/${r.id}`)
										},
										{ label: 'พิมพ์ใบสำคัญรับ', icon: Printer, onClick: () => setPrint(r) },
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
				src={print ? `/api/receipt-vouchers/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!del}
				danger
				title="ลบใบสำคัญรับ"
				message={`ต้องการลบ ${del?.voucherNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
