import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateInstallments } from '@/components/purchase-orders/po-math';

// GET /api/purchase-orders/[id]/installments — งวดจ่าย + ยอดที่จ่ายแล้ว
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const rows = await prisma.pOInstallment.findMany({
			where: { purchaseOrderId: id },
			orderBy: { seq: 'asc' },
			include: {
				paymentVouchers: {
					select: { id: true, voucherNumber: true, amount: true }
				}
			}
		});

		return NextResponse.json(rows);
	} catch (error) {
		console.error('GET installments error:', error);
		return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 });
	}
}

// PUT /api/purchase-orders/[id]/installments — แทนที่งวดทั้งหมด (งวดที่มีใบสำคัญจ่ายแล้วลบไม่ได้)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const list: {
			id?: string;
			percent?: number | null;
			dueDate?: string | null;
			amount?: number;
			retentionAmount?: number;
			notes?: string;
		}[] = Array.isArray(body.installments) ? body.installments : [];
		const po = await prisma.purchaseOrder.findUnique({ where: { id } });

		if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

		const v = validateInstallments(Number(po.totalAmount) || 0, list);

		if (!v.ok) return NextResponse.json({ error: 'ยอดรวมทุกงวดเกินยอดสุทธิของใบสั่งซื้อ' }, { status: 400 });

		const existing = await prisma.pOInstallment.findMany({
			where: { purchaseOrderId: id },
			include: { _count: { select: { paymentVouchers: true } } }
		});
		const keepIds = new Set(list.map((l) => l.id).filter(Boolean));
		const blocked = existing.filter((e) => e._count.paymentVouchers > 0 && !keepIds.has(e.id));

		if (blocked.length)
			return NextResponse.json({ error: `งวดที่ ${blocked[0].seq} มีใบสำคัญจ่ายแล้ว ลบไม่ได้` }, { status: 409 });

		await prisma.$transaction(async (tx) => {
			await tx.pOInstallment.deleteMany({
				where: {
					purchaseOrderId: id,
					id: { notIn: [...keepIds] as string[] },
					paymentVouchers: { none: {} }
				}
			});

			// ย้าย seq ชั่วคราวกันชน unique (purchaseOrderId, seq)
			await tx.pOInstallment.updateMany({
				where: { purchaseOrderId: id },
				data: { seq: { increment: 1000 } }
			});

			for (const [i, it] of list.entries()) {
				const data = {
					seq: i + 1,
					percent: it.percent ? Number(it.percent) : null,
					dueDate: it.dueDate ? new Date(it.dueDate) : null,
					amount: v.amounts[i],
					retentionAmount: Number(it.retentionAmount) || 0,
					notes: it.notes || null
				};

				if (it.id && existing.some((e) => e.id === it.id))
					await tx.pOInstallment.update({ where: { id: it.id }, data });
				else
					await tx.pOInstallment.create({
						data: { ...data, purchaseOrderId: id }
					});
			}
		});

		const rows = await prisma.pOInstallment.findMany({
			where: { purchaseOrderId: id },
			orderBy: { seq: 'asc' }
		});

		return NextResponse.json(rows);
	} catch (error) {
		console.error('PUT installments error:', error);
		return NextResponse.json({ error: 'Failed to save installments' }, { status: 500 });
	}
}
