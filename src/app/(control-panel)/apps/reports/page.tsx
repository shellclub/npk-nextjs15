'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
	Card,
	CardHeader,
	DataTable,
	FilterField,
	MoneyText,
	PageHeader,
	Select,
	StatCard,
	StatGrid,
	TwoLine
} from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';

type Totals = { quotationTotal: number; actualCost: number; actualRevenue: number; woCount: number };
type MonthData = Totals & { month: number };
type Report = { year: number; yearCE: number; monthly: MonthData[]; totals: Totals; vat7: Omit<Totals, 'woCount'> };
type MonthWO = {
	id: string;
	woNumber: string;
	date: string;
	projectName: string;
	quotationNumber: string;
	teamName: string;
	quotationTotal: number;
	actualCost: number;
	actualRevenue: number;
};
type MonthDetail = { workOrders: MonthWO[]; summary: Totals };
type Team = { id: string; teamName: string };

const MONTHS = [
	'มกราคม',
	'กุมภาพันธ์',
	'มีนาคม',
	'เมษายน',
	'พฤษภาคม',
	'มิถุนายน',
	'กรกฎาคม',
	'สิงหาคม',
	'กันยายน',
	'ตุลาคม',
	'พฤศจิกายน',
	'ธันวาคม'
];
const SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function MonthlyChart({ data }: { data: MonthData[] }) {
	const max = Math.max(1, ...data.flatMap((m) => [m.quotationTotal, m.actualCost]));
	const summary = data
		.map(
			(m) =>
				`${MONTHS[m.month - 1]} เสนอราคา ${formatMoney(m.quotationTotal, 0)} ต้นทุน ${formatMoney(m.actualCost, 0)}`
		)
		.join(', ');

	return (
		<div
			role="img"
			aria-label={`กราฟยอดเสนอราคาและต้นทุนรายเดือน: ${summary}`}
			className="border-line flex h-56 items-end gap-2 border-b"
		>
			{data.map((m) => (
				<div
					key={m.month}
					className="flex h-full flex-1 flex-col justify-end"
				>
					<div className="flex flex-1 items-end justify-center gap-1">
						<div
							className="bg-primary w-full max-w-5 rounded-t-sm"
							style={{ height: `${(m.quotationTotal / max) * 100}%` }}
						/>
						<div
							className="bg-chart-expense w-full max-w-5 rounded-t-sm"
							style={{ height: `${(m.actualCost / max) * 100}%` }}
						/>
					</div>
					<div className="text-ink-muted h-6 pt-1 text-center text-xs">{SHORT[m.month - 1]}</div>
				</div>
			))}
		</div>
	);
}

const profitCls = (n: number) => (n < 0 ? 'text-danger' : 'text-success');

