'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import { DateInput, Field, FormPage, InfoCard, RefPicker, Textarea, TotalsBlock } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { sendJson } from '@/lib/use-api';

type WO = {
	id: string;
	woNumber: string;
	status?: string;
	quotation?: {
		quotationNumber: string;
		projectName?: string | null;
		subtotal: number;
		discountAmount?: number;
		vatPercent?: number;
		vatAmount?: number;
		totalAmount: number;
		customerGroup?: { groupName: string } | null;
	} | null;
	invoices?: { id: string }[];
};

const iso = (d: Date) => d.toISOString().split('T')[0];

/** ยอดใบแจ้งหนี้จากใบเสนอราคา: ยอดก่อน VAT หลังส่วนลด + VAT = ยอดรวม */
function amounts(q?: WO['quotation']) {
	const total = Number(q?.totalAmount || 0);
	const vat = q?.vatAmount !== undefined ? Number(q.vatAmount) : Math.round((total - total / 1.07) * 100) / 100;

	return {
		subtotal: Math.round((total - vat) * 100) / 100,
		vatPercent: Number(q?.vatPercent ?? 7),
		vatAmount: vat,
		totalAmount: total
	};
}

function NewInvoice() {
	const router = useRouter();
	const alert = useAlert();
	const sp = useSearchParams();
	const [wo, setWo] = useState<WO | null>(null);
	const [date, setDate] = useState(iso(new Date()));
	const [dueDate, setDueDate] = useState(() => iso(new Date(Date.now() + 30 * 86_400_000)));
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);
	const preset = sp.get('workOrderId');

	useEffect(() => {
		if (!preset) return;

		fetch(`/api/work-orders/${preset}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((w) => w?.id && setWo(w))
			.catch(() => null);
	}, [preset]);

	const a = amounts(wo?.quotation);

	async function save() {
		if (!wo) {
			alert.showWarning('กรุณาเลือก Work Order อ้างอิง');

			return;
		}

		setSaving(true);

		try {
			const inv = await sendJson('/api/invoices', 'POST', {
				workOrderId: wo.id,
				date,
				dueDate,
				...a,
				notes: notes || null
			});
			alert.showSuccess('สร้างใบแจ้งหนี้เรียบร้อย', inv.invoiceNumber);
			router.push(`/apps/invoices/${inv.id}`);
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบแจ้งหนี้ได้');
			setSaving(false);
		}
	}

	return (
		<FormPage
			title="สร้างใบแจ้งหนี้"
			subtitle="ออกใบแจ้งหนี้จากงาน WO ที่ยังไม่มีใบแจ้งหนี้"
			backHref="/apps/invoices"
			saving={saving}
			saveLabel="บันทึกใบแจ้งหนี้"
			saveDisabled={!wo}
			onSave={save}
		>
			<RefPicker<WO>
				label="Work Order (WO) อ้างอิง"
				required
				url="/api/work-orders"
				filter={(w) => w.status !== 'CANCELLED' && !(w.invoices && w.invoices.length)}
				getLabel={(w) =>
					`${w.woNumber} — ${w.quotation?.customerGroup?.groupName || ''} — ${w.quotation?.projectName || ''}`
				}
				value={wo}
				onChange={setWo}
				placeholder="ค้นหา WO หรือชื่อลูกค้า"
				emptyText="ไม่พบ WO ที่ยังไม่มีใบแจ้งหนี้"
			/>
			{wo && (
				<InfoCard
					title="ข้อมูลอ้างอิง"
					rows={[
						['WO', wo.woNumber],
						['ใบเสนอราคา', wo.quotation?.quotationNumber ?? '-'],
						['ลูกค้า', wo.quotation?.customerGroup?.groupName ?? '-'],
						['โครงการ', wo.quotation?.projectName ?? '-']
					]}
				/>
			)}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field label="วันที่ใบแจ้งหนี้">
					{(id) => (
						<DateInput
							id={id}
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					)}
				</Field>
				<Field label="ครบกำหนดชำระ">
					{(id) => (
						<DateInput
							id={id}
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
						/>
					)}
				</Field>
			</div>
			<Field label="หมายเหตุ">
				{(id) => (
					<Textarea
						id={id}
						rows={2}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				)}
			</Field>
			{wo && (
				<TotalsBlock
					rows={[
						['ยอดก่อน VAT', formatMoney(a.subtotal)],
						[`VAT ${a.vatPercent}%`, formatMoney(a.vatAmount)]
					]}
					grand={['ยอดรวมทั้งสิ้น', formatMoney(a.totalAmount)]}
				/>
			)}
		</FormPage>
	);
}

export default function NewInvoicePage() {
	return (
		<Suspense fallback={<p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>}>
			<NewInvoice />
		</Suspense>
	);
}
