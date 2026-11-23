'use client';

import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	Field,
	IconButton,
	Input,
	PageHeader,
	RecordDialog,
	Textarea,
	type RecordField
} from '@/components/ui';
import { CompanyAssets } from '@/components/company/CompanyAssets';
import { useAlert } from '@/components/shared/AlertProvider';
import { sendJson, useApi } from '@/lib/use-api';

type Bank = {
	id: string;
	bank: string;
	branch: string;
	accountName: string;
	accountNumber: string;
	accountType: string;
};
type Company = {
	id: string;
	nameTh: string;
	nameEn: string;
	addressTh: string;
	addressEn?: string | null;
	taxId: string;
	phones: string[];
	email?: string | null;
	bankAccounts: Bank[];
};

const BANK_FIELDS: RecordField[] = [
	{ key: 'bank', label: 'ธนาคาร', required: true },
	{ key: 'branch', label: 'สาขา' },
	{ key: 'accountType', label: 'ประเภทบัญชี', hint: 'เช่น ออมทรัพย์ กระแสรายวัน' },
	{ key: 'accountName', label: 'ชื่อบัญชี', required: true },
	{ key: 'accountNumber', label: 'เลขที่บัญชี', required: true, span: 2 }
];
const EMPTY = { nameTh: '', nameEn: '', taxId: '', addressTh: '', addressEn: '', phones: '', email: '' };

