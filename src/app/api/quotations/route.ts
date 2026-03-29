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
        items: { orderBy: { itemOrder: 'asc' } },
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

    // Generate quotation number: Npk-YYMMDD-XXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `Npk-${yy}${mm}${dd}`;

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

    // Calculate totals from items (only ITEM type, not HEADER)
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { itemType?: string; quantity: number; materialPrice?: number; labourPrice?: number; unitPrice?: number }) => {
        if (item.itemType === 'HEADER') return sum;
        const matTotal = (item.quantity || 0) * (item.materialPrice || 0);
        const labTotal = (item.quantity || 0) * (item.labourPrice || 0);
        return sum + matTotal + labTotal;
      },
      0
    );
    const discountAmount = body.discountAmount || 0;
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
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        projectName: body.projectName || null,
        subtotal,
        discountPercent: 0,
        discountAmount,
        vatPercent,
        vatAmount,
        totalAmount,
        status: body.status || 'DRAFT',
        notes: body.notes || null,
        conditions: body.conditions || null,
        validDays: body.validDays || 30,
        warranty: body.conditions || body.warranty || null,
        createdById,
        items: {
          createMany: {
            data: items.map(
              (
                item: {
                  itemType?: string;
                  parentIndex?: number;
                  description: string;
                  unit: string;
                  quantity: number;
                  unitPrice?: number;
                  materialPrice?: number;
                  labourPrice?: number;
                },
                index: number
              ) => {
                const isHeader = item.itemType === 'HEADER';
                const matPrice = item.materialPrice || 0;
                const labPrice = item.labourPrice || 0;
                const qty = isHeader ? 0 : (item.quantity || 0);
                const amount = isHeader ? 0 : (qty * matPrice + qty * labPrice);
                return {
                  itemOrder: index + 1,
                  itemType: item.itemType || 'ITEM',
                  parentIndex: item.parentIndex ?? null,
                  description: item.description,
                  unit: isHeader ? '' : (item.unit || ''),
                  quantity: qty,
                  unitPrice: matPrice + labPrice,
                  materialPrice: matPrice,
                  labourPrice: labPrice,
                  amount,
                };
              }
            ),
          },
        },
      },
      include: {
        customerGroup: true,
        branch: true,
        items: { orderBy: { itemOrder: 'asc' } },
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}
