'use client';

import { useParams } from 'next/navigation';
import { DocumentDetail, TotalsBlock } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';

type TaxInvoice = {
	id: string;
	taxInvoiceNumber: string;
	date: string;
	subtotal: number;
	vatAmount: number;
	totalAmount: number;
	notes?: string | null;
	invoice?: {
		invoiceNumber: string;
		workOrder?: {
			woNumber: string;
			quotation?: { customerGroup?: { groupName: string; taxId?: string | null } } | null;
		} | null;
	} | null;
};

export default function TaxInvoiceDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: ti, isLoading, isError } = useApi<TaxInvoice>(`/api/tax-invoices/${id}`);
	const c = ti?.invoice?.workOrder?.quotation?.customerGroup;

	return (
		<DocumentDetail
			loading={isLoading}
			notFound={isError || !ti?.id}
			notFoundText="ไม่พบใบกำกับภาษี"
			backHref="/apps/tax-invoices"
			backLabel="กลับรายการใบกำกับภาษี"
			number={ti?.taxInvoiceNumber ?? ''}
			subtitle={ti && `วันที่ ${formatDateShort(ti.date)}`}
			printSrc={`/api/tax-invoices/${id}/pdf`}
			cards={
				ti
					? [
							{
								title: 'ข้อมูลลูกค้า',
								rows: [
									['ลูกค้า', c?.groupName ?? '-'],
									['เลขผู้เสียภาษี', c?.taxId ?? '-'],
									['WO', ti.invoice?.workOrder?.woNumber ?? '-']
								]
							},
							{
								title: 'อ้างอิง',
								rows: [
									['ใบแจ้งหนี้', ti.invoice?.invoiceNumber ?? '-'],
									['วันที่', formatDateShort(ti.date)],
									['หมายเหตุ', ti.notes]
								]
							}
						]
					: []
			}
			summary={
				ti && (
					<TotalsBlock
						rows={[
							['ยอดก่อน VAT', formatMoney(ti.subtotal)],
							['VAT', formatMoney(ti.vatAmount)]
						]}
						grand={['ยอดรวมทั้งสิ้น', formatMoney(ti.totalAmount)]}
					/>
				)
			}
		/>
	);
}
