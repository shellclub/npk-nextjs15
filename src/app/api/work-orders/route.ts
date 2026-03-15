import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-orders — List all work orders
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
        { woNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { branch: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        quotation: { select: { quotationNumber: true, customerGroup: { select: { groupName: true } } } },
        branch: true,
        team: { select: { teamName: true, leaderName: true } },
        createdBy: { select: { name: true } },
        purchaseOrders: { select: { id: true, poNumber: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('GET /api/work-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

// POST /api/work-orders — Create a new work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate WO number: WO-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `WO-${yy}${mm}${dd}`;

    const lastWO = await prisma.workOrder.findFirst({
      where: { woNumber: { startsWith: prefix } },
      orderBy: { woNumber: 'desc' },
    });

    let seq = 1;
    if (lastWO) {
      const lastSeq = parseInt(lastWO.woNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    const woNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    // Resolve creator ID
    let createdById = body.createdById;
    if (!createdById || createdById === 'system') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!adminUser) {
        return NextResponse.json({ error: 'No admin user found' }, { status: 400 });
      }
      createdById = adminUser.id;
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        quotationId: body.quotationId || null,
        branchId: body.branchId || null,
        teamId: body.teamId || null,
        date: new Date(body.date || now),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        description: body.description || null,
        totalAmount: body.totalAmount || 0,
        status: body.status || 'PENDING',
        notes: body.notes || null,
        createdById,
      },
      include: {
        quotation: { select: { quotationNumber: true, customerGroup: { select: { groupName: true } } } },
        branch: true,
        team: true,
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('POST /api/work-orders error:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
