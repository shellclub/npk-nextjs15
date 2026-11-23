'use client';

import { useEffect, useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import { Button, DateInput, Dialog, Field, Input, RefPicker, Select, Textarea } from '@/components/ui';
import { addMonthsISO } from '@/lib/add-months';
import { sendJson, useApi } from '@/lib/use-api';

export type POEditable = {
	id: string;
	poNumber: string;
	teamId?: string | null;
	costType?: string;
	costCategory?: string | null;
	payeeName?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	warrantyStartDate?: string | null;
	warrantyEndDate?: string | null;
	warrantyMonths?: number | null;
	notes?: string | null;
	quotation?: {
		id: string;
		quotationNumber: string;
		customerGroup?: { groupName: string };
	} | null;
};
type Ref = {
	quotationId?: string | null;
	workOrderId?: string | null;
	quotationNumber: string;
	customerName?: string;
	projectName?: string;
	woNumber?: string;
};

const d = (v?: string | null) => (v ? new Date(v).toISOString().split('T')[0] : '');

/** แก้ข้อมูล PO ที่ไม่กระทบยอดเงิน: ทีม ลูกค้า(ใบเสนอราคาอ้างอิง) ผู้รับเงิน วันที่ ประกัน หมายเหตุ — ราคาที่ล็อกไว้ไม่ถูกแตะ */
export function POEditDialog({
	po,
	open,
	onClose,
	onSaved
}: {
	po: POEditable;
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
}) {
	const alert = useAlert();
	const { data: teamData } = useApi<{ id: string; teamName: string; leaderName: string }[]>(
		'/api/technician-teams',
		undefined,
		open
	);
	const teams = Array.isArray(teamData) ? teamData : [];
	const [f, setF] = useState({
		teamId: '',
		costType: 'LABOUR',
		costCategory: '',
		payeeName: '',
		startDate: '',
		endDate: '',
		warrantyStart: '',
		warrantyEnd: '',
		warrantyMonths: '',
		notes: ''
	});
	const [ref, setRef] = useState<Ref | null>(null);
	const [saving, setSaving] = useState(false);
	const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

	useEffect(() => {
		if (!open) return;

		setRef(null);
		setF({
			teamId: po.teamId || '',
			costType: po.costType || 'LABOUR',
			costCategory: po.costCategory || '',
			payeeName: po.payeeName || '',
			startDate: d(po.startDate),
			endDate: d(po.endDate),
			warrantyStart: d(po.warrantyStartDate),
			warrantyEnd: d(po.warrantyEndDate),
			warrantyMonths: po.warrantyMonths ? String(po.warrantyMonths) : '',
			notes: po.notes || ''
		});
	}, [open, po]);

	function setWarranty(p: { warrantyStart?: string; warrantyMonths?: string }) {
		setF((x) => {
			const n = { ...x, ...p };
			const end = addMonthsISO(n.warrantyStart, Number(n.warrantyMonths));

			return end ? { ...n, warrantyEnd: end } : n;
		});
	}

	async function save() {
		setSaving(true);

		try {
			await sendJson(`/api/purchase-orders/${po.id}`, 'PATCH', {
				teamId: f.teamId || null,
				costType: f.costType,
				costCategory: f.costCategory || null,
				payeeName: f.payeeName || null,
				startDate: f.startDate || null,
				endDate: f.endDate || null,
				warrantyStartDate: f.warrantyStart || null,
				warrantyEndDate: f.warrantyEnd || null,
				warrantyMonths: f.warrantyMonths ? Number(f.warrantyMonths) : null,
				notes: f.notes || null,
				...(ref
					? {
							quotationId: ref.quotationId || null,
							workOrderId: ref.workOrderId || null
						}
					: {})
			});
			alert.showSuccess('บันทึกเรียบร้อย', po.poNumber);
			onSaved();
			onClose();
		} catch {
			alert.showError('ไม่สามารถบันทึกได้');
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			size="lg"
			title={`แก้ไข ${po.poNumber}`}
			footer={
				<>
					<Button
						variant="ghost"
						onClick={onClose}
					>
						ยกเลิก
					</Button>
					<Button
						disabled={saving}
						onClick={save}
					>
						บันทึกการแก้ไข
					</Button>
				</>
			}
		>
			<p className="text-ink-muted">
				แก้ได้เฉพาะทีม ลูกค้า และรายละเอียดทั่วไป — ยอดเงินและราคาที่ล็อกแล้วไม่เปลี่ยน
			</p>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="sm:col-span-2">
					<RefPicker<Ref>
						label="ลูกค้า (เปลี่ยนใบเสนอราคา/WO อ้างอิง)"
						url="/api/purchase-orders/search-ref"
						searchParam="q"
						minChars={2}
						getId={(r) => r.quotationId || r.workOrderId || r.quotationNumber}
						getLabel={(r) =>
							`${r.quotationNumber} — ${r.customerName ?? ''}${r.projectName ? ` (${r.projectName})` : ''}`
						}
						value={ref}
						onChange={setRef}
						placeholder={
							po.quotation
								? `ปัจจุบัน: ${po.quotation.quotationNumber} — ${po.quotation.customerGroup?.groupName ?? ''}`
								: 'พิมพ์อย่างน้อย 2 ตัวอักษร'
						}
						emptyText="พิมพ์เพื่อค้นหา"
					/>
				</div>
				<Field label="ทีมช่าง">
					{(id) => (
						<Select
							id={id}
							value={f.teamId}
							onChange={(e) => set({ teamId: e.target.value })}
						>
							<option value="">ไม่ระบุทีม</option>
							{teams.map((t) => (
								<option
									key={t.id}
									value={t.id}
								>
									{t.teamName} ({t.leaderName})
								</option>
							))}
						</Select>
					)}
				</Field>
				<Field label="ผู้รับเงิน / ร้านค้า">
					{(id) => (
						<Input
							id={id}
							value={f.payeeName}
							onChange={(e) => set({ payeeName: e.target.value })}
						/>
					)}
				</Field>
				<Field label="ประเภทต้นทุน">
					{(id) => (
						<Select
							id={id}
							value={f.costType}
							onChange={(e) => set({ costType: e.target.value })}
						>
							<option value="LABOUR">ค่าแรง (จ้างช่าง)</option>
							<option value="MATERIAL">ค่าของ (บริษัทสั่งซื้อเอง)</option>
							<option value="OTHER">ค่าใช้จ่ายอื่นๆ</option>
						</Select>
					)}
				</Field>
				<Field label="หมวดใบสำคัญจ่าย">
					{(id) => (
						<Input
							id={id}
							value={f.costCategory}
							onChange={(e) => set({ costCategory: e.target.value })}
						/>
					)}
				</Field>
				<Field label="วันเริ่มงาน">
					{(id) => (
						<DateInput
							id={id}
							value={f.startDate}
							onChange={(e) => set({ startDate: e.target.value })}
						/>
					)}
				</Field>
				<Field label="กำหนดเสร็จ">
					{(id) => (
						<DateInput
							id={id}
							value={f.endDate}
							onChange={(e) => set({ endDate: e.target.value })}
						/>
					)}
				</Field>
				<Field label="วันเริ่มประกัน">
					{(id) => (
						<DateInput
							id={id}
							value={f.warrantyStart}
							onChange={(e) => setWarranty({ warrantyStart: e.target.value })}
						/>
					)}
				</Field>
				<Field label="ระยะเวลาประกัน">
					{(id) => (
						<Select
							id={id}
							value={f.warrantyMonths}
							onChange={(e) => setWarranty({ warrantyMonths: e.target.value })}
						>
							<option value="">ไม่ระบุ</option>
							{[3, 6, 12, 24].map((m) => (
								<option
									key={m}
									value={m}
								>
									{m % 12 === 0 ? `${m / 12} ปี` : `${m} เดือน`}
								</option>
							))}
						</Select>
					)}
				</Field>
				<Field
					label="วันสิ้นสุดประกัน"
					className="sm:col-span-2"
				>
					{(id) => (
						<DateInput
							id={id}
							value={f.warrantyEnd}
							onChange={(e) => set({ warrantyEnd: e.target.value })}
						/>
					)}
				</Field>
				<Field
					label="หมายเหตุ"
					className="sm:col-span-2"
				>
					{(id) => (
						<Textarea
							id={id}
							rows={3}
							value={f.notes}
							onChange={(e) => set({ notes: e.target.value })}
						/>
					)}
				</Field>
			</div>
		</Dialog>
	);
}
