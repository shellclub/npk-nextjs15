import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// POST /api/completed-works/[id]/upload — Upload photos/receipts
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const photoType = (formData.get('photoType') as string) || 'WORK'; // WORK or RECEIPT

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'completed-works', id);
    await mkdir(uploadDir, { recursive: true });

    const uploaded = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(uploadDir, safeName);
      await writeFile(filePath, buffer);

      const photo = await prisma.completedWorkPhoto.create({
        data: {
          completedWorkId: id,
          fileName: file.name,
          fileUrl: `/uploads/completed-works/${id}/${safeName}`,
          fileSize: buffer.length,
          photoType,
        },
      });
      uploaded.push(photo);
    }

    // Update hasPhotos/hasWorkReceipt flag
    const updateData: Record<string, boolean> = {};
    if (photoType === 'WORK') updateData.hasPhotos = true;
    if (photoType === 'RECEIPT') updateData.hasWorkReceipt = true;
    await prisma.completedWork.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true, photos: uploaded });
  } catch (error) {
    console.error('POST /api/completed-works/[id]/upload error:', error);
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
