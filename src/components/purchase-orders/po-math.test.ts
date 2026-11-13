import { describe, expect, it } from 'vitest';
import { computePOTotals, installmentAmount, quotationMargins, summarizePO, validateInstallments } from './po-math';

describe('computePOTotals', () => {
	it('ตรงกับตัวอย่าง PO ของลูกค้า: 120,000 + VAT7% − หัก3% = 124,800', () => {
		const t = computePOTotals(120000, 0, 7, 3);
		expect(t.vatAmount).toBe(8400);
		expect(t.whtAmount).toBe(3600);
		expect(t.totalAmount).toBe(124800);
	});

	it('มีส่วนลด: WHT/VAT คิดจากยอดหลังส่วนลด', () => {
		const t = computePOTotals(100000, 10, 7, 3);
		expect(t.afterDiscount).toBe(90000);
		expect(t.vatAmount).toBe(6300);
		expect(t.whtAmount).toBe(2700);
		expect(t.totalAmount).toBe(93600);
	});

	it('ไม่มี VAT/WHT → ยอดเท่าเดิม', () => {
		expect(computePOTotals(48500).totalAmount).toBe(48500);
	});
});

describe('installments', () => {
	it('คิดจาก % ของยอดสุทธิ', () => {
		expect(installmentAmount(124800, { percent: 30 })).toBe(37440);
	});

	it('% ว่าง/0 → ใช้ยอดที่กรอก', () => {
		expect(installmentAmount(1000, { percent: '', amount: 250 })).toBe(250);
		expect(installmentAmount(1000, { percent: 0, amount: 250 })).toBe(250);
	});

	it('ผลรวมเกินยอด PO → ไม่ผ่าน, ไม่เกิน → ผ่านและเหลือค้างถูกต้อง', () => {
		expect(validateInstallments(1000, [{ percent: 60 }, { percent: 50 }]).ok).toBe(false);

		const v = validateInstallments(1000, [{ percent: 30 }, { amount: 200 }]);
		expect(v.ok).toBe(true);
		expect(v.remaining).toBe(500);
	});
});

describe('summarizePO', () => {
	it('แยกค่าของ/ค่าแรงและงานเพิ่ม-ลด', () => {
		const s = summarizePO([
			{ totalMaterial: 100, totalLabour: 50, amount: 150 },
			{ isAdjustment: true, quantity: 1, amount: 20 },
			{ isAdjustment: true, quantity: -1, amount: -10 }
		]);
		expect(s.net).toBe(160);
	});
});

describe('quotationMargins', () => {
	const item = (amount: number) => ({
		totalMaterial: 0,
		totalLabour: amount,
		amount
	});

	it('รวมต้นทุนทุก PO ของใบเสนอราคาเดียวกัน และไม่นับที่ยกเลิก', () => {
		const q = { subtotal: 100000 };
		const m = quotationMargins([
			{
				quotationId: 'q1',
				status: 'APPROVED',
				quotation: q,
				items: [item(30000)]
			},
			{
				quotationId: 'q1',
				status: 'DRAFT',
				quotation: q,
				items: [item(20000)]
			},
			{
				quotationId: 'q1',
				status: 'CANCELLED',
				quotation: q,
				items: [item(99999)]
			},
			{
				quotationId: 'q2',
				status: 'DRAFT',
				quotation: { subtotal: 1000 },
				items: [item(1500)]
			}
		]);
		expect(m.get('q1')).toBe(50000);
		expect(m.get('q2')).toBe(-500);
	});
});
