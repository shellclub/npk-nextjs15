import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/dashboard — Aggregate summary for dashboard
export async function GET() {
  try {
    // Run each section independently so one failure doesn't crash everything
    let quotationsData = { total: 0, draft: 0, sent: 0, approved: 0, cancelled: 0, totalAmount: 0 };
    let workOrdersData = { total: 0, pending: 0, inProgress: 0, completed: 0, paid: 0, cancelled: 0, totalAmount: 0 };
    let purchaseOrdersData = { total: 0, pending: 0, approved: 0, cancelled: 0, totalAmount: 0 };
    let invoicesData = { total: 0, unpaid: 0, partial: 0, paid: 0, cancelled: 0, totalAmount: 0, paidAmount: 0 };
    let receiptVouchersData = { total: 0, totalAmount: 0 };
    let paymentVouchersData = { total: 0, totalAmount: 0 };
    let taxInvoicesData = { total: 0, totalAmount: 0 };
    let withholdingTaxData = { total: 0, totalAmount: 0 };
    let recentQuotations: { id: string; number: string; customer: string; project: string; amount: number; status: string; date: Date }[] = [];
    let recentWorkOrders: { id: string; number: string; customer: string; project: string; amount: number; status: string; date: Date }[] = [];
    let monthlyChart: { month: string; label: string; income: number; expense: number }[] = [];

    // ── Quotations ──
    try {
      const allQ = await prisma.quotation.findMany({ select: { status: true, totalAmount: true } });
      quotationsData.total = allQ.length;
      allQ.forEach(q => {
        const s = String(q.status);
        if (s === 'DRAFT') quotationsData.draft++;
        else if (s === 'SENT') quotationsData.sent++;
        else if (s === 'APPROVED') quotationsData.approved++;
        else if (s === 'CANCELLED' || s === 'REJECTED' || s === 'EXPIRED') quotationsData.cancelled++;
        if (s !== 'CANCELLED' && s !== 'REJECTED' && s !== 'EXPIRED') {
          quotationsData.totalAmount += Number(q.totalAmount || 0);
        }
      });

      const rq = await prisma.quotation.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        include: { customerGroup: { select: { groupName: true } } },
      });
      recentQuotations = rq.map(q => ({
        id: q.id, number: q.quotationNumber,
        customer: q.customerGroup?.groupName || '-',
        project: q.projectName || '-',
        amount: Number(q.totalAmount), status: String(q.status), date: q.date,
      }));
    } catch (e) { console.error('Dashboard quotations error:', e); }

    // ── Work Orders ──
    try {
      const allWo = await prisma.workOrder.findMany({ select: { status: true, totalAmount: true } });
      workOrdersData.total = allWo.length;
      allWo.forEach(wo => {
        const s = String(wo.status);
        if (s === 'PENDING') workOrdersData.pending++;
        else if (s === 'IN_PROGRESS') workOrdersData.inProgress++;
        else if (s === 'COMPLETED') workOrdersData.completed++;
        else if (s === 'PAID') workOrdersData.paid++;
        else if (s === 'CANCELLED') workOrdersData.cancelled++;
        if (s !== 'CANCELLED') workOrdersData.totalAmount += Number(wo.totalAmount || 0);
      });

      const rwo = await prisma.workOrder.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        include: { quotation: { select: { projectName: true, customerGroup: { select: { groupName: true } } } } },
      });
      recentWorkOrders = rwo.map(wo => ({
        id: wo.id, number: wo.woNumber,
        customer: wo.quotation?.customerGroup?.groupName || '-',
        project: wo.quotation?.projectName || wo.description || '-',
        amount: Number(wo.totalAmount), status: String(wo.status), date: wo.createdAt,
      }));
    } catch (e) { console.error('Dashboard work orders error:', e); }

    // ── Purchase Orders ──
    try {
      const allPo = await prisma.purchaseOrder.findMany({ select: { status: true, totalAmount: true } });
      purchaseOrdersData.total = allPo.length;
      allPo.forEach(po => {
        const s = String(po.status);
        if (s === 'DRAFT' || s === 'PENDING') purchaseOrdersData.pending++;
        else if (s === 'APPROVED' || s === 'ORDERED' || s === 'RECEIVED') purchaseOrdersData.approved++;
        else if (s === 'CANCELLED') purchaseOrdersData.cancelled++;
        if (s !== 'CANCELLED') purchaseOrdersData.totalAmount += Number(po.totalAmount || 0);
      });
    } catch (e) { console.error('Dashboard purchase orders error:', e); }

    // ── Invoices ──
    try {
      const allInv = await prisma.invoice.findMany({ select: { status: true, totalAmount: true } });
      invoicesData.total = allInv.length;
      allInv.forEach(inv => {
        const s = String(inv.status);
        if (s === 'UNPAID' || s === 'OVERDUE') invoicesData.unpaid++;
        else if (s === 'PARTIAL') invoicesData.partial++;
        else if (s === 'PAID') { invoicesData.paid++; invoicesData.paidAmount += Number(inv.totalAmount || 0); }
        else if (s === 'CANCELLED') invoicesData.cancelled++;
        if (s !== 'CANCELLED') invoicesData.totalAmount += Number(inv.totalAmount || 0);
      });
    } catch (e) { console.error('Dashboard invoices error:', e); }

    // ── Receipt Vouchers ──
    try {
      const allRv = await prisma.receiptVoucher.findMany({ select: { amount: true, date: true } });
      receiptVouchersData.total = allRv.length;
      allRv.forEach(rv => { receiptVouchersData.totalAmount += Number(rv.amount || 0); });
    } catch (e) { console.error('Dashboard receipt vouchers error:', e); }

    // ── Payment Vouchers ──
    try {
      const allPv = await prisma.paymentVoucher.findMany({ select: { amount: true, date: true } });
      paymentVouchersData.total = allPv.length;
      allPv.forEach(pv => { paymentVouchersData.totalAmount += Number(pv.amount || 0); });
    } catch (e) { console.error('Dashboard payment vouchers error:', e); }

    // ── Tax Invoices ──
    try {
      const allTi = await prisma.taxInvoice.findMany({ select: { totalAmount: true } });
      taxInvoicesData.total = allTi.length;
      allTi.forEach(ti => { taxInvoicesData.totalAmount += Number(ti.totalAmount || 0); });
    } catch (e) { console.error('Dashboard tax invoices error:', e); }

    // ── Withholding Tax ──
    try {
      const allWht = await prisma.withholdingTax.findMany({ select: { taxAmount: true } });
      withholdingTaxData.total = allWht.length;
      allWht.forEach(wht => { withholdingTaxData.totalAmount += Number(wht.taxAmount || 0); });
    } catch (e) { console.error('Dashboard withholding tax error:', e); }

    // ── Monthly Chart ──
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const receipts = await prisma.receiptVoucher.findMany({
        where: { date: { gte: sixMonthsAgo } }, select: { date: true, amount: true },
      });
      const payments = await prisma.paymentVoucher.findMany({
        where: { date: { gte: sixMonthsAgo } }, select: { date: true, amount: true },
      });

      const monthlyMap: Record<string, { income: number; expense: number }> = {};
      for (let i = 0; i < 6; i++) {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { income: 0, expense: 0 };
      }
      receipts.forEach(r => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) monthlyMap[key].income += Number(r.amount);
      });
      payments.forEach(p => {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) monthlyMap[key].expense += Number(p.amount);
      });
      monthlyChart = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
        income: data.income, expense: data.expense,
      }));
    } catch (e) { console.error('Dashboard monthly chart error:', e); }

    return NextResponse.json({
      quotations: quotationsData,
      workOrders: workOrdersData,
      purchaseOrders: purchaseOrdersData,
      invoices: invoicesData,
      receiptVouchers: receiptVouchersData,
      paymentVouchers: paymentVouchersData,
      taxInvoices: taxInvoicesData,
      withholdingTax: withholdingTaxData,
      recentQuotations,
      recentWorkOrders,
      monthlyChart,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
