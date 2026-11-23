'use client';

import { Download, Eye, Plus, Printer, Trash2 } from 'lucide-react';
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
	MoneyText,
	PageHeader,
	Pagination,
	PrintPreviewDialog,
	SearchInput,
	Select,
	StatCard,
	StatGrid,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { downloadCsv } from '@/lib/csv';
import { formatDateShort, formatMoney, formatMonthLabel, monthKey } from '@/lib/format';
import { sendJson, useApi } from '@/lib/use-api';

type TaxInvoice = {
	id: string;
	taxInvoiceNumber: string;
	date: string;
	subtotal: number;
	vatAmount: number;
	totalAmount: number;
	invoice?: {
		invoiceNumber: string;
		workOrder?: {
			woNumber: string;
			quotation?: { customerGroup: { groupName: string; taxId?: string | null } } | null;
		} | null;
	} | null;
};

const PAGE_SIZE = 10;
const sum = (a: TaxInvoice[], k: 'subtotal' | 'vatAmount' | 'totalAmount') => a.reduce((s, r) => s + Number(r[k]), 0);
const customer = (r: TaxInvoice) => r.invoice?.workOrder?.quotation?.customerGroup;

export default function TaxInvoicesPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<TaxInvoice[]>('/api/tax-invoices');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [q, setQ] = useState('');
	const [month, setMonth] = useState('ALL');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<TaxInvoice | null>(null);
	const [del, setDel] = useState<TaxInvoice | null>(null);

	const months = useMemo(
		() =>
			Array.from(new Set(list.map((r) => monthKey(r.date))))
				.sort()
				.reverse(),
		[list]
	);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(r) =>
				(month === 'ALL' || monthKey(r.date) === month) &&
				(!k ||
					`${r.taxInvoiceNumber} ${customer(r)?.groupName ?? ''} ${r.invoice?.invoiceNumber ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, q, month]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const nowKey = monthKey(new Date());
	const thisMonth = list.filter((r) => monthKey(r.date) === nowKey);
	const thisYear = list.filter((r) => monthKey(r.date).slice(0, 4) === nowKey.slice(0, 4));

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`/api/tax-invoices/${del.id}`, 'DELETE');
			alert.showSuccess('ลบเรียบร้อย', del.taxInvoiceNumber);
			await qc.invalidateQueries({ queryKey: ['/api/tax-invoices'] });
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
		}

		setDel(null);
	}

	return (
		<>
			<PageHeader
				title="ใบกำกับภาษี"
				subtitle="ใบกำกับภาษีที่ออกจากใบแจ้งหนี้ และสรุปภาษีขาย"
				actions={
					<>
						<Button
							variant="soft"
							icon={<Download size={18} />}
							onClick={() =>
								downloadCsv(
									'รายงานภาษีขาย.csv',
									[
										'เลขที่',
										'วันที่',
										'ลูกค้า',
										'เลขผู้เสียภาษี',
										'ใบแจ้งหนี้',
										'ก่อน VAT',
										'VAT',
										'รวม'
									],
									filtered.map((r) => [
										r.taxInvoiceNumber,
										formatDateShort(r.date),
										customer(r)?.groupName,
										customer(r)?.taxId,
										r.invoice?.invoiceNumber,
										r.subtotal,
										r.vatAmount,
										r.totalAmount
									])
								)
							}
						>
							ส่งออกรายงานภาษีขาย
						</Button>
						<Button
							href="/apps/tax-invoices/new"
							icon={<Plus size={18} />}
						>
							ออกใบกำกับภาษี
						</Button>
					</>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="VAT เดือนนี้"
					value={formatMoney(sum(thisMonth, 'vatAmount'), 0)}
					sub={`${thisMonth.length} ใบ`}
				/>
				<StatCard
					label="ออกทั้งปี"
					color="ink"
					value={`${thisYear.length} ใบ`}
					sub={`ยอดรวม ${formatMoney(sum(thisYear, 'totalAmount'), 0)}`}
				/>
				<StatCard
					label="VAT สะสมทั้งปี (ภ.พ.30)"
					color="info"
					value={formatMoney(sum(thisYear, 'vatAmount'), 0)}
				/>
			</StatGrid>
			<Card>
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
								placeholder="เลขที่ ลูกค้า หรือใบแจ้งหนี้"
							/>
						)}
					</FilterField>
					<FilterField
						label="เดือนภาษี"
						className="w-56"
					>
						{(id) => (
							<Select
								id={id}
								value={month}
								onChange={(e) => {
									setMonth(e.target.value);
									setPage(1);
								}}
							>
								<option value="ALL">ทุกเดือน</option>
								{months.map((m) => (
									<option
										key={m}
										value={m}
									>
										{formatMonthLabel(m)}
									</option>
								))}
							</Select>
						)}
					</FilterField>
				</div>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ยังไม่มีใบกำกับภาษี"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/tax-invoices/${r.id}`}
									className="font-semibold"
								>
									{r.taxInvoiceNumber}
								</Link>
							)
						},
						{
							key: 'd',
							header: 'วันที่',
							cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span>
						},
						{ key: 'c', header: 'ลูกค้า', cell: (r) => <TwoLine title={customer(r)?.groupName ?? '-'} /> },
						{ key: 't', header: 'เลขผู้เสียภาษี', cell: (r) => customer(r)?.taxId ?? '-' },
						{ key: 'i', header: 'อ้างอิงใบแจ้งหนี้', cell: (r) => r.invoice?.invoiceNumber ?? '-' },
						{ key: 's', header: 'ก่อน VAT', money: true, cell: (r) => <MoneyText value={r.subtotal} /> },
						{ key: 'v', header: 'VAT 7%', money: true, cell: (r) => <MoneyText value={r.vatAmount} /> },
						{ key: 'a', header: 'ยอดรวม', money: true, cell: (r) => <MoneyText value={r.totalAmount} /> },
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
											onClick: () => router.push(`/apps/tax-invoices/${r.id}`)
										},
										{ label: 'พิมพ์ใบกำกับภาษี', icon: Printer, onClick: () => setPrint(r) },
										{ label: 'ลบ', icon: Trash2, danger: true, onClick: () => setDel(r) }
									]}
								/>
							)
						}
					]}
					footer={
						<tr>
							<td
								colSpan={5}
								className="px-3 py-3 text-right"
							>
								รวม {filtered.length} ใบ
							</td>
							<td className="px-3 py-3 text-right">{formatMoney(sum(filtered, 'subtotal'))}</td>
							<td className="px-3 py-3 text-right">{formatMoney(sum(filtered, 'vatAmount'))}</td>
							<td className="px-3 py-3 text-right">{formatMoney(sum(filtered, 'totalAmount'))}</td>
							<td />
						</tr>
					}
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
				title={print?.taxInvoiceNumber ?? ''}
				src={print ? `/api/tax-invoices/${print.id}/pdf` : ''}
			/>
			<ConfirmDialog
				open={!!del}
				danger
				title="ลบใบกำกับภาษี"
				message={`ต้องการลบ ${del?.taxInvoiceNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
