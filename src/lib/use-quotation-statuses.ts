'use client';

import { useMemo } from 'react';
import { FALLBACK, QUOTATION_STATUS, type WoStatusConfig } from '@/lib/status';
import { useApi } from '@/lib/use-api';

type Cfg = WoStatusConfig & { isActive: boolean };

export type QuotationStatusMeta = {
	label: string;
	tone?: import('@/components/ui/StatusBadge').BadgeTone;
	color?: string;
	bgColor?: string;
};

/**
 * สถานะใบเสนอราคา: ชื่อ/สี/ลำดับ มาจากตารางตั้งค่าสถานะ (appliesTo = QUOTATION)
 * ถ้ายังโหลดไม่เสร็จหรือไม่มีรหัสนั้นในตาราง ใช้ค่าสำรองที่ตั้งไว้ใน lib/status
 */
export function useQuotationStatuses() {
	const { data } = useApi<Cfg[]>('/api/work-order-statuses?appliesTo=QUOTATION');
	const list = useMemo(
		() => (Array.isArray(data) ? data : []).filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
		[data]
	);
	const byCode = useMemo(() => new Map(list.map((s) => [s.code, s])), [list]);

	function meta(code: string): QuotationStatusMeta {
		const c = byCode.get(code);

		if (c) return { label: c.name, color: c.color, bgColor: c.bgColor };

		return QUOTATION_STATUS[code] ?? { ...FALLBACK, label: code || '-' };
	}

	return { list, meta };
}
