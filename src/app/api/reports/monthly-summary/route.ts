import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/reports/monthly-summary?year=2569&teamId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearBE = parseInt(searchParams.get('year') || '0', 10);
    const monthParam = searchParams.get('month');
    const teamId = searchParams.get('teamId');
    const teamName = searchParams.get('teamName');
    const statusFilter = searchParams.get('status'); // comma-separated status codes

    // Convert Buddhist year to CE
    const yearCE = yearBE > 2500 ? yearBE - 543 : yearBE || new Date().getFullYear();
    const startOfYear = new Date(yearCE, 0, 1);
    const endOfYear = new Date(yearCE + 1, 0, 1);

    // Build where clause
    const where: Record<string, unknown> = {
      date: { gte: startOfYear, lt: endOfYear },
      status: { not: 'CANCELLED' },
    };
    if (teamId) where.teamId = teamId;
    if (teamName) where.teamName = { contains: teamName, mode: 'insensitive' };
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      where.status = { in: statuses };
    }

    // Fetch all work orders for the year
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        quotation: {
          select: { subtotal: true, totalAmount: true, projectName: true, quotationNumber: true },
        },
        purchaseOrders: {
          select: { totalAmount: true },
        },
        team: { select: { teamName: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Monthly drill-down: return WO list for a specific month
    if (monthParam) {
      const monthNum = parseInt(monthParam, 10);
      const monthWOs = workOrders
        .filter(wo => new Date(wo.date).getMonth() + 1 === monthNum)
        .map(wo => {
          const qSubtotal = wo.quotation ? Number(wo.quotation.subtotal || wo.quotation.totalAmount || 0) : Number(wo.totalAmount);
          const poCost = wo.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
          return {
            id: wo.id,
            woNumber: wo.woNumber,
            date: wo.date,
            status: wo.status,
            projectName: wo.quotation?.projectName || wo.description || '-',
            quotationNumber: wo.quotation?.quotationNumber || '-',
            teamName: wo.team?.teamName || '-',
            quotationTotal: qSubtotal,
            actualCost: poCost,
            actualRevenue: qSubtotal - poCost,
          };
        });

      const monthSummary = monthWOs.reduce(
        (acc, wo) => ({
          quotationTotal: acc.quotationTotal + wo.quotationTotal,
          actualCost: acc.actualCost + wo.actualCost,
          actualRevenue: acc.actualRevenue + wo.actualRevenue,
          woCount: acc.woCount + 1,
        }),
        { quotationTotal: 0, actualCost: 0, actualRevenue: 0, woCount: 0 }
      );

      return NextResponse.json({
        year: yearBE > 2500 ? yearBE : yearCE + 543,
        yearCE,
        month: monthNum,
        workOrders: monthWOs,
        summary: monthSummary,
      });
    }

    // Aggregate by month (1-12)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      quotationTotal: 0,     // เสนอราคา (subtotal before VAT)
      actualCost: 0,          // ต้นทุนที่แท้จริง (PO totals)
      actualRevenue: 0,       // รายได้ที่แท้จริง (quotation - cost)
      woCount: 0,
    }));

    workOrders.forEach(wo => {
      const monthIndex = new Date(wo.date).getMonth(); // 0-11
      const qSubtotal = wo.quotation ? Number(wo.quotation.subtotal || wo.quotation.totalAmount || 0) : Number(wo.totalAmount);
      const poCost = wo.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);

      monthlyData[monthIndex].quotationTotal += qSubtotal;
      monthlyData[monthIndex].actualCost += poCost;
      monthlyData[monthIndex].actualRevenue += (qSubtotal - poCost);
      monthlyData[monthIndex].woCount += 1;
    });

    // Calculate totals
    const totals = monthlyData.reduce(
      (acc, m) => ({
        quotationTotal: acc.quotationTotal + m.quotationTotal,
        actualCost: acc.actualCost + m.actualCost,
        actualRevenue: acc.actualRevenue + m.actualRevenue,
        woCount: acc.woCount + m.woCount,
      }),
      { quotationTotal: 0, actualCost: 0, actualRevenue: 0, woCount: 0 }
    );

    return NextResponse.json({
      year: yearBE > 2500 ? yearBE : yearCE + 543,
      yearCE,
      monthly: monthlyData,
      totals,
      vat7: {
        quotationTotal: totals.quotationTotal * 0.07,
        actualCost: totals.actualCost * 0.07,
        actualRevenue: totals.actualRevenue * 0.07,
      },
    });
  } catch (error) {
    console.error('GET /api/reports/monthly-summary error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
