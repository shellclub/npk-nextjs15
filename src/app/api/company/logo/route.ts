import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const LOGO_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'logo');
const LOGO_FILENAME = 'npk-logo.png';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์โลโก้' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/png')) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ PNG เท่านั้น' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });
    }

    // Convert to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(LOGO_DIR, { recursive: true });
    const filePath = path.join(LOGO_DIR, LOGO_FILENAME);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดโลโก้สำเร็จ',
      url: `/assets/images/logo/${LOGO_FILENAME}?t=${Date.now()}`,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    url: `/assets/images/logo/${LOGO_FILENAME}`,
  });
}
