import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/work-order-statuses/[id] — Update
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const status = await prisma.workOrderStatusConfig.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.code !== undefined && { code: body.code.toUpperCase().replace(/\s+/g, '_') }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.bgColor !== undefined && { bgColor: body.bgColor }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(status);
  } catch (error) {
    console.error('PATCH /api/work-order-statuses/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/work-order-statuses/[id] — Delete
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.workOrderStatusConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/work-order-statuses/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
