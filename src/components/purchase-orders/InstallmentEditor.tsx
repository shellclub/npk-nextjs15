'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button, DateInput, IconButton } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { installmentAmount, validateInstallments } from './po-math';

export type InstallmentRow = {
	key: number;
	id?: string;
	percent: string;
	amount: string;
	dueDate: string;
	retentionAmount: string;
	notes: string;
};

let seed = 1;
export const newInstallmentRow = (patch: Partial<InstallmentRow> = {}): InstallmentRow => ({
	key: seed++,
	percent: '',
	amount: '',
	dueDate: '',
	retentionAmount: '',
	notes: '',
	...patch
});

/** แปลงแถวในฟอร์ม → payload API (ยอดงวดคำนวณฝั่งเซิร์ฟเวอร์ซ้ำอีกครั้ง) */
export const toInstallmentPayload = (rows: InstallmentRow[]) =>
	rows.map((r) => ({
		id: r.id,
		percent: r.percent ? Number(r.percent) : null,
		amount: r.amount ? Number(r.amount) : 0,
		dueDate: r.dueDate || null,
		retentionAmount: r.retentionAmount ? Number(r.retentionAmount) : 0,
		notes: r.notes || null
	}));

const cell =
	'h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-right text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-surface-2';

/** ตารางกำหนดงวดจ่าย — เพิ่มได้ไม่จำกัด กรอกเป็น % หรือยอดเงินก็ได้ */
export function InstallmentEditor({
	rows,
	onChange,
	total,
	lockedIds = []
}: {
	rows: InstallmentRow[];
	onChange: (rows: InstallmentRow[]) => void;
	/** ยอดสุทธิของ PO ที่ใช้คิด % */
	total: number;
	/** งวดที่มีใบสำคัญจ่ายแล้ว (ลบไม่ได้) */
	lockedIds?: string[];
}) {
	const set = (key: number, patch: Partial<InstallmentRow>) =>
		onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
	const v = validateInstallments(total, toInstallmentPayload(rows));

	return (
		<div className="flex flex-col gap-3">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px] border-collapse">
					<thead>
						<tr>
							{['งวดที่', '%', 'วันครบกำหนด', 'ยอดเงิน', 'ยอดหัก/ประกัน', 'หมายเหตุ'].map((h, i) => (
								<th
									key={h}
									scope="col"
									className={`bg-surface-2 font-display text-ink-muted px-2 py-2.5 text-[13px] font-medium whitespace-nowrap ${i === 1 || i === 3 || i === 4 ? 'text-right' : 'text-left'}`}
								>
									{h}
								</th>
							))}
							<th className="bg-surface-2">
								<span className="sr-only">ลบ</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 && (
							<tr>
								<td
									colSpan={7}
									className="text-ink-muted px-3 py-6 text-center"
								>
									ยังไม่มีงวดจ่าย — กด "เพิ่มงวด" (ไม่จำกัดจำนวน)
								</td>
							</tr>
						)}
						{rows.map((r, i) => {
							const locked = !!r.id && lockedIds.includes(r.id);
							const amt = installmentAmount(total, {
								percent: r.percent,
								amount: r.amount
							});

							return (
								<tr
									key={r.key}
									className="border-line border-t"
								>
									<td className="px-2 py-2 whitespace-nowrap">งวด {i + 1}</td>
									<td className="w-24 px-2 py-2">
										<input
											aria-label={`เปอร์เซ็นต์งวดที่ ${i + 1}`}
											type="number"
											min={0}
											max={100}
											className={cell}
											value={r.percent}
											disabled={locked}
											onChange={(e) => set(r.key, { percent: e.target.value, amount: '' })}
										/>
									</td>
									<td className="w-48 px-2 py-2">
										<DateInput
											aria-label={`วันครบกำหนดงวดที่ ${i + 1}`}
											value={r.dueDate}
											onChange={(e) => set(r.key, { dueDate: e.target.value })}
										/>
									</td>
									<td className="w-40 px-2 py-2">
										<input
											aria-label={`ยอดเงินงวดที่ ${i + 1}`}
											type="number"
											min={0}
											className={cell}
											value={r.percent ? amt : r.amount}
											disabled={locked || !!r.percent}
											onChange={(e) => set(r.key, { amount: e.target.value })}
										/>
									</td>
									<td className="w-36 px-2 py-2">
										<input
											aria-label={`ยอดหักงวดที่ ${i + 1}`}
											type="number"
											min={0}
											className={cell}
											value={r.retentionAmount}
											onChange={(e) => set(r.key, { retentionAmount: e.target.value })}
										/>
									</td>
									<td className="min-w-40 px-2 py-2">
										<input
											aria-label={`หมายเหตุงวดที่ ${i + 1}`}
											className={`${cell} text-left`}
											value={r.notes}
											onChange={(e) => set(r.key, { notes: e.target.value })}
										/>
									</td>
									<td className="px-2">
										<IconButton
											aria-label={`ลบงวดที่ ${i + 1}`}
											disabled={locked}
											onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
										>
											<Trash2 size={18} />
										</IconButton>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					variant="dashed"
					icon={<Plus size={18} />}
					onClick={() => onChange([...rows, newInstallmentRow()])}
				>
					เพิ่มงวด
				</Button>
				<p
					className={v.ok ? 'text-ink-muted' : 'text-danger font-semibold'}
					role={v.ok ? undefined : 'alert'}
				>
					รวมทุกงวด {formatMoney(v.sum)} • คงเหลือ {formatMoney(v.remaining)}
					{!v.ok && ' (เกินยอดใบสั่งซื้อ)'}
				</p>
			</div>
		</div>
	);
}
