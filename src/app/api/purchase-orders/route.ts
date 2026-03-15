import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchase-orders — List all purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { team: { teamName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        workOrder: { select: { woNumber: true, branch: { select: { name: true } } } },
        team: { select: { teamName: true, leaderName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('GET /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/purchase-orders — Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate PO number: PO-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `PO-${yy}${mm}${dd}`;

    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: 'desc' },
    });

    let seq = 1;
    if (lastPO) {
      const lastSeq = parseInt(lastPO.poNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    const poNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    // Calculate totals
    const items = body.items || [];
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        workOrderId: body.workOrderId || null,
        teamId: body.teamId || null,
        date: new Date(body.date || now),
        totalAmount,
        status: body.status || 'DRAFT',
        notes: body.notes || null,
        items: {
          createMany: {
            data: items.map(
              (
                item: { description: string; unit: string; quantity: number; unitPrice: number },
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
        workOrder: true,
        team: true,
        items: true,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
