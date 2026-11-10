import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
	it('ตรวจรหัสผ่านที่ถูกต้อง', () => {
		expect(verifyPassword('secret-123', hashPassword('secret-123'))).toBe(true);
	});

	it('ปฏิเสธรหัสผ่านที่ผิด', () => {
		expect(verifyPassword('wrong', hashPassword('secret-123'))).toBe(false);
	});

	it('ปฏิเสธค่า placeholder ที่ไม่ใช่รูปแบบ scrypt', () => {
		expect(verifyPassword('anything', '$2b$10$examplehashedpassword')).toBe(false);
	});

	it('salt ต่างกันทุกครั้ง', () => {
		expect(hashPassword('a')).not.toBe(hashPassword('a'));
	});
});
