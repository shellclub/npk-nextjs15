'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useAlert } from '@/components/shared/AlertProvider';
import {
	DateInput,
	Button,
	Card,
	CardHeader,
	Field,
	FileDrop,
	FormPageHeader,
	IconButton,
	Input,
	InfoCard,
	RefPicker,
	Select,
	Textarea
} from '@/components/ui';
import {
	InstallmentEditor,
	toInstallmentPayload,
	type InstallmentRow
} from '@/components/purchase-orders/InstallmentEditor';
import { computePOTotals, validateInstallments } from '@/components/purchase-orders/po-math';
import { addMonthsISO } from '@/lib/add-months';
import { formatMoney } from '@/lib/format';
import { sendJson, useApi } from '@/lib/use-api';

type RefResult = {
	quotationId?: string | null;
	workOrderId?: string | null;
	quotationNumber: string;
	customerName?: string;
	branchName?: string;
	projectName?: string;
	woNumber?: string;
	items?: {
		itemType: string;
		description: string;
		unit?: string;
		quantity: number;
		unitPrice?: number;
		materialPrice?: number;
		labourPrice?: number;
	}[];
};
type Team = { id: string; teamName: string };
type Line = {
	id: number;
	itemType: 'HEADER' | 'ITEM';
	description: string;
	unit: string;
	quantity: number;
	materialPrice: number;
	labourPrice: number;
};
type Group = {
	id: number;
	teamId: string;
	selected: Set<number>;
	notes: string;
	startDate: string;
	endDate: string;
	warrantyStart: string;
	warrantyEnd: string;
	warrantyMonths: string;
	costType: 'LABOUR' | 'MATERIAL' | 'OTHER';
	costCategory: string;
	payeeName: string;
	vatPercent: string;
	whtPercent: string;
	installments: InstallmentRow[];
};

const COST_TYPES = [
	{ value: 'LABOUR', label: 'ค่าแรง (จ้างช่าง)' },
	{ value: 'MATERIAL', label: 'ค่าของ (บริษัทสั่งซื้อเอง)' },
	{ value: 'OTHER', label: 'ค่าใช้จ่ายอื่นๆ' }
] as const;

const amountOf = (l: Line) => (l.itemType === 'HEADER' ? 0 : (l.materialPrice + l.labourPrice) * l.quantity);
const numCls =
	'h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-right text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

