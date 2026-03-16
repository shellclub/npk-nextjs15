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

    // Calculate totals from items
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = body.discountPercent
      ? (subtotal * body.discountPercent) / 100
      : body.discountAmount || 0;
    const afterDiscount = subtotal - discountAmount;
    const vatPercent = body.vatPercent ?? existing.vatPercent ?? 7;
    const vatAmount = (afterDiscount * Number(vatPercent)) / 100;
    const totalAmount = afterDiscount + vatAmount;

    // Delete old items then re-create
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        customerGroupId: body.customerGroupId || undefined,
        branchId: body.branchId ?? undefined,
        contactPerson: body.contactPerson ?? undefined,
        projectName: body.projectName ?? undefined,
        subtotal,
        discountPercent: body.discountPercent ?? 0,
        discountAmount,
        vatPercent: Number(vatPercent),
        vatAmount,
        totalAmount,
        status: body.status || undefined,
        notes: body.notes ?? undefined,
        validDays: body.validDays ?? undefined,
        warranty: body.warranty ?? undefined,
        items: {
          createMany: {
            data: items.map(
              (
                item: {
                  description: string;
                  unit: string;
                  quantity: number;
                  unitPrice: number;
                },
                index: number
              ) => ({
                itemOrder: index + 1,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })
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
