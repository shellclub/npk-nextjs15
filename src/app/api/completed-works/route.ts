import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/completed-works — List all completed works
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { workOrder: { woNumber: { contains: search, mode: 'insensitive' } } },
        { workOrder: { quotation: { customerGroup: { groupName: { contains: search, mode: 'insensitive' } } } } },
        { workOrder: { quotation: { projectName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const items = await prisma.completedWork.findMany({
      where,
      include: {
        workOrder: {
          include: {
            quotation: {
              include: {
                customerGroup: true,
              },
            },
            team: true,
            purchaseOrders: { select: { id: true } },
          },
        },
        photos: { select: { id: true, photoType: true } },
        serviceItems: { select: { id: true } },
      },
      orderBy: { completionDate: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/completed-works error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/completed-works — Create a new completed work record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workOrderId, completionDate, notes, serviceItems } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: 'workOrderId is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.completedWork.findUnique({ where: { workOrderId } });
    if (existing) {
      return NextResponse.json({ error: 'งานนี้มีบันทึกเสร็จแล้ว' }, { status: 400 });
    }

    const cw = await prisma.completedWork.create({
      data: {
        workOrderId,
        completionDate: completionDate ? new Date(completionDate) : new Date(),
        notes: notes || null,
        status: 'COMPLETED',
        serviceItems: serviceItems?.length > 0 ? {
          create: serviceItems.map((item: { itemNo: number; description: string }) => ({
            itemNo: item.itemNo,
            description: item.description,
          })),
        } : undefined,
      },
      include: {
        workOrder: true,
        serviceItems: true,
      },
    });

    // Update work order status to COMPLETED
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json(cw);
  } catch (error) {
    console.error('POST /api/completed-works error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
