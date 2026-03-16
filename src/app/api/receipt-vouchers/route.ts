import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/receipt-vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.voucherNumber = { contains: search, mode: 'insensitive' };
    }

    const vouchers = await prisma.receiptVoucher.findMany({
      where,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            workOrder: {
              select: {
                woNumber: true,
                quotation: {
                  select: {
                    customerGroup: { select: { groupName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('GET /api/receipt-vouchers error:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt vouchers' }, { status: 500 });
  }
}

// POST /api/receipt-vouchers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const prefix = `RV-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const last = await prisma.receiptVoucher.findFirst({
      where: { voucherNumber: { startsWith: prefix } },
      orderBy: { voucherNumber: 'desc' },
    });
    const seq = last ? parseInt(last.voucherNumber.split('-').pop() || '0', 10) + 1 : 1;
    const voucherNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    const voucher = await prisma.receiptVoucher.create({
      data: {
        voucherNumber,
        invoiceId: body.invoiceId || null,
        date: new Date(body.date || now),
        amount: body.amount || 0,
        paymentMethod: body.paymentMethod || 'TRANSFER',
        bankName: body.bankName || null,
        chequeNumber: body.chequeNumber || null,
        chequeDate: body.chequeDate ? new Date(body.chequeDate) : null,
        notes: body.notes || null,
      },
      include: { invoice: true },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error('POST /api/receipt-vouchers error:', error);
    return NextResponse.json({ error: 'Failed to create receipt voucher' }, { status: 500 });
  }
}
