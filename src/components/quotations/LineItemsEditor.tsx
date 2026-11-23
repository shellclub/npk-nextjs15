'use client';

import clsx from 'clsx';
import { FolderPlus, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button, ComboInput, Dialog, Field, IconButton, Input, Select } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { ItemSuggestInput, type ItemSuggestion } from './ItemSuggestInput';
import {
	OVERHEAD_DESCRIPTION,
	OVERHEAD_PERCENT,
	appendOverheadItem,
	computeLineAmount,
	findParentHeaderIndex,
	isOverheadItem
} from '@/lib/quotation-line-items';

export type Line = {
	tempId: number;
	itemType: 'HEADER' | 'ITEM';
	description: string;
	unit: string;
	quantity: number;
	materialPrice: number;
	labourPrice: number;
	isAdjustment?: boolean;
};

export const UNITS = [
	'งาน',
	'ชุด',
	'ตัว',
	'เครื่อง',
	'ชิ้น',
	'เมตร',
	'ตร.ม.',
	'จุด',
	'ล็อต',
	'ชม.',
	'วัน',
	'เดือน',
	'ปี',
	'แพ็ค'
];
const blankHeader = (id: number): Line => ({
	tempId: id,
	itemType: 'HEADER',
	description: '',
	unit: '',
	quantity: 0,
	materialPrice: 0,
	labourPrice: 0
});
const blankItem = (id: number): Line => ({
	tempId: id,
	itemType: 'ITEM',
	description: '',
	unit: 'งาน',
	quantity: 1,
	materialPrice: 0,
	labourPrice: 0
});

export const initialLines = (): Line[] => [blankHeader(1), blankItem(2)];

const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
	const t = e.target;
	setTimeout(() => t.select(), 0);
};

/** เลขลำดับ 1, 1.1, 1.2, 2 ... คำนวณจากลำดับแถวจริง */
function numbering(rows: { itemType?: string }[]) {
	let h = 0;
	const sub: Record<number, number> = {};

	return rows.map((r, idx) => {
		if (isOverheadItem(r)) return `${h + 1}`;

		if (r.itemType === 'HEADER') {
			h++;
			sub[idx] = 0;

			return `${h}`;
		}

		const p = findParentHeaderIndex(rows, idx);

		if (p >= 0 && sub[p] !== undefined) {
			sub[p]++;

			return `${rows.slice(0, p + 1).filter((x) => x.itemType === 'HEADER').length}.${sub[p]}`;
		}

		return `${h}`;
	});
}

