'use client';

import {
	ChevronRight,
	CircleDollarSign,
	Clock,
	FileText,
	Landmark,
	Plus,
	Receipt,
	ReceiptText,
	Wallet,
	Wrench
} from 'lucide-react';
import Link from 'next/link';
import { Button, PageHeader, StatusBadge } from '@/components/ui';
import {
	CashFlowChart,
	DonutWidget,
	KpiWidget,
	MiniStat,
	NetBarsChart,
	RecentRow,
	Widget,
	WidgetHeader
} from '@/components/dashboard/widgets';
import { formatDateLong, formatMoney, formatMoneyCompact } from '@/lib/format';
import { type WoStatusConfig } from '@/lib/status';
import { useQuotationStatuses } from '@/lib/use-quotation-statuses';
import { useApi } from '@/lib/use-api';

type Recent = { id: string; number: string; customer: string; project: string; amount: number; status: string };
type Dashboard = {
	quotations: { total: number; approved: number; totalAmount: number };
	workOrders: { total: number; inProgress: number; completed: number; paid: number };
	invoices: { unpaid: number; partial: number; totalAmount: number; paidAmount: number };
	receiptVouchers: { total: number; totalAmount: number };
	paymentVouchers: { total: number; totalAmount: number };
	taxInvoices: { total: number; totalAmount: number };
	withholdingTax: { total: number; totalAmount: number };
	recentQuotations: Recent[];
	recentWorkOrders: Recent[];
	monthlyChart: { month: string; label: string; income: number; expense: number }[];
};
type Wo = { status: string };

const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

