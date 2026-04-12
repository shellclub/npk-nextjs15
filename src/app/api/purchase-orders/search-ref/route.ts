import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/purchase-orders/search-ref?q=xxx — Search quotations & work orders for PO reference
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) {
      return NextResponse.json([]);
    }

    // Search quotations
    const quotations = await prisma.quotation.findMany({
      where: {
        OR: [
          { quotationNumber: { contains: q, mode: 'insensitive' } },
          { projectName: { contains: q, mode: 'insensitive' } },
          { customerGroup: { groupName: { contains: q, mode: 'insensitive' } } },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        customerGroup: { select: { groupName: true } },
        branch: { select: { name: true, code: true } },
        workOrders: {
          select: {
            id: true,
            woNumber: true,
            poNumber: true,
            poDate: true,
            date: true,
          },
          where: { status: { not: 'CANCELLED' } },
        },
        items: {
          orderBy: { itemOrder: 'asc' },
          select: {
            id: true,
            itemType: true,
            description: true,
            quantity: true,
            unit: true,
            materialPrice: true,
            labourPrice: true,
            parentIndex: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Also search work orders directly
    const workOrders = await prisma.workOrder.findMany({
      where: {
        OR: [
          { woNumber: { contains: q, mode: 'insensitive' } },
          { poNumber: { contains: q, mode: 'insensitive' } },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        quotation: {
          include: {
            customerGroup: { select: { groupName: true } },
            branch: { select: { name: true, code: true } },
            items: {
              orderBy: { itemOrder: 'asc' },
              select: {
                id: true,
                itemType: true,
                description: true,
                quantity: true,
                unit: true,
                materialPrice: true,
                labourPrice: true,
                parentIndex: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Combine results
    const results: Array<{
      type: string;
      quotationId: string | null;
      workOrderId: string | null;
      label: string;
      quotationNumber: string;
      woNumber?: string;
      poNumber?: string;
      customerName: string;
      branchName: string;
      projectName: string;
      subtotal: number;
      totalAmount: number;
      items: unknown[];
      workOrders: unknown[];
    }> = [];

    // From quotation search
    quotations.forEach(qt => {
      results.push({
        type: 'quotation',
        quotationId: qt.id,
        workOrderId: qt.workOrders[0]?.id || null,
        label: `${qt.quotationNumber} - ${qt.customerGroup?.groupName || ''} - ${qt.projectName || ''}`,
        quotationNumber: qt.quotationNumber,
        woNumber: qt.workOrders[0]?.woNumber,
        poNumber: qt.workOrders[0]?.poNumber || undefined,
        customerName: qt.customerGroup?.groupName || '',
        branchName: qt.branch ? `${qt.branch.code || ''} ${qt.branch.name}` : '',
        projectName: qt.projectName || '',
        subtotal: Number(qt.subtotal),
        totalAmount: Number(qt.totalAmount),
        items: qt.items,
        workOrders: qt.workOrders,
      });
    });

    // From WO search (only add if quotation not already in results)
    workOrders.forEach(wo => {
      if (wo.quotation && !results.find(r => r.quotationId === wo.quotation?.id)) {
        results.push({
          type: 'workOrder',
          quotationId: wo.quotation.id,
          workOrderId: wo.id,
          label: `${wo.woNumber} → ${wo.quotation.quotationNumber} - ${wo.quotation.customerGroup?.groupName || ''}`,
          quotationNumber: wo.quotation.quotationNumber,
          woNumber: wo.woNumber,
          poNumber: wo.poNumber || undefined,
          customerName: wo.quotation.customerGroup?.groupName || '',
          branchName: wo.quotation.branch ? `${wo.quotation.branch.code || ''} ${wo.quotation.branch.name}` : '',
          projectName: wo.quotation.projectName || '',
          subtotal: Number(wo.quotation.subtotal),
          totalAmount: Number(wo.quotation.totalAmount),
          items: wo.quotation.items,
          workOrders: [{ id: wo.id, woNumber: wo.woNumber, poNumber: wo.poNumber, poDate: wo.poDate, date: wo.date }],
        });
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/purchase-orders/search-ref error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
