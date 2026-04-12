import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/purchase-orders/[id]/adjustments — Add an adjustment (append-only, cannot delete)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { adjustments: true },
    });
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Create adjustment
    const adjustment = await prisma.pOAdjustment.create({
      data: {
        purchaseOrderId: id,
        adjustmentType: body.adjustmentType || 'ADD', // ADD or DEDUCT
        description: body.description || '',
        amount: body.amount || 0,
        createdBy: body.createdBy || null,
      },
    });

    // Recalculate total: base total + all ADD amounts - all DEDUCT amounts
    const allAdjustments = await prisma.pOAdjustment.findMany({
      where: { purchaseOrderId: id },
    });

    let totalAdds = 0;
    let totalDeducts = 0;
    allAdjustments.forEach(adj => {
      if (adj.adjustmentType === 'ADD') {
        totalAdds += Number(adj.amount);
      } else {
        totalDeducts += Number(adj.amount);
      }
    });

    // Update PO total (totalAmount from base + adjustments)
    const baseTotalStr = body.baseTotal; // Pass from client if needed
    if (baseTotalStr !== undefined) {
      const newTotal = Number(baseTotalStr) + totalAdds - totalDeducts;
      await prisma.purchaseOrder.update({
        where: { id },
        data: { totalAmount: newTotal },
      });
    }

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders/[id]/adjustments error:', error);
    return NextResponse.json({ error: 'Failed to add adjustment' }, { status: 500 });
  }
}

// GET /api/purchase-orders/[id]/adjustments — List adjustments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adjustments = await prisma.pOAdjustment.findMany({
      where: { purchaseOrderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(adjustments);
  } catch (error) {
    console.error('GET /api/purchase-orders/[id]/adjustments error:', error);
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 });
  }
}
