import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/withholding-tax
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { whtNumber: { contains: search, mode: 'insensitive' } },
        { payeeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const whtList = await prisma.withholdingTax.findMany({
      where,
      include: {
        paymentVoucher: {
          select: {
            voucherNumber: true,
            amount: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(whtList);
  } catch (error) {
    console.error('GET /api/withholding-tax error:', error);
    return NextResponse.json({ error: 'Failed to fetch withholding tax records' }, { status: 500 });
  }
}
