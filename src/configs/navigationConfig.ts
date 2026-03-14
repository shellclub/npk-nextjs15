import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * NPK Service & Supply - Navigation Config
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'dashboard',
		title: 'แดชบอร์ด',
		subtitle: 'ภาพรวมระบบ',
		type: 'group',
		icon: 'lucide:layout-dashboard',
		children: [
			{
				id: 'dashboard.main',
				title: 'แดชบอร์ด',
				type: 'item',
				icon: 'lucide:layout-dashboard',
				url: '/dashboards/project'
			}
		]
	},
	{
		id: 'documents',
		title: 'เอกสาร',
		subtitle: 'จัดการเอกสารธุรกิจ',
		type: 'group',
		icon: 'lucide:file-text',
		children: [
			{
				id: 'docs.quotations',
				title: 'ใบเสนอราคา',
				type: 'item',
				icon: 'lucide:file-text',
				url: '/apps/quotations'
			},
			{
				id: 'docs.work-orders',
				title: 'ตอบรับทำงาน (WO/PO)',
				type: 'item',
				icon: 'lucide:clipboard-check',
				url: '/apps/work-orders'
			},
			{
				id: 'docs.purchase-orders',
				title: 'ใบสั่งซื้อให้ช่าง',
				type: 'item',
				icon: 'lucide:shopping-cart',
				url: '/apps/purchase-orders'
			}
		]
	},
	{
		id: 'work-management',
		title: 'จัดการงาน',
		subtitle: 'ติดตามสถานะงาน',
		type: 'group',
		icon: 'lucide:briefcase',
		children: [
			{
				id: 'work.completed',
				title: 'งานเสร็จแล้วทั้งหมด',
				type: 'item',
				icon: 'lucide:circle-check',
				url: '/apps/completed-works'
			},
			{
				id: 'work.pending-payment',
				title: 'งานเสร็จรอจ่ายช่าง',
				type: 'item',
				icon: 'lucide:clock',
				url: '/apps/pending-payments'
			}
		]
	},
	{
		id: 'finance',
		title: 'การเงิน',
		subtitle: 'ใบแจ้งหนี้ ใบกำกับภาษี ใบสำคัญ',
		type: 'group',
		icon: 'lucide:banknote',
		children: [
			{
				id: 'finance.invoices',
				title: 'ใบแจ้งหนี้',
				type: 'item',
				icon: 'lucide:receipt',
				url: '/apps/invoices'
			},
			{
				id: 'finance.tax-invoices',
				title: 'ใบกำกับภาษี',
				type: 'item',
				icon: 'lucide:file-badge',
				url: '/apps/tax-invoices'
			},
			{
				id: 'finance.receipt-vouchers',
				title: 'ใบสำคัญรับ',
				type: 'item',
				icon: 'lucide:download',
				url: '/apps/receipt-vouchers'
			},
			{
				id: 'finance.payment-vouchers',
				title: 'ใบสำคัญจ่าย',
				type: 'item',
				icon: 'lucide:upload',
				url: '/apps/payment-vouchers'
			},
			{
				id: 'finance.withholding-tax',
				title: 'ออก 50 ทวิ',
				type: 'item',
				icon: 'lucide:file-spreadsheet',
				url: '/apps/withholding-tax'
			}
		]
	},
	{
		id: 'master-data',
		title: 'ข้อมูลหลัก',
		subtitle: 'ลูกค้า ช่าง บริษัท',
		type: 'group',
		icon: 'lucide:database',
		children: [
			{
				id: 'master.customers',
				title: 'ข้อมูลลูกค้า',
				type: 'item',
				icon: 'lucide:building-2',
				url: '/apps/customers'
			},
			{
				id: 'master.technicians',
				title: 'ข้อมูลทีมช่าง',
				type: 'item',
				icon: 'lucide:hard-hat',
				url: '/apps/technicians'
			},
			{
				id: 'master.company',
				title: 'ข้อมูลบริษัท',
				type: 'item',
				icon: 'lucide:settings',
				url: '/apps/company-settings'
			}
		]
	}
];

export default navigationConfig;
