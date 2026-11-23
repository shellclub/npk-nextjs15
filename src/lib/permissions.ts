/**
 * สิทธิ์เข้าถึงระบบตาม role (ไฟล์นี้เป็น pure: ใช้ได้ทั้ง client, proxy และ seed)
 *
 * - ADMIN เข้าได้ทุกอย่างเสมอ และเป็นผู้เดียวที่เข้าหน้าจัดการผู้ใช้/สิทธิ์
 * - role อื่นเข้าได้เฉพาะเมนูที่ ADMIN ติ๊กไว้ (ตาราง RolePermission)
 * - API ถูกผูกกับเมนูเจ้าของ: เขียน (POST/PATCH/PUT/DELETE) ต้องมีเมนูเจ้าของ,
 *   อ่าน (GET) มีเมนูเจ้าของหรือเมนูที่ต้องอ้างอิงข้อมูลนั้นก็อ่านได้
 */

export const ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] as const;
export type Role = (typeof ROLES)[number];

/** role ที่ ADMIN ตั้งสิทธิ์ได้ (ADMIN เองล็อกไว้ ไม่ให้ตัดสิทธิ์ตัวเอง) */
export const CONFIGURABLE_ROLES = ['MANAGER', 'STAFF', 'ACCOUNTANT'] as const;

export const ROLE_LABEL: Record<Role, string> = {
	ADMIN: 'ผู้ดูแลระบบ',
	MANAGER: 'ผู้จัดการ',
	STAFF: 'เจ้าหน้าที่',
	ACCOUNTANT: 'ฝ่ายบัญชี'
};

export type MenuDef = { key: string; title: string; group: string };

/** เมนูที่ ADMIN ตั้งสิทธิ์ได้ (key ตรงกับ id ใน nav.ts) */
export const CONFIGURABLE_MENUS: MenuDef[] = [
	{ key: 'dashboard.main', title: 'แดชบอร์ด', group: 'แดชบอร์ด' },
	{ key: 'docs.quotations', title: 'ใบเสนอราคา', group: 'เอกสาร' },
	{ key: 'docs.work-orders', title: 'ตอบรับทำงาน (WO/PO)', group: 'เอกสาร' },
	{ key: 'docs.purchase-orders', title: 'ใบสั่งซื้อให้ช่าง', group: 'เอกสาร' },
	{ key: 'work.completed', title: 'งานเสร็จแล้วทั้งหมด', group: 'จัดการงาน' },
	{ key: 'work.pending-payment', title: 'งานเสร็จรอจ่ายช่าง', group: 'จัดการงาน' },
	{ key: 'finance.invoices', title: 'ใบแจ้งหนี้', group: 'การเงิน' },
	{ key: 'finance.tax-invoices', title: 'ใบกำกับภาษี', group: 'การเงิน' },
	{ key: 'finance.receipt-vouchers', title: 'ใบสำคัญรับ', group: 'การเงิน' },
	{ key: 'finance.payment-vouchers', title: 'ใบสำคัญจ่าย', group: 'การเงิน' },
	{ key: 'finance.withholding-tax', title: 'ออก 50 ทวิ', group: 'การเงิน' },
	{ key: 'reports.monthly', title: 'สรุปรายงานรายปี', group: 'รายงาน' },
	{ key: 'master.customers', title: 'ข้อมูลลูกค้า', group: 'ข้อมูลหลัก' },
	{ key: 'master.technicians', title: 'ข้อมูลทีมช่าง', group: 'ข้อมูลหลัก' },
	{ key: 'master.company', title: 'ข้อมูลบริษัท', group: 'ข้อมูลหลัก' },
	{ key: 'master.wo-statuses', title: 'ตั้งค่าสถานะ WO', group: 'ข้อมูลหลัก' }
];

/** เมนูที่เฉพาะ ADMIN (ตั้งค่าไม่ได้) */
export const ADMIN_ONLY_MENUS = ['admin.users', 'admin.permissions'];

const CONFIGURABLE_KEYS = new Set(CONFIGURABLE_MENUS.map((m) => m.key));

export const isConfigurableMenu = (key: string) => CONFIGURABLE_KEYS.has(key);

/** สิทธิ์เริ่มต้น (ใช้ตอน seed ครั้งแรกเท่านั้น หลังจากนั้น ADMIN ปรับเองในหน้า "สิทธิ์การเข้าถึง") */
export const DEFAULT_GRANTS: Record<(typeof CONFIGURABLE_ROLES)[number], string[]> = {
	MANAGER: CONFIGURABLE_MENUS.map((m) => m.key).filter((k) => k !== 'master.company' && k !== 'master.wo-statuses'),
	STAFF: [
		'dashboard.main',
		'docs.quotations',
		'docs.work-orders',
		'docs.purchase-orders',
		'work.completed',
		'work.pending-payment',
		'master.customers',
		'master.technicians'
	],
	ACCOUNTANT: [
		'dashboard.main',
		'work.completed',
		'work.pending-payment',
		'finance.invoices',
		'finance.tax-invoices',
		'finance.receipt-vouchers',
		'finance.payment-vouchers',
		'finance.withholding-tax',
		'reports.monthly',
		'master.customers'
	]
};

// ---------------------------------------------------------------------------
// หน้าเว็บ: pathname → เมนู (ใช้ href ของเมนู จับแบบ prefix ที่ยาวที่สุดใน nav.ts)
// ---------------------------------------------------------------------------

