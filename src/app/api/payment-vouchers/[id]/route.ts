import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pv = await prisma.paymentVoucher.findUnique({ where: { id }, include: { withholdingTax: true } });
    if (!pv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(pv);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const pv = await prisma.paymentVoucher.update({ where: { id }, data: body });
    return NextResponse.json(pv);
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.paymentVoucher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
