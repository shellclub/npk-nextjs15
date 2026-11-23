import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

/**
 * ไฟล์ของบริษัทที่แนบจากหน้าตั้งค่าบริษัท (โลโก้ / ลายเซ็น / ตราประทับ)
 * ทุกที่ในระบบ (เอกสารพิมพ์ PDF, เมนู, หน้าแชร์) อ้างผ่าน /api/company/asset/{kind}
 * ถ้ายังไม่ได้แนบ โลโก้จะใช้ไฟล์เริ่มต้น ส่วนลายเซ็น/ตราประทับจะตอบ 404 (เอกสารซ่อนรูปเอง)
 */
const KINDS = ['logo', 'signature', 'stamp'] as const;
type Kind = (typeof KINDS)[number];

const DIR = path.join(process.cwd(), 'public', 'uploads', 'company');
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
const MAX_SIZE = 5 * 1024 * 1024;

const isKind = (k: string): k is Kind => (KINDS as readonly string[]).includes(k);

async function findFile(kind: Kind) {
	for (const ext of Object.keys(TYPES)) {
		try {
			return { ext, buf: await readFile(path.join(DIR, `${kind}.${ext}`)) };
		} catch {
			/* ลองนามสกุลถัดไป */
		}
	}

	return null;
}

async function removeAll(kind: Kind) {
	await Promise.all(Object.keys(TYPES).map((ext) => unlink(path.join(DIR, `${kind}.${ext}`)).catch(() => null)));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
	const { kind } = await params;

	if (!isKind(kind)) return NextResponse.json({ error: 'ไม่รู้จักประเภทไฟล์' }, { status: 404 });

	let found = await findFile(kind);

	if (!found && kind === 'logo') {
		try {
			found = { ext: 'png', buf: await readFile(path.join(process.cwd(), 'public', 'npk-logo.png')) };
		} catch {
			/* ไม่มีไฟล์เริ่มต้น */
		}
	}

	if (!found) return new NextResponse(null, { status: 404 });

	return new NextResponse(new Uint8Array(found.buf), {
		headers: { 'Content-Type': TYPES[found.ext], 'Cache-Control': 'no-cache' }
	});
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
	try {
		const { kind } = await params;

		if (!isKind(kind)) return NextResponse.json({ error: 'ไม่รู้จักประเภทไฟล์' }, { status: 404 });

		const file = (await request.formData()).get('file') as File | null;

		if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });

		const ext =
			file.type === 'image/png'
				? 'png'
				: file.type === 'image/jpeg'
					? 'jpg'
					: file.type === 'image/webp'
						? 'webp'
						: '';

		if (!ext) return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP' }, { status: 400 });

		if (file.size > MAX_SIZE) return NextResponse.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });

		await mkdir(DIR, { recursive: true });
		await removeAll(kind); // เก็บไฟล์เดียวต่อประเภท
		await writeFile(path.join(DIR, `${kind}.${ext}`), Buffer.from(await file.arrayBuffer()));

		return NextResponse.json({ success: true, url: `/api/company/asset/${kind}?t=${Date.now()}` });
	} catch (e) {
		console.error('Company asset upload error:', e);

		return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' }, { status: 500 });
	}
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
	const { kind } = await params;

	if (!isKind(kind)) return NextResponse.json({ error: 'ไม่รู้จักประเภทไฟล์' }, { status: 404 });

	await removeAll(kind);

	return NextResponse.json({ success: true });
}
