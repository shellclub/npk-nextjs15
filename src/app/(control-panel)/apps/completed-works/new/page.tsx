'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import {
	DateInput,
	Button,
	Field,
	FormPage,
	IconButton,
	Input,
	QueuedFiles,
	RefPicker,
	Textarea
} from '@/components/ui';

type WO = {
	id: string;
	woNumber: string;
	description?: string | null;
	status: string;
	quotation?: { projectName?: string | null; customerGroup: { groupName: string } } | null;
};

async function upload(id: string, files: File[], photoType: string) {
	if (!files.length) return;

	const fd = new FormData();
	files.forEach((f) => fd.append('files', f));
	fd.append('photoType', photoType);
	await fetch(`/api/completed-works/${id}/upload`, { method: 'POST', body: fd });
}

export default function NewCompletedWorkPage() {
	const router = useRouter();
	const alert = useAlert();
	const [wo, setWo] = useState<WO | null>(null);
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [notes, setNotes] = useState('');
	const [photos, setPhotos] = useState<File[]>([]);
	const [receipts, setReceipts] = useState<File[]>([]);
	const [items, setItems] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	async function save() {
		if (!wo) return alert.showWarning('กรุณาเลือก Work Order');

		setSaving(true);

		try {
			const res = await fetch('/api/completed-works', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					workOrderId: wo.id,
					completionDate: date,
					notes,
					serviceItems: items
						.map((d, i) => ({ itemNo: i + 1, description: d }))
						.filter((s) => s.description.trim())
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				alert.showError('เกิดข้อผิดพลาด', err.error || 'ไม่สามารถสร้างได้');
				setSaving(false);

				return;
			}

			const cw = await res.json();
			await upload(cw.id, photos, 'WORK');
			await upload(cw.id, receipts, 'RECEIPT');
			alert.showSuccess('บันทึกเรียบร้อย', `บันทึกงานเสร็จ ${wo.woNumber} แล้ว`);
			router.push('/apps/completed-works');
		} catch {
			alert.showError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้ กรุณาลองใหม่');
			setSaving(false);
		}
	}

	return (
		<FormPage
			title="บันทึกงานเสร็จ"
			subtitle="แนบรูปงานและใบรับงาน พร้อมรายการ Service Report"
			backHref="/apps/completed-works"
			saving={saving}
			saveLabel="บันทึกงานเสร็จ"
			saveDisabled={!wo}
			onSave={save}
		>
			<RefPicker<WO>
				label="Work Order"
				required
				url="/api/work-orders"
				filter={(w) => ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(w.status)}
				getLabel={(w) =>
					`${w.woNumber} — ${w.quotation?.customerGroup?.groupName || ''} — ${w.quotation?.projectName || w.description || ''}`
				}
				value={wo}
				onChange={setWo}
				placeholder="ค้นหา WO หรือชื่อลูกค้า"
			/>
			<Field label="วันที่เสร็จงาน">
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
						rows={3}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				)}
			</Field>
			<div>
				<div className="font-display mb-1.5 text-sm font-medium">รูปภาพงาน</div>
				<QueuedFiles
					label="ลากรูปงานมาวาง หรือคลิกเพื่อเลือก"
					files={photos}
					onChange={setPhotos}
				/>
			</div>
			<div>
				<div className="font-display mb-1.5 text-sm font-medium">ใบรับงาน</div>
				<QueuedFiles
					label="ลากรูปใบรับงานมาวาง หรือคลิกเพื่อเลือก"
					files={receipts}
					onChange={setReceipts}
				/>
			</div>
			<div className="flex flex-col gap-3">
				<div className="font-display text-sm font-medium">รายการ Service Report</div>
				{items.map((d, i) => (
					<div
						key={i}
						className="flex items-center gap-2"
					>
						<span className="text-ink-muted w-8 text-right">{i + 1}.</span>
						<Input
							aria-label={`รายการ Service Report ${i + 1}`}
							value={d}
							onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
						/>
						<IconButton
							aria-label={`ลบรายการ ${i + 1}`}
							onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
						>
							<Trash2 size={18} />
						</IconButton>
					</div>
				))}
				<div>
					<Button
						variant="dashed"
						icon={<Plus size={18} />}
						onClick={() => setItems((p) => [...p, ''])}
					>
						เพิ่มรายการ
					</Button>
				</div>
			</div>
		</FormPage>
	);
}
