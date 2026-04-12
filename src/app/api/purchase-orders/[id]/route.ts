import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchase-orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            poNumber: true,
            poDate: true,
            date: true,
            description: true,
            startDate: true,
            endDate: true,
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                projectName: true,
                subtotal: true,
                totalAmount: true,
                contactPerson: true,
                contactPhone: true,
                customerGroup: { select: { groupName: true } },
                branch: { select: { name: true, code: true } },
              },
            },
          },
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            projectName: true,
            subtotal: true,
            totalAmount: true,
            contactPerson: true,
            contactPhone: true,
            customerGroup: { select: { groupName: true } },
            branch: { select: { name: true, code: true } },
            items: { orderBy: { itemOrder: 'asc' } },
          },
        },
        team: true,
        adjustments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    return NextResponse.json(po);
  } catch (error) {
    console.error('GET /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 });
  }
}

// PATCH /api/purchase-orders/[id] — Update PO
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        workOrderId: body.workOrderId !== undefined ? (body.workOrderId || null) : undefined,
        quotationId: body.quotationId !== undefined ? (body.quotationId || null) : undefined,
        teamId: body.teamId !== undefined ? (body.teamId || null) : undefined,
        date: body.date ? new Date(body.date) : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
        warrantyStartDate: body.warrantyStartDate !== undefined ? (body.warrantyStartDate ? new Date(body.warrantyStartDate) : null) : undefined,
        warrantyEndDate: body.warrantyEndDate !== undefined ? (body.warrantyEndDate ? new Date(body.warrantyEndDate) : null) : undefined,
        contractorQuoteUrl: body.contractorQuoteUrl !== undefined ? body.contractorQuoteUrl : undefined,
        totalAmount: body.totalAmount !== undefined ? body.totalAmount : undefined,
        status: body.status || undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        workOrder: true,
        quotation: true,
        team: true,
        adjustments: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json(po);
  } catch (error) {
    console.error('PATCH /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
  }
}

// DELETE /api/purchase-orders/[id] — Cancel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return NextResponse.json(po);
  } catch (error) {
    console.error('DELETE /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to cancel purchase order' }, { status: 500 });
  }
}
