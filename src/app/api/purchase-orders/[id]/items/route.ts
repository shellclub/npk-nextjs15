import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — ดึงรายการ items ของ PO + ข้อมูลใบเสนอราคาอ้างอิง
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { orderBy: { itemOrder: 'asc' } },
        quotation: {
          include: {
            items: { orderBy: { itemOrder: 'asc' } },
            customerGroup: true,
            branch: true,
          },
        },
        team: true,
        workOrder: true,
      },
    });
    if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(po);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — เพิ่มรายการใหม่ (ทั้ง initial import จากใบเสนอราคา หรือเพิ่ม/ลดทีหลัง)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();

    // === Mode 1: Import items from quotation ===
    if (body.action === 'import-from-quotation') {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { quotation: { include: { items: { orderBy: { itemOrder: 'asc' } } } } },
      });
      if (!po?.quotation) return NextResponse.json({ error: 'No quotation reference' }, { status: 400 });

      // Check if PO already has items
      const existingCount = await prisma.purchaseOrderItem.count({ where: { purchaseOrderId: id } });
      if (existingCount > 0 && !body.replace) {
        return NextResponse.json({ error: 'Items already imported', alreadyImported: true }, { status: 400 });
      }

      // If replace=true, delete existing unlocked items first
      if (existingCount > 0 && body.replace) {
        await prisma.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id, isLocked: false, isAdjustment: false },
        });
      }

      // Copy quotation items but with empty prices
      const newItems = po.quotation.items.map((qi) => ({
        purchaseOrderId: id,
        itemOrder: qi.itemOrder,
        itemType: qi.itemType,
        parentIndex: qi.parentIndex,
        description: qi.description,
        unit: qi.unit,
        quantity: qi.quantity,
        materialPrice: 0,
        labourPrice: 0,
        totalMaterial: 0,
        totalLabour: 0,
        amount: 0,
        isLocked: false,
        isAdjustment: false,
      }));

      await prisma.purchaseOrderItem.createMany({ data: newItems });
      const items = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        orderBy: { itemOrder: 'asc' },
      });
      return NextResponse.json({ success: true, items });
    }


    // === Mode 2: Save prices for unlocked items (lock them) ===
    if (body.action === 'save-prices') {
      const updates: Array<{ id: string; materialPrice: number; labourPrice: number }> = body.items || [];

      for (const item of updates) {
        const existing = await prisma.purchaseOrderItem.findUnique({ where: { id: item.id } });
        if (!existing || existing.isLocked) continue; // skip locked items

        const qty = Number(existing.quantity);
        const matP = Number(item.materialPrice) || 0;
        const labP = Number(item.labourPrice) || 0;
        const totalMat = qty * matP;
        const totalLab = qty * labP;
        const amount = totalMat + totalLab;

        await prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            materialPrice: matP,
            labourPrice: labP,
            totalMaterial: totalMat,
            totalLabour: totalLab,
            amount,
            isLocked: true,
          },
        });
      }

      // Recalculate PO totals
      await recalcPOTotals(id);

      const items = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        orderBy: [{ itemOrder: 'asc' }, { createdAt: 'asc' }],
      });
      return NextResponse.json({ success: true, items });
    }

    // === Mode 3: Add adjustment item (positive or negative) ===
    if (body.action === 'add-adjustment') {
      const lastItem = await prisma.purchaseOrderItem.findFirst({
        where: { purchaseOrderId: id },
        orderBy: { itemOrder: 'desc' },
      });

      const qty = Number(body.quantity) || 1;
      const matP = Number(body.materialPrice) || 0;
      const labP = Number(body.labourPrice) || 0;
      const totalMat = qty * matP;
      const totalLab = qty * labP;
      const amount = totalMat + totalLab;

      const newItem = await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: id,
          itemOrder: (lastItem?.itemOrder || 0) + 1,
          itemType: 'ITEM',
          parentIndex: body.parentIndex ?? null,
          description: body.description || 'รายการปรับแก้',
          unit: body.unit || 'งาน',
          quantity: qty,
          materialPrice: matP,
          labourPrice: labP,
          totalMaterial: totalMat,
          totalLabour: totalLab,
          amount,
          isLocked: true, // adjustment items are immediately locked
          isAdjustment: true,
        },
      });

      await recalcPOTotals(id);
      return NextResponse.json({ success: true, item: newItem });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Recalculate PO subtotal → discount → vat → total
async function recalcPOTotals(poId: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) return;

  const items = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
  const subtotal = items.reduce((sum, it) => sum + Number(it.amount), 0);
  const discPct = Number(po.discountPercent) || 0;
  const discAmt = subtotal * discPct / 100;
  const afterDisc = subtotal - discAmt;
  const vatPct = Number(po.vatPercent) || 0;
  const vatAmt = afterDisc * vatPct / 100;
  const total = afterDisc + vatAmt;

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      subtotal,
      discountAmount: discAmt,
      afterDiscount: afterDisc,
      vatAmount: vatAmt,
      totalAmount: total,
    },
  });
}
