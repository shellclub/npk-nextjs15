import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rv = await prisma.receiptVoucher.findUnique({
      where: { id },
      include: { invoice: { include: { workOrder: { include: { quotation: { include: { customerGroup: true, branch: true } } } } } } },
    });
    if (!rv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rv);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const rv = await prisma.receiptVoucher.update({ where: { id }, data: body });
    return NextResponse.json(rv);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.receiptVoucher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
