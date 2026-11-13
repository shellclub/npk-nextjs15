'use client';

import { Banknote, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
	ActionMenu,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	FilterField,
	MoneyText,
	PageHeader,
	SearchInput,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { formatDateShort, formatMoney } from '@/lib/format';
import { sendJson, useApi } from '@/lib/use-api';

type WorkOrder = {
	id: string;
	woNumber: string;
	date: string;
	description?: string | null;
	totalAmount: number;
	endDate?: string | null;
	quotation?: { quotationNumber: string; projectName?: string | null; customerGroup: { groupName: string } } | null;
	team?: { teamName: string; leaderName: string } | null;
	purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
};

/** ยอดจ่ายช่าง = รวม PO ช่างที่ไม่ยกเลิก ถ้าไม่มี PO ใช้มูลค่า WO */
function payAmount(wo: WorkOrder) {
	const po = (wo.purchaseOrders ?? []).filter((p) => p.status !== 'CANCELLED');
	const total = po.reduce((s, p) => s + Number(p.totalAmount), 0);

	return total > 0 ? total : Number(wo.totalAmount);
}

const activePo = (wo: WorkOrder) => (wo.purchaseOrders ?? []).filter((p) => p.status !== 'CANCELLED');
const DAY = 86_400_000;

export default function PendingPaymentsPage() {
	const router = useRouter();
	const alert = useAlert();
	const { data, isLoading } = useApi<WorkOrder[]>('/api/work-orders', { status: 'COMPLETED' });
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [q, setQ] = useState('');
	const [target, setTarget] = useState<WorkOrder | null>(null);
	const [busy, setBusy] = useState(false);

	const rows = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(w) =>
				!k ||
				`${w.woNumber} ${w.quotation?.customerGroup.groupName ?? ''} ${w.quotation?.projectName ?? ''} ${w.team?.teamName ?? ''}`
					.toLowerCase()
					.includes(k)
		);
	}, [list, q]);
	const total = list.reduce((s, w) => s + payAmount(w), 0);
	const aged = list.filter((w) => Date.now() - new Date(w.date).getTime() > 30 * DAY);
	const byTeam = useMemo(() => {
		const m = new Map<string, number>();
		list.forEach((w) =>
			m.set(w.team?.teamName ?? 'ไม่ระบุทีม', (m.get(w.team?.teamName ?? 'ไม่ระบุทีม') ?? 0) + payAmount(w))
		);

		return Array.from(m.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 2);
	}, [list]);

	async function pay() {
		if (!target) return;

		setBusy(true);

		try {
			const res = await sendJson(`/api/work-orders/${target.id}/pay-contractor`, 'POST');
			setTarget(null);
			router.push(`/apps/payment-vouchers/${res.paymentVoucher.id}`);
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<PageHeader
				title="งานเสร็จรอจ่ายช่าง"
				subtitle="งาน WO ที่เสร็จแล้ว และยังไม่ได้ออกใบสำคัญจ่ายให้ช่าง"
			/>
			<StatGrid>
				<StatCard
					tone="warn"
					color="warn"
					label="ยอดรอจ่ายทั้งหมด"
					value={formatMoney(total, 0)}
					sub={`${list.length} งาน`}
				/>
				{byTeam.map(([name, amt]) => (
					<StatCard
						key={name}
						label={name}
						color="ink"
						value={formatMoney(amt, 0)}
						sub="ยอดรอจ่ายของทีม"
					/>
				))}
				<StatCard
					label="ค้างเกิน 30 วัน"
					color="danger"
					value={`${aged.length} งาน`}
					sub={formatMoney(
						aged.reduce((s, w) => s + payAmount(w), 0),
						0
					)}
				/>
			</StatGrid>
			<Card>
				<FilterField
					label="ค้นหา"
					className="max-w-xl"
				>
					{(id) => (
						<SearchInput
							id={id}
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="เลข WO ลูกค้า โครงการ หรือทีมช่าง"
						/>
					)}
				</FilterField>
				<DataTable
					loading={isLoading}
					rows={rows}
					rowKey={(r) => r.id}
					empty="ไม่มีงานที่รอจ่ายช่าง"
					columns={[
						{
							key: 'd',
							header: 'วันที่',
							cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span>
						},
						{
							key: 'wo',
							header: 'เลขที่ WO',
							cell: (r) => (
								<Link
									href={`/apps/work-orders/${r.id}`}
									className="font-semibold"
								>
									{r.woNumber}
								</Link>
							)
						},
						{
							key: 'p',
							header: 'ชื่อโครงการ / ลูกค้า',
							cell: (r) => (
								<TwoLine
									title={r.quotation?.projectName || r.description || '-'}
									sub={r.quotation?.customerGroup.groupName}
								/>
							)
						},
						{
							key: 't',
							header: 'ทีมช่าง / ผู้รับเงิน',
							cell: (r) => (
								<TwoLine
									title={r.team?.teamName ?? '-'}
									sub={r.team?.leaderName}
								/>
							)
						},
						{
							key: 'po',
							header: 'อ้างอิง PO',
							cell: (r) =>
								activePo(r).length ? (
									activePo(r)
										.map((p) => p.poNumber)
										.join(', ')
								) : (
									<StatusBadge
										label="ไม่มี PO"
										tone="warn"
									/>
								)
						},
						{
							key: 'a',
							header: 'ยอดจ่ายช่าง',
							money: true,
							cell: (r) => <MoneyText value={payAmount(r)} />
						},
						{
							key: 'act',
							header: <span className="sr-only">การดำเนินการ</span>,
							align: 'right',
							cell: (r) => (
								<div className="flex items-center justify-end gap-1">
									<Button
										onClick={(e) => {
											e.stopPropagation();
											setTarget(r);
										}}
									>
										จ่ายช่าง
									</Button>
									<ActionMenu
										actions={[
											{
												label: 'ดู WO',
												icon: Eye,
												onClick: () => router.push(`/apps/work-orders/${r.id}`)
											},
											{ label: 'ออกใบสำคัญจ่าย', icon: Banknote, onClick: () => setTarget(r) }
										]}
									/>
								</div>
							)
						}
					]}
					footer={
						<tr>
							<td
								colSpan={5}
								className="px-3 py-3 text-right"
							>
								รวม {rows.length} งาน
							</td>
							<td className="px-3 py-3 text-right">
								{formatMoney(rows.reduce((s, w) => s + payAmount(w), 0))}
							</td>
							<td />
						</tr>
					}
				/>
			</Card>
			<ConfirmDialog
				open={!!target}
				busy={busy}
				title="ออกใบสำคัญจ่ายให้ช่าง"
				message={
					target
						? `ออกใบสำคัญจ่ายสำหรับ ${target.woNumber} จำนวน ${formatMoney(payAmount(target))} ให้ ${target.team?.teamName ?? 'ทีมช่าง'}`
						: ''
				}
				confirmLabel="ออกใบสำคัญจ่าย"
				onClose={() => setTarget(null)}
				onConfirm={pay}
			/>
		</>
	);
}
