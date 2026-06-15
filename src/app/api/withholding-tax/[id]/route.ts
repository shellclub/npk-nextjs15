import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const wht = await prisma.withholdingTax.findUnique({
      where: { id },
      include: {
        paymentVoucher: {
          select: { id: true, voucherNumber: true, amount: true, paymentMethod: true, date: true, payeeName: true },
        },
      },
    });
    if (!wht) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(wht);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.withholdingTax.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
