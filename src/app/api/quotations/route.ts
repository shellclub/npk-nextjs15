import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/quotations — List all quotations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { projectName: { contains: search, mode: 'insensitive' } },
        { customerGroup: { groupName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customerGroup: true,
        branch: true,
        createdBy: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations — Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate quotation number: npk-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `npk-${yy}${mm}${dd}`;

    const lastQuotation = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: 'desc' },
    });

    let seq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    const quotationNumber = `${prefix}-${String(seq).padStart(3, '0')}`;

    // Calculate totals
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = body.discountPercent
      ? (subtotal * body.discountPercent) / 100
      : body.discountAmount || 0;
    const afterDiscount = subtotal - discountAmount;
    const vatPercent = body.vatPercent ?? 7;
    const vatAmount = (afterDiscount * vatPercent) / 100;
    const totalAmount = afterDiscount + vatAmount;

    // Resolve creator ID — use provided or fallback to first admin
    let createdById = body.createdById;
    if (!createdById || createdById === 'system') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!adminUser) {
        return NextResponse.json({ error: 'No admin user found' }, { status: 400 });
      }
      createdById = adminUser.id;
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        date: new Date(body.date || now),
        customerGroupId: body.customerGroupId,
        branchId: body.branchId || null,
        contactPerson: body.contactPerson || null,
        projectName: body.projectName || null,
        subtotal,
        discountPercent: body.discountPercent || 0,
        discountAmount,
        vatPercent,
        vatAmount,
        totalAmount,
        status: body.status || 'DRAFT',
        notes: body.notes || null,
        validDays: body.validDays || 30,
        warranty: body.warranty || null,
        createdById,
        items: {
          createMany: {
            data: items.map(
              (
                item: {
                  description: string;
                  unit: string;
                  quantity: number;
                  unitPrice: number;
                },
                index: number
              ) => ({
                itemOrder: index + 1,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })
            ),
          },
        },
      },
      include: {
        customerGroup: true,
        branch: true,
        items: true,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}
