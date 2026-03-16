import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payment-vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { voucherNumber: { contains: search, mode: 'insensitive' } },
        { payeeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vouchers = await prisma.paymentVoucher.findMany({
      where,
      include: {
        withholdingTax: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('GET /api/payment-vouchers error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment vouchers' }, { status: 500 });
  }
}

// POST /api/payment-vouchers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const prefix = `PV-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const last = await prisma.paymentVoucher.findFirst({
      where: { voucherNumber: { startsWith: prefix } },
      orderBy: { voucherNumber: 'desc' },
    });
    const seq = last ? parseInt(last.voucherNumber.split('-').pop() || '0', 10) + 1 : 1;
    const voucherNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    const voucher = await prisma.paymentVoucher.create({
      data: {
        voucherNumber,
        date: new Date(body.date || now),
        payeeName: body.payeeName || '',
        amount: body.amount || 0,
        paymentMethod: body.paymentMethod || 'TRANSFER',
        bankName: body.bankName || null,
        chequeNumber: body.chequeNumber || null,
        chequeDate: body.chequeDate ? new Date(body.chequeDate) : null,
        description: body.description || null,
        notes: body.notes || null,
      },
    });

    // If withholding tax info provided, create it
    if (body.withholding && body.withholding.payeeTaxId) {
      const whtPrefix = `WHT-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const lastWht = await prisma.withholdingTax.findFirst({
        where: { whtNumber: { startsWith: whtPrefix } },
        orderBy: { whtNumber: 'desc' },
      });
      const whtSeq = lastWht ? parseInt(lastWht.whtNumber.split('-').pop() || '0', 10) + 1 : 1;

      await prisma.withholdingTax.create({
        data: {
          whtNumber: `${whtPrefix}-${String(whtSeq).padStart(3, '0')}`,
          paymentVoucherId: voucher.id,
          payeeName: body.withholding.payeeName || body.payeeName,
          payeeTaxId: body.withholding.payeeTaxId,
          payeeAddress: body.withholding.payeeAddress || null,
          incomeType: body.withholding.incomeType || 'ค่าจ้าง',
          taxRate: body.withholding.taxRate || 3,
          incomeAmount: body.withholding.incomeAmount || body.amount,
          taxAmount: body.withholding.taxAmount || 0,
          date: new Date(body.date || now),
          notes: body.withholding.notes || null,
        },
      });
    }

    // Re-fetch with relations
    const result = await prisma.paymentVoucher.findUnique({
      where: { id: voucher.id },
      include: { withholdingTax: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/payment-vouchers error:', error);
    return NextResponse.json({ error: 'Failed to create payment voucher' }, { status: 500 });
  }
}
