import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/completed-works/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cw = await prisma.completedWork.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            quotation: {
              include: {
                customerGroup: true,
                items: true,
              },
            },
            team: true,
            purchaseOrders: true,
          },
        },
        photos: { orderBy: { createdAt: 'asc' } },
        serviceItems: { orderBy: { itemNo: 'asc' } },
      },
    });
    if (!cw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(cw);
  } catch (error) {
    console.error('GET /api/completed-works/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH /api/completed-works/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, notes, completionDate, serviceItems } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (completionDate) updateData.completionDate = new Date(completionDate);

    const cw = await prisma.completedWork.update({
      where: { id },
      data: updateData,
    });

    // Update service items if provided
    if (serviceItems) {
      await prisma.serviceReportItem.deleteMany({ where: { completedWorkId: id } });
      if (serviceItems.length > 0) {
        await prisma.serviceReportItem.createMany({
          data: serviceItems.map((item: { itemNo: number; description: string }) => ({
            completedWorkId: id,
            itemNo: item.itemNo,
            description: item.description,
          })),
        });
      }
    }

    // If status changed, also update work order
    if (status) {
      const woStatus = status === 'PAID' ? 'PAID' : 'COMPLETED';
      await prisma.workOrder.update({
        where: { id: cw.workOrderId },
        data: { status: woStatus },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/completed-works/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
