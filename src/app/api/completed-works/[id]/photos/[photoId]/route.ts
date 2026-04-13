import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import path from 'path';
import { unlink } from 'fs/promises';

// DELETE /api/completed-works/[id]/photos/[photoId] — Delete a photo
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  try {
    const photo = await prisma.completedWorkPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.completedWorkId !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', photo.fileUrl);
      await unlink(filePath);
    } catch {
      // File might not exist, continue anyway
    }

    // Delete from database
    await prisma.completedWorkPhoto.delete({ where: { id: photoId } });

    // Update flags on completed work
    const remaining = await prisma.completedWorkPhoto.findMany({
      where: { completedWorkId: id },
      select: { photoType: true },
    });
    const hasPhotos = remaining.some(p => p.photoType === 'WORK');
    const hasWorkReceipt = remaining.some(p => p.photoType === 'RECEIPT');
    await prisma.completedWork.update({
      where: { id },
      data: { hasPhotos, hasWorkReceipt },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE photo error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
