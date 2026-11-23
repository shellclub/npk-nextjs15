'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import { DateInput, Field, FormPage, Input, RefPicker, Select, Textarea } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { PAYMENT_METHOD } from '@/lib/status';
import { sendJson } from '@/lib/use-api';

type Invoice = {
	id: string;
	invoiceNumber: string;
	totalAmount: number;
	status: string;
	receiptVoucher?: { id: string } | null;
	workOrder?: { woNumber: string; quotation?: { customerGroup?: { groupName: string } } | null } | null;
};

export default function NewReceiptVoucherPage() {
	const router = useRouter();
	const alert = useAlert();
	const [inv, setInv] = useState<Invoice | null>(null);
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [amount, setAmount] = useState('');
	const [method, setMethod] = useState('TRANSFER');
	const [bank, setBank] = useState('');
	const [cheque, setCheque] = useState('');
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (inv) setAmount(String(Number(inv.totalAmount)));
	}, [inv]);

	async function save() {
		if (!inv) return alert.showWarning('กรุณาเลือกใบแจ้งหนี้');

		if (!amount || Number(amount) <= 0) return alert.showWarning('กรุณาระบุจำนวนเงิน');

		setSaving(true);

		try {
			const rv = await sendJson('/api/receipt-vouchers', 'POST', {
				invoiceId: inv.id,
				date,
				amount: Number(amount),
				paymentMethod: method,
				bankName: bank || null,
				chequeNumber: cheque || null,
				notes: notes || null
			});
			alert.showSuccess('สร้างใบสำคัญรับเรียบร้อย', rv.voucherNumber);
			router.push(`/apps/receipt-vouchers/${rv.id}`);
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบสำคัญรับได้');
			setSaving(false);
		}
	}

	return (
		<FormPage
			title="ออกใบสำคัญรับ"
			subtitle="บันทึกการรับเงินจากลูกค้าตามใบแจ้งหนี้"
			backHref="/apps/receipt-vouchers"
			saving={saving}
			saveLabel="บันทึกใบสำคัญรับ"
			saveDisabled={!inv}
			onSave={save}
		>
			<RefPicker<Invoice>
				label="ใบแจ้งหนี้"
				required
				url="/api/invoices"
				filter={(i) => i.status !== 'CANCELLED' && !i.receiptVoucher}
				getLabel={(i) =>
					`${i.invoiceNumber} — ${i.workOrder?.quotation?.customerGroup?.groupName || ''} — ${formatMoney(i.totalAmount)}`
				}
				value={inv}
				onChange={setInv}
				emptyText="ไม่พบใบแจ้งหนี้ที่ยังไม่มีใบสำคัญรับ"
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field label="วันที่รับเงิน">
					{(id) => (
						<DateInput
							id={id}
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					)}
				</Field>
				<Field
					label="จำนวนเงิน (บาท)"
					required
				>
					{(id) => (
						<Input
							id={id}
							inputMode="decimal"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					)}
				</Field>
				<Field label="วิธีชำระเงิน">
					{(id) => (
						<Select
							id={id}
							value={method}
							onChange={(e) => setMethod(e.target.value)}
						>
							{Object.entries(PAYMENT_METHOD).map(([k, v]) => (
								<option
									key={k}
									value={k}
								>
									{v.label}
								</option>
							))}
						</Select>
					)}
				</Field>
				{(method === 'TRANSFER' || method === 'CHEQUE') && (
					<Field label="ธนาคาร">
						{(id) => (
							<Input
								id={id}
								value={bank}
								onChange={(e) => setBank(e.target.value)}
							/>
						)}
					</Field>
				)}
				{method === 'CHEQUE' && (
					<Field label="เลขที่เช็ค">
						{(id) => (
							<Input
								id={id}
								value={cheque}
								onChange={(e) => setCheque(e.target.value)}
							/>
						)}
					</Field>
				)}
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
		</FormPage>
	);
}
