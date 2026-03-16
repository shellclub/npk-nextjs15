import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/quotations/[id]/duplicate — Duplicate a quotation with new number
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the original quotation with items
    const original = await prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { itemOrder: 'asc' } } },
    });

    if (!original) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Generate new quotation number: Q-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `Q-${yy}${mm}${dd}`;

    const lastQuotation = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: 'desc' },
    });

    let seq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    const quotationNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    // Resolve creator — use first admin as fallback
    let createdById = original.createdById;
    if (!createdById) {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      createdById = adminUser?.id || original.createdById;
    }

    // Create the duplicated quotation with same items & prices but new number
    const duplicated = await prisma.quotation.create({
      data: {
        quotationNumber,
        date: now,
        customerGroupId: original.customerGroupId,
        branchId: original.branchId,
        contactPerson: original.contactPerson,
        projectName: original.projectName,
        subtotal: original.subtotal,
        discountPercent: original.discountPercent,
        discountAmount: original.discountAmount,
        vatPercent: original.vatPercent,
        vatAmount: original.vatAmount,
        totalAmount: original.totalAmount,
        status: 'DRAFT', // Always start as draft
        notes: original.notes,
        validDays: original.validDays,
        warranty: original.warranty,
        createdById: createdById!,
        items: {
          createMany: {
            data: original.items.map((item) => ({
              itemOrder: item.itemOrder,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
        },
      },
      include: {
        customerGroup: true,
        branch: true,
        items: { orderBy: { itemOrder: 'asc' } },
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error('POST /api/quotations/[id]/duplicate error:', error);
    return NextResponse.json({ error: 'Failed to duplicate quotation' }, { status: 500 });
  }
}
