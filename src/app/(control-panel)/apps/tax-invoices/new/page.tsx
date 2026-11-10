'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import { DateInput, Field, FormPage, RefPicker, Textarea, TotalsBlock } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { sendJson } from '@/lib/use-api';

type Invoice = {
	id: string;
	invoiceNumber: string;
	subtotal: number;
	vatAmount: number;
	totalAmount: number;
	status: string;
	taxInvoice?: { id: string } | null;
	workOrder?: { woNumber: string; quotation?: { customerGroup?: { groupName: string } } | null } | null;
};

export default function NewTaxInvoicePage() {
	const router = useRouter();
	const alert = useAlert();
	const [inv, setInv] = useState<Invoice | null>(null);
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);

	async function save() {
		if (!inv) return alert.showWarning('กรุณาเลือกใบแจ้งหนี้');

		setSaving(true);

		try {
			const ti = await sendJson('/api/tax-invoices', 'POST', {
				invoiceId: inv.id,
				date,
				notes: notes || null,
				subtotal: Number(inv.subtotal),
				vatAmount: Number(inv.vatAmount),
				totalAmount: Number(inv.totalAmount)
			});
			alert.showSuccess('สร้างใบกำกับภาษีเรียบร้อย', ti.taxInvoiceNumber);
			router.push(`/apps/tax-invoices/${ti.id}`);
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบกำกับภาษีได้');
			setSaving(false);
		}
	}

	return (
		<FormPage
			title="ออกใบกำกับภาษี"
			subtitle="ออกจากใบแจ้งหนี้ที่ยังไม่มีใบกำกับภาษี"
			backHref="/apps/tax-invoices"
			saving={saving}
			saveLabel="บันทึกใบกำกับภาษี"
			saveDisabled={!inv}
			onSave={save}
		>
			<RefPicker<Invoice>
				label="ใบแจ้งหนี้"
				required
				url="/api/invoices"
				filter={(i) => i.status !== 'CANCELLED' && !i.taxInvoice}
				getLabel={(i) =>
					`${i.invoiceNumber} — ${i.workOrder?.quotation?.customerGroup?.groupName || ''} — ${formatMoney(i.totalAmount)}`
				}
				value={inv}
				onChange={setInv}
				emptyText="ไม่พบใบแจ้งหนี้ที่ยังไม่มีใบกำกับภาษี"
			/>
			<Field label="วันที่ใบกำกับภาษี">
				{(id) => (
					<DateInput
						id={id}
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				)}
			</Field>
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
			{inv && (
				<TotalsBlock
					rows={[
						['ยอดก่อน VAT', formatMoney(inv.subtotal)],
						['VAT', formatMoney(inv.vatAmount)]
					]}
					grand={['ยอดรวมทั้งสิ้น', formatMoney(inv.totalAmount)]}
				/>
			)}
		</FormPage>
	);
}
