import type { WoStatusConfig } from '@/lib/status';

export type WorkOrder = {
	id: string;
	woNumber: string;
	date: string;
	poNumber?: string | null;
	poDate?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	warrantyStartDate?: string | null;
	warrantyEndDate?: string | null;
	warrantyMonths?: number | null;
	retentionAmount?: number | string | null;
	teamId?: string | null;
	teamName?: string | null;
	description?: string | null;
	totalAmount: number;
	status: string;
	workflowType?: string | null;
	quotation?: {
		quotationNumber: string;
		projectName?: string | null;
		subtotal?: number | null;
		totalAmount?: number | null;
		customerGroup: { groupName: string };
	} | null;
	team?: { teamName: string; leaderName: string } | null;
	branch?: { name: string } | null;
	purchaseOrders?: { id: string; poNumber: string; totalAmount: number; status: string }[];
	invoices?: { id: string; invoiceNumber: string; taxInvoice?: { id: string; taxInvoiceNumber: string } | null }[];
};

export type StatusConfig = WoStatusConfig & { isActive: boolean };

export const WORKFLOW_TYPES = [
	{ value: 'QUOTE_FIRST', label: 'เสนอราคาก่อนเข้าทำงาน' },
	{ value: 'WO_FIRST', label: 'ได้รับเลข WO ก่อนทำราคา (ต้องจองเลขที่ใบเสนอราคา)' },
	{ value: 'WORK_FIRST', label: 'ทำงานก่อนทำใบเสนอราคา' }
] as const;

export const WORKFLOW_BADGE: Record<string, { label: string; tone: 'warn' | 'violet' }> = {
	WO_FIRST: { label: 'รับ WO ก่อนราคา', tone: 'warn' },
	WORK_FIRST: { label: 'ทำงานก่อนใบเสนอราคา', tone: 'violet' }
};

/** สถานะที่ถือว่างานจบแล้ว (ไม่ขึ้น "เลยกำหนด") */
export const FINISHED = ['COMPLETED', 'PAID', 'CANCELLED'];
export const isOverdue = (w: WorkOrder) =>
	!!w.endDate && !FINISHED.includes(w.status) && new Date(w.endDate).getTime() < Date.now();
export const dateInput = (v?: string | null) => (v ? new Date(v).toISOString().split('T')[0] : '');

/** ระยะเวลาประกันที่เลือกได้เร็ว (เดือน) */
export const WARRANTY_PRESETS = [3, 6, 12, 24] as const;

export { addMonthsISO } from '@/lib/add-months';
