'use client';

import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	DataTable,
	Field,
	IconButton,
	Input,
	PageHeader,
	Segmented,
	StatusBadge
} from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';
import { sendJson, useApi } from '@/lib/use-api';

type WOStatus = {
	id: string;
	name: string;
	code: string;
	color: string;
	bgColor: string;
	sortOrder: number;
	isDefault: boolean;
	isActive: boolean;
};

const SWATCHES = [
	{ color: '#D97706', bgColor: '#FEF3C7', label: 'เหลือง' },
	{ color: '#2563EB', bgColor: '#DBEAFE', label: 'น้ำเงิน' },
	{ color: '#059669', bgColor: '#D1FAE5', label: 'เขียว' },
	{ color: '#4F46E5', bgColor: '#E0E7FF', label: 'ม่วง' },
	{ color: '#DC2626', bgColor: '#FEE2E2', label: 'แดง' },
	{ color: '#0891B2', bgColor: '#CFFAFE', label: 'ฟ้า' },
	{ color: '#EA580C', bgColor: '#FFF7ED', label: 'ส้ม' },
	{ color: '#64748B', bgColor: '#F1F5F9', label: 'เทา' }
];
const EMPTY = { name: '', code: '', color: SWATCHES[7].color, bgColor: SWATCHES[7].bgColor, isDefault: false };

