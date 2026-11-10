'use client';

import { Download, Eye, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
	ActionMenu,
	Button,
	Card,
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
import { downloadCsv } from '@/lib/csv';
import { formatDateShort, formatMoney, formatMonthLabel, monthKey } from '@/lib/format';
import { useApi } from '@/lib/use-api';

type Wht = {
	id: string;
	whtNumber: string;
	date: string;
	payeeName: string;
	payeeTaxId?: string | null;
	incomeType: string;
	taxRate: number;
	incomeAmount: number;
	taxAmount: number;
	paymentVoucher?: { id?: string; voucherNumber: string } | null;
};

const PAGE_SIZE = 10;
const sum = (a: Wht[], k: 'incomeAmount' | 'taxAmount') => a.reduce((s, r) => s + Number(r[k]), 0);

export default function WithholdingTaxPage() {
	const router = useRouter();
	const { data, isLoading } = useApi<Wht[]>('/api/withholding-tax');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [q, setQ] = useState('');
	const [month, setMonth] = useState('ALL');
	const [type, setType] = useState('ALL');
	const [page, setPage] = useState(1);
	const [print, setPrint] = useState<Wht | null>(null);

	const months = useMemo(
		() =>
			Array.from(new Set(list.map((r) => monthKey(r.date))))
				.sort()
				.reverse(),
		[list]
	);
	const types = useMemo(() => Array.from(new Set(list.map((r) => r.incomeType))), [list]);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(r) =>
				(month === 'ALL' || monthKey(r.date) === month) &&
				(type === 'ALL' || r.incomeType === type) &&
				(!k || `${r.whtNumber} ${r.payeeName} ${r.payeeTaxId ?? ''}`.toLowerCase().includes(k))
		);
	}, [list, q, month, type]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const nowKey = monthKey(new Date());
	const thisMonth = list.filter((r) => monthKey(r.date) === nowKey);
	const thisYear = list.filter((r) => monthKey(r.date).slice(0, 4) === nowKey.slice(0, 4));

	return (
		<>
			<PageHeader
				title="ออก 50 ทวิ"
				subtitle="หนังสือรับรองการหักภาษี ณ ที่จ่าย ที่ออกจากใบสำคัญจ่าย"
				actions={
					<Button
						variant="soft"
						icon={<Download size={18} />}
						onClick={() =>
							downloadCsv(
								'รายงานหักภาษี ณ ที่จ่าย.csv',
								[
									'เลขที่',
									'วันที่',
									'ผู้ถูกหักภาษี',
									'เลขผู้เสียภาษี',
									'ประเภทเงินได้',
									'อัตรา %',
									'เงินได้',
									'ภาษีหัก',
									'ใบสำคัญจ่าย'
								],
								filtered.map((r) => [
									r.whtNumber,
									formatDateShort(r.date),
									r.payeeName,
									r.payeeTaxId,
									r.incomeType,
									r.taxRate,
									r.incomeAmount,
									r.taxAmount,
									r.paymentVoucher?.voucherNumber
								])
							)
						}
					>
						ส่งออกสำหรับยื่น ภ.ง.ด.
					</Button>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="ภาษีหักเดือนนี้"
					value={formatMoney(sum(thisMonth, 'taxAmount'), 0)}
					sub={`${thisMonth.length} ฉบับ`}
				/>
				<StatCard
					label="ภาษีหักทั้งปี"
					color="ink"
					value={formatMoney(sum(thisYear, 'taxAmount'), 0)}
					sub={`${thisYear.length} ฉบับ`}
				/>
				<StatCard
					label="เงินได้ที่จ่ายทั้งปี"
					color="info"
					value={formatMoney(sum(thisYear, 'incomeAmount'), 0)}
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
								placeholder="เลขที่ ผู้ถูกหักภาษี หรือเลขผู้เสียภาษี"
							/>
						)}
					</FilterField>
					<FilterField
						label="เดือนภาษี"
						className="w-52"
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
					<FilterField
						label="ประเภทเงินได้"
						className="w-52"
					>
						{(id) => (
							<Select
								id={id}
								value={type}
								onChange={(e) => {
									setType(e.target.value);
									setPage(1);
								}}
							>
								<option value="ALL">ทุกประเภท</option>
								{types.map((t) => (
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
					empty="ยังไม่มีรายการหัก ณ ที่จ่าย"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/withholding-tax/${r.id}`}
									className="font-semibold"
								>
									{r.whtNumber}
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
							header: 'ผู้ถูกหักภาษี',
							cell: (r) => (
								<TwoLine
									title={r.payeeName}
									sub={r.payeeTaxId}
								/>
							)
						},
						{ key: 't', header: 'ประเภทเงินได้', cell: (r) => r.incomeType },
						{ key: 'r', header: 'อัตรา', align: 'right', cell: (r) => `${Number(r.taxRate)}%` },
						{ key: 'i', header: 'เงินได้', money: true, cell: (r) => <MoneyText value={r.incomeAmount} /> },
						{ key: 'x', header: 'ภาษีหัก', money: true, cell: (r) => <MoneyText value={r.taxAmount} /> },
						{
							key: 'v',
							header: 'ใบสำคัญจ่าย',
							cell: (r) =>
								r.paymentVoucher ? (
									<Link href={`/apps/payment-vouchers/${r.paymentVoucher.id ?? ''}`}>
										{r.paymentVoucher.voucherNumber}
									</Link>
								) : (
									'-'
								)
						},
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
											onClick: () => router.push(`/apps/withholding-tax/${r.id}`)
										},
										{ label: 'พิมพ์ 50 ทวิ', icon: Printer, onClick: () => setPrint(r) }
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
								รวม {filtered.length} ฉบับ
							</td>
							<td className="px-3 py-3 text-right">{formatMoney(sum(filtered, 'incomeAmount'))}</td>
							<td className="px-3 py-3 text-right">{formatMoney(sum(filtered, 'taxAmount'))}</td>
							<td colSpan={2} />
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
				title={print?.whtNumber ?? ''}
				src={print ? `/api/withholding-tax/${print.id}/pdf` : ''}
			/>
		</>
	);
}
