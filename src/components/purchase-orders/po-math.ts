export type POItemLite = {
	itemType?: string;
	isAdjustment?: boolean;
	quantity?: unknown;
	totalMaterial?: unknown;
	totalLabour?: unknown;
	amount?: unknown;
};

/** สรุปค่าของ/ค่าแรง/ยอดงานเพิ่ม/ยอดงานลด จากรายการจริงของ PO */
export function summarizePO(items: POItemLite[] = []) {
	const normal = items.filter((i) => !i.isAdjustment);
	const adj = items.filter((i) => i.isAdjustment);
	const material = normal.reduce((s, i) => s + Number(i.totalMaterial || 0), 0);
	const labour = normal.reduce((s, i) => s + Number(i.totalLabour || 0), 0);
	const add = adj.filter((i) => Number(i.quantity) >= 0).reduce((s, i) => s + Number(i.amount || 0), 0);
	const deduct = adj.filter((i) => Number(i.quantity) < 0).reduce((s, i) => s + Math.abs(Number(i.amount || 0)), 0);

	return {
		material,
		labour,
		add,
		deduct,
		net: material + labour + add - deduct
	};
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * คำนวณยอด PO: ยอดรวม → ส่วนลด → VAT → หัก ณ ที่จ่าย
 * ยอดสุทธิ = หลังส่วนลด + VAT − หัก ณ ที่จ่าย  (WHT คิดจากยอดหลังส่วนลด ก่อน VAT)
 */
export function computePOTotals(subtotal: number, discountPercent = 0, vatPercent = 0, whtPercent = 0) {
	const sub = r2(subtotal);
	const discountAmount = r2((sub * discountPercent) / 100);
	const afterDiscount = r2(sub - discountAmount);
	const vatAmount = r2((afterDiscount * vatPercent) / 100);
	const whtAmount = r2((afterDiscount * whtPercent) / 100);

	return {
		subtotal: sub,
		discountAmount,
		afterDiscount,
		vatAmount,
		whtAmount,
		totalAmount: r2(afterDiscount + vatAmount - whtAmount)
	};
}

export type InstallmentInput = {
	percent?: number | string | null;
	amount?: number | string | null;
};

/** ยอดงวด: ถ้ากรอก % ให้คิดจากยอดสุทธิ PO, ไม่เช่นนั้นใช้ยอดที่กรอก */
export function installmentAmount(total: number, i: InstallmentInput): number {
	const pct = Number(i.percent);

	if (i.percent !== null && i.percent !== undefined && i.percent !== '' && pct > 0) return r2((total * pct) / 100);

	return r2(Number(i.amount) || 0);
}

/** ตรวจงวดจ่าย: ผลรวมต้องไม่เกินยอดสุทธิ PO (คลาดเคลื่อนไม่เกิน 1 สตางค์) */
export function validateInstallments(total: number, list: InstallmentInput[]) {
	const amounts = list.map((i) => installmentAmount(total, i));
	const sum = r2(amounts.reduce((s, a) => s + a, 0));

	return {
		amounts,
		sum,
		remaining: r2(total - sum),
		ok: sum <= total + 0.01 && amounts.every((a) => a >= 0)
	};
}

export const COST_TYPE_LABEL: Record<string, string> = {
	LABOUR: 'ค่าแรง (จ้างช่าง)',
	MATERIAL: 'ค่าของ (บริษัทสั่งซื้อเอง)',
	OTHER: 'ค่าใช้จ่ายอื่นๆ'
};

/**
 * ส่วนต่างจากใบเสนอราคา = ยอดเสนอราคา (ก่อน VAT) − ต้นทุน PO ที่ไม่ยกเลิกของใบเสนอราคาเดียวกันทั้งหมด
 * คืน Map<quotationId, ส่วนต่าง> (บวก = ยังมีส่วนเหลือ/กำไร, ลบ = ต้นทุนเกินยอดเสนอ)
 */
export function quotationMargins(
	pos: {
		quotationId?: string | null;
		status: string;
		items?: POItemLite[];
		quotation?: { subtotal?: unknown } | null;
	}[]
) {
	const cost = new Map<string, number>();
	const quote = new Map<string, number>();

	for (const p of pos) {
		if (!p.quotationId || p.status === 'CANCELLED') continue;

		quote.set(p.quotationId, Number(p.quotation?.subtotal) || 0);
		cost.set(p.quotationId, (cost.get(p.quotationId) ?? 0) + summarizePO(p.items).net);
	}

	return new Map([...quote].map(([id, q]) => [id, r2(q - (cost.get(id) ?? 0))]));
}
