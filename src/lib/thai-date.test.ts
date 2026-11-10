import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysIn, formatThaiDate, parse, toIso } from './thai-date';

describe('thai-date', () => {
	it('แปลง ISO ค.ศ. เป็นข้อความ พ.ศ.', () => {
		expect(formatThaiDate('2026-11-09')).toBe('9 พ.ย. 2569');
		expect(formatThaiDate('2026-01-01')).toBe('1 ม.ค. 2569');
		expect(formatThaiDate('')).toBe('');
		expect(formatThaiDate('abc')).toBe('');
	});

	it('toIso/parse ไปกลับ และเก็บเป็น yyyy-mm-dd (ค.ศ.)', () => {
		expect(toIso({ y: 2026, m: 10, d: 9 })).toBe('2026-11-09');
		expect(parse('2026-11-09')).toEqual({ y: 2026, m: 10, d: 9 });
		expect(parse('2026-11-09T00:00:00.000Z')).toEqual({ y: 2026, m: 10, d: 9 });
	});

	it('จำนวนวันในเดือน รวมปีอธิกสุรทิน', () => {
		expect(daysIn(2024, 1)).toBe(29);
		expect(daysIn(2026, 1)).toBe(28);
		expect(daysIn(2026, 10)).toBe(30);
	});

	it('addDays ข้ามเดือน/ปี', () => {
		expect(toIso(addDays({ y: 2026, m: 11, d: 31 }, 1))).toBe('2027-01-01');
		expect(toIso(addDays({ y: 2026, m: 2, d: 1 }, -1))).toBe('2026-02-28');
	});

	it('addMonths ตัดวันที่ให้พอดีเดือนปลายทาง และข้ามปี', () => {
		expect(toIso(addMonths({ y: 2026, m: 0, d: 31 }, 1))).toBe('2026-02-28');
		expect(toIso(addMonths({ y: 2026, m: 11, d: 15 }, 1))).toBe('2027-01-15');
		expect(toIso(addMonths({ y: 2026, m: 0, d: 15 }, -1))).toBe('2025-12-15');
	});
});
