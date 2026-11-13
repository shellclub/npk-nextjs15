import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * เสิร์ฟไฟล์ที่อัปโหลดหลัง build (public/uploads/**)
 * โหมด standalone ไม่เสิร์ฟไฟล์ใหม่ใน public ที่เพิ่มหลัง build จึงทำให้รูปไม่แสดง
 * next.config.ts rewrite /uploads/* มาที่ route นี้ ลิงก์เดิมที่เก็บในฐานข้อมูลจึงใช้ได้ต่อ
 */
const ROOT = path.join(process.cwd(), 'public', 'uploads');
const TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.heic': 'image/heic',
	'.pdf': 'application/pdf'
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const parts = (await params).path.map((p) => decodeURIComponent(p));
	const file = path.join(ROOT, ...parts);

	// กันออกนอกโฟลเดอร์ uploads
	if (!file.startsWith(ROOT + path.sep)) return new NextResponse(null, { status: 400 });

	try {
		const buf = await readFile(file);

		return new NextResponse(new Uint8Array(buf), {
			headers: {
				'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		return new NextResponse(null, { status: 404 });
	}
}
