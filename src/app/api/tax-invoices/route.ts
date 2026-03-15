import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tax-invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.taxInvoiceNumber = { contains: search, mode: 'insensitive' };
    }

    const taxInvoices = await prisma.taxInvoice.findMany({
      where,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            workOrder: {
              select: {
                woNumber: true,
                quotation: {
                  select: {
                    customerGroup: { select: { groupName: true, taxId: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(taxInvoices);
  } catch (error) {
    console.error('GET /api/tax-invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch tax invoices' }, { status: 500 });
  }
}

// POST /api/tax-invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const prefix = `TI-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const last = await prisma.taxInvoice.findFirst({ where: { taxInvoiceNumber: { startsWith: prefix } }, orderBy: { taxInvoiceNumber: 'desc' } });
    const seq = last ? parseInt(last.taxInvoiceNumber.split('-').pop() || '0', 10) + 1 : 1;

    const taxInvoice = await prisma.taxInvoice.create({
      data: {
        taxInvoiceNumber: `${prefix}-${String(seq).padStart(3, '0')}`,
        invoiceId: body.invoiceId,
        date: new Date(body.date || now),
        subtotal: body.subtotal || 0,
        vatAmount: body.vatAmount || 0,
        totalAmount: body.totalAmount || 0,
        notes: body.notes || null,
      },
      include: { invoice: true },
    });

    return NextResponse.json(taxInvoice, { status: 201 });
  } catch (error) {
    console.error('POST /api/tax-invoices error:', error);
    return NextResponse.json({ error: 'Failed to create tax invoice' }, { status: 500 });
  }
}
