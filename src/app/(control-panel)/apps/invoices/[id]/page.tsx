'use client';

import { useParams } from 'next/navigation';
import { DocumentDetail, StatusBadge, TotalsBlock } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { FALLBACK, INVOICE_STATUS } from '@/lib/status';
import { useApi } from '@/lib/use-api';

type Invoice = {
	id: string;
	invoiceNumber: string;
	date: string;
	dueDate?: string | null;
	subtotal: number;
	vatPercent?: number;
	vatAmount: number;
	totalAmount: number;
	status: string;
	notes?: string | null;
	workOrder?: {
		woNumber: string;
		quotation?: {
			quotationNumber: string;
			projectName?: string | null;
			customerGroup?: { groupName: string };
			branch?: { code?: string; name: string } | null;
		} | null;
	} | null;
};

export default function InvoiceDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: inv, isLoading, isError } = useApi<Invoice>(`/api/invoices/${id}`);
	const q = inv?.workOrder?.quotation;
	const m = (inv && INVOICE_STATUS[inv.status]) || FALLBACK;

	return (
		<DocumentDetail
			loading={isLoading}
			notFound={isError || !inv?.id}
			notFoundText="ไม่พบใบแจ้งหนี้"
			backHref="/apps/invoices"
			backLabel="กลับรายการใบแจ้งหนี้"
			number={inv?.invoiceNumber ?? ''}
			badge={
				<StatusBadge
					label={m.label}
					tone={m.tone}
				/>
			}
			subtitle={inv && `วันที่ ${formatDateShort(inv.date)}`}
			printSrc={`/api/invoices/${id}/pdf`}
			cards={
				inv
					? [
							{
								title: 'ข้อมูลลูกค้า',
								rows: [
									['ลูกค้า', q?.customerGroup?.groupName ?? '-'],
									['สาขา', q?.branch ? `${q.branch.code || ''} ${q.branch.name}` : '-'],
									['โครงการ', q?.projectName ?? '-'],
									['WO', inv.workOrder?.woNumber ?? '-']
								]
							},
							{
								title: 'อ้างอิง',
								rows: [
									['วันที่', formatDateShort(inv.date)],
									[
										'ครบกำหนด',
										<span
											key="d"
											className={inv.status === 'OVERDUE' ? 'text-danger' : ''}
										>
											{formatDateShort(inv.dueDate)}
										</span>
									],
									['ใบเสนอราคา', q?.quotationNumber ?? '-'],
									['หมายเหตุ', inv.notes]
								]
							}
						]
					: []
			}
			summary={
				inv && (
					<TotalsBlock
						rows={[
							['ยอดก่อน VAT', formatMoney(inv.subtotal)],
							[`VAT ${Number(inv.vatPercent ?? 7)}%`, formatMoney(inv.vatAmount)]
						]}
						grand={['ยอดรวมทั้งสิ้น', formatMoney(inv.totalAmount)]}
					/>
				)
			}
		/>
	);
}
