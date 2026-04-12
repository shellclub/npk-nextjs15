import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchase-orders — List all purchase orders
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
        { poNumber: { contains: search, mode: 'insensitive' } },
        { team: { teamName: { contains: search, mode: 'insensitive' } } },
        { team: { leaderName: { contains: search, mode: 'insensitive' } } },
        { workOrder: { woNumber: { contains: search, mode: 'insensitive' } } },
        { quotation: { quotationNumber: { contains: search, mode: 'insensitive' } } },
        { quotation: { projectName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        workOrder: {
          select: {
            woNumber: true,
            poNumber: true,
            poDate: true,
            date: true,
            description: true,
            quotation: {
              select: {
                quotationNumber: true,
                projectName: true,
                customerGroup: { select: { groupName: true } },
                branch: { select: { name: true, code: true } },
              },
            },
          },
        },
        quotation: {
          select: {
            quotationNumber: true,
            projectName: true,
            subtotal: true,
            totalAmount: true,
            customerGroup: { select: { groupName: true } },
            branch: { select: { name: true, code: true } },
          },
        },
        team: { select: { teamName: true, leaderName: true, leaderPhone: true, leaderAddress: true } },
        adjustments: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('GET /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/purchase-orders — Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate PO number: PO{YYMMDD}/Npk-{XXX}
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2); // CE last 2 digits
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `PO${yy}${mm}${dd}`;

    // Find last PO with same date prefix
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: datePrefix } },
      orderBy: { poNumber: 'desc' },
    });

    let seq = 1;
    if (lastPO) {
      // Extract sequence from "PO260319/Npk-001" -> "001"
      const match = lastPO.poNumber.match(/Npk-(\d+)$/);
      if (match) {
        seq = parseInt(match[1], 10) + 1;
      }
    }
    const poNumber = `${datePrefix}/Npk-${String(seq).padStart(3, '0')}`;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        workOrderId: body.workOrderId || null,
        quotationId: body.quotationId || null,
        teamId: body.teamId || null,
        date: new Date(body.date || now),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        warrantyStartDate: body.warrantyStartDate ? new Date(body.warrantyStartDate) : null,
        warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
        contractorQuoteUrl: body.contractorQuoteUrl || null,
        discountPercent: body.discountPercent || 0,
        vatPercent: body.vatPercent ?? 7,
        totalAmount: body.totalAmount || 0,
        status: body.status || 'DRAFT',
        notes: body.notes || null,
        conditions: body.conditions || null,
        // Create initial adjustments if provided
        adjustments: body.adjustments?.length > 0 ? {
          createMany: {
            data: body.adjustments.map((adj: { adjustmentType: string; description: string; amount: number; createdBy?: string }) => ({
              adjustmentType: adj.adjustmentType,
              description: adj.description,
              amount: adj.amount,
              createdBy: adj.createdBy || null,
            })),
          },
        } : undefined,
      },
      include: {
        workOrder: true,
        quotation: true,
        team: true,
        adjustments: true,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
