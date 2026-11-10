import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

/** เข้ารหัสรหัสผ่านด้วย scrypt รูปแบบ `scrypt$salt$hash` (ไม่ต้องพึ่ง dependency เพิ่ม) */
export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');

	return `${PREFIX}$${salt}$${hash}`;
}

/** ตรวจรหัสผ่านกับค่าที่เก็บในฐานข้อมูล คืน false ถ้ารูปแบบไม่ถูกต้อง (เช่น placeholder เดิม) */
export function verifyPassword(password: string, stored: string): boolean {
	const [prefix, salt, hash] = stored.split('$');

	if (prefix !== PREFIX || !salt || !hash) return false;

	const expected = Buffer.from(hash, 'hex');
	const actual = scryptSync(password, salt, expected.length);

	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
