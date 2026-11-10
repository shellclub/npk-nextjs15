'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@/components/shared/AlertProvider';
import { DateInput, Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui';
import { sendJson, useApi } from '@/lib/use-api';
import { WARRANTY_PRESETS, WORKFLOW_TYPES, addMonthsISO, dateInput, type StatusConfig, type WorkOrder } from './types';

type Team = { id: string; teamName: string };
type Quotation = {
	id: string;
	quotationNumber: string;
	projectName?: string | null;
	subtotal: number;
	totalAmount: number;
	status: string;
	customerGroup?: { groupName: string } | null;
};
type Customer = { id: string; groupName: string };

const today = () => new Date().toISOString().split('T')[0];
const blank = {
	woNumber: '',
	woDate: today(),
	workflowType: 'QUOTE_FIRST',
	quotationId: '',
	poNumber: '',
	poDate: '',
	teamId: '',
	teamName: '',
	statusCode: '',
	startDate: '',
	endDate: '',
	warrantyStartDate: '',
	warrantyEndDate: '',
	warrantyMonths: '',
	retentionAmount: 0,
	totalAmount: 0,
	description: ''
};

/** สร้าง/แก้ไข WO ใน dialog เดียว (mode = create | edit) */
export function WorkOrderDialog({
	open,
	mode,
	wo,
	initialQuotationId,
	onClose
}: {
	open: boolean;
	mode: 'create' | 'edit';
	wo?: WorkOrder | null;
	initialQuotationId?: string;
	onClose: () => void;
}) {
	const alert = useAlert();
	const qc = useQueryClient();
	const { data: statusData } = useApi<StatusConfig[]>('/api/work-order-statuses', undefined, open);
	const { data: teamData } = useApi<Team[]>('/api/technician-teams', undefined, open);
	const { data: quoData } = useApi<Quotation[]>('/api/quotations', undefined, open && mode === 'create');
	const { data: custData } = useApi<Customer[]>('/api/customers', undefined, open && mode === 'create');
	const statuses = useMemo(
		() => (Array.isArray(statusData) ? statusData.filter((s) => s.isActive) : []),
		[statusData]
	);
	const teams = Array.isArray(teamData) ? teamData : [];
	const quotations = useMemo(
		() => (Array.isArray(quoData) ? quoData.filter((q) => q.status !== 'CANCELLED') : []),
		[quoData]
	);
	const customers = Array.isArray(custData) ? custData : [];
	const [f, setF] = useState(blank);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);
	const [reserve, setReserve] = useState<{ customerGroupId: string; date: string } | null>(null);
	const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((p) => ({ ...p, [k]: v }));

	useEffect(() => {
		if (!open) return;

		setError('');

		if (mode === 'edit' && wo) {
			setF({
				...blank,
				poNumber: wo.poNumber || '',
				poDate: dateInput(wo.poDate),
				teamId: wo.teamId || '',
				teamName: wo.teamName || wo.team?.teamName || '',
				statusCode: wo.status,
				startDate: dateInput(wo.startDate),
				endDate: dateInput(wo.endDate),
				warrantyStartDate: dateInput(wo.warrantyStartDate),
				warrantyEndDate: dateInput(wo.warrantyEndDate),
				warrantyMonths: wo.warrantyMonths ? String(wo.warrantyMonths) : '',
				retentionAmount: Number(wo.retentionAmount) || 0,
				totalAmount: Number(wo.totalAmount) || 0,
				description: wo.description || ''
			});
		} else {
			setF({ ...blank, quotationId: initialQuotationId || '' });
		}
	}, [open, mode, wo, initialQuotationId]);

	useEffect(() => {
		if (open && mode === 'create') {
			setF((p) => {
				const q = quotations.find((x) => x.id === p.quotationId);
				const def = statuses.find((s) => (s as StatusConfig & { isDefault?: boolean }).isDefault);

				return {
					...p,
					statusCode: p.statusCode || def?.code || statuses[0]?.code || '',
					totalAmount: q && !p.totalAmount ? Number(q.subtotal || q.totalAmount) : p.totalAmount
				};
			});
		}
	}, [open, mode, statuses, quotations]);

	function pickQuotation(id: string) {
		const q = quotations.find((x) => x.id === id);
		setF((p) => ({ ...p, quotationId: id, totalAmount: q ? Number(q.subtotal || q.totalAmount) : 0 }));
	}

	/** เปลี่ยนวันเริ่มประกัน/ระยะเวลา → คำนวณวันสิ้นสุดให้ (ยังแก้เองได้) */
	function setWarranty(patch: Partial<Pick<typeof blank, 'warrantyStartDate' | 'warrantyMonths'>>) {
		setF((p) => {
			const n = { ...p, ...patch };
			const end = addMonthsISO(n.warrantyStartDate, Number(n.warrantyMonths));

			return end ? { ...n, warrantyEndDate: end } : n;
		});
	}

	function pickWorkflow(v: string) {
		// เลข WO key เองเฉพาะกรณีได้รับ WO ก่อน — กรณีอื่นให้ระบบ run เลขอัตโนมัติ
		setF((p) => ({ ...p, workflowType: v, woNumber: v === 'WO_FIRST' ? p.woNumber : '' }));
	}

	function pickTeam(id: string) {
		const t = teams.find((x) => x.id === id);
		setF((p) => ({ ...p, teamId: id, teamName: t?.teamName ?? '' }));
	}

	async function save() {
		setError('');

		if (!f.statusCode) return setError('กรุณาเลือกสถานะก่อนบันทึก');

		if (!f.teamId && !f.teamName.trim()) return setError('กรุณาเลือกหรือกรอกชื่อทีมช่างก่อนบันทึก');

		if (mode === 'create' && f.workflowType === 'WO_FIRST' && !f.woNumber.trim())
			return setError('กรุณากรอกเลข WO ที่ได้รับจากลูกค้า');

		setSaving(true);

		try {
			if (mode === 'edit' && wo) {
				await sendJson(`/api/work-orders/${wo.id}`, 'PATCH', {
					poNumber: f.poNumber || null,
					poDate: f.poDate || null,
					teamId: f.teamId || null,
					teamName: f.teamName || null,
					status: f.statusCode,
					startDate: f.startDate || null,
					endDate: f.endDate || null,
					warrantyStartDate: f.warrantyStartDate || null,
					warrantyEndDate: f.warrantyEndDate || null,
					warrantyMonths: f.warrantyMonths ? Number(f.warrantyMonths) : null,
					retentionAmount: f.retentionAmount || null,
					totalAmount: f.totalAmount,
					description: f.description || null
				});
				alert.showSuccess('บันทึกเรียบร้อย', wo.woNumber);
			} else {
				const n = await sendJson('/api/work-orders', 'POST', {
					woNumber: f.woNumber || undefined,
					date: f.woDate,
					poNumber: f.poNumber || undefined,
					poDate: f.poDate || undefined,
					quotationId: f.quotationId || undefined,
					teamId: f.teamId || undefined,
					teamName: f.teamName || undefined,
					status: f.statusCode,
					workflowType: f.workflowType,
					startDate: f.startDate || undefined,
					endDate: f.endDate || undefined,
					warrantyStartDate: f.warrantyStartDate || undefined,
					warrantyEndDate: f.warrantyEndDate || undefined,
					warrantyMonths: f.warrantyMonths ? Number(f.warrantyMonths) : undefined,
					retentionAmount: f.retentionAmount || undefined,
					totalAmount: f.totalAmount,
					description: f.description || undefined,
					createdById: 'system'
				});
				alert.showSuccess('สร้างเรียบร้อย', n.woNumber);
			}

			await qc.invalidateQueries({ queryKey: ['/api/work-orders'] });
			onClose();
		} catch (e) {
			const m = e instanceof Error ? e.message : '';
			setError(m && m.length < 150 ? m : 'ไม่สามารถบันทึกได้ กรุณาตรวจสอบข้อมูลและลองใหม่');
		} finally {
			setSaving(false);
		}
	}

	async function doReserve() {
		if (!reserve?.customerGroupId) return;

		try {
			const q = await sendJson('/api/quotations', 'POST', {
				customerGroupId: reserve.customerGroupId,
				date: reserve.date,
				status: 'DRAFT',
				items: [],
				createdById: 'system'
			});
			await qc.invalidateQueries({ queryKey: ['/api/quotations'] });
			setF((p) => ({ ...p, quotationId: q.id }));
			setReserve(null);
			alert.showSuccess('จองเลขที่ใบเสนอราคาแล้ว', q.quotationNumber);
		} catch {
			alert.showError('ไม่สามารถจองเลขที่ใบเสนอราคาได้');
		}
	}

	const create = mode === 'create';

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				size="lg"
				title={create ? 'สร้าง WO ใหม่' : `แก้ไข ${wo?.woNumber ?? ''}`}
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
							{create ? 'สร้าง WO' : 'บันทึกการแก้ไข'}
						</Button>
					</>
				}
			>
				{error && (
					<p
						role="alert"
						className="bg-danger-soft text-danger rounded-lg px-4 py-2.5"
					>
						{error}
					</p>
				)}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{create && (
						<>
							<Field
								label="เลขที่ WO"
								required={f.workflowType === 'WO_FIRST'}
								hint={
									f.workflowType === 'WO_FIRST'
										? 'กรอกเลข WO ที่ลูกค้าให้มา พร้อมวันที่ WO'
										: 'ระบบสร้างเลขอัตโนมัติ'
								}
							>
								{(id) => (
									<Input
										id={id}
										value={f.woNumber}
										disabled={f.workflowType !== 'WO_FIRST'}
										placeholder={f.workflowType === 'WO_FIRST' ? '' : 'WO-YYMMDD-XXX (อัตโนมัติ)'}
										onChange={(e) => set('woNumber', e.target.value)}
									/>
								)}
							</Field>
							<Field label="วันที่ WO">
								{(id) => (
									<DateInput
										id={id}
										value={f.woDate}
										onChange={(e) => set('woDate', e.target.value)}
									/>
								)}
							</Field>
							<Field
								label="ลำดับการตอบรับงาน"
								className="sm:col-span-2"
							>
								{(id) => (
									<Select
										id={id}
										value={f.workflowType}
										onChange={(e) => pickWorkflow(e.target.value)}
									>
										{WORKFLOW_TYPES.map((w) => (
											<option
												key={w.value}
												value={w.value}
											>
												{w.label}
											</option>
										))}
									</Select>
								)}
							</Field>
							<Field
								label="อ้างอิงใบเสนอราคา"
								hint={f.workflowType === 'QUOTE_FIRST' ? undefined : 'ไม่บังคับสำหรับกรณีนี้'}
								className="sm:col-span-2"
							>
								{(id) => (
									<div className="flex gap-2">
										<Select
											id={id}
											value={f.quotationId}
											onChange={(e) => pickQuotation(e.target.value)}
										>
											<option value="">ไม่อ้างอิงใบเสนอราคา</option>
											{quotations.map((q) => (
												<option
													key={q.id}
													value={q.id}
												>
													{q.quotationNumber} — {q.customerGroup?.groupName}
													{q.projectName ? ` (${q.projectName})` : ''}
												</option>
											))}
										</Select>
										{f.workflowType === 'WO_FIRST' && !f.quotationId && (
											<Button
												variant="outline"
												onClick={() => setReserve({ customerGroupId: '', date: today() })}
											>
												จองเลขที่
											</Button>
										)}
									</div>
								)}
							</Field>
						</>
					)}
					<Field label="เลข PO ลูกค้า">
						{(id) => (
							<Input
								id={id}
								value={f.poNumber}
								onChange={(e) => set('poNumber', e.target.value)}
							/>
						)}
					</Field>
					<Field label="วันที่ PO">
						{(id) => (
							<DateInput
								id={id}
								value={f.poDate}
								onChange={(e) => set('poDate', e.target.value)}
							/>
						)}
					</Field>
					<Field
						label="สถานะ"
						required
					>
						{(id) => (
							<Select
								id={id}
								value={f.statusCode}
								onChange={(e) => set('statusCode', e.target.value)}
							>
								<option value="">เลือกสถานะ</option>
								{statuses.map((s) => (
									<option
										key={s.code}
										value={s.code}
									>
										{s.name}
									</option>
								))}
							</Select>
						)}
					</Field>
					<Field
						label="ทีมช่าง"
						required
					>
						{(id) => (
							<Select
								id={id}
								value={f.teamId}
								onChange={(e) => pickTeam(e.target.value)}
							>
								<option value="">เลือกทีมช่าง</option>
								{teams.map((t) => (
									<option
										key={t.id}
										value={t.id}
									>
										{t.teamName}
									</option>
								))}
							</Select>
						)}
					</Field>
					{!f.teamId && (
						<Field
							label="หรือพิมพ์ชื่อทีมเอง"
							className="sm:col-span-2"
						>
							{(id) => (
								<Input
									id={id}
									value={f.teamName}
									onChange={(e) => set('teamName', e.target.value)}
								/>
							)}
						</Field>
					)}
					<Field label="วันเริ่มงาน">
						{(id) => (
							<DateInput
								id={id}
								value={f.startDate}
								onChange={(e) => set('startDate', e.target.value)}
							/>
						)}
					</Field>
					<Field label="กำหนดเสร็จ">
						{(id) => (
							<DateInput
								id={id}
								value={f.endDate}
								onChange={(e) => set('endDate', e.target.value)}
							/>
						)}
					</Field>
					<Field
						label="เงินประกันผลงาน ก่อน VAT (บาท)"
						hint="กรอกเอง (ยอดที่ลูกค้าหักไว้)"
						className="sm:col-span-2"
					>
						{(id) => (
							<Input
								id={id}
								type="number"
								min={0}
								value={f.retentionAmount || ''}
								onChange={(e) => set('retentionAmount', Number(e.target.value))}
							/>
						)}
					</Field>
					<Field label="วันเริ่มประกัน">
						{(id) => (
							<DateInput
								id={id}
								value={f.warrantyStartDate}
								onChange={(e) => setWarranty({ warrantyStartDate: e.target.value })}
							/>
						)}
					</Field>
					<Field
						label="ระยะเวลาประกัน"
						hint="เลือกแล้วระบบคำนวณวันสิ้นสุดให้"
					>
						{(id) => (
							<Select
								id={id}
								value={f.warrantyMonths}
								onChange={(e) => setWarranty({ warrantyMonths: e.target.value })}
							>
								<option value="">ไม่ระบุ</option>
								{WARRANTY_PRESETS.map((m) => (
									<option
										key={m}
										value={m}
									>
										{m % 12 === 0 ? `${m / 12} ปี` : `${m} เดือน`}
									</option>
								))}
								{f.warrantyMonths &&
									!(WARRANTY_PRESETS as readonly number[]).includes(Number(f.warrantyMonths)) && (
										<option value={f.warrantyMonths}>{f.warrantyMonths} เดือน</option>
									)}
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
								value={f.warrantyEndDate}
								onChange={(e) => set('warrantyEndDate', e.target.value)}
							/>
						)}
					</Field>
					<Field
						label="มูลค่างาน ก่อน VAT (บาท)"
						hint={f.quotationId && create ? 'ดึงจากใบเสนอราคาที่อ้างอิง' : undefined}
						className="sm:col-span-2"
					>
						{(id) => (
							<Input
								id={id}
								type="number"
								min={0}
								value={f.totalAmount}
								readOnly={create && !!f.quotationId}
								onChange={(e) => set('totalAmount', Number(e.target.value))}
							/>
						)}
					</Field>
					<Field
						label="รายละเอียด / หมายเหตุ"
						className="sm:col-span-2"
					>
						{(id) => (
							<Textarea
								id={id}
								rows={3}
								value={f.description}
								onChange={(e) => set('description', e.target.value)}
							/>
						)}
					</Field>
				</div>
			</Dialog>
			<Dialog
				open={!!reserve}
				onClose={() => setReserve(null)}
				size="sm"
				title="จองเลขที่ใบเสนอราคา"
				footer={
					<>
						<Button
							variant="ghost"
							onClick={() => setReserve(null)}
						>
							ยกเลิก
						</Button>
						<Button
							disabled={!reserve?.customerGroupId}
							onClick={doReserve}
						>
							จองเลขที่
						</Button>
					</>
				}
			>
				{reserve && (
					<div className="flex flex-col gap-4">
						<Field
							label="ลูกค้า"
							required
						>
							{(id) => (
								<Select
									id={id}
									value={reserve.customerGroupId}
									onChange={(e) => setReserve({ ...reserve, customerGroupId: e.target.value })}
								>
									<option value="">เลือกลูกค้า</option>
									{customers.map((c) => (
										<option
											key={c.id}
											value={c.id}
										>
											{c.groupName}
										</option>
									))}
								</Select>
							)}
						</Field>
						<Field label="วันที่">
							{(id) => (
								<DateInput
									id={id}
									value={reserve.date}
									onChange={(e) => setReserve({ ...reserve, date: e.target.value })}
								/>
							)}
						</Field>
					</div>
				)}
			</Dialog>
		</>
	);
}
