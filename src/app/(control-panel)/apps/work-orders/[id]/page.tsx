'use client';

import { ArrowLeft, Banknote, Printer, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	DataTable,
	IconButton,
	MoneyText,
	PageHeader,
	PrintPreviewDialog,
	StatusBadge
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { WORKFLOW_BADGE, type StatusConfig, type WorkOrder } from '@/components/work-orders/types';
import { formatDateShort, formatMoney } from '@/lib/format';
import { PO_STATUS, FALLBACK } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="border-line flex flex-wrap justify-between gap-x-4 border-b py-2 last:border-0">
			<dt className="text-ink-muted">{label}</dt>
			<dd className="text-right font-medium">{children}</dd>
		</div>
	);
}

export default function WorkOrderDetailPage() {
	const router = useRouter();
	const alert = useAlert();
	const { id } = useParams<{ id: string }>();
	const { data: wo, isLoading, isError } = useApi<WorkOrder>(`/api/work-orders/${id}`);
	const { data: statusData } = useApi<StatusConfig[]>('/api/work-order-statuses');
	const [print, setPrint] = useState(false);
	const [confirm, setConfirm] = useState(false);
	const [busy, setBusy] = useState(false);

	if (isLoading) return <p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>;

	if (isError || !wo?.id) {
		return (
			<div className="flex flex-col items-center gap-4 py-20">
				<p role="alert">ไม่พบ Work Order</p>
				<Button href="/apps/work-orders">กลับรายการ WO</Button>
			</div>
		);
	}

	const st = (Array.isArray(statusData) ? statusData : []).find((s) => s.code === wo.status);
	const pos = wo.purchaseOrders ?? [];
	const poTotal = pos.filter((p) => p.status !== 'CANCELLED').reduce((s, p) => s + Number(p.totalAmount), 0);
	const wf = wo.workflowType ? WORKFLOW_BADGE[wo.workflowType] : null;

	async function payContractor() {
		setBusy(true);

		try {
			const r = await sendJson(`/api/work-orders/${id}/pay-contractor`, 'POST');
			router.push(`/apps/payment-vouchers/${r.paymentVoucher.id}`);
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
			setBusy(false);
			setConfirm(false);
		}
	}

	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label="กลับรายการ WO"
							href="/apps/work-orders"
						>
							<ArrowLeft size={22} />
						</IconButton>
						{wo.woNumber}
					</span>
				}
				badge={
					<>
						<StatusBadge
							label={st?.name ?? wo.status}
							color={st?.color}
							bgColor={st?.bgColor}
						/>
						{wf && (
							<StatusBadge
								label={wf.label}
								tone={wf.tone}
							/>
						)}
					</>
				}
				subtitle={`วันที่ ${formatDateShort(wo.date)}`}
				actions={
					<>
						<Button
							variant="outline"
							icon={<Printer size={18} />}
							onClick={() => setPrint(true)}
						>
							พิมพ์ใบตอบรับงาน
						</Button>
						<Button
							variant="outline"
							icon={<Truck size={18} />}
							onClick={() => window.open(`/api/work-orders/${id}/delivery-note`, '_blank')}
						>
							ใบส่งมอบงาน
						</Button>
						{wo.status === 'COMPLETED' && (
							<Button
								icon={<Banknote size={18} />}
								onClick={() => setConfirm(true)}
							>
								ออกใบสำคัญจ่ายช่าง
							</Button>
						)}
					</>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
				<Card>
					<CardHeader title="ข้อมูลงาน" />
					<dl>
						<Row label="ลูกค้า">{wo.quotation?.customerGroup.groupName ?? '-'}</Row>
						<Row label="โครงการ">{wo.quotation?.projectName || wo.description || '-'}</Row>
						<Row label="อ้างอิง QT">{wo.quotation?.quotationNumber ?? '-'}</Row>
						<Row label="PO ลูกค้า">
							{wo.poNumber ? `${wo.poNumber}${wo.poDate ? ` (${formatDateShort(wo.poDate)})` : ''}` : '-'}
						</Row>
						<Row label="วันเริ่มงาน">{formatDateShort(wo.startDate)}</Row>
						<Row label="กำหนดเสร็จ">{formatDateShort(wo.endDate)}</Row>
						<Row label="ประกัน">
							{wo.warrantyStartDate
								? `${formatDateShort(wo.warrantyStartDate)} – ${formatDateShort(wo.warrantyEndDate)}`
								: '-'}
							{wo.warrantyMonths ? ` (${wo.warrantyMonths} เดือน)` : ''}
						</Row>
						<Row label="เงินประกันผลงาน (ก่อน VAT)">
							{Number(wo.retentionAmount) > 0 ? <MoneyText value={Number(wo.retentionAmount)} /> : '-'}
						</Row>
					</dl>
				</Card>
				<Card>
					<CardHeader title="ทีมช่าง / ยอดเงิน" />
					<dl>
						<Row label="ทีม">{wo.team?.teamName || wo.teamName || '-'}</Row>
						<Row label="หัวหน้าทีม">{wo.team?.leaderName || '-'}</Row>
						<Row label="มูลค่า WO (ก่อน VAT)">
							<MoneyText value={wo.totalAmount} />
						</Row>
						{poTotal > 0 && (
							<Row label="ยอด PO ช่างรวม">
								<MoneyText
									value={poTotal}
									className="text-violet"
								/>
							</Row>
						)}
						{poTotal > 0 && (
							<Row label="กำไรขั้นต้น (ประมาณ)">
								<MoneyText
									value={Number(wo.totalAmount) - poTotal}
									className={Number(wo.totalAmount) - poTotal < 0 ? 'text-danger' : 'text-success'}
								/>
							</Row>
						)}
					</dl>
				</Card>
			</div>
			<Card>
				<CardHeader
					title="ใบสั่งซื้อให้ช่าง (PO)"
					action={
						<Button
							variant="dashed"
							href={`/apps/purchase-orders/new?workOrderId=${id}`}
						>
							ออกใบสั่งซื้อช่าง
						</Button>
					}
				/>
				<DataTable
					rows={pos}
					rowKey={(p) => p.id}
					empty="ยังไม่มีใบสั่งซื้อให้ช่าง"
					columns={[
						{
							key: 'n',
							header: 'เลข PO',
							cell: (p) => (
								<Link
									href={`/apps/purchase-orders/${p.id}`}
									className="font-semibold"
								>
									{p.poNumber}
								</Link>
							)
						},
						{
							key: 's',
							header: 'สถานะ',
							cell: (p) => {
								const m = PO_STATUS[p.status] ?? FALLBACK;
								return (
									<StatusBadge
										label={m.label}
										tone={m.tone}
									/>
								);
							}
						},
						{ key: 'a', header: 'ยอดรวม', money: true, cell: (p) => formatMoney(p.totalAmount) }
					]}
				/>
			</Card>
			<PrintPreviewDialog
				open={print}
				onClose={() => setPrint(false)}
				title={wo.woNumber}
				src={`/api/work-orders/${id}/pdf`}
			/>
			<ConfirmDialog
				open={confirm}
				busy={busy}
				title="ออกใบสำคัญจ่ายช่าง"
				message={`ออกใบสำคัญจ่ายและบันทึก ${wo.woNumber} เป็นจ่ายแล้ว?`}
				confirmLabel="ออกใบสำคัญจ่าย"
				onClose={() => setConfirm(false)}
				onConfirm={payContractor}
			/>
		</>
	);
}
