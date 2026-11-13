const DIGITS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/** อ่านเลขไม่เกิน 6 หลัก; tail = มีหลักล้านนำหน้า (ทำให้ 1 ท้ายสุดอ่าน "เอ็ด") */
function read6(input: string, tail: boolean): string {
	const s = input.replace(/^0+/, '');
	let out = '';
	for (let i = 0; i < s.length; i++) {
		const d = Number(s[i]);
		const pos = s.length - i - 1;

		if (d === 0) continue;

		if (pos === 0 && d === 1 && (s.length > 1 || tail)) out += 'เอ็ด';
		else if (pos === 1 && d === 2) out += 'ยี่';
		else if (pos === 1 && d === 1) out += '';
		else out += DIGITS[d];

		out += UNITS[pos];
	}
	return out;
}

function read(s: string, tail: boolean): string {
	if (s.length > 6) return `${read(s.slice(0, -6), tail)}ล้าน${read6(s.slice(-6), true)}`;

	return read6(s, tail);
}

/** แปลงจำนวนเงินเป็นข้อความบาทไทย เช่น 1234.5 → "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์" */
export function bahtText(amount: number): string {
	const cents = Math.round(Math.abs(amount) * 100);
	const baht = Math.floor(cents / 100);
	const satang = cents % 100;
	const b = baht > 0 ? read(String(baht), false) : 'ศูนย์';
	return `${amount < 0 ? 'ลบ' : ''}${b}บาท${satang > 0 ? `${read6(String(satang), false)}สตางค์` : 'ถ้วน'}`;
}
