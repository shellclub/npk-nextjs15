const TZ = 'Asia/Bangkok';
type DateInput = Date | string | number | null | undefined;

function toDate(v: DateInput): Date | null {
	if (v === null || v === undefined || v === '') return null;

	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? null : d;
}

const shortFmt = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
	day: 'numeric',
	month: 'short',
	year: '2-digit',
	timeZone: TZ
});
const longFmt = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: TZ
});

/** 9 พ.ย. 69 — ใช้ในตาราง */
export function formatDateShort(v: DateInput): string {
	const d = toDate(v);
	return d ? shortFmt.format(d) : '-';
}

/** วันจันทร์ที่ 9 พฤศจิกายน 2569 — ใช้ในหัวข้อหน้า */
export function formatDateLong(v: DateInput): string {
	const d = toDate(v);

	if (!d) return '-';

	return longFmt.format(d).replace(/^(\S+)\s/, '$1ที่ ');
}

const money2 = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** ฿1,234.00 (เอกสาร) หรือ ฿1,234 เมื่อ decimals = 0 (KPI) */
export function formatMoney(v: number | string | null | undefined, decimals: 0 | 2 = 2): string {
	const n = Number(v ?? 0);
	return `฿${(decimals === 0 ? money0 : money2).format(Number.isFinite(n) ? n : 0)}`;
}

/** 2.86 ล้าน สำหรับ KPI ขนาดใหญ่ */
export function formatMoneyCompact(v: number): string {
	return Math.abs(v) >= 1_000_000 ? `฿${(v / 1_000_000).toFixed(2)} ล้าน` : formatMoney(v, 0);
}

/** YYYY-MM (เขตเวลาไทย) ใช้เป็นค่าของตัวกรองเดือน */
export function monthKey(v: DateInput): string {
	const d = toDate(v);

	if (!d) return '';

	const p = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TZ }).format(d);

	return p.slice(0, 7);
}

const monthFmt = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** 2026-11 → พฤศจิกายน 2569 */
export function formatMonthLabel(key: string): string {
	const [y, m] = key.split('-').map(Number);

	return monthFmt.format(new Date(Date.UTC(y, m - 1, 15)));
}
