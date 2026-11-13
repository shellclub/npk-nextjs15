import { describe, expect, it } from 'vitest';
import { addMonthsISO } from './add-months';

describe('addMonthsISO', () => {
	it('บวกเดือนปกติ', () => {
		expect(addMonthsISO('2026-09-24', 3)).toBe('2026-12-24');
		expect(addMonthsISO('2026-09-24', 6)).toBe('2027-03-24');
		expect(addMonthsISO('2026-09-24', 12)).toBe('2027-09-24');
	});

	it('ตัดวันที่ให้พอดีสิ้นเดือน', () => {
		expect(addMonthsISO('2026-08-31', 6)).toBe('2027-02-28');
		expect(addMonthsISO('2027-11-30', 3)).toBe('2028-02-29');
	});

	it('ข้อมูลไม่ครบ → สตริงว่าง', () => {
		expect(addMonthsISO('', 3)).toBe('');
		expect(addMonthsISO('2026-09-24', 0)).toBe('');
	});
});
