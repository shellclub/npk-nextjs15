'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import { DateInput, Field, FormPage, Input, Select, Textarea } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { PAYMENT_METHOD } from '@/lib/status';
import { sendJson } from '@/lib/use-api';

const INCOME_TYPES = ['ค่าจ้าง', 'ค่าบริการ', 'ค่าเช่า', 'ค่าขนส่ง', 'ค่าโฆษณา', 'อื่นๆ'];
const TAX_RATES = [1, 2, 3, 5, 10, 15];

function NewPaymentVoucher() {
	const router = useRouter();
	const sp = useSearchParams();
	const poId = sp.get('poId');
	const installmentId = sp.get('installmentId');
	const [category, setCategory] = useState('');
	const alert = useAlert();
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [payee, setPayee] = useState('');
	const [amount, setAmount] = useState('');
	const [method, setMethod] = useState('TRANSFER');
	const [bank, setBank] = useState('');
	const [cheque, setCheque] = useState('');
	const [description, setDescription] = useState('');
	const [notes, setNotes] = useState('');
	const [wht, setWht] = useState(false);
	const [taxId, setTaxId] = useState('');
	const [address, setAddress] = useState('');
	const [incomeType, setIncomeType] = useState('ค่าจ้าง');
	const [rate, setRate] = useState(3);
	const [saving, setSaving] = useState(false);
	const taxAmount = useMemo(() => Math.round((((Number(amount) || 0) * rate) / 100) * 100) / 100, [amount, rate]);

	// มาจากงวดจ่ายของ PO → เติมผู้รับเงิน ยอด และรายละเอียดให้อัตโนมัติ
	useEffect(() => {
		if (!poId) return;

		(async () => {
			try {
				const po = await (await fetch(`/api/purchase-orders/${poId}`)).json();
				const inst = (po.installments ?? []).find((i: { id: string }) => i.id === installmentId);
				const total = inst ? Number(inst.amount) : Number(po.totalAmount);

				setPayee(po.payeeName || po.team?.leaderName || po.team?.teamName || '');
				setAmount(total ? String(total) : '');
				setCategory(po.costCategory || '');
				setDescription(`${po.poNumber}${inst ? ` งวดที่ ${inst.seq}` : ''}`);

				if (Number(po.whtPercent) > 0) {
					setWht(true);
					setRate(Number(po.whtPercent));
				}
			} catch {
				/* กรอกเองได้ */
			}
		})();
	}, [poId, installmentId]);

	async function save() {
		if (!payee.trim()) return alert.showWarning('กรุณาระบุชื่อผู้รับเงิน');

		if (!amount || Number(amount) <= 0) return alert.showWarning('กรุณาระบุจำนวนเงิน');

		if (wht && !taxId.trim()) return alert.showWarning('กรุณาระบุเลขผู้เสียภาษีผู้ถูกหัก');

		setSaving(true);

		try {
			const body: Record<string, unknown> = {
				date,
				payeeName: payee,
				amount: Number(amount),
				paymentMethod: method,
				bankName: bank || null,
				chequeNumber: cheque || null,
				description: description || null,
				notes: notes || null,
				purchaseOrderId: poId || undefined,
				installmentId: installmentId || undefined,
				category: category || undefined
			};

			if (wht)
				body.withholding = {
					payeeName: payee,
					payeeTaxId: taxId,
					payeeAddress: address || null,
					incomeType,
					taxRate: rate,
					incomeAmount: Number(amount),
					taxAmount
				};

			const pv = await sendJson('/api/payment-vouchers', 'POST', body);
			alert.showSuccess('สร้างใบสำคัญจ่ายเรียบร้อย', pv.voucherNumber);
			router.push(`/apps/payment-vouchers/${pv.id}`);
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างใบสำคัญจ่ายได้');
			setSaving(false);
		}
	}

	return (
		<FormPage
			title="ออกใบสำคัญจ่าย"
			subtitle="บันทึกการจ่ายเงิน และออก 50 ทวิพร้อมกันได้"
			backHref="/apps/payment-vouchers"
			saving={saving}
			saveLabel={wht ? 'บันทึก + ออก 50 ทวิ' : 'บันทึกใบสำคัญจ่าย'}
			onSave={save}
		>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field label="วันที่จ่ายเงิน">
					{(id) => (
						<DateInput
							id={id}
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					)}
				</Field>
				<Field
					label="ชื่อผู้รับเงิน"
					required
				>
					{(id) => (
						<Input
							id={id}
							value={payee}
							onChange={(e) => setPayee(e.target.value)}
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
				<Field label="วิธีจ่ายเงิน">
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
			<Field label="รายละเอียดการจ่าย">
				{(id) => (
					<Input
						id={id}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
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
			<label className="border-line font-display flex min-h-11 cursor-pointer items-center gap-3 border-t pt-4 font-medium">
				<input
					type="checkbox"
					checked={wht}
					onChange={(e) => setWht(e.target.checked)}
					className="accent-primary size-5"
				/>
				หัก ณ ที่จ่าย และออก 50 ทวิ
			</label>
			{wht && (
				<div className="bg-surface-2 grid grid-cols-1 gap-4 rounded-xl p-4 sm:grid-cols-2">
					<Field
						label="เลขผู้เสียภาษีผู้ถูกหัก"
						required
					>
						{(id) => (
							<Input
								id={id}
								value={taxId}
								onChange={(e) => setTaxId(e.target.value)}
							/>
						)}
					</Field>
					<Field label="ประเภทเงินได้">
						{(id) => (
							<Select
								id={id}
								value={incomeType}
								onChange={(e) => setIncomeType(e.target.value)}
							>
								{INCOME_TYPES.map((t) => (
									<option key={t}>{t}</option>
								))}
							</Select>
						)}
					</Field>
					<Field
						label="ที่อยู่ผู้ถูกหัก"
						className="sm:col-span-2"
					>
						{(id) => (
							<Textarea
								id={id}
								rows={2}
								value={address}
								onChange={(e) => setAddress(e.target.value)}
							/>
						)}
					</Field>
					<Field label="อัตราภาษี">
						{(id) => (
							<Select
								id={id}
								value={rate}
								onChange={(e) => setRate(Number(e.target.value))}
							>
								{TAX_RATES.map((r) => (
									<option
										key={r}
										value={r}
									>
										{r}%
									</option>
								))}
							</Select>
						)}
					</Field>
					<div className="flex flex-col justify-end text-sm">
						<span className="text-ink-muted">ภาษีที่หัก</span>
						<span className="font-display text-primary-ink text-xl font-semibold">
							{formatMoney(taxAmount)}
						</span>
					</div>
				</div>
			)}
		</FormPage>
	);
}

export default function NewPaymentVoucherPage() {
	return (
		<Suspense fallback={<p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>}>
			<NewPaymentVoucher />
		</Suspense>
	);
}
