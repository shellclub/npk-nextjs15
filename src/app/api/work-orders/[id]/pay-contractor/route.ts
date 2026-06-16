import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/work-orders/[id]/pay-contractor — สร้างใบสำคัญจ่ายจาก PO แล้วอัปเดตสถานะ WO เป็น PAID
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        team: { select: { teamName: true, leaderName: true } },
        purchaseOrders: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, poNumber: true, totalAmount: true, status: true },
        },
        completedWork: { select: { id: true } },
      },
    });

    if (!wo) {
      return NextResponse.json({ error: 'ไม่พบ Work Order' }, { status: 404 });
    }
    if (wo.status === 'PAID') {
      return NextResponse.json({ error: 'WO นี้จ่ายแล้ว' }, { status: 400 });
    }
    if (wo.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'WO ต้องอยู่ในสถานะเสร็จสิ้นก่อนจ่ายช่าง' }, { status: 400 });
    }

    const poTotal = wo.purchaseOrders.reduce((s, po) => s + Number(po.totalAmount), 0);
    const amount = poTotal > 0 ? poTotal : Number(wo.totalAmount);
    if (amount <= 0) {
      return NextResponse.json({ error: 'ไม่มียอดเงินที่จะจ่าย (ตรวจสอบ PO หรือยอด WO)' }, { status: 400 });
    }

    const payeeName = wo.team?.leaderName || wo.team?.teamName || wo.teamName || 'ผู้รับเงิน';
    const poRefs = wo.purchaseOrders.map(p => p.poNumber).join(', ');
    const description = poRefs
      ? `จ่ายค่าจ้าง ${wo.woNumber} อ้างอิง PO: ${poRefs}`
      : `จ่ายค่าจ้าง ${wo.woNumber}`;

    const now = new Date();
    const prefix = `PV-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const last = await prisma.paymentVoucher.findFirst({
      where: { voucherNumber: { startsWith: prefix } },
      orderBy: { voucherNumber: 'desc' },
    });
    const seq = last ? parseInt(last.voucherNumber.split('-').pop() || '0', 10) + 1 : 1;

    const result = await prisma.$transaction(async (tx) => {
      const paymentVoucher = await tx.paymentVoucher.create({
        data: {
          voucherNumber: `${prefix}-${String(seq).padStart(3, '0')}`,
          date: now,
          payeeName,
          amount,
          paymentMethod: 'TRANSFER',
          description,
          notes: `สร้างอัตโนมัติจาก WO ${wo.woNumber}`,
        },
      });

      await tx.workOrder.update({
        where: { id },
        data: { status: 'PAID' },
      });

      if (wo.completedWork) {
        await tx.completedWork.update({
          where: { id: wo.completedWork.id },
          data: { status: 'PAID' },
        });
      }

      return paymentVoucher;
    });

    return NextResponse.json({
      paymentVoucher: result,
      workOrder: { id: wo.id, woNumber: wo.woNumber, status: 'PAID' },
      amount,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/work-orders/[id]/pay-contractor error:', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างใบสำคัญจ่ายได้' }, { status: 500 });
  }
}