export const ROLE_HOME = '/dashboards/project';

export function hasMenu(role: string | null | undefined, menus: readonly string[] | undefined, key: string): boolean {
	if (!role) return false;

	if (role.toLowerCase() === 'admin') return true;

	if (ADMIN_ONLY_MENUS.includes(key)) return false;

	return !!menus?.includes(key);
}

// ---------------------------------------------------------------------------
// API: pathname + method → เมนูที่ต้องมี
// ---------------------------------------------------------------------------

/** 'open' = ผู้ใช้ที่ล็อกอินทุกคน, 'admin' = เฉพาะ ADMIN, อาร์เรย์ = ต้องมีอย่างน้อยหนึ่งเมนูในนั้น */
export type Need = 'open' | 'admin' | string[];

type Rule = { pattern: RegExp; read: Need; write: Need };

const DOCS = ['docs.quotations', 'docs.work-orders', 'docs.purchase-orders'];
const WORK = ['work.completed', 'work.pending-payment'];
const FIN = [
	'finance.invoices',
	'finance.tax-invoices',
	'finance.receipt-vouchers',
	'finance.payment-vouchers',
	'finance.withholding-tax'
];
const REPORTS = ['reports.monthly'];
/** ผู้ที่ต้องอ่านเอกสารต้นทาง (ใบเสนอราคา/WO/PO/งานเสร็จ) เพื่อออกเอกสารต่อ */
const DOC_READERS = [...DOCS, ...WORK, ...FIN, ...REPORTS];

const own = (...keys: string[]) => keys;

export const API_RULES: Rule[] = [
	{ pattern: /^\/api\/admin(\/|$)/, read: 'admin', write: 'admin' },
	{ pattern: /^\/api\/account(\/|$)/, read: 'open', write: 'open' },
	{ pattern: /^\/api\/nav-counts(\/|$)/, read: 'open', write: 'open' },
	{ pattern: /^\/api\/dashboard(\/|$)/, read: own('dashboard.main'), write: own('dashboard.main') },
	{ pattern: /^\/api\/reports(\/|$)/, read: own(...REPORTS), write: own(...REPORTS) },

	// ต้องมาก่อน /api/work-orders ทั่วไป
	{
		pattern: /^\/api\/work-orders\/[^/]+\/pay-contractor(\/|$)/,
		read: own('work.pending-payment'),
		write: own('work.pending-payment')
	},

	{ pattern: /^\/api\/quotations(\/|$)/, read: DOC_READERS, write: own('docs.quotations') },
	{ pattern: /^\/api\/quotation-items(\/|$)/, read: DOC_READERS, write: own('docs.quotations') },
	{ pattern: /^\/api\/work-orders(\/|$)/, read: DOC_READERS, write: own('docs.work-orders') },
	{ pattern: /^\/api\/purchase-orders(\/|$)/, read: DOC_READERS, write: own('docs.purchase-orders') },
	{ pattern: /^\/api\/completed-works(\/|$)/, read: DOC_READERS, write: own('work.completed') },

	{ pattern: /^\/api\/invoices(\/|$)/, read: [...FIN, ...REPORTS], write: own('finance.invoices') },
	{ pattern: /^\/api\/tax-invoices(\/|$)/, read: [...FIN, ...REPORTS], write: own('finance.tax-invoices') },
	{ pattern: /^\/api\/receipt-vouchers(\/|$)/, read: [...FIN, ...REPORTS], write: own('finance.receipt-vouchers') },
	{
		pattern: /^\/api\/payment-vouchers(\/|$)/,
		read: [...FIN, ...WORK, ...REPORTS],
		write: own('finance.payment-vouchers', 'work.pending-payment')
	},
	{ pattern: /^\/api\/withholding-tax(\/|$)/, read: [...FIN, ...REPORTS], write: own('finance.withholding-tax') },

	// ข้อมูลหลัก: ทุกคนที่ล็อกอินอ่านได้ (ใช้เลือกในฟอร์ม) แก้ไขได้เฉพาะเจ้าของเมนู
	{ pattern: /^\/api\/(customers|branches|contacts)(\/|$)/, read: 'open', write: own('master.customers') },
	{
		pattern: /^\/api\/(technicians|technician-teams|team-members)(\/|$)/,
		read: 'open',
		write: own('master.technicians')
	},
	{ pattern: /^\/api\/company(\/|$)/, read: 'open', write: own('master.company') },
	{ pattern: /^\/api\/work-order-statuses(\/|$)/, read: 'open', write: own('master.wo-statuses') }
];

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** ต้องมีสิทธิ์อะไรจึงเรียก API นี้ได้ (ไม่ตรงกฎใด = เฉพาะ ADMIN เพื่อความปลอดภัย) */
export function apiNeed(pathname: string, method: string): Need {
	const rule = API_RULES.find((r) => r.pattern.test(pathname));

	if (!rule) return 'admin';

	return READ_METHODS.has(method.toUpperCase()) ? rule.read : rule.write;
}

export function canCallApi(role: string, menus: readonly string[], pathname: string, method: string): boolean {
	if (role.toLowerCase() === 'admin') return true;

	const need = apiNeed(pathname, method);

	if (need === 'open') return true;

	if (need === 'admin') return false;

	return need.some((k) => menus.includes(k));
}
