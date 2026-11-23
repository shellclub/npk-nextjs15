'use client';

import {
	Camera,
	Copy,
	Download,
	Eye,
	FileSpreadsheet,
	Pencil,
	Plus,
	Printer,
	RefreshCw,
	Share2,
	Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	ActionMenu,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Dialog,
	FilterField,
	FilterTabs,
	IconButton,
	MoneyText,
	PageHeader,
	Pagination,
	PrintPreviewDialog,
	SearchInput,
	Select,
	ShareLinkDialog,
	StatCard,
	StatGrid,
	StatusBadge,
	TwoLine
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { downloadCsv } from '@/lib/csv';
import { formatDateShort, formatMoney } from '@/lib/format';
import { downloadQuotationPdf } from '@/lib/pdf/download-quotation';
import { useQuotationStatuses } from '@/lib/use-quotation-statuses';
import { sendJson, useApi } from '@/lib/use-api';

type Quotation = {
	id: string;
	quotationNumber: string;
	revisionNumber?: number;
	date: string;
	validDays: number;
	projectName?: string | null;
	totalAmount: number;
	status: string;
	customerGroupId: string;
	customerGroup?: { groupName: string } | null;
};

const PAGE_SIZE = 10;
const DAY = 86_400_000;
const LIVE = ['DRAFT', 'SENT', 'APPROVED'];
const validUntil = (q: Quotation) => new Date(new Date(q.date).getTime() + (q.validDays || 30) * DAY);
const daysLeft = (q: Quotation) => Math.ceil((validUntil(q).getTime() - Date.now()) / DAY);
const isSoon = (q: Quotation) => q.status === 'SENT' && daysLeft(q) >= 0 && daysLeft(q) <= 7;
const sum = (a: Quotation[]) => a.reduce((s, q) => s + Number(q.totalAmount), 0);
const PERIODS = [
	{ v: '3M', label: '3 เดือนล่าสุด', days: 92 },
	{ v: '1M', label: 'เดือนนี้', days: 31 },
	{ v: '1Y', label: '1 ปีล่าสุด', days: 366 },
	{ v: 'ALL', label: 'ทั้งหมด', days: 0 }
];

function QuotationsList() {
	const router = useRouter();
	const alert = useAlert();
	const qc = useQueryClient();
	const sp = useSearchParams();
	const { data, isLoading } = useApi<Quotation[]>('/api/quotations');
	const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	// ใบที่อนุมัติแล้วย้ายไปรายการตอบรับการทำงาน (ใบสั่งงาน) จึงไม่แสดงในหน้านี้
	const list = useMemo(() => all.filter((x) => x.status !== 'APPROVED'), [all]);
	const [tab, setTab] = useState('ALL');
	const [q, setQ] = useState(sp.get('q') ?? '');
	const [customer, setCustomer] = useState('ALL');
	const [period, setPeriod] = useState('ALL');
	const [page, setPage] = useState(1);
	const [pdf, setPdf] = useState<Quotation | null>(null);
	const [share, setShare] = useState<{ q: Quotation; kind: 'share' | 'photo' } | null>(null);
	const [cancel, setCancel] = useState<Quotation | null>(null);
	const [busy, setBusy] = useState(false);
	const qs = useQuotationStatuses();
	const [statusFor, setStatusFor] = useState<Quotation | null>(null);

	const customers = useMemo(
		() => Array.from(new Map(list.map((x) => [x.customerGroupId, x.customerGroup?.groupName ?? '-'])).entries()),
		[list]
	);
	const filtered = useMemo(() => {
		const k = q.trim().toLowerCase();
		const days = PERIODS.find((p) => p.v === period)?.days ?? 0;

		return list.filter(
			(x) =>
				(tab === 'ALL' || x.status === tab) &&
				(customer === 'ALL' || x.customerGroupId === customer) &&
				(!days || Date.now() - new Date(x.date).getTime() <= days * DAY) &&
				(!k ||
					`${x.quotationNumber} ${x.projectName ?? ''} ${x.customerGroup?.groupName ?? ''}`
						.toLowerCase()
						.includes(k))
		);
	}, [list, tab, customer, period, q]);
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const counts = (s: string) => (s === 'ALL' ? list.length : list.filter((x) => x.status === s).length);
	const statusCodes = qs.list.length
		? qs.list.map((s) => s.code)
		: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'];
	const tabs = ['ALL', ...statusCodes.filter((c) => c !== 'APPROVED')].filter(
		(s) => ['ALL', 'DRAFT', 'SENT', 'CANCELLED'].includes(s) || counts(s) > 0
	);
	const live = all.filter((x) => LIVE.includes(x.status));
	const sent = list.filter((x) => x.status === 'SENT');
	const approved = all.filter((x) => x.status === 'APPROVED');
	const soon = list.filter(isSoon);
	const reset = () => setPage(1);
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/quotations'] });
	const origin = typeof window !== 'undefined' ? window.location.origin : '';

	async function duplicate(x: Quotation) {
		setBusy(true);

		try {
			const n = await sendJson(`/api/quotations/${x.id}/duplicate`, 'POST');
			alert.showSuccess('สร้างซ้ำสำเร็จ', `สร้างซ้ำ → ${n.quotationNumber} เรียบร้อย`);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างซ้ำได้ กรุณาลองใหม่');
		} finally {
			setBusy(false);
		}
	}

	async function changeStatus(x: Quotation, status: string) {
		setBusy(true);

		try {
			await sendJson(`/api/quotations/${x.id}`, 'PATCH', { status });
			alert.showSuccess('เปลี่ยนสถานะแล้ว', `${x.quotationNumber} → ${qs.meta(status).label}`);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่');
		} finally {
			setBusy(false);
			setStatusFor(null);
		}
	}

	async function doCancel() {
		if (!cancel) return;

		setBusy(true);

		try {
			await sendJson(`/api/quotations/${cancel.id}`, 'DELETE');
			alert.showSuccess('ยกเลิกเรียบร้อย', `${cancel.quotationNumber} ถูกยกเลิกแล้ว`);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่');
		} finally {
			setBusy(false);
			setCancel(null);
		}
	}

	const num = (x: Quotation) =>
		(x.revisionNumber ?? 0) > 0 ? `${x.quotationNumber} Rev. ${x.revisionNumber}` : x.quotationNumber;

	return (
		<>
			<PageHeader
				title="ใบเสนอราคา"
				subtitle="จัดการใบเสนอราคาทั้งหมด (ใบที่ลูกค้าอนุมัติแล้วจะย้ายไปที่ใบสั่งงาน)"
				actions={
					<>
						<Button
							variant="soft"
							icon={<FileSpreadsheet size={18} />}
							onClick={() =>
								downloadCsv(
									'ใบเสนอราคา.csv',
									['เลขที่', 'วันที่', 'ลูกค้า', 'โครงการ', 'มูลค่ารวม VAT', 'ยืนราคาถึง', 'สถานะ'],
									filtered.map((x) => [
										num(x),
										formatDateShort(x.date),
										x.customerGroup?.groupName,
										x.projectName,
										x.totalAmount,
										formatDateShort(validUntil(x)),
										qs.meta(x.status).label
									])
								)
							}
						>
							ส่งออก Excel
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
			<StatGrid>
				<StatCard
					tone="tint"
					label="มูลค่ารวมทั้งหมด"
					value={formatMoney(sum(live), 0)}
					sub={`${live.length} ใบ`}
				/>
				<StatCard
					label="รอลูกค้าตอบกลับ"
					color="info"
					value={formatMoney(sum(sent), 0)}
					sub={`${sent.length} ใบ ส่งแล้ว`}
				/>
				<StatCard
					label="อนุมัติแล้ว"
					color="success"
					value={formatMoney(sum(approved), 0)}
					sub={`${approved.length} ใบ · อัตราอนุมัติ ${all.length ? Math.round((approved.length / all.length) * 100) : 0}% · ย้ายไปใบสั่งงานแล้ว`}
				/>
				<StatCard
					tone="warn"
					color="warn"
					label="ใกล้หมดอายุยืนราคา"
					value={`${soon.length} ใบ`}
					sub="ภายใน 7 วัน ควรติดตามลูกค้า"
				/>
			</StatGrid>
			<Card>
				<FilterTabs
					tabs={tabs.map((s) => ({
						value: s,
						label: s === 'ALL' ? 'ทั้งหมด' : qs.meta(s).label,
						count: counts(s)
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
								placeholder="เลขที่ ชื่อลูกค้า หรือชื่อโครงการ"
							/>
						)}
					</FilterField>
					<FilterField
						label="ลูกค้า"
						className="min-w-52 flex-1"
					>
						{(id) => (
							<Select
								id={id}
								value={customer}
								onChange={(e) => {
									setCustomer(e.target.value);
									reset();
								}}
							>
								<option value="ALL">ลูกค้าทั้งหมด</option>
								{customers.map(([cid, name]) => (
									<option
										key={cid}
										value={cid}
									>
										{name}
									</option>
								))}
							</Select>
						)}
					</FilterField>
					<FilterField
						label="ช่วงเวลา"
						className="min-w-52 flex-1"
					>
						{(id) => (
							<Select
								id={id}
								value={period}
								onChange={(e) => {
									setPeriod(e.target.value);
									reset();
								}}
							>
								{PERIODS.map((p) => (
									<option
										key={p.v}
										value={p.v}
									>
										{p.label}
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
					strike={(r) => r.status === 'REJECTED'}
					empty="ไม่พบใบเสนอราคา"
					columns={[
						{
							key: 'no',
							header: 'เลขที่',
							cell: (r) => (
								<Link
									href={`/apps/quotations/${r.id}`}
									className="font-semibold whitespace-nowrap underline"
								>
									{num(r)}
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
							header: 'ลูกค้า / โครงการ',
							cell: (r) => (
								<TwoLine
									title={r.customerGroup?.groupName ?? '-'}
									sub={r.projectName}
								/>
							)
						},
						{
							key: 'a',
							header: 'มูลค่า (รวม VAT)',
							money: true,
							cell: (r) => <MoneyText value={r.totalAmount} />
						},
						{
							key: 'v',
							header: 'ยืนราคาถึง',
							cell: (r) => (
								<span
									className={
										isSoon(r) ? 'text-warn font-semibold whitespace-nowrap' : 'whitespace-nowrap'
									}
								>
									{formatDateShort(validUntil(r))}
									{isSoon(r) && <span className="sr-only"> ใกล้หมดอายุ</span>}
								</span>
							)
						},
						{
							key: 's',
							header: 'สถานะ',
							cell: (r) => {
								const m = qs.meta(r.status);
								return (
									<StatusBadge
										label={m.label}
										tone={m.tone}
										color={m.color}
										bgColor={m.bgColor}
									/>
								);
							}
						},
						{
							key: 'act',
							header: 'การดำเนินการ',
							align: 'right',
							cell: (r) => (
								<div className="flex items-center justify-end gap-1">
									<IconButton
										aria-label={`แก้ไข ${r.quotationNumber}`}
										href={`/apps/quotations/${r.id}`}
									>
										<Pencil size={18} />
									</IconButton>
									<IconButton
										aria-label={`พิมพ์ ${r.quotationNumber}`}
										onClick={() => setPdf(r)}
									>
										<Printer size={18} />
									</IconButton>
									<ActionMenu
										disabled={busy}
										actions={[
											{
												label: 'ดูรายละเอียด',
												icon: Eye,
												onClick: () => router.push(`/apps/quotations/${r.id}`)
											},
											{
												label: 'แชร์ลิงก์เอกสาร',
												icon: Share2,
												onClick: () => setShare({ q: r, kind: 'share' })
											},
											{
												label: 'ดาวน์โหลด PDF',
												icon: Download,
												onClick: () =>
													downloadQuotationPdf(r.id).catch(() =>
														alert.showError(
															'ดาวน์โหลดไม่สำเร็จ',
															'ไม่สามารถสร้างไฟล์ PDF ได้'
														)
													)
											},
											{
												label: 'เปลี่ยนสถานะ',
												icon: RefreshCw,
												hidden: r.status === 'CANCELLED',
												onClick: () => setStatusFor(r)
											},
											{ label: 'สร้างซ้ำ', icon: Copy, onClick: () => duplicate(r) },
											{
												label: 'ลิงก์แนบรูปก่อนทำงาน',
												icon: Camera,
												onClick: () => setShare({ q: r, kind: 'photo' })
											},
											{
												label: 'ยกเลิกใบเสนอราคา',
												icon: Trash2,
												danger: true,
												hidden: r.status === 'CANCELLED',
												onClick: () => setCancel(r)
											}
										]}
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
			</Card>

			<Dialog
				open={!!statusFor}
				onClose={() => setStatusFor(null)}
				title={`เปลี่ยนสถานะ ${statusFor?.quotationNumber ?? ''}`}
				size="sm"
			>
				<ul className="flex flex-col gap-2">
					{statusCodes
						.filter((c) => c !== 'CANCELLED')
						.map((st) => {
							const m = qs.meta(st);
							const cur = statusFor?.status === st;

							return (
								<li key={st}>
									<button
										type="button"
										disabled={busy || cur}
										onClick={() => statusFor && changeStatus(statusFor, st)}
										className="border-line hover:bg-primary focus-visible:outline-focus flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2 text-left text-[17px] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-inherit"
									>
										{m.label}
										{cur && <span className="text-ink-muted text-[14px]">สถานะปัจจุบัน</span>}
									</button>
								</li>
							);
						})}
				</ul>
				<p className="text-ink-muted mt-3 text-[14px]">
					ใบที่ตั้งเป็น &quot;อนุมัติ&quot; จะย้ายไปอยู่ที่ใบสั่งงาน
				</p>
			</Dialog>
			<PrintPreviewDialog
				open={!!pdf}
				onClose={() => setPdf(null)}
				title={pdf ? num(pdf) : ''}
				src={pdf ? `/api/quotations/${pdf.id}/pdf` : ''}
				extraActions={
					pdf && (
						<Button
							variant="outline"
							icon={<Download size={18} />}
							onClick={() =>
								downloadQuotationPdf(pdf.id).catch(() => alert.showError('ดาวน์โหลดไม่สำเร็จ'))
							}
						>
							ดาวน์โหลด
						</Button>
					)
				}
			/>
			<ShareLinkDialog
				open={!!share}
				onClose={() => setShare(null)}
				title={
					share?.kind === 'photo'
						? `ลิงก์แนบรูปภาพ ${share.q.quotationNumber}`
						: `แชร์เอกสาร ${share?.q.quotationNumber ?? ''}`
				}
				description={
					share?.kind === 'photo'
						? 'ส่งลิงก์นี้ให้ช่างเพื่ออัปโหลดรูปหน้างานก่อนทำ'
						: 'ผู้ที่มีลิงก์สามารถดูใบเสนอราคาได้'
				}
				url={
					share
						? `${origin}/${share.kind === 'photo' ? 'upload-photos' : 'share/quotation'}/${share.q.id}`
						: ''
				}
			/>
			<ConfirmDialog
				open={!!cancel}
				danger
				busy={busy}
				title="ยกเลิกใบเสนอราคา"
				message={`ต้องการยกเลิก ${cancel?.quotationNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ยกเลิกใบเสนอราคา"
				onClose={() => setCancel(null)}
				onConfirm={doCancel}
			/>
		</>
	);
}

export default function QuotationsPage() {
	return (
		<Suspense fallback={<p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>}>
			<QuotationsList />
		</Suspense>
	);
}