export default function ReportsPage() {
	const router = useRouter();
	const thisYear = new Date().getFullYear() + 543;
	const [year, setYear] = useState(thisYear);
	const [team, setTeam] = useState('');
	const [month, setMonth] = useState(0);
	const { data: teams = [] } = useApi<Team[]>('/api/technicians');
	const { data: report, isLoading } = useApi<Report>('/api/reports/monthly-summary', { year, teamId: team });
	const { data: detail, isLoading: detailLoading } = useApi<MonthDetail>(
		'/api/reports/monthly-summary',
		{ year, teamId: team, month },
		month > 0
	);
	const t = report?.totals;
	const margin = t && t.quotationTotal > 0 ? (t.actualRevenue / t.quotationTotal) * 100 : 0;

	return (
		<>
			<PageHeader
				title="สรุปรายงานรายปี"
				subtitle="ยอดเสนอราคา ต้นทุน และกำไรของงาน WO แยกตามเดือน"
			/>
			<Card>
				<div className="flex flex-wrap gap-4">
					<FilterField
						label="ปี (พ.ศ.)"
						className="w-56"
					>
						{(id) => (
							<Select
								id={id}
								value={year}
								onChange={(e) => {
									setYear(Number(e.target.value));
									setMonth(0);
								}}
							>
								{Array.from({ length: 5 }, (_, i) => thisYear - i).map((y) => (
									<option
										key={y}
										value={y}
									>
										{y} (ค.ศ. {y - 543})
									</option>
								))}
							</Select>
						)}
					</FilterField>
					<FilterField
						label="เลือกทีมช่าง"
						className="w-64"
					>
						{(id) => (
							<Select
								id={id}
								value={team}
								onChange={(e) => {
									setTeam(e.target.value);
									setMonth(0);
								}}
							>
								<option value="">ทุกทีม</option>
								{(Array.isArray(teams) ? teams : []).map((tm) => (
									<option
										key={tm.id}
										value={tm.id}
									>
										{tm.teamName}
									</option>
								))}
							</Select>
						)}
					</FilterField>
				</div>
			</Card>

			<StatGrid>
				<StatCard
					tone="tint"
					label="จำนวน WO ทั้งปี"
					value={`${t?.woCount ?? 0} งาน`}
				/>
				<StatCard
					label="ยอดเสนอราคา (ก่อน VAT)"
					color="primary"
					value={formatMoney(t?.quotationTotal ?? 0, 0)}
				/>
				<StatCard
					tone="warn"
					color="warn"
					label="ต้นทุนรวม"
					value={formatMoney(t?.actualCost ?? 0, 0)}
				/>
				<StatCard
					label="กำไรสุทธิ"
					color={(t?.actualRevenue ?? 0) < 0 ? 'danger' : 'success'}
					value={formatMoney(t?.actualRevenue ?? 0, 0)}
					sub={`${margin.toFixed(1)}% ของยอดเสนอราคา`}
				/>
			</StatGrid>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-6">
				<div className="flex flex-col gap-6">
					<Card>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h2 className="font-display text-xl font-semibold">รายเดือน พ.ศ. {year}</h2>
							<div className="flex gap-4 text-sm">
								<span className="flex items-center gap-1.5">
									<span className="bg-primary size-3 rounded-sm" />
									เสนอราคา
								</span>
								<span className="flex items-center gap-1.5">
									<span className="bg-chart-expense size-3 rounded-sm" />
									ต้นทุน
								</span>
							</div>
						</div>
						<MonthlyChart data={report?.monthly ?? []} />
					</Card>
					<Card>
						<DataTable
							loading={isLoading}
							rows={report?.monthly ?? []}
							rowKey={(m) => String(m.month)}
							selectedKey={month ? String(month) : null}
							columns={[
								{
									key: 'm',
									header: 'เดือน',
									cell: (m) => (
										<button
											type="button"
											aria-pressed={month === m.month}
											onClick={() => setMonth(m.month)}
											className="text-primary-ink focus-visible:outline-focus cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
										>
											{MONTHS[m.month - 1]}
										</button>
									)
								},
								{ key: 'n', header: 'WO', align: 'right', cell: (m) => m.woCount },
								{
									key: 'q',
									header: 'เสนอราคา',
									money: true,
									cell: (m) => <MoneyText value={m.quotationTotal} />
								},
								{
									key: 'c',
									header: 'ต้นทุน',
									money: true,
									cell: (m) => <MoneyText value={m.actualCost} />
								},
								{
									key: 'p',
									header: 'กำไร',
									money: true,
									cell: (m) => (
										<MoneyText
											value={m.actualRevenue}
											className={profitCls(m.actualRevenue)}
										/>
									)
								}
							]}
							footer={
								report && (
									<>
										<tr>
											<td className="px-3 py-3">ทั้งหมด</td>
											<td className="px-3 py-3 text-right">{report.totals.woCount}</td>
											<td className="px-3 py-3 text-right">
												{formatMoney(report.totals.quotationTotal)}
											</td>
											<td className="px-3 py-3 text-right">
												{formatMoney(report.totals.actualCost)}
											</td>
											<td
												className={clsx(
													'px-3 py-3 text-right',
													profitCls(report.totals.actualRevenue)
												)}
											>
												{formatMoney(report.totals.actualRevenue)}
											</td>
										</tr>
										<tr>
											<td className="px-3 py-3">รวม VAT 7%</td>
											<td />
											<td className="px-3 py-3 text-right">
												{formatMoney(report.vat7.quotationTotal)}
											</td>
											<td className="px-3 py-3 text-right">
												{formatMoney(report.vat7.actualCost)}
											</td>
											<td className="px-3 py-3 text-right">
												{formatMoney(report.vat7.actualRevenue)}
											</td>
										</tr>
									</>
								)
							}
						/>
					</Card>
				</div>

				<Card className="self-start">
					<CardHeader
						title={month ? `งาน WO เดือน${MONTHS[month - 1]} ${year}` : 'งาน WO ของเดือนที่เลือก'}
					/>
					{!month ? (
						<p className="text-ink-muted">เลือกเดือนจากตารางเพื่อดูรายการ WO</p>
					) : (
						<DataTable
							loading={detailLoading}
							rows={detail?.workOrders ?? []}
							rowKey={(w) => w.id}
							onRowClick={(w) => router.push(`/apps/work-orders/${w.id}`)}
							empty="ไม่พบข้อมูลเดือนนี้"
							columns={[
								{
									key: 'w',
									header: 'WO',
									cell: (w) => (
										<TwoLine
											title={w.woNumber}
											sub={formatDateShort(w.date)}
										/>
									)
								},
								{
									key: 'p',
									header: 'โครงการ / ทีม',
									cell: (w) => (
										<TwoLine
											title={w.projectName}
											sub={`${w.quotationNumber} · ${w.teamName}`}
										/>
									)
								},
								{
									key: 'q',
									header: 'เสนอราคา',
									money: true,
									cell: (w) => <MoneyText value={w.quotationTotal} />
								},
								{
									key: 'c',
									header: 'ต้นทุน',
									money: true,
									cell: (w) => <MoneyText value={w.actualCost} />
								},
								{
									key: 'g',
									header: 'กำไร',
									money: true,
									cell: (w) => (
										<MoneyText
											value={w.actualRevenue}
											className={profitCls(w.actualRevenue)}
										/>
									)
								}
							]}
						/>
					)}
				</Card>
			</div>
		</>
	);
}
