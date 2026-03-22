import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/quotations/[id]/share — Get quotation data for public share view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const q = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customerGroup: true,
        branch: true,
        createdBy: { select: { name: true } },
        items: { orderBy: { itemOrder: 'asc' } },
      },
    });

    if (!q) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Display quotation number with Rev
    const displayQN = (q.revisionNumber || 0) > 0
      ? `${q.quotationNumber} Rev.${q.revisionNumber}`
      : q.quotationNumber;

    // Return safe public data (no internal IDs exposed beyond quotation)
    return NextResponse.json({
      quotationNumber: displayQN,
      date: q.date,
      customerName: q.customerGroup?.groupName || '',
      customerAddress: q.customerGroup?.headOfficeAddress || '',
      branchName: q.branch ? `${q.branch.code || ''} ${q.branch.name}` : '',
      contactPerson: q.contactPerson || '',
      contactPhone: q.contactPhone || '',
      projectName: q.projectName || '',
      items: q.items.map(item => ({
        itemType: item.itemType || 'ITEM',
        parentIndex: item.parentIndex,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || '',
        unitPrice: Number(item.unitPrice),
        materialPrice: Number(item.materialPrice || 0),
        labourPrice: Number(item.labourPrice || 0),
        amount: Number(item.amount),
      })),
      subtotal: Number(q.subtotal),
      discountPercent: Number(q.discountPercent),
      discountAmount: Number(q.discountAmount),
      vatPercent: Number(q.vatPercent),
      vatAmount: Number(q.vatAmount),
      totalAmount: Number(q.totalAmount),
      conditions: q.conditions || q.warranty || '',
      notes: q.notes,
      validDays: q.validDays,
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}
