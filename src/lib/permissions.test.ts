import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	ADMIN_ONLY_MENUS,
	API_RULES,
	CONFIGURABLE_MENUS,
	DEFAULT_GRANTS,
	apiNeed,
	canCallApi,
	hasMenu,
	isConfigurableMenu
} from './permissions';

const staff = DEFAULT_GRANTS.STAFF;
const accountant = DEFAULT_GRANTS.ACCOUNTANT;

describe('hasMenu', () => {
	it('ADMIN เข้าได้ทุกเมนูรวมเมนูเฉพาะ admin', () => {
		expect(hasMenu('admin', [], 'finance.invoices')).toBe(true);
		expect(hasMenu('ADMIN', [], 'admin.users')).toBe(true);
	});

	it('role อื่นเข้าได้เฉพาะเมนูที่ได้สิทธิ์', () => {
		expect(hasMenu('staff', staff, 'docs.quotations')).toBe(true);
		expect(hasMenu('staff', staff, 'finance.invoices')).toBe(false);
	});

	it('เมนูเฉพาะ admin ไม่ให้ role อื่นแม้ถูกใส่ในรายการสิทธิ์', () => {
		expect(hasMenu('manager', ['admin.users'], 'admin.users')).toBe(false);
	});

	it('ไม่มี role = เข้าไม่ได้', () => {
		expect(hasMenu(null, ['docs.quotations'], 'docs.quotations')).toBe(false);
	});
});

describe('canCallApi', () => {
	it('ADMIN เรียกได้ทุก API', () => {
		expect(canCallApi('admin', [], '/api/admin/users', 'POST')).toBe(true);
		expect(canCallApi('ADMIN', [], '/api/invoices', 'DELETE')).toBe(true);
	});

	it('เจ้าหน้าที่ไม่เห็นข้อมูลการเงินและรายงาน', () => {
		expect(canCallApi('staff', staff, '/api/invoices', 'GET')).toBe(false);
		expect(canCallApi('staff', staff, '/api/payment-vouchers', 'GET')).toBe(true); // ผ่านเมนู work.pending-payment
		expect(canCallApi('staff', staff, '/api/tax-invoices', 'GET')).toBe(false);
		expect(canCallApi('staff', staff, '/api/reports', 'GET')).toBe(false);
	});

	it('เจ้าหน้าที่ออกใบเสนอราคาได้', () => {
		expect(canCallApi('staff', staff, '/api/quotations', 'POST')).toBe(true);
		expect(canCallApi('staff', staff, '/api/quotations/abc', 'PATCH')).toBe(true);
	});

	it('ฝ่ายบัญชีอ่านใบเสนอราคาได้แต่แก้ไม่ได้', () => {
		expect(canCallApi('accountant', accountant, '/api/quotations', 'GET')).toBe(true);
		expect(canCallApi('accountant', accountant, '/api/quotations', 'POST')).toBe(false);
		expect(canCallApi('accountant', accountant, '/api/quotations/abc', 'DELETE')).toBe(false);
	});

	it('ฝ่ายบัญชีออกใบแจ้งหนี้ได้', () => {
		expect(canCallApi('accountant', accountant, '/api/invoices', 'POST')).toBe(true);
	});

	it('จ่ายช่างผูกกับเมนู work.pending-payment ไม่ใช่ WO', () => {
		expect(canCallApi('accountant', accountant, '/api/work-orders/1/pay-contractor', 'POST')).toBe(true);
		expect(canCallApi('accountant', accountant, '/api/work-orders/1', 'PATCH')).toBe(false);
	});

	it('ข้อมูลหลักอ่านได้ทุกคน แก้ไขต้องมีสิทธิ์เมนู', () => {
		expect(canCallApi('accountant', accountant, '/api/technicians', 'GET')).toBe(true);
		expect(canCallApi('accountant', accountant, '/api/technicians', 'POST')).toBe(false);
		expect(canCallApi('staff', staff, '/api/company', 'PUT')).toBe(false);
	});

	it('API ของ admin ปิดสำหรับ role อื่นทั้งหมด', () => {
		expect(canCallApi('manager', DEFAULT_GRANTS.MANAGER, '/api/admin/users', 'GET')).toBe(false);
		expect(canCallApi('manager', DEFAULT_GRANTS.MANAGER, '/api/admin/role-permissions', 'PUT')).toBe(false);
	});

	it('API ที่ไม่มีกฎ = เฉพาะ admin (default deny)', () => {
		expect(apiNeed('/api/something-new', 'GET')).toBe('admin');
		expect(canCallApi('manager', DEFAULT_GRANTS.MANAGER, '/api/something-new', 'GET')).toBe(false);
	});
});

describe('ความสมบูรณ์ของกฎ', () => {
	it('เมนูในสิทธิ์เริ่มต้นมีอยู่จริง และไม่มีเมนูเฉพาะ admin', () => {
		for (const keys of Object.values(DEFAULT_GRANTS)) {
			for (const k of keys) {
				expect(isConfigurableMenu(k), k).toBe(true);
				expect(ADMIN_ONLY_MENUS).not.toContain(k);
			}
		}
	});

	it('เมนูทุกตัวอ้างถึงได้ในกฎ API หรือเป็นเมนูหน้าล้วน', () => {
		const used = new Set(API_RULES.flatMap((r) => [r.read, r.write]).flatMap((n) => (Array.isArray(n) ? n : [])));
		// เมนูที่ไม่มี API เจ้าของโดยตรง: ใช้ API อ้างอิงร่วมกัน
		const exempt = new Set(['dashboard.main']);

		for (const m of CONFIGURABLE_MENUS) {
			if (!exempt.has(m.key)) expect(used.has(m.key), m.key).toBe(true);
		}
	});

	it('ทุกโฟลเดอร์ใน src/app/api มีกฎ (ยกเว้น auth/files ที่ proxy จัดการเอง)', () => {
		const dir = path.join(process.cwd(), 'src/app/api');
		const skip = new Set(['auth', 'files']);

		for (const name of readdirSync(dir)) {
			if (skip.has(name)) continue;

			expect(
				API_RULES.some((r) => r.pattern.test(`/api/${name}`)),
				`/api/${name}`
			).toBe(true);
		}
	});
});
