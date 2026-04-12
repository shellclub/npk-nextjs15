import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/purchase-orders/[id]/upload — Upload contractor quote file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'po-quotes', id);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const ext = path.extname(file.name) || '.jpg';
    const safeName = `contractor-quote-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/po-quotes/${id}/${safeName}`;

    // Update PO with file URL
    await prisma.purchaseOrder.update({
      where: { id },
      data: { contractorQuoteUrl: fileUrl },
    });

    return NextResponse.json({ fileUrl }, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders/[id]/upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
