'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DocumentDetail, StatusBadge } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { FALLBACK, PAYMENT_METHOD } from '@/lib/status';
import { useApi } from '@/lib/use-api';

type Payment = {
	id: string;
	voucherNumber: string;
	date: string;
	payeeName: string;
	description?: string | null;
	amount: number;
	paymentMethod: string;
	bankName?: string | null;
	chequeNumber?: string | null;
	notes?: string | null;
	withholdingTax?: { id: string; whtNumber: string } | null;
};

export default function PaymentVoucherDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: pv, isLoading, isError } = useApi<Payment>(`/api/payment-vouchers/${id}`);
	const m = (pv && PAYMENT_METHOD[pv.paymentMethod]) || FALLBACK;

	return (
		<DocumentDetail
			loading={isLoading}
			notFound={isError || !pv?.id}
			notFoundText="ไม่พบใบสำคัญจ่าย"
			backHref="/apps/payment-vouchers"
			backLabel="กลับรายการใบสำคัญจ่าย"
			number={pv?.voucherNumber ?? ''}
			badge={
				pv && (
					<StatusBadge
						label={m.label}
						tone={m.tone}
					/>
				)
			}
			subtitle={pv && `วันที่ ${formatDateShort(pv.date)}`}
			printSrc={`/api/payment-vouchers/${id}/pdf`}
			cards={
				pv
					? [
							{
								title: 'ผู้รับเงิน',
								rows: [
									['ชื่อ', pv.payeeName],
									['รายละเอียด', pv.description]
								]
							},
							{
								title: 'รายละเอียดการจ่าย',
								rows: [
									['วันที่', formatDateShort(pv.date)],
									['วิธีจ่าย', m.label],
									['ธนาคาร', pv.bankName],
									['เลขเช็ค', pv.chequeNumber],
									['หมายเหตุ', pv.notes],
									[
										'50 ทวิ',
										pv.withholdingTax ? (
											<Link
												key="w"
												href={`/apps/withholding-tax/${pv.withholdingTax.id}`}
											>
												{pv.withholdingTax.whtNumber}
											</Link>
										) : null
									]
								]
							}
						]
					: []
			}
			summary={
				pv && (
					<div className="text-right">
						<div className="text-ink-muted">จำนวนเงินที่จ่าย</div>
						<div className="font-display text-primary-ink text-3xl font-semibold">
							{formatMoney(pv.amount)}
						</div>
					</div>
				)
			}
		/>
	);
}
