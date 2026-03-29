import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-orders/[id] — Get single work order
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        quotation: {
          select: {
            quotationNumber: true,
            projectName: true,
            customerGroup: { select: { groupName: true } },
          },
        },
        branch: true,
        team: { select: { teamName: true, leaderName: true } },
        createdBy: { select: { name: true } },
        purchaseOrders: { select: { id: true, poNumber: true, totalAmount: true, status: true } },
      },
    });
    if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    return NextResponse.json(wo);
  } catch (error) {
    console.error('GET /api/work-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch work order' }, { status: 500 });
  }
}

// PATCH /api/work-orders/[id] — Update work order (status, description, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.description !== undefined) data.description = body.description;
    if (body.totalAmount !== undefined) data.totalAmount = body.totalAmount;
    if (body.teamId !== undefined) data.teamId = body.teamId || null;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.customerPO !== undefined) data.customerPO = body.customerPO || null;

    const updated = await prisma.workOrder.update({
      where: { id },
      data,
      include: {
        quotation: { select: { quotationNumber: true, customerGroup: { select: { groupName: true } } } },
        branch: true,
        team: { select: { teamName: true, leaderName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/work-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
  }
}

// DELETE /api/work-orders/[id] — Delete work order
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.workOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/work-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
  }
}
