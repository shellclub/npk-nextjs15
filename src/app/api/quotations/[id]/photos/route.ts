import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET /api/quotations/[id]/photos — List photos for a quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photos = await prisma.quotationPhoto.findMany({
      where: { quotationId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(photos);
  } catch (error) {
    console.error('GET photos error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST /api/quotations/[id]/photos — Upload photos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    const photoType = (formData.get('photoType') as string) || 'BEFORE';
    const uploadedBy = (formData.get('uploadedBy') as string) || null;
    const caption = (formData.get('caption') as string) || null;

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos', id);
    await mkdir(uploadDir, { recursive: true });

    const savedPhotos = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.name) || '.jpg';
      const safeName = `${photoType.toLowerCase()}_${timestamp}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, safeName);

      // Save to disk
      await writeFile(filePath, buffer);

      // Save to database
      const photo = await prisma.quotationPhoto.create({
        data: {
          quotationId: id,
          fileName: file.name,
          fileUrl: `/uploads/photos/${id}/${safeName}`,
          fileSize: buffer.length,
          caption,
          photoType,
          uploadedBy,
        },
      });

      savedPhotos.push(photo);
    }

    return NextResponse.json(savedPhotos, { status: 201 });
  } catch (error) {
    console.error('POST photos error:', error);
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }
}

// DELETE /api/quotations/[id]/photos — Delete a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 });
    }

    await prisma.quotationPhoto.delete({ where: { id: photoId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
