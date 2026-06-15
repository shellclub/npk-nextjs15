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

// POST /api/withholding-tax — สร้าง 50 ทวิ จากใบสำคัญจ่าย
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.paymentVoucherId) {
      return NextResponse.json({ error: 'paymentVoucherId is required' }, { status: 400 });
    }

    const pv = await prisma.paymentVoucher.findUnique({
      where: { id: body.paymentVoucherId },
      include: { withholdingTax: true },
    });
    if (!pv) return NextResponse.json({ error: 'Payment voucher not found' }, { status: 404 });
    if (pv.withholdingTax) {
      return NextResponse.json({ error: 'Already has withholding tax', existingId: pv.withholdingTax.id }, { status: 400 });
    }

    const now = new Date();
    const prefix = `WHT-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const last = await prisma.withholdingTax.findFirst({ where: { whtNumber: { startsWith: prefix } }, orderBy: { whtNumber: 'desc' } });
    const seq = last ? parseInt(last.whtNumber.split('-').pop() || '0', 10) + 1 : 1;

    const incomeAmount = Number(body.incomeAmount ?? pv.amount);
    const taxRate = Number(body.taxRate ?? 3);
    const taxAmount = Number(body.taxAmount ?? (incomeAmount * taxRate / 100));

    const wht = await prisma.withholdingTax.create({
      data: {
        whtNumber: `${prefix}-${String(seq).padStart(3, '0')}`,
        paymentVoucherId: pv.id,
        payeeName: body.payeeName || pv.payeeName,
        payeeTaxId: body.payeeTaxId || null,
        payeeAddress: body.payeeAddress || null,
        incomeType: body.incomeType || 'ค่าจ้าง',
        taxRate,
        incomeAmount,
        taxAmount,
        date: new Date(body.date || pv.date || now),
        notes: body.notes || null,
      },
      include: {
        paymentVoucher: { select: { voucherNumber: true, amount: true, paymentMethod: true } },
      },
    });

    return NextResponse.json(wht, { status: 201 });
  } catch (error) {
    console.error('POST /api/withholding-tax error:', error);
    return NextResponse.json({ error: 'Failed to create withholding tax' }, { status: 500 });
  }
}
