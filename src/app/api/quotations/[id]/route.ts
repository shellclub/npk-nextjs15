import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/quotations/[id] — Get single quotation with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customerGroup: { include: { branches: true } },
        branch: true,
        createdBy: { select: { name: true } },
        items: { orderBy: { itemOrder: 'asc' } },
      },
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
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if quotation exists
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Calculate totals from items (only ITEM type, not HEADER)
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { itemType?: string; quantity: number; materialPrice?: number; labourPrice?: number }) => {
        if (item.itemType === 'HEADER') return sum;
        const matTotal = (item.quantity || 0) * (item.materialPrice || 0);
        const labTotal = (item.quantity || 0) * (item.labourPrice || 0);
        return sum + matTotal + labTotal;
      },
      0
    );

    const discountAmount = body.discountAmount ?? Number(existing.discountAmount) ?? 0;
    const afterDiscount = subtotal - discountAmount;
    const vatPercent = body.vatPercent ?? existing.vatPercent ?? 7;
    const vatAmount = (afterDiscount * Number(vatPercent)) / 100;
    const totalAmount = afterDiscount + vatAmount;

    // Determine if we need to bump revision (when discount is changed)
    let revisionNumber = existing.revisionNumber || 0;
    if (body.discountAmount !== undefined && Number(body.discountAmount) !== Number(existing.discountAmount)) {
      revisionNumber += 1;
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
        projectName: body.projectName ?? undefined,
        subtotal,
        discountPercent: 0,
        discountAmount,
        vatPercent: Number(vatPercent),
        vatAmount,
        totalAmount,
        revisionNumber,
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
                },
                index: number
              ) => {
                const isHeader = item.itemType === 'HEADER';
                const matPrice = item.materialPrice || 0;
                const labPrice = item.labourPrice || 0;
                const qty = isHeader ? 0 : (item.quantity || 0);
                const amount = isHeader ? 0 : (qty * matPrice + qty * labPrice);
                return {
                  itemOrder: index + 1,
                  itemType: item.itemType || 'ITEM',
                  parentIndex: item.parentIndex ?? null,
                  description: item.description,
                  unit: isHeader ? '' : (item.unit || ''),
                  quantity: qty,
                  unitPrice: matPrice + labPrice,
                  materialPrice: matPrice,
                  labourPrice: labPrice,
                  amount,
                };
              }
            ),
          },
        },
      },
      include: {
        customerGroup: true,
        branch: true,
        items: { orderBy: { itemOrder: 'asc' } },
      },
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('PATCH /api/quotations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

// DELETE /api/quotations/[id] — Cancel (set status to CANCELLED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Soft-delete: change status to CANCELLED
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('DELETE /api/quotations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to cancel quotation' }, { status: 500 });
  }
}
