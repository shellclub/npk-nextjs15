import prisma from '@/lib/prisma';
import { computePOTotals } from '@/components/purchase-orders/po-math';

/** คำนวณยอด PO ใหม่จากรายการ (ยอดรวม → ส่วนลด → VAT → หัก ณ ที่จ่าย) แล้วบันทึกลง DB */
export async function recalcPOTotals(poId: string) {
	const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });

	if (!po) return null;

	const items = await prisma.purchaseOrderItem.findMany({
		where: { purchaseOrderId: poId }
	});
	const subtotal = items.reduce((sum, it) => sum + Number(it.amount), 0);
	const t = computePOTotals(
		subtotal,
		Number(po.discountPercent) || 0,
		Number(po.vatPercent) || 0,
		Number(po.whtPercent) || 0
	);

	await prisma.purchaseOrder.update({ where: { id: poId }, data: t });

	return t;
}

export type InstallmentRow = {
	seq: number;
	percent: number | null;
	dueDate: Date | null;
	amount: number;
	retentionAmount: number;
	notes: string | null;
};
