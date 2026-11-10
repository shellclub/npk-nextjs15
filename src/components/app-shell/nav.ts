import {
	BarChart3,
	Building2,
	CircleCheck,
	ClipboardCheck,
	Clock,
	Download,
	FileBadge,
	FileSpreadsheet,
	FileText,
	HardHat,
	LayoutDashboard,
	Receipt,
	Settings,
	ShoppingCart,
	Tags,
	Upload,
	type LucideIcon
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
	'layout-dashboard': LayoutDashboard,
	'file-text': FileText,
	'clipboard-check': ClipboardCheck,
	'shopping-cart': ShoppingCart,
	'circle-check': CircleCheck,
	clock: Clock,
	receipt: Receipt,
	'file-badge': FileBadge,
	download: Download,
	upload: Upload,
	'file-spreadsheet': FileSpreadsheet,
	'bar-chart-3': BarChart3,
	'building-2': Building2,
	'hard-hat': HardHat,
	settings: Settings,
	tags: Tags
};

export type NavItem = { id: string; title: string; href: string; Icon: LucideIcon };
export type NavGroup = { id: string; title: string; items: NavItem[] };

const item = (id: string, title: string, href: string, icon: keyof typeof ICONS): NavItem => ({
	id,
	title,
	href,
	Icon: ICONS[icon]
});

export const dashboardItem: NavItem = item('dashboard.main', 'แดชบอร์ด', '/dashboards/project', 'layout-dashboard');

export const navGroups: NavGroup[] = [
	{
		id: 'documents',
		title: 'เอกสาร',
		items: [
			item('docs.quotations', 'ใบเสนอราคา', '/apps/quotations', 'file-text'),
			item('docs.work-orders', 'ตอบรับทำงาน (WO/PO)', '/apps/work-orders', 'clipboard-check'),
			item('docs.purchase-orders', 'ใบสั่งซื้อให้ช่าง', '/apps/purchase-orders', 'shopping-cart')
		]
	},
	{
		id: 'work-management',
		title: 'จัดการงาน',
		items: [
			item('work.completed', 'งานเสร็จแล้วทั้งหมด', '/apps/completed-works', 'circle-check'),
			item('work.pending-payment', 'งานเสร็จรอจ่ายช่าง', '/apps/pending-payments', 'clock')
		]
	},
	{
		id: 'finance',
		title: 'การเงิน',
		items: [
			item('finance.invoices', 'ใบแจ้งหนี้', '/apps/invoices', 'receipt'),
			item('finance.tax-invoices', 'ใบกำกับภาษี', '/apps/tax-invoices', 'file-badge'),
			item('finance.receipt-vouchers', 'ใบสำคัญรับ', '/apps/receipt-vouchers', 'download'),
			item('finance.payment-vouchers', 'ใบสำคัญจ่าย', '/apps/payment-vouchers', 'upload'),
			item('finance.withholding-tax', 'ออก 50 ทวิ', '/apps/withholding-tax', 'file-spreadsheet')
		]
	},
	{
		id: 'reports',
		title: 'รายงาน',
		items: [item('reports.monthly', 'สรุปรายงานรายปี', '/apps/reports', 'bar-chart-3')]
	},
	{
		id: 'master-data',
		title: 'ข้อมูลหลัก',
		items: [
			item('master.customers', 'ข้อมูลลูกค้า', '/apps/customers', 'building-2'),
			item('master.technicians', 'ข้อมูลทีมช่าง', '/apps/technicians', 'hard-hat'),
			item('master.company', 'ข้อมูลบริษัท', '/apps/company-settings', 'settings'),
			item('master.wo-statuses', 'ตั้งค่าสถานะ WO', '/apps/work-order-statuses', 'tags')
		]
	}
];

/** จับคู่ pathname กับเมนูที่ยาวที่สุด เพื่อทำ active + breadcrumb */
export function findActive(pathname: string): { group?: NavGroup; item?: NavItem } {
	let best: { group?: NavGroup; item?: NavItem; len: number } = { len: 0 };

	const all: [NavGroup | undefined, NavItem][] = [
		[undefined, dashboardItem],
		...navGroups.flatMap((g) => g.items.map((i): [NavGroup, NavItem] => [g, i]))
	];

	for (const [group, item] of all) {
		if ((pathname === item.href || pathname.startsWith(`${item.href}/`)) && item.href.length > best.len) {
			best = { group, item, len: item.href.length };
		}
	}

	return best;
}

/** ตัวเลขเหลืองบนเมนู: id เมนู → key ใน /api/nav-counts */
export const NAV_COUNT_KEYS: Record<string, 'workOrdersPending' | 'pendingPayments'> = {
	'docs.work-orders': 'workOrdersPending',
	'work.pending-payment': 'pendingPayments'
};
