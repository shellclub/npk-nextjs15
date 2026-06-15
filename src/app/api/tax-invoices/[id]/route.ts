import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ti = await prisma.taxInvoice.findUnique({
      where: { id },
      include: { invoice: { include: { workOrder: { include: { quotation: { include: { customerGroup: true, branch: true, items: { orderBy: { itemOrder: 'asc' } } } } } } } } },
    });
    if (!ti) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ti);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const ti = await prisma.taxInvoice.update({ where: { id }, data: body });
    return NextResponse.json(ti);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.taxInvoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