export function LineItemsEditor({
	items,
	onChange,
	includeOverhead,
	onOverheadChange,
	readOnly,
	error
}: {
	items: Line[];
	onChange: (items: Line[]) => void;
	includeOverhead: boolean;
	onOverheadChange: (v: boolean) => void;
	readOnly?: boolean;
	error?: string;
}) {
	const nextId = useRef(Math.max(100, ...items.map((i) => i.tempId)) + 1);
	const [adj, setAdj] = useState<{
		negative: boolean;
		desc: string;
		qty: string;
		unit: string;
		mat: string;
		lab: string;
	} | null>(null);
	const effective = useMemo(() => appendOverheadItem(items, includeOverhead), [items, includeOverhead]);
	const nums = useMemo(() => numbering(effective), [effective]);
	const newId = () => nextId.current++;

	function update(tempId: number, patch: Partial<Line>) {
		onChange(
			items.map((it) => {
				if (it.tempId !== tempId) return it;

				const u = { ...it, ...patch };

				// หัวข้อที่ใส่ราคาเอง แต่จำนวนเป็น 0 → ตั้งจำนวนเป็น 1
				if (
					it.itemType === 'HEADER' &&
					('materialPrice' in patch || 'labourPrice' in patch) &&
					(Number(patch.materialPrice) > 0 || Number(patch.labourPrice) > 0) &&
					!Number(u.quantity)
				)
					u.quantity = 1;

				return u;
			})
		);
	}

	function pickSuggestion(it: Line, sg: ItemSuggestion) {
		// ใส่ราคาครั้งหลังสุดให้ แต่ผู้ใช้แก้ราคาใหม่ได้ตามปกติ
		update(it.tempId, {
			description: sg.description,
			unit: sg.unit || it.unit,
			materialPrice: sg.materialPrice,
			labourPrice: sg.labourPrice
		});
	}

	function addSub(headerIdx: number) {
		let at = headerIdx + 1;

		for (let i = headerIdx + 1; i < items.length; i++) {
			if (items[i].itemType === 'HEADER') break;

			at = i + 1;
		}

		const next = [...items];
		next.splice(at, 0, blankItem(newId()));
		onChange(next);
	}

	function remove(it: Line) {
		if (it.itemType !== 'HEADER') return onChange(items.filter((i) => i.tempId !== it.tempId));

		const idx = items.indexOf(it);
		let end = idx + 1;

		while (end < items.length && items[end].itemType !== 'HEADER') end++;

		onChange([...items.slice(0, idx), ...items.slice(end)]);
	}

	function addAdjustment() {
		if (!adj || !adj.desc.trim()) return;

		const q = Math.abs(parseFloat(adj.qty) || 1);
		onChange([
			...items,
			{
				tempId: newId(),
				itemType: 'ITEM',
				description: adj.desc,
				unit: adj.unit,
				quantity: adj.negative ? -q : q,
				materialPrice: parseFloat(adj.mat) || 0,
				labourPrice: parseFloat(adj.lab) || 0,
				isAdjustment: true
			}
		]);
		setAdj(null);
	}

	const num =
		'h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-right text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-surface-2';

	return (
		<div className="flex flex-col gap-3">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[880px] border-collapse">
					<thead>
						<tr>
							{[
								'ลำดับ',
								'รายละเอียด',
								'จำนวน',
								'หน่วย',
								'ค่าวัสดุ/หน่วย',
								'ค่าแรง/หน่วย',
								'จำนวนเงิน'
							].map((h, i) => (
								<th
									key={h}
									scope="col"
									className={clsx(
										'bg-surface-2 font-display text-ink-muted px-2 py-2.5 text-[13px] font-medium whitespace-nowrap',
										i >= 4 ? 'text-right' : 'text-left'
									)}
								>
									{h}
								</th>
							))}
							<th
								scope="col"
								className="bg-surface-2 px-2"
							>
								<span className="sr-only">การดำเนินการ</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{effective.map((raw, idx) => {
							const overhead = isOverheadItem(raw);
							const it = raw as Line;
							const header = it.itemType === 'HEADER' && !overhead;

							return (
								<tr
									key={overhead ? 'overhead' : it.tempId}
									className={clsx(
										'border-line border-t',
										header && 'bg-tint/60',
										it.isAdjustment && 'bg-warn-soft/60',
										overhead && 'bg-surface-2'
									)}
								>
									<td
										className={clsx(
											'px-2 py-2 align-middle whitespace-nowrap',
											header ? 'text-primary-ink font-semibold' : 'text-ink-muted'
										)}
									>
										{nums[idx]}
									</td>
									<td className="min-w-64 px-2 py-2">
										{overhead ? (
											<span className="font-semibold">
												{OVERHEAD_DESCRIPTION} (+{OVERHEAD_PERCENT}%)
											</span>
										) : (
											<div className="flex items-center gap-2">
												{header ? (
													<Input
														aria-label={`หัวข้อ ${nums[idx]}`}
														value={it.description}
														disabled={readOnly}
														placeholder="หัวข้อหลัก"
														className="font-semibold"
														onChange={(e) =>
															update(it.tempId, { description: e.target.value })
														}
													/>
												) : (
													<ItemSuggestInput
														ariaLabel={`รายละเอียดรายการ ${nums[idx]}`}
														value={it.description}
														disabled={readOnly}
														placeholder="รายละเอียดสินค้า/บริการ (พิมพ์เพื่อค้นหาที่เคยใช้)"
														onChange={(text) => update(it.tempId, { description: text })}
														onPick={(sg) => pickSuggestion(it, sg)}
													/>
												)}
												{it.isAdjustment && (
													<span className="bg-warn-soft text-warn rounded-sm px-1.5 py-0.5 text-xs whitespace-nowrap">
														ปรับแก้
													</span>
												)}
											</div>
										)}
									</td>
									<td className="w-24 px-2 py-2">
										{overhead ? (
											<span className="block text-right">1</span>
										) : (
											<input
												aria-label={`จำนวน ${nums[idx]}`}
												type="number"
												step="any"
												className={num}
												disabled={readOnly}
												value={it.quantity}
												onFocus={selectOnFocus}
												onChange={(e) =>
													update(it.tempId, { quantity: Number(e.target.value) })
												}
											/>
										)}
									</td>
									<td className="w-32 px-2 py-2">
										{overhead ? (
											raw.unit
										) : (
											<>
												<ComboInput
													ariaLabel={`หน่วย ${nums[idx]}`}
													options={UNITS}
													value={it.unit}
													disabled={readOnly}
													onChange={(text) => update(it.tempId, { unit: text })}
												/>
											</>
										)}
									</td>
									<td className="w-36 px-2 py-2">
										{overhead ? (
											<span className="block text-right">
												{formatMoney(raw.materialPrice as number)}
											</span>
										) : (
											<input
												aria-label={`ค่าวัสดุต่อหน่วย ${nums[idx]}`}
												type="number"
												step="any"
												className={num}
												disabled={readOnly}
												value={it.materialPrice}
												onFocus={selectOnFocus}
												onChange={(e) =>
													update(it.tempId, { materialPrice: Number(e.target.value) })
												}
											/>
										)}
									</td>
									<td className="w-36 px-2 py-2">
										{overhead ? (
											<span className="block text-right">-</span>
										) : (
											<input
												aria-label={`ค่าแรงต่อหน่วย ${nums[idx]}`}
												type="number"
												step="any"
												className={num}
												disabled={readOnly}
												value={it.labourPrice}
												onFocus={selectOnFocus}
												onChange={(e) =>
													update(it.tempId, { labourPrice: Number(e.target.value) })
												}
											/>
										)}
									</td>
									<td className="px-2 py-2 text-right font-semibold whitespace-nowrap tabular-nums">
										{formatMoney(computeLineAmount(raw))}
									</td>
									<td className="px-2 py-2 whitespace-nowrap">
										{!readOnly && !overhead && (
											<div className="flex justify-end">
												{header && (
													<IconButton
														aria-label={`เพิ่มรายการย่อยใต้หัวข้อ ${nums[idx]}`}
														onClick={() => addSub(idx)}
													>
														<Plus size={18} />
													</IconButton>
												)}
												<IconButton
													aria-label={`ลบ ${header ? 'หัวข้อ' : 'รายการ'} ${nums[idx]}`}
													className="hover:text-danger"
													onClick={() => remove(it)}
												>
													<Trash2 size={18} />
												</IconButton>
											</div>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{error && (
				<p
					role="alert"
					className="text-danger text-[13px]"
				>
					{error}
				</p>
			)}
			{!readOnly && (
				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant="dashed"
						icon={<FolderPlus size={18} />}
						onClick={() => onChange([...items, blankHeader(newId())])}
					>
						เพิ่มหัวข้อหลัก
					</Button>
					<Button
						variant="dashed"
						icon={<PencilLine size={18} />}
						onClick={() => setAdj({ negative: false, desc: '', qty: '1', unit: 'งาน', mat: '', lab: '' })}
					>
						ปรับแก้รายการ
					</Button>
					<label className="flex items-center gap-2 text-[15px]">
						<span className="font-display text-sm font-medium">Overhead and Profit</span>
						<Select
							value={includeOverhead ? 'yes' : 'no'}
							onChange={(e) => onOverheadChange(e.target.value === 'yes')}
							className="w-auto"
						>
							<option value="no">ไม่มี</option>
							<option value="yes">มี (+{OVERHEAD_PERCENT}% จากยอดก่อน VAT)</option>
						</Select>
					</label>
				</div>
			)}

			<Dialog
				open={!!adj}
				onClose={() => setAdj(null)}
				title="ปรับแก้รายการ"
				footer={
					<>
						<Button
							variant="ghost"
							onClick={() => setAdj(null)}
						>
							ยกเลิก
						</Button>
						<Button
							disabled={!adj?.desc.trim()}
							onClick={addAdjustment}
						>
							เพิ่มรายการปรับแก้
						</Button>
					</>
				}
			>
				{adj && (
					<div className="grid grid-cols-2 gap-4">
						<div
							className="col-span-2 flex gap-2"
							role="group"
							aria-label="ประเภทการปรับแก้"
						>
							{[false, true].map((neg) => (
								<Button
									key={String(neg)}
									variant={adj.negative === neg ? 'primary' : 'outline'}
									aria-pressed={adj.negative === neg}
									onClick={() => setAdj({ ...adj, negative: neg })}
								>
									{neg ? 'ลดงาน (−)' : 'เพิ่มงาน (+)'}
								</Button>
							))}
						</div>
						<Field
							label="รายละเอียด"
							required
							className="col-span-2"
						>
							{(id) => (
								<Input
									id={id}
									value={adj.desc}
									onChange={(e) => setAdj({ ...adj, desc: e.target.value })}
								/>
							)}
						</Field>
						<Field label="จำนวน">
							{(id) => (
								<Input
									id={id}
									type="number"
									min="0"
									value={adj.qty}
									onChange={(e) => setAdj({ ...adj, qty: e.target.value })}
								/>
							)}
						</Field>
						<Field label="หน่วย">
							{(id) => (
								<ComboInput
									id={id}
									options={UNITS}
									value={adj.unit}
									onChange={(text) => setAdj({ ...adj, unit: text })}
								/>
							)}
						</Field>
						<Field label="ค่าวัสดุ/หน่วย">
							{(id) => (
								<Input
									id={id}
									type="number"
									min="0"
									value={adj.mat}
									onChange={(e) => setAdj({ ...adj, mat: e.target.value })}
								/>
							)}
						</Field>
						<Field label="ค่าแรง/หน่วย">
							{(id) => (
								<Input
									id={id}
									type="number"
									min="0"
									value={adj.lab}
									onChange={(e) => setAdj({ ...adj, lab: e.target.value })}
								/>
							)}
						</Field>
					</div>
				)}
			</Dialog>
		</div>
	);
}