function NewPurchaseOrder() {
	const router = useRouter();
	const alert = useAlert();
	const sp = useSearchParams();
	const { data: teamData } = useApi<Team[]>('/api/technician-teams');
	const teams = Array.isArray(teamData) ? teamData : [];
	const counter = useRef(1);
	const nid = () => counter.current++;
	const [ref, setRef] = useState<RefResult | null>(null);
	const [lines, setLines] = useState<Line[]>([]);
	const [groups, setGroups] = useState<Group[]>([
		{
			id: nid(),
			teamId: '',
			selected: new Set(),
			notes: '',
			startDate: '',
			endDate: '',
			warrantyStart: '',
			warrantyEnd: '',
			warrantyMonths: '',
			costType: 'LABOUR',
			costCategory: '',
			payeeName: '',
			vatPercent: '0',
			whtPercent: '0',
			installments: []
		}
	]);
	const [file, setFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);
	const presetWo = sp.get('workOrderId');

	function pickRef(r: RefResult | null) {
		setRef(r);
		const next: Line[] = (r?.items ?? []).map((it) => {
			const header = it.itemType === 'HEADER';

			return {
				id: nid(),
				itemType: header ? 'HEADER' : 'ITEM',
				description: it.description || '',
				unit: header ? '' : it.unit || '',
				quantity: header ? 0 : Number(it.quantity || 1),
				materialPrice: header ? 0 : Number(it.materialPrice || it.unitPrice || 0),
				labourPrice: header ? 0 : Number(it.labourPrice || 0)
			};
		});
		setLines(next);
		const all = new Set(next.filter((l) => l.itemType === 'ITEM').map((l) => l.id));
		setGroups((g) => g.map((x, i) => (i === 0 ? { ...x, selected: all } : { ...x, selected: new Set() })));
	}

	useEffect(() => {
		if (!presetWo) return;

		(async () => {
			try {
				const wo = await (await fetch(`/api/work-orders/${presetWo}`)).json();
				const res: RefResult[] = await (
					await fetch(`/api/purchase-orders/search-ref?q=${encodeURIComponent(wo.woNumber)}`)
				).json();
				const hit = res.find((x) => x.workOrderId === presetWo);

				if (hit) pickRef(hit);
			} catch {
				/* เลือกเองได้ */
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [presetWo]);

	const setLine = (id: number, patch: Partial<Line>) =>
		setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
	const setGroup = (id: number, patch: Partial<Group>) =>
		setGroups((p) => p.map((g) => (g.id === id ? { ...g, ...patch } : g)));
	const items = lines.filter((l) => l.itemType === 'ITEM');
	const groupSub = (g: Group) => items.filter((l) => g.selected.has(l.id)).reduce((s, l) => s + amountOf(l), 0);
	const groupCalc = (g: Group) =>
		computePOTotals(groupSub(g), 0, Number(g.vatPercent) || 0, Number(g.whtPercent) || 0);
	const groupTotal = (g: Group) => groupCalc(g).totalAmount;
	const setWarranty = (g: Group, patch: Partial<Pick<Group, 'warrantyStart' | 'warrantyMonths'>>) => {
		const n = { ...g, ...patch };
		const end = addMonthsISO(n.warrantyStart, Number(n.warrantyMonths));

		setGroup(g.id, end ? { ...patch, warrantyEnd: end } : patch);
	};

	function toggle(g: Group, id: number) {
		const s = new Set(g.selected);

		if (s.has(id)) s.delete(id);
		else s.add(id);

		setGroup(g.id, { selected: s });
	}

	function addLine() {
		const l: Line = {
			id: nid(),
			itemType: 'ITEM',
			description: '',
			unit: '',
			quantity: 1,
			materialPrice: 0,
			labourPrice: 0
		};
		setLines((p) => [...p, l]);
		setGroups((p) => p.map((g) => ({ ...g, selected: new Set([...g.selected, l.id]) })));
	}

	function removeLine(id: number) {
		setLines((p) => p.filter((l) => l.id !== id));
		setGroups((p) =>
			p.map((g) => {
				const s = new Set(g.selected);
				s.delete(id);
				return { ...g, selected: s };
			})
		);
	}

	async function save() {
		if (!items.length) return alert.showWarning('กรุณาเพิ่มรายการงานอย่างน้อย 1 รายการ');

		if (groups.some((g) => g.selected.size === 0))
			return alert.showWarning('ทุกใบสั่งซื้อต้องมีรายการงานอย่างน้อย 1 รายการ');

		const bad = groups.findIndex(
			(g) => !validateInstallments(groupTotal(g), toInstallmentPayload(g.installments)).ok
		);

		if (bad >= 0) return alert.showWarning(`ใบสั่งซื้อที่ ${bad + 1}: ยอดรวมทุกงวดเกินยอดสุทธิ`);

		setSaving(true);

		try {
			for (const g of groups) {
				const picked: Line[] = [];

				lines.forEach((l, i) => {
					if (l.itemType === 'HEADER') {
						for (let j = i + 1; j < lines.length && lines[j].itemType !== 'HEADER'; j++) {
							if (g.selected.has(lines[j].id)) {
								picked.push(l);
								break;
							}
						}
					} else if (g.selected.has(l.id)) picked.push(l);
				});

				const po = await sendJson('/api/purchase-orders', 'POST', {
					quotationId: ref?.quotationId || null,
					workOrderId: ref?.workOrderId || null,
					teamId: g.teamId || null,
					date: new Date().toISOString(),
					startDate: g.startDate || null,
					endDate: g.endDate || null,
					warrantyStartDate: g.warrantyStart || null,
					warrantyEndDate: g.warrantyEnd || null,
					costType: g.costType,
					costCategory: g.costCategory || null,
					payeeName: g.payeeName || null,
					warrantyMonths: g.warrantyMonths ? Number(g.warrantyMonths) : null,
					vatPercent: Number(g.vatPercent) || 0,
					whtPercent: Number(g.whtPercent) || 0,
					installments: g.installments.length ? toInstallmentPayload(g.installments) : undefined,
					notes: g.notes || null,
					items: picked.map((l, idx) => ({
						itemOrder: idx,
						itemType: l.itemType,
						description: l.description,
						unit: l.unit,
						quantity: l.itemType === 'HEADER' ? 0 : l.quantity,
						materialPrice: l.itemType === 'HEADER' ? 0 : l.materialPrice,
						labourPrice: l.itemType === 'HEADER' ? 0 : l.labourPrice
					}))
				});

				if (file) {
					const fd = new FormData();
					fd.append('file', file);
					await fetch(`/api/purchase-orders/${po.id}/upload`, { method: 'POST', body: fd }).catch(() => null);
				}
			}

			alert.showSuccess('สร้างเรียบร้อย', `${groups.length} ใบสั่งซื้อ`);
			router.push('/apps/purchase-orders');
		} catch {
			alert.showError('ไม่สามารถสร้างใบสั่งซื้อได้ กรุณาลองใหม่');
			setSaving(false);
		}
	}

	return (
		<>
			<FormPageHeader
				title="สร้างใบสั่งซื้อให้ช่าง"
				subtitle="เลือกใบเสนอราคา/WO อ้างอิง แล้วแบ่งงานให้ทีมช่างได้หลายทีม (1 ทีม = 1 ใบสั่งซื้อ)"
				backHref="/apps/purchase-orders"
			/>
			<div className="flex flex-col gap-6">
				<Card>
					<CardHeader title="อ้างอิงใบเสนอราคา" />
					<RefPicker<RefResult>
						label="ค้นหาใบเสนอราคา หรือ WO"
						url="/api/purchase-orders/search-ref"
						searchParam="q"
						minChars={2}
						getId={(r) => r.quotationId || r.workOrderId || r.quotationNumber}
						getLabel={(r) =>
							`${r.quotationNumber} — ${r.customerName ?? ''}${r.projectName ? ` (${r.projectName})` : ''}${r.woNumber ? ` • WO ${r.woNumber}` : ''}`
						}
						value={ref}
						onChange={pickRef}
						placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร"
						emptyText="พิมพ์เพื่อค้นหา"
					/>
					{ref && (
						<InfoCard
							title="ข้อมูลอ้างอิง"
							rows={[
								['ใบเสนอราคา', ref.quotationNumber],
								['ลูกค้า', ref.customerName],
								['สาขา', ref.branchName],
								['โครงการ', ref.projectName],
								['WO', ref.woNumber]
							]}
						/>
					)}
				</Card>

				<Card>
					<CardHeader
						title="รายการงาน"
						action={
							<Button
								variant="dashed"
								icon={<Plus size={18} />}
								onClick={addLine}
							>
								เพิ่มรายการ
							</Button>
						}
					/>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[820px] border-collapse">
							<thead>
								<tr>
									{['รายละเอียด', 'จำนวน', 'หน่วย', 'ค่าของ/หน่วย', 'ค่าแรง/หน่วย', 'จำนวนเงิน'].map(
										(h, i) => (
											<th
												key={h}
												scope="col"
												className={`bg-surface-2 font-display text-ink-muted px-2 py-2.5 text-[13px] font-medium whitespace-nowrap ${i > 2 ? 'text-right' : 'text-left'}`}
											>
												{h}
											</th>
										)
									)}
									<th className="bg-surface-2">
										<span className="sr-only">ลบ</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{lines.length === 0 && (
									<tr>
										<td
											colSpan={7}
											className="text-ink-muted px-3 py-8 text-center"
										>
											เลือกใบเสนอราคาเพื่อดึงรายการ หรือเพิ่มรายการเอง
										</td>
									</tr>
								)}
								{lines.map((l) =>
									l.itemType === 'HEADER' ? (
										<tr
											key={l.id}
											className="border-line bg-tint/60 border-t"
										>
											<td
												colSpan={7}
												className="text-primary-ink px-2 py-2 font-semibold"
											>
												{l.description}
											</td>
										</tr>
									) : (
										<tr
											key={l.id}
											className="border-line border-t"
										>
											<td className="min-w-56 px-2 py-2">
												<Input
													aria-label="รายละเอียดรายการ"
													value={l.description}
													onChange={(e) => setLine(l.id, { description: e.target.value })}
												/>
											</td>
											<td className="w-24 px-2 py-2">
												<input
													aria-label="จำนวน"
													type="number"
													className={numCls}
													value={l.quantity}
													onChange={(e) =>
														setLine(l.id, { quantity: Number(e.target.value) })
													}
												/>
											</td>
											<td className="w-28 px-2 py-2">
												<Input
													aria-label="หน่วย"
													value={l.unit}
													onChange={(e) => setLine(l.id, { unit: e.target.value })}
												/>
											</td>
											<td className="w-36 px-2 py-2">
												<input
													aria-label="ค่าของต่อหน่วย"
													type="number"
													className={numCls}
													value={l.materialPrice}
													onChange={(e) =>
														setLine(l.id, { materialPrice: Number(e.target.value) })
													}
												/>
											</td>
											<td className="w-36 px-2 py-2">
												<input
													aria-label="ค่าแรงต่อหน่วย"
													type="number"
													className={numCls}
													value={l.labourPrice}
													onChange={(e) =>
														setLine(l.id, { labourPrice: Number(e.target.value) })
													}
												/>
											</td>
											<td className="px-2 py-2 text-right font-semibold whitespace-nowrap tabular-nums">
												{formatMoney(amountOf(l))}
											</td>
											<td className="px-2">
												<IconButton
													aria-label="ลบรายการ"
													onClick={() => removeLine(l.id)}
												>
													<Trash2 size={18} />
												</IconButton>
											</td>
										</tr>
									)
								)}
							</tbody>
						</table>
					</div>
				</Card>

				{groups.map((g, gi) => (
					<Card key={g.id}>
						<CardHeader
							title={`ใบสั่งซื้อที่ ${gi + 1}`}
							action={
								groups.length > 1 && (
									<Button
										variant="ghost"
										icon={<Trash2 size={18} />}
										onClick={() => setGroups((p) => p.filter((x) => x.id !== g.id))}
									>
										ลบกลุ่มนี้
									</Button>
								)
							}
						/>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label="ประเภทต้นทุน">
								{(id) => (
									<Select
										id={id}
										value={g.costType}
										onChange={(e) =>
											setGroup(g.id, { costType: e.target.value as Group['costType'] })
										}
									>
										{COST_TYPES.map((c) => (
											<option
												key={c.value}
												value={c.value}
											>
												{c.label}
											</option>
										))}
									</Select>
								)}
							</Field>
							<Field
								label="หมวดใบสำคัญจ่าย"
								hint="ใช้จัดกลุ่มตอนออกใบสำคัญจ่าย"
							>
								{(id) => (
									<Input
										id={id}
										value={g.costCategory}
										onChange={(e) => setGroup(g.id, { costCategory: e.target.value })}
									/>
								)}
							</Field>
							<Field
								label="ทีมช่าง"
								className={g.costType === 'LABOUR' ? 'sm:col-span-2' : undefined}
							>
								{(id) => (
									<Select
										id={id}
										value={g.teamId}
										onChange={(e) => setGroup(g.id, { teamId: e.target.value })}
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
							{g.costType !== 'LABOUR' && (
								<Field
									label="ผู้รับเงิน / ร้านค้า"
									hint="กรณีไม่ใช่ทีมช่าง"
								>
									{(id) => (
										<Input
											id={id}
											value={g.payeeName}
											onChange={(e) => setGroup(g.id, { payeeName: e.target.value })}
										/>
									)}
								</Field>
							)}
							<Field label="วันเริ่มงาน">
								{(id) => (
									<DateInput
										id={id}
										value={g.startDate}
										onChange={(e) => setGroup(g.id, { startDate: e.target.value })}
									/>
								)}
							</Field>
							<Field label="กำหนดเสร็จ">
								{(id) => (
									<DateInput
										id={id}
										value={g.endDate}
										onChange={(e) => setGroup(g.id, { endDate: e.target.value })}
									/>
								)}
							</Field>
							<Field label="วันเริ่มประกัน">
								{(id) => (
									<DateInput
										id={id}
										value={g.warrantyStart}
										onChange={(e) => setWarranty(g, { warrantyStart: e.target.value })}
									/>
								)}
							</Field>
							<Field
								label="ระยะเวลาประกัน"
								hint="เลือกแล้วคำนวณวันสิ้นสุดให้"
							>
								{(id) => (
									<Select
										id={id}
										value={g.warrantyMonths}
										onChange={(e) => setWarranty(g, { warrantyMonths: e.target.value })}
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
							<Field label="วันสิ้นสุดประกัน">
								{(id) => (
									<DateInput
										id={id}
										value={g.warrantyEnd}
										onChange={(e) => setGroup(g.id, { warrantyEnd: e.target.value })}
									/>
								)}
							</Field>
						</div>
						<fieldset>
							<legend className="font-display mb-2 flex w-full items-center justify-between text-sm font-medium">
								<span>
									รายการงานที่มอบหมาย ({g.selected.size}/{items.length})
								</span>
								<span className="flex gap-2">
									<button
										type="button"
										className="text-primary-ink cursor-pointer underline"
										onClick={() => setGroup(g.id, { selected: new Set(items.map((l) => l.id)) })}
									>
										เลือกทั้งหมด
									</button>
									<button
										type="button"
										className="text-primary-ink cursor-pointer underline"
										onClick={() => setGroup(g.id, { selected: new Set() })}
									>
										ล้าง
									</button>
								</span>
							</legend>
							<ul className="border-line flex max-h-60 flex-col overflow-y-auto rounded-xl border">
								{items.map((l) => (
									<li
										key={l.id}
										className="border-line border-b last:border-0"
									>
										<label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-1.5">
											<input
												type="checkbox"
												className="accent-primary size-5"
												checked={g.selected.has(l.id)}
												onChange={() => toggle(g, l.id)}
											/>
											<span className="flex-1">{l.description || '(ไม่มีรายละเอียด)'}</span>
											<span className="text-ink-muted tabular-nums">
												{formatMoney(amountOf(l))}
											</span>
										</label>
									</li>
								))}
							</ul>
						</fieldset>
						<Field label="หมายเหตุ">
							{(id) => (
								<Textarea
									id={id}
									rows={2}
									value={g.notes}
									onChange={(e) => setGroup(g.id, { notes: e.target.value })}
								/>
							)}
						</Field>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label="VAT (%)">
								{(id) => (
									<Input
										id={id}
										type="number"
										min={0}
										value={g.vatPercent}
										onChange={(e) => setGroup(g.id, { vatPercent: e.target.value })}
									/>
								)}
							</Field>
							<Field
								label="หัก ณ ที่จ่าย (%)"
								hint="เช่น 3 — คิดจากยอดก่อน VAT แล้วหักออกจากยอดจ่าย"
							>
								{(id) => (
									<Input
										id={id}
										type="number"
										min={0}
										value={g.whtPercent}
										onChange={(e) => setGroup(g.id, { whtPercent: e.target.value })}
									/>
								)}
							</Field>
						</div>
						<div className="flex flex-col gap-1.5">
							<h3 className="font-display text-[16px] font-medium">
								กำหนดการจ่ายเป็นงวด (ไม่จำกัดจำนวนงวด)
							</h3>
							<InstallmentEditor
								rows={g.installments}
								onChange={(rows) => setGroup(g.id, { installments: rows })}
								total={groupTotal(g)}
							/>
						</div>
						<dl className="ml-auto grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-right">
							<dt className="text-ink-muted">ยอดรวมรายการ</dt>
							<dd className="tabular-nums">{formatMoney(groupCalc(g).subtotal)}</dd>
							<dt className="text-ink-muted">VAT {Number(g.vatPercent) || 0}%</dt>
							<dd className="tabular-nums">{formatMoney(groupCalc(g).vatAmount)}</dd>
							<dt className="text-ink-muted">หัก ณ ที่จ่าย {Number(g.whtPercent) || 0}%</dt>
							<dd className="tabular-nums">-{formatMoney(groupCalc(g).whtAmount)}</dd>
							<dt className="font-display text-lg font-semibold">ยอดสุทธิใบสั่งซื้อนี้</dt>
							<dd className="font-display text-primary-ink text-lg font-semibold tabular-nums">
								{formatMoney(groupTotal(g))}
							</dd>
						</dl>
					</Card>
				))}
				<div>
					<Button
						variant="dashed"
						icon={<Plus size={18} />}
						onClick={() =>
							setGroups((p) => [
								...p,
								{
									id: nid(),
									teamId: '',
									selected: new Set(),
									notes: '',
									startDate: '',
									endDate: '',
									warrantyStart: '',
									warrantyEnd: '',
									warrantyMonths: '',
									costType: 'LABOUR',
									costCategory: '',
									payeeName: '',
									vatPercent: '0',
									whtPercent: '0',
									installments: []
								}
							])
						}
					>
						เพิ่มทีมช่าง (ใบสั่งซื้อใบใหม่)
					</Button>
				</div>

				<Card>
					<CardHeader title="เอกสารแนบ: ใบเสนอราคาจากช่าง" />
					<FileDrop
						label={file ? `เลือกแล้ว: ${file.name}` : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก'}
						onFiles={(f) => setFile(f[0] ?? null)}
					/>
				</Card>

				<div className="flex justify-end gap-3">
					<Button
						variant="ghost"
						href="/apps/purchase-orders"
					>
						ยกเลิก
					</Button>
					<Button
						disabled={saving}
						onClick={save}
					>
						{saving ? 'กำลังบันทึก...' : `สร้าง ${groups.length} ใบสั่งซื้อ`}
					</Button>
				</div>
			</div>
		</>
	);
}

export default function NewPurchaseOrderPage() {
	return (
		<Suspense fallback={<p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>}>
			<NewPurchaseOrder />
		</Suspense>
	);
}
