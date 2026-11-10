'use client';

import { useParams } from 'next/navigation';
import { DocumentDetail, StatusBadge } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { FALLBACK, PAYMENT_METHOD } from '@/lib/status';
import { useApi } from '@/lib/use-api';

type Receipt = {
	id: string;
	voucherNumber: string;
	date: string;
	amount: number;
	paymentMethod: string;
	bankName?: string | null;
	chequeNumber?: string | null;
	notes?: string | null;
	invoice?: {
		invoiceNumber: string;
		workOrder?: { woNumber: string; quotation?: { customerGroup?: { groupName: string } } | null } | null;
	} | null;
};

export default function ReceiptVoucherDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: rv, isLoading, isError } = useApi<Receipt>(`/api/receipt-vouchers/${id}`);
	const m = (rv && PAYMENT_METHOD[rv.paymentMethod]) || FALLBACK;

	return (
		<DocumentDetail
			loading={isLoading}
			notFound={isError || !rv?.id}
			notFoundText="ไม่พบใบสำคัญรับ"
			backHref="/apps/receipt-vouchers"
			backLabel="กลับรายการใบสำคัญรับ"
			number={rv?.voucherNumber ?? ''}
			badge={
				rv && (
					<StatusBadge
						label={m.label}
						tone={m.tone}
					/>
				)
			}
			subtitle={rv && `วันที่ ${formatDateShort(rv.date)}`}
			printSrc={`/api/receipt-vouchers/${id}/pdf`}
			cards={
				rv
					? [
							{
								title: 'ผู้ชำระเงิน',
								rows: [
									['ลูกค้า', rv.invoice?.workOrder?.quotation?.customerGroup?.groupName ?? '-'],
									['ใบแจ้งหนี้', rv.invoice?.invoiceNumber ?? '-'],
									['WO', rv.invoice?.workOrder?.woNumber ?? '-']
								]
							},
							{
								title: 'รายละเอียดการรับเงิน',
								rows: [
									['วันที่', formatDateShort(rv.date)],
									['วิธีชำระ', m.label],
									['ธนาคาร', rv.bankName],
									['เลขเช็ค', rv.chequeNumber],
									['หมายเหตุ', rv.notes]
								]
							}
						]
					: []
			}
			summary={
				rv && (
					<div className="text-right">
						<div className="text-ink-muted">จำนวนเงินที่รับ</div>
						<div className="font-display text-primary-ink text-3xl font-semibold">
							{formatMoney(rv.amount)}
						</div>
					</div>
				)
			}
		/>
	);
}
