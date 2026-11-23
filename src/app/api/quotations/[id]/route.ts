import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { computeQuotationTotals, normalizeQuotationItemsForSave } from '@/lib/quotation-line-items';

// GET /api/quotations/[id] — Get single quotation with items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const quotation = await prisma.quotation.findUnique({
			where: { id },
			include: {
				customerGroup: { include: { branches: true } },
				branch: true,
				createdBy: { select: { name: true } },
				items: { orderBy: { itemOrder: 'asc' } },
				workOrders: {
					select: { woNumber: true, poNumber: true, warrantyStartDate: true, warrantyEndDate: true },
					where: { status: { not: 'CANCELLED' } }
				}
			}
		});

		if (!quotation) {
			return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
		}

		return NextResponse.json(quotation);
	} catch (error) {
		console.error('GET /api/quotations/[id] error:', error);
		return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
	}
}

// PATCH /api/quotations/[id] — Update quotation
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await request.json();

		// เปลี่ยนเฉพาะสถานะ (เช่น จากหน้ารายการ): ไม่แตะรายการ ไม่นับเป็น Rev
		if (body.items === undefined && body.status) {
			const known = await prisma.workOrderStatusConfig.findFirst({
				where: { appliesTo: 'QUOTATION', code: String(body.status), isActive: true }
			});

			if (!known) return NextResponse.json({ error: 'ไม่รู้จักสถานะนี้' }, { status: 400 });

			const updated = await prisma.quotation.update({ where: { id }, data: { status: body.status } });

			return NextResponse.json(updated);
		}

		// Check if quotation exists
		const existing = await prisma.quotation.findUnique({
			where: { id },
			include: { items: true }
		});

		if (!existing) {
			return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
		}

		const rawItems = body.items || [];
		const items = normalizeQuotationItemsForSave(rawItems);

		const discountAmount = body.discountAmount ?? (Number(existing.discountAmount) || 0);
		const vatPercent = body.vatPercent ?? existing.vatPercent ?? 7;
		const { subtotal, vatAmount, totalAmount } = computeQuotationTotals(items, discountAmount, Number(vatPercent));

		// Revision: บันทึกทุกครั้ง Rev +1 (ลำดับต่อเนื่อง 1, 2, 3 ...)
		const revisionNumber = (existing.revisionNumber || 0) + 1;

		// เลขที่: เปลี่ยนวันที่ด้านหน้าเป็นวันที่บันทึก คงเลขลำดับท้ายไว้เหมือนเดิม (NpkYYMMDD-XXXX)
		let quotationNumber = existing.quotationNumber;
		const m = /^(Npk)(\d{6})(-\d+)$/i.exec(quotationNumber);

		if (m) {
			const now = new Date();
			const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
			const candidate = `${m[1]}${stamp}${m[3]}`;

			if (candidate !== quotationNumber) {
				const clash = await prisma.quotation.findUnique({ where: { quotationNumber: candidate } });

				if (!clash) quotationNumber = candidate; // ถ้าเลขใหม่ซ้ำกับใบอื่น คงเลขเดิมไว้
			}
		}

		// Delete old items then re-create
		await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

		const quotation = await prisma.quotation.update({
			where: { id },
			data: {
				date: body.date ? new Date(body.date) : undefined,
				customerGroupId: body.customerGroupId || undefined,
				branchId: body.branchId ?? undefined,
				contactPerson: body.contactPerson ?? undefined,
				contactPhone: body.contactPhone ?? undefined,
				address: body.address ?? undefined,
				projectName: body.projectName ?? undefined,
				subtotal,
				discountPercent: 0,
				discountAmount,
				vatPercent: Number(vatPercent),
				vatAmount,
				totalAmount,
				revisionNumber,
				quotationNumber,
				status: body.status || undefined,
				notes: body.notes ?? undefined,
				conditions: body.conditions ?? undefined,
				validDays: body.validDays ?? undefined,
				warranty: body.conditions ?? body.warranty ?? undefined,
				items: {
					createMany: {
						data: items.map(
							(
								item: {
									itemType?: string;
									parentIndex?: number;
									description: string;
									unit: string;
									quantity: number;
									unitPrice?: number;
									materialPrice?: number;
									labourPrice?: number;
									isAdjustment?: boolean;
								},
								index: number
							) => {
								const matPrice = Number(item.materialPrice) || 0;
								const labPrice = Number(item.labourPrice) || 0;
								const qty = Number(item.quantity) || 0;
								const amount = qty * matPrice + qty * labPrice;
								return {
									itemOrder: index + 1,
									itemType: item.itemType || 'ITEM',
									parentIndex: item.parentIndex ?? null,
									description: item.description,
									unit: item.unit || '',
									quantity: qty,
									unitPrice: matPrice + labPrice,
									materialPrice: matPrice,
									labourPrice: labPrice,
									amount,
									isAdjustment: Boolean(item.isAdjustment)
								};
							}
						)
					}
				}
			},
			include: {
				customerGroup: true,
				branch: true,
				items: { orderBy: { itemOrder: 'asc' } }
			}
		});

		return NextResponse.json(quotation);
	} catch (error) {
		console.error('PATCH /api/quotations/[id] error:', error);
		return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
	}
}

// DELETE /api/quotations/[id] — Cancel (set status to CANCELLED)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const existing = await prisma.quotation.findUnique({ where: { id } });

		if (!existing) {
			return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
		}

		// Soft-delete: change status to CANCELLED
		const quotation = await prisma.quotation.update({
			where: { id },
			data: { status: 'CANCELLED' }
		});

		return NextResponse.json(quotation);
	} catch (error) {
		console.error('DELETE /api/quotations/[id] error:', error);
		return NextResponse.json({ error: 'Failed to cancel quotation' }, { status: 500 });
	}
}
