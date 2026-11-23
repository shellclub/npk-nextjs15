import type { BadgeTone } from '@/components/ui/StatusBadge';

export type StatusMeta = { label: string; tone: BadgeTone };

export const QUOTATION_STATUS: Record<string, StatusMeta> = {
	DRAFT: { label: 'ร่าง', tone: 'neutral' },
	SENT: { label: 'ส่งแล้ว', tone: 'info' },
	APPROVED: { label: 'อนุมัติ', tone: 'success' },
	REJECTED: { label: 'ปฏิเสธ', tone: 'danger' },
	EXPIRED: { label: 'หมดอายุ', tone: 'warn' },
	CANCELLED: { label: 'ยกเลิก', tone: 'danger' }
};

export const PO_STATUS: Record<string, StatusMeta> = {
	DRAFT: { label: 'แบบร่าง', tone: 'neutral' },
	PENDING: { label: 'รออนุมัติ', tone: 'warn' },
	APPROVED: { label: 'อนุมัติ', tone: 'info' },
	ORDERED: { label: 'สั่งซื้อแล้ว', tone: 'tint' },
	RECEIVED: { label: 'รับแล้ว', tone: 'success' },
	CANCELLED: { label: 'ยกเลิก', tone: 'danger' }
};

export const COMPLETED_STATUS: Record<string, StatusMeta> = {
	COMPLETED: { label: 'เสร็จสิ้น', tone: 'success' },
	PENDING_PAYMENT: { label: 'รอจ่ายค่าแรง', tone: 'warn' },
	PAID: { label: 'จ่ายแล้ว', tone: 'violet' }
};

export const INVOICE_STATUS: Record<string, StatusMeta> = {
	UNPAID: { label: 'ยังไม่ชำระ', tone: 'warn' },
	PARTIAL: { label: 'ชำระบางส่วน', tone: 'info' },
	PAID: { label: 'ชำระแล้ว', tone: 'success' },
	OVERDUE: { label: 'เกินกำหนด', tone: 'danger' },
	CANCELLED: { label: 'ยกเลิก', tone: 'neutral' }
};

export const PAYMENT_METHOD: Record<string, StatusMeta> = {
	TRANSFER: { label: 'โอนเงิน', tone: 'info' },
	CASH: { label: 'เงินสด', tone: 'tint' },
	CHEQUE: { label: 'เช็ค', tone: 'warn' }
};

export const FALLBACK: StatusMeta = { label: '-', tone: 'neutral' };

export type WoStatusConfig = {
	id: string;
	code: string;
	name: string;
	color: string;
	bgColor: string;
	sortOrder: number;
	isDefault?: boolean;
};
