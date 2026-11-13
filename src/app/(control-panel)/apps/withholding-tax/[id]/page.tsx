'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DocumentDetail } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';

type Wht = {
	id: string;
	whtNumber: string;
	date: string;
	payeeName: string;
	payeeTaxId?: string | null;
	payeeAddress?: string | null;
	incomeType: string;
	taxRate: number;
	incomeAmount: number;
	taxAmount: number;
	notes?: string | null;
	paymentVoucher?: { id: string; voucherNumber: string } | null;
};

export default function WithholdingTaxDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: w, isLoading, isError } = useApi<Wht>(`/api/withholding-tax/${id}`);

	return (
		<DocumentDetail
			loading={isLoading}
			notFound={isError || !w?.id}
			notFoundText="ไม่พบรายการ 50 ทวิ"
			backHref="/apps/withholding-tax"
			backLabel="กลับรายการ 50 ทวิ"
			number={w?.whtNumber ?? ''}
			subtitle={w && `วันที่ ${formatDateShort(w.date)}`}
			printSrc={`/api/withholding-tax/${id}/pdf`}
			cards={
				w
					? [
							{
								title: 'ผู้ถูกหักภาษี',
								rows: [
									['ชื่อ', w.payeeName],
									['เลขผู้เสียภาษี', w.payeeTaxId || '-'],
									['ที่อยู่', w.payeeAddress]
								]
							},
							{
								title: 'รายละเอียด',
								rows: [
									['วันที่', formatDateShort(w.date)],
									['ประเภทเงินได้', w.incomeType],
									[
										'ใบสำคัญจ่าย',
										w.paymentVoucher ? (
											<Link
												key="p"
												href={`/apps/payment-vouchers/${w.paymentVoucher.id}`}
											>
												{w.paymentVoucher.voucherNumber}
											</Link>
										) : null
									],
									['หมายเหตุ', w.notes]
								]
							}
						]
					: []
			}
			summary={
				w && (
					<div className="grid grid-cols-2 gap-6 text-right">
						<div>
							<div className="text-ink-muted">จำนวนเงินที่จ่าย</div>
							<div className="font-display text-2xl font-semibold">{formatMoney(w.incomeAmount)}</div>
						</div>
						<div>
							<div className="text-ink-muted">ภาษีหัก ณ ที่จ่าย ({Number(w.taxRate)}%)</div>
							<div className="font-display text-primary-ink text-2xl font-semibold">
								{formatMoney(w.taxAmount)}
							</div>
						</div>
					</div>
				)
			}
		/>
	);
}