export default function DashboardPage() {
	const { data: d } = useApi<Dashboard>('/api/dashboard');
	const { data: statuses = [] } = useApi<WoStatusConfig[]>('/api/work-order-statuses');
	const { data: wos = [] } = useApi<Wo[]>('/api/work-orders');
	const qs = useQuotationStatuses();
	const statusMap = Object.fromEntries(statuses.map((s) => [s.code, s]));
	const months = d?.monthlyChart ?? [];
	const last = months[months.length - 1];
	const prev = months[months.length - 2];
	const net = (last?.income ?? 0) - (last?.expense ?? 0);
	const outstanding = (d?.invoices.totalAmount ?? 0) - (d?.invoices.paidAmount ?? 0);
	const pendingPay = wos.filter((w) => w.status === 'COMPLETED').length;
	const woTotal = d?.workOrders.total ?? 0;
	const woDone = (d?.workOrders.completed ?? 0) + (d?.workOrders.paid ?? 0);

	return (
		<>
			<PageHeader
				title="ภาพรวมระบบ"
				subtitle={formatDateLong(new Date())}
				actions={
					<>
						<Button
							variant="soft"
							href="/apps/invoices/new"
							icon={<Receipt size={18} />}
						>
							ออกใบแจ้งหนี้
						</Button>
						<Button
							href="/apps/quotations/new"
							icon={<Plus size={18} />}
						>
							สร้างใบเสนอราคา
						</Button>
					</>
				}
			/>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
				<KpiWidget
					tone="hero"
					icon={<FileText size={24} />}
					label={`ใบเสนอราคา ${d?.quotations.total ?? 0} ใบ`}
					value={formatMoneyCompact(d?.quotations.totalAmount ?? 0)}
					sub={`อนุมัติแล้ว ${d?.quotations.approved ?? 0} ใบ`}
					meter={{
						ratio: d?.quotations.total ? d.quotations.approved / d.quotations.total : 0,
						text: `อัตราอนุมัติ ${d?.quotations.total ? Math.round((d.quotations.approved / d.quotations.total) * 100) : 0}%`
					}}
				/>
				<KpiWidget
					icon={<Wrench size={24} />}
					label="งาน WO กำลังดำเนินการ"
					value={d?.workOrders.inProgress ?? 0}
					sub={`ทั้งหมด ${woTotal} งาน`}
					meter={{
						ratio: woTotal ? woDone / woTotal : 0,
						text: `เสร็จสิ้น/จ่ายแล้ว ${woDone} จาก ${woTotal} งาน`
					}}
				/>
				<KpiWidget
					tone="warn"
					icon={<Clock size={24} />}
					label={`ค้างชำระ ${(d?.invoices.unpaid ?? 0) + (d?.invoices.partial ?? 0)} ใบ`}
					value={formatMoney(outstanding, 0)}
					sub="ใบแจ้งหนี้ที่ยังเก็บเงินไม่ครบ"
					meter={{
						ratio: d?.invoices.totalAmount ? d.invoices.paidAmount / d.invoices.totalAmount : 0,
						text: `เก็บเงินแล้ว ${d?.invoices.totalAmount ? Math.round((d.invoices.paidAmount / d.invoices.totalAmount) * 100) : 0}%`
					}}
				/>
				<KpiWidget
					icon={<CircleDollarSign size={24} />}
					label="รับ − จ่าย เดือนนี้"
					value={formatMoney(net, 0)}
					delta={pct(last?.income ?? 0, prev?.income ?? 0)}
					sub="รายรับเทียบเดือนก่อน"
					spark={months.map((m) => m.income - m.expense)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-5 min-[1100px]:grid-cols-[3fr_2fr]">
				<Widget>
					<WidgetHeader
						title="กระแสเงินสด"
						sub={`รายรับ–รายจ่าย ${months.length} เดือนล่าสุด`}
						action={
							<div className="flex gap-4 text-[15px]">
								<span className="flex items-center gap-1.5">
									<span className="bg-primary size-3 rounded-full" />
									รายรับ
								</span>
								<span className="flex items-center gap-1.5">
									<span className="bg-chart-expense size-3 rounded-full" />
									รายจ่าย
								</span>
							</div>
						}
					/>
					<CashFlowChart data={months} />
				</Widget>
				<Widget>
					<WidgetHeader
						title="กำไรสุทธิรายเดือน"
						sub="รายรับ − รายจ่าย (เขียว = กำไร, แดง = ขาดทุน)"
					/>
					<NetBarsChart data={months} />
				</Widget>
			</div>

			<div className="grid grid-cols-1 gap-5 min-[1100px]:grid-cols-[2fr_3fr]">
				<Widget>
					<WidgetHeader
						title="สถานะงาน WO"
						sub={`ทั้งหมด ${wos.length} งาน`}
					/>
					<DonutWidget
						centerLabel="งาน"
						items={statuses.map((s) => ({
							key: s.code,
							label: s.name,
							value: wos.filter((w) => w.status === s.code).length,
							color: s.color
						}))}
					/>
					<Link
						href="/apps/pending-payments"
						className="from-warn-soft text-warn hover:text-warn mt-auto flex min-h-12 items-center justify-between rounded-2xl bg-gradient-to-r to-white px-4 text-[16px] no-underline ring-1 ring-black/[0.04]"
					>
						<span>
							<strong>{pendingPay} งาน</strong> เสร็จแล้ว รอจ่ายช่าง
						</span>
						<ChevronRight
							size={18}
							aria-hidden="true"
						/>
					</Link>
				</Widget>

				<div className="grid grid-cols-1 gap-5 min-[1280px]:grid-cols-2">
					<Widget>
						<WidgetHeader
							title="ใบเสนอราคาล่าสุด"
							action={
								<Link
									href="/apps/quotations"
									className="text-[15px] font-medium"
								>
									ดูทั้งหมด
								</Link>
							}
						/>
						<ul className="flex flex-col">
							{(d?.recentQuotations ?? []).map((r, i) => {
								const m = qs.meta(r.status);

								return (
									<RecentRow
										key={r.id}
										index={i}
										href={`/apps/quotations/${r.id}`}
										title={r.customer}
										sub={r.project}
										number={r.number}
										amount={r.amount}
										badge={
											<StatusBadge
												label={m.label}
												tone={m.tone}
												color={m.color}
												bgColor={m.bgColor}
											/>
										}
									/>
								);
							})}
						</ul>
					</Widget>
					<Widget>
						<WidgetHeader
							title="งาน WO ล่าสุด"
							action={
								<Link
									href="/apps/work-orders"
									className="text-[15px] font-medium"
								>
									ดูทั้งหมด
								</Link>
							}
						/>
						<ul className="flex flex-col">
							{(d?.recentWorkOrders ?? []).map((r, i) => {
								const c = statusMap[r.status];

								return (
									<RecentRow
										key={r.id}
										index={i + 2}
										href={`/apps/work-orders/${r.id}`}
										title={r.customer}
										sub={r.project}
										number={r.number}
										amount={r.amount}
										badge={
											<StatusBadge
												label={c?.name ?? r.status}
												color={c?.color}
												bgColor={c?.bgColor}
											/>
										}
									/>
								);
							})}
						</ul>
					</Widget>
				</div>
			</div>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
				<MiniStat
					label="ใบกำกับภาษี"
					amount={d?.taxInvoices.totalAmount ?? 0}
					count={d?.taxInvoices.total ?? 0}
					icon={<ReceiptText size={22} />}
				/>
				<MiniStat
					label="ใบสำคัญรับ"
					amount={d?.receiptVouchers.totalAmount ?? 0}
					count={d?.receiptVouchers.total ?? 0}
					icon={<Wallet size={22} />}
				/>
				<MiniStat
					label="ใบสำคัญจ่าย"
					amount={d?.paymentVouchers.totalAmount ?? 0}
					count={d?.paymentVouchers.total ?? 0}
					icon={<CircleDollarSign size={22} />}
				/>
				<MiniStat
					label="หัก ณ ที่จ่าย (50 ทวิ)"
					amount={d?.withholdingTax.totalAmount ?? 0}
					count={d?.withholdingTax.total ?? 0}
					icon={<Landmark size={22} />}
				/>
			</div>
		</>
	);
}
