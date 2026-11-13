'use client';

import { Banknote, Check, Clock, Eye, FileText, Image as ImageIcon, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	ActionMenu,
	Button,
	Card,
	DataTable,
	FilterField,
	FilterTabs,
	MoneyText,
	PageHeader,
	Pagination,
	SearchInput,
	Select,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { formatDateShort, formatMonthLabel, monthKey } from '@/lib/format';
import { COMPLETED_STATUS, FALLBACK } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type CompletedWork = {
	id: string;
	completionDate: string;
	status: string;
	hasPhotos: boolean;
	hasWorkReceipt: boolean;
	workOrder: {
		woNumber: string;
		description?: string | null;
		totalAmount: number;
		quotation?: {
			quotationNumber: string;
			projectName?: string | null;
			customerGroup: { groupName: string };
		} | null;
		team?: { teamName: string } | null;
	};
};

const PAGE_SIZE = 10;
const TABS = ['ALL', 'COMPLETED', 'PENDING_PAYMENT', 'PAID'] as const;
type Tab = (typeof TABS)[number];

function DocMark({ ok, label }: { ok: boolean; label: string }) {
	const Icon = ok ? Check : X;

	return (
		<span className={`inline-flex items-center gap-1 text-[13px] ${ok ? 'text-success' : 'text-danger'}`}>
			<Icon
				size={14}
				aria-hidden="true"
			/>
			{label}
			<span className="sr-only">{ok ? 'ครบ' : 'ยังไม่มี'}</span>
		</span>
	);
}

export default function CompletedWorksPage() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data, isLoading } = useApi<CompletedWork[]>('/api/completed-works');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const [tab, setTab] = useState<Tab>('ALL');
	const [q, setQ] = useState('');
	const [team, setTeam] = useState('ALL');
	const [month, setMonth] = useState('ALL');
	const [page, setPage] = useState(1);
	const [busy, setBusy] = useState(false);

	const teams = useMemo(
		() => Array.from(new Set(list.map((c) => c.workOrder.team?.teamName).filter(Boolean))) as string[],
		[list]
	);
	const months = useMemo(
		() =>
			Array.from(new Set(list.map((c) => monthKey(c.completionDate))))
				.sort()
				.reverse(),
		[list]
	);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();

		return list.filter(
			(c) =>
				(tab === 'ALL' || c.status === tab) &&
				(team === 'ALL' || c.workOrder.team?.teamName === team) &&
				(month === 'ALL' || monthKey(c.completionDate) === month) &&
				(!k ||
					`${c.workOrder.woNumber} ${c.workOrder.quotation?.customerGroup.groupName ?? ''} ${c.workOrder.quotation?.projectName ?? ''} ${c.workOrder.description ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, team, month, q]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const nowKey = monthKey(new Date());
	const incomplete = list.filter((c) => !c.hasPhotos || !c.hasWorkReceipt);
	const reset = () => setPage(1);

	async function setStatus(c: CompletedWork, status: string, label: string) {
		setBusy(true);

		try {
			await sendJson(`/api/completed-works/${c.id}`, 'PATCH', { status });
			alert.showSuccess('อัปเดตสถานะ', `${c.workOrder.woNumber} → ${label}`);
			await qc.invalidateQueries({ queryKey: ['/api/completed-works'] });
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<PageHeader
				title="งานเสร็จแล้วทั้งหมด"
				subtitle="บันทึกงานที่ปิดแล้ว พร้อมรูปภาพและใบรับงาน"
				actions={
					<Button
						href="/apps/completed-works/new"
						icon={<Plus size={18} />}
					>
						บันทึกงานเสร็จ
					</Button>
				}
			/>
			<StatGrid>
				<StatCard
					tone="tint"
					label="งานเสร็จทั้งหมด"
					value={`${list.length} งาน`}
				/>
				<StatCard
					label="เสร็จเดือนนี้"
					color="success"
					value={`${list.filter((c) => monthKey(c.completionDate) === nowKey).length} งาน`}
				/>
				<StatCard
					tone="warn"
					color="warn"
					label="รอจ่ายค่าแรง"
					value={`${list.filter((c) => c.status === 'PENDING_PAYMENT').length} งาน`}
				/>
				<StatCard
					label="เอกสารไม่ครบ"
					color="danger"
					value={`${incomplete.length} งาน`}
					sub="ขาดรูปหรือใบรับงาน"
				/>
			</StatGrid>
			<Card>
				<FilterTabs
					tabs={TABS.map((t) => ({
						value: t,
						label: t === 'ALL' ? 'ทั้งหมด' : COMPLETED_STATUS[t].label,
						count: t === 'ALL' ? list.length : list.filter((c) => c.status === t).length
					}))}
					value={tab}
					onChange={(v) => {
						setTab(v);
						reset();
					}}
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
									reset();
								}}
								placeholder="เลข WO ลูกค้า หรือรายละเอียดงาน"
							/>
						)}
					</FilterField>
					<FilterField
						label="ทีมช่าง"
						className="w-52"
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
						label="เดือน"
						className="w-52"
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
					empty="ยังไม่มีงานที่เสร็จ"
					columns={[
						{
							key: 'd',
							header: 'วันที่',
							cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.completionDate)}</span>
						},
						{
							key: 'wo',
							header: 'WO / อ้างอิง QT',
							cell: (r) => (
								<TwoLine
									title={<Link href={`/apps/completed-works/${r.id}`}>{r.workOrder.woNumber}</Link>}
									sub={r.workOrder.quotation?.quotationNumber}
								/>
							)
						},
						{
							key: 'p',
							header: 'รายละเอียดงาน / ลูกค้า',
							cell: (r) => (
								<TwoLine
									title={r.workOrder.quotation?.projectName || r.workOrder.description || '-'}
									sub={r.workOrder.quotation?.customerGroup.groupName}
								/>
							)
						},
						{ key: 't', header: 'ทีมช่าง', cell: (r) => r.workOrder.team?.teamName ?? '-' },
						{
							key: 'a',
							header: 'ยอดรวม',
							money: true,
							cell: (r) => <MoneyText value={r.workOrder.totalAmount} />
						},
						{
							key: 'doc',
							header: 'เอกสาร',
							cell: (r) => (
								<div className="flex flex-col">
									<DocMark
										ok={r.hasPhotos}
										label="รูป"
									/>
									<DocMark
										ok={r.hasWorkReceipt}
										label="ใบรับ"
									/>
								</div>
							)
						},
						{
							key: 'st',
							header: 'สถานะ',
							cell: (r) => {
								const m = COMPLETED_STATUS[r.status] ?? FALLBACK;
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
											label: 'ดูรายละเอียด / แก้ไข',
											icon: Eye,
											onClick: () => router.push(`/apps/completed-works/${r.id}`)
										},
										{
											label: 'พิมพ์รูปภาพ Report',
											icon: ImageIcon,
											onClick: () => window.open(`/completed-works/${r.id}/print`, '_blank')
										},
										{
											label: 'พิมพ์ Service Report',
											icon: FileText,
											onClick: () =>
												window.open(`/completed-works/${r.id}/service-report`, '_blank')
										},
										{
											label: 'รอจ่ายค่าแรง',
											icon: Clock,
											hidden: r.status !== 'COMPLETED',
											onClick: () => setStatus(r, 'PENDING_PAYMENT', 'รอจ่ายค่าแรง')
										},
										{
											label: 'จ่ายแล้ว',
											icon: Banknote,
											hidden: r.status === 'PAID',
											onClick: () => setStatus(r, 'PAID', 'จ่ายแล้ว')
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
		</>
	);
}