export default function WorkOrderStatusesPage() {
	const alert = useAlert();
	const qc = useQueryClient();
	const [scope, setScope] = useState<'WO' | 'QUOTATION'>('WO');
	const { data, isLoading } = useApi<WOStatus[]>(`/api/work-order-statuses?appliesTo=${scope}`);
	const { data: wos } = useApi<{ status: string }[]>(scope === 'WO' ? '/api/work-orders' : '/api/quotations');
	const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
	const used = useMemo(() => new Set((Array.isArray(wos) ? wos : []).map((w) => w.status)), [wos]);
	const [form, setForm] = useState(EMPTY);
	const [editing, setEditing] = useState<WOStatus | null>(null);
	const [del, setDel] = useState<WOStatus | null>(null);
	const [saving, setSaving] = useState(false);
	const refresh = () =>
		qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/api/work-order-statuses') });

	function reset() {
		setForm(EMPTY);
		setEditing(null);
	}

	const toCode = (s: string) =>
		s
			.toUpperCase()
			.replace(/[^A-Z0-9]+/g, '_')
			.replace(/^_|_$/g, '');

	async function save() {
		if (!form.name.trim() || !form.code.trim()) {
			alert.showWarning('กรุณากรอกชื่อและรหัสสถานะ');

			return;
		}

		setSaving(true);

		try {
			if (editing) await sendJson(`/api/work-order-statuses/${editing.id}`, 'PATCH', form);
			else await sendJson('/api/work-order-statuses', 'POST', { ...form, appliesTo: scope });

			alert.showSuccess(editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสถานะสำเร็จ');
			reset();
			await refresh();
		} catch (e) {
			alert.showError('เกิดข้อผิดพลาด', e instanceof Error ? e.message : undefined);
		} finally {
			setSaving(false);
		}
	}

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`/api/work-order-statuses/${del.id}`, 'DELETE');
			alert.showSuccess('ลบแล้ว', del.name);
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาดในการลบ');
		}

		setDel(null);
	}

	async function toggle(s: WOStatus) {
		try {
			await sendJson(`/api/work-order-statuses/${s.id}`, 'PATCH', { isActive: !s.isActive });
			await refresh();
		} catch {
			alert.showError('เกิดข้อผิดพลาด');
		}
	}

	return (
		<>
			<PageHeader
				title="ตั้งค่าสถานะ WO"
				subtitle="กำหนดชื่อ สี และลำดับของสถานะ ที่ใช้ทั้งระบบ (แยกชุดสถานะใบสั่งงานกับใบเสนอราคา)"
				actions={
					<Segmented
						label="ชุดสถานะ"
						value={scope}
						onChange={(v) => {
							setScope(v);
							reset();
						}}
						options={[
							{ value: 'WO', label: 'สถานะใบสั่งงาน' },
							{ value: 'QUOTATION', label: 'สถานะใบเสนอราคา' }
						]}
					/>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-6 min-[1100px]:grid-cols-[2fr_1fr]">
				<Card>
					<DataTable
						loading={isLoading}
						rows={list}
						rowKey={(s) => s.id}
						empty="ยังไม่มีสถานะ"
						columns={[
							{ key: 'o', header: 'ลำดับ', cell: (s) => s.sortOrder },
							{
								key: 'p',
								header: 'ตัวอย่าง',
								cell: (s) => (
									<StatusBadge
										label={s.name}
										color={s.color}
										bgColor={s.bgColor}
									/>
								)
							},
							{
								key: 'c',
								header: 'รหัส',
								cell: (s) => (
									<code className="bg-surface-2 rounded-sm px-1.5 py-0.5 text-[13px]">{s.code}</code>
								)
							},
							{
								key: 'k',
								header: 'สี',
								cell: (s) => (
									<span className="inline-flex items-center gap-2">
										<span
											aria-hidden="true"
											className="border-line size-4 rounded-full border"
											style={{ backgroundColor: s.color }}
										/>
										{s.color}
									</span>
								)
							},
							{
								key: 'd',
								header: 'ค่าเริ่มต้น',
								cell: (s) =>
									s.isDefault ? (
										<StatusBadge
											label="ค่าเริ่มต้น"
											tone="info"
										/>
									) : null
							},
							{
								key: 'a',
								header: 'ใช้งาน',
								cell: (s) => (
									<label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
										<input
											type="checkbox"
											checked={s.isActive}
											onChange={() => toggle(s)}
											className="accent-primary size-5"
										/>
										<span className="sr-only">เปิดใช้งาน {s.name}</span>
									</label>
								)
							},
							{
								key: 'act',
								header: <span className="sr-only">การดำเนินการ</span>,
								align: 'right',
								cell: (s) => (
									<div className="flex justify-end">
										<IconButton
											aria-label={`แก้ไข ${s.name}`}
											onClick={() => {
												setEditing(s);
												setForm({
													name: s.name,
													code: s.code,
													color: s.color,
													bgColor: s.bgColor,
													isDefault: s.isDefault
												});
											}}
										>
											<Pencil size={18} />
										</IconButton>
										<IconButton
											aria-label={
												used.has(s.code)
													? `ลบ ${s.name} ไม่ได้ เพราะมีงานใช้อยู่`
													: `ลบ ${s.name}`
											}
											disabled={used.has(s.code)}
											onClick={() => setDel(s)}
										>
											<Trash2 size={18} />
										</IconButton>
									</div>
								)
							}
						]}
					/>
					<p className="text-ink-muted text-[13px]">สถานะที่มีงานใช้อยู่จะลบไม่ได้ แต่ปิดการใช้งานได้</p>
				</Card>

				<Card>
					<CardHeader title={editing ? 'แก้ไขสถานะ' : 'เพิ่มสถานะ'} />
					<Field
						label="ชื่อสถานะ"
						required
					>
						{(id) => (
							<Input
								id={id}
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							/>
						)}
					</Field>
					<Field
						label="รหัส"
						required
						hint="ตัวพิมพ์ใหญ่และขีดล่าง เช่น IN_PROGRESS"
					>
						{(id) => (
							<Input
								id={id}
								value={form.code}
								disabled={!!editing}
								onChange={(e) => {
									setForm((f) => ({ ...f, code: toCode(e.target.value) }));
								}}
								className="font-mono"
							/>
						)}
					</Field>
					<fieldset>
						<legend className="font-display mb-1.5 text-sm font-medium">สี</legend>
						<div className="flex flex-wrap gap-2">
							{SWATCHES.map((s) => {
								const on = form.color === s.color;

								return (
									<button
										key={s.color}
										type="button"
										aria-label={s.label}
										aria-pressed={on}
										onClick={() => setForm((f) => ({ ...f, color: s.color, bgColor: s.bgColor }))}
										className={clsx(
											'focus-visible:outline-focus size-11 cursor-pointer rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2',
											on ? 'border-ink' : 'border-transparent'
										)}
										style={{ backgroundColor: s.color }}
									/>
								);
							})}
						</div>
					</fieldset>
					<div>
						<div className="font-display mb-1.5 text-sm font-medium">ตัวอย่าง</div>
						<StatusBadge
							label={form.name || 'ชื่อสถานะ'}
							color={form.color}
							bgColor={form.bgColor}
						/>
					</div>
					<label className="flex min-h-11 cursor-pointer items-center gap-3">
						<input
							type="checkbox"
							checked={form.isDefault}
							onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
							className="accent-primary size-5"
						/>
						ใช้เป็นสถานะเริ่มต้น
					</label>
					<div className="flex gap-3">
						<Button
							disabled={saving}
							onClick={save}
						>
							{editing ? 'บันทึก' : 'เพิ่มสถานะ'}
						</Button>
						<Button
							variant="ghost"
							onClick={reset}
						>
							ล้างฟอร์ม
						</Button>
					</div>
				</Card>
			</div>
			<ConfirmDialog
				open={!!del}
				danger
				title="ลบสถานะ"
				message={`ต้องการลบสถานะ "${del?.name ?? ''}" ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</>
	);
}
