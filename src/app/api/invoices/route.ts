import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        workOrder: {
          select: {
            woNumber: true,
            quotation: {
              select: {
                quotationNumber: true,
                customerGroup: { select: { groupName: true } },
              },
            },
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const prefix = `INV-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const last = await prisma.invoice.findFirst({ where: { invoiceNumber: { startsWith: prefix } }, orderBy: { invoiceNumber: 'desc' } });
    const seq = last ? parseInt(last.invoiceNumber.split('-').pop() || '0', 10) + 1 : 1;
    const invoiceNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        workOrderId: body.workOrderId || null,
        date: new Date(body.date || now),
        dueDate: new Date(body.dueDate || now),
        subtotal: body.subtotal || 0,
        vatPercent: body.vatPercent ?? 7,
        vatAmount: body.vatAmount || 0,
        totalAmount: body.totalAmount || 0,
        status: body.status || 'UNPAID',
        notes: body.notes || null,
      },
      include: { workOrder: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
