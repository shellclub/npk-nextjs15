import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/work-order-statuses — List all statuses
export async function GET() {
  try {
    const statuses = await prisma.workOrderStatusConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('GET /api/work-order-statuses error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/work-order-statuses — Create a new status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
    }

    // Check unique code
    const existing = await prisma.workOrderStatusConfig.findUnique({ where: { code: body.code } });
    if (existing) {
      return NextResponse.json({ error: 'code already exists' }, { status: 409 });
    }

    // Get next sortOrder
    const maxSort = await prisma.workOrderStatusConfig.findFirst({ orderBy: { sortOrder: 'desc' } });
    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    const status = await prisma.workOrderStatusConfig.create({
      data: {
        name: body.name,
        code: body.code.toUpperCase().replace(/\s+/g, '_'),
        color: body.color || '#64748B',
        bgColor: body.bgColor || '#F1F5F9',
        sortOrder,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error('POST /api/work-order-statuses error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