export default function CompanySettingsPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data: company, isLoading } = useApi<Company | null>('/api/company');
	const [form, setForm] = useState(EMPTY);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const [bank, setBank] = useState<{ record?: Bank } | null>(null);
	const [delBank, setDelBank] = useState<Bank | null>(null);
	const refresh = () => qc.invalidateQueries({ queryKey: ['/api/company'] });

	useEffect(() => {
		if (company)
			setForm({
				nameTh: company.nameTh,
				nameEn: company.nameEn ?? '',
				taxId: company.taxId,
				addressTh: company.addressTh,
				addressEn: company.addressEn ?? '',
				phones: (company.phones ?? []).join(', '),
				email: company.email ?? ''
			});
	}, [company]);

	const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm((f) => ({ ...f, [k]: e.target.value }));

	async function save() {
		const errs: Record<string, string> = {};

		if (!form.nameTh.trim()) errs.nameTh = 'กรุณากรอกชื่อบริษัท';

		if (!form.taxId.trim()) errs.taxId = 'กรุณากรอกเลขผู้เสียภาษี';

		if (!form.addressTh.trim()) errs.addressTh = 'กรุณากรอกที่อยู่';

		setErrors(errs);

		if (Object.keys(errs).length) return;

		setSaving(true);

		try {
			await sendJson('/api/company', 'PUT', {
				...form,
				phones: form.phones
					.split(/[,，]/)
					.map((p) => p.trim())
					.filter(Boolean)
			});
			alert.showSuccess('บันทึกข้อมูลบริษัทแล้ว');
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		} finally {
			setSaving(false);
		}
	}

	async function saveBank(values: Record<string, string>) {
		const id = bank?.record?.id;

		try {
			await sendJson(
				id ? `/api/company/bank-accounts/${id}` : '/api/company/bank-accounts',
				id ? 'PATCH' : 'POST',
				values
			);
			alert.showSuccess('บันทึกบัญชีธนาคารแล้ว');
			setBank(null);
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}
	}

	async function removeBank() {
		if (!delBank) return;

		try {
			await sendJson(`/api/company/bank-accounts/${delBank.id}`, 'DELETE');
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		}

		setDelBank(null);
	}

	return (
		<>
			<PageHeader
				title="ข้อมูลบริษัท"
				subtitle="ข้อมูลที่แสดงบนหัวเอกสารและบัญชีธนาคารสำหรับรับชำระเงิน"
				actions={
					<Button
						disabled={saving || isLoading}
						onClick={save}
					>
						บันทึกการเปลี่ยนแปลง
					</Button>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] items-start gap-6 min-[1100px]:grid-cols-[3fr_2fr]">
				<Card>
					<CardHeader title="ข้อมูลบริษัท" />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field
							label="ชื่อบริษัท (ไทย)"
							required
							error={errors.nameTh}
							className="sm:col-span-2"
						>
							{(id, bad) => (
								<Input
									id={id}
									aria-invalid={bad}
									value={form.nameTh}
									onChange={set('nameTh')}
								/>
							)}
						</Field>
						<Field
							label="ชื่อบริษัท (อังกฤษ)"
							className="sm:col-span-2"
						>
							{(id) => (
								<Input
									id={id}
									value={form.nameEn}
									onChange={set('nameEn')}
								/>
							)}
						</Field>
						<Field
							label="เลขประจำตัวผู้เสียภาษี"
							required
							error={errors.taxId}
						>
							{(id, bad) => (
								<Input
									id={id}
									aria-invalid={bad}
									value={form.taxId}
									onChange={set('taxId')}
								/>
							)}
						</Field>
						<Field label="อีเมล">
							{(id) => (
								<Input
									id={id}
									type="email"
									value={form.email}
									onChange={set('email')}
								/>
							)}
						</Field>
						<Field
							label="เบอร์โทร"
							hint="หลายเบอร์คั่นด้วยเครื่องหมายจุลภาค"
							className="sm:col-span-2"
						>
							{(id) => (
								<Input
									id={id}
									value={form.phones}
									onChange={set('phones')}
								/>
							)}
						</Field>
						<Field
							label="ที่อยู่ (ไทย)"
							required
							error={errors.addressTh}
							className="sm:col-span-2"
						>
							{(id, bad) => (
								<Textarea
									id={id}
									aria-invalid={bad}
									value={form.addressTh}
									onChange={set('addressTh')}
								/>
							)}
						</Field>
						<Field
							label="ที่อยู่ (อังกฤษ)"
							className="sm:col-span-2"
						>
							{(id) => (
								<Textarea
									id={id}
									value={form.addressEn}
									onChange={set('addressEn')}
								/>
							)}
						</Field>
					</div>
				</Card>

				<Card>
					<CardHeader title="บัญชีธนาคาร" />
					{(company?.bankAccounts ?? []).length === 0 && (
						<p className="text-ink-muted">ยังไม่มีบัญชีธนาคาร</p>
					)}
					<ul className="flex flex-col gap-3">
						{(company?.bankAccounts ?? []).map((b) => (
							<li
								key={b.id}
								className="bg-surface-2 ring-line flex items-start gap-3 rounded-2xl p-4 ring-1"
							>
								<span
									aria-hidden="true"
									className="bg-tint text-primary-ink flex size-10 shrink-0 items-center justify-center rounded-full"
								>
									<Landmark size={20} />
								</span>
								<div className="min-w-0 flex-1">
									<div className="font-display font-semibold">
										{b.bank}
										{b.branch ? ` · ${b.branch}` : ''}
									</div>
									<CompanyAssets />
									<div className="text-ink-muted text-sm">
										{b.accountType} · {b.accountName}
									</div>
									<div className="font-display text-lg font-semibold tracking-wide">
										{b.accountNumber}
									</div>
								</div>
								<IconButton
									aria-label={`แก้ไขบัญชี ${b.bank}`}
									onClick={() => setBank({ record: b })}
								>
									<Pencil size={18} />
								</IconButton>
								<IconButton
									aria-label={`ลบบัญชี ${b.bank}`}
									onClick={() => setDelBank(b)}
								>
									<Trash2 size={18} />
								</IconButton>
							</li>
						))}
					</ul>
					<Button
						variant="dashed"
						icon={<Plus size={18} />}
						onClick={() => setBank({})}
						disabled={!company}
					>
						เพิ่มบัญชีธนาคาร
					</Button>
					{!company && !isLoading && (
						<p className="text-ink-muted text-[13px]">บันทึกข้อมูลบริษัทก่อนจึงจะเพิ่มบัญชีธนาคารได้</p>
					)}
				</Card>
			</div>
			<RecordDialog
				open={!!bank}
				title={bank?.record ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}
				fields={BANK_FIELDS}
				initial={bank?.record as never}
				onSubmit={saveBank}
				onClose={() => setBank(null)}
			/>
			<ConfirmDialog
				open={!!delBank}
				danger
				title="ลบบัญชีธนาคาร"
				message={`ต้องการลบบัญชี ${delBank?.bank ?? ''} ${delBank?.accountNumber ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDelBank(null)}
				onConfirm={removeBank}
			/>
		</>
	);
}
