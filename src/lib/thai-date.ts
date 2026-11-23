/** ตรรกะวันที่สำหรับปฏิทินไทย (พ.ศ.) — ภายในใช้ ค.ศ. และ ISO 'YYYY-MM-DD' เหมือนที่เก็บในฐานข้อมูล */

export const MONTHS = [
	'มกราคม',
	'กุมภาพันธ์',
	'มีนาคม',
	'เมษายน',
	'พฤษภาคม',
	'มิถุนายน',
	'กรกฎาคม',
	'สิงหาคม',
	'กันยายน',
	'ตุลาคม',
	'พฤศจิกายน',
	'ธันวาคม'
];
export const MONTHS_SHORT = [
	'ม.ค.',
	'ก.พ.',
	'มี.ค.',
	'เม.ย.',
	'พ.ค.',
	'มิ.ย.',
	'ก.ค.',
	'ส.ค.',
	'ก.ย.',
	'ต.ค.',
	'พ.ย.',
	'ธ.ค.'
];
export const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
export const BE = 543;

export type YMD = { y: number; m: number; d: number }; // y = ค.ศ., m = 0-11

const pad = (n: number) => String(n).padStart(2, '0');
export const toIso = ({ y, m, d }: YMD) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function parse(iso?: string | null): YMD | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');

	return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

export const today = (): YMD => {
	const n = new Date();

	return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
};
export const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
export const cmp = (a: YMD, b: YMD) => a.y - b.y || a.m - b.m || a.d - b.d;

/** เลื่อนวัน (รองรับข้ามเดือน/ปี) */
export function addDays(v: YMD, n: number): YMD {
	const dt = new Date(v.y, v.m, v.d + n);

	return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

export function addMonths(v: YMD, n: number): YMD {
	const t = v.y * 12 + v.m + n;
	const y = Math.floor(t / 12);
	const m = t - y * 12;

	return { y, m, d: Math.min(v.d, daysIn(y, m)) };
}

/** ข้อความแสดงบนปุ่ม: 9 พ.ย. 2569 (พ.ศ.) */
export function formatThaiDate(iso?: string | null) {
	const v = parse(iso);

	return v ? `${v.d} ${MONTHS_SHORT[v.m]} ${v.y + BE}` : '';
}
