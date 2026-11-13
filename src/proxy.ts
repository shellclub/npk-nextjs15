import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canCallApi } from '@/lib/permissions';
import { loadAccess } from '@/lib/permissions-server';

/**
 * เส้นทาง API ที่เปิดสาธารณะโดยตั้งใจ (หน้าสาธารณะ/หน้าพิมพ์/ช่างอัปโหลดรูปหน้างานเรียกใช้โดยไม่ล็อกอิน)
 * ที่เหลือใน /api ต้องมี session และ role ต้องมีสิทธิ์ตาม src/lib/permissions.ts
 */
const PUBLIC_API: { pattern: RegExp; methods?: string[] }[] = [
	{ pattern: /^\/api\/auth(\/|$)/ },
	{ pattern: /^\/api\/files\// },
	{ pattern: /^\/api\/company\/asset\// },
	// ลิงก์แชร์ใบเสนอราคา
	{ pattern: /^\/api\/quotations\/[^/]+\/share$/, methods: ['GET'] },
	// หน้าช่างอัปโหลดรูปหน้างาน: อ่านใบเสนอราคา + จัดการรูป
	{ pattern: /^\/api\/quotations\/[^/]+$/, methods: ['GET'] },
	{ pattern: /^\/api\/quotations\/[^/]+\/photos$/, methods: ['GET', 'POST', 'DELETE'] }
];

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;

	if (PUBLIC_API.some((r) => r.pattern.test(pathname) && (!r.methods || r.methods.includes(req.method)))) {
		return NextResponse.next();
	}

	// ชื่อ cookie ขึ้นกับ AUTH_URL (http → authjs.session-token, https → __Secure-...) ไม่ใช่โปรโตคอลที่ผู้ใช้เข้ามา
	// จึงลองทั้งสองแบบ (ลายเซ็น JWT ยังตรวจด้วย secret เสมอ)
	const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
	const token =
		(await getToken({ req, secret, secureCookie: false })) ?? (await getToken({ req, secret, secureCookie: true }));

	if (!token?.userId) return json('กรุณาเข้าสู่ระบบ', 401);

	// role/สถานะมาจากฐานข้อมูล (แคชสั้น ๆ) ไม่เชื่อค่าใน token → ปิดบัญชี/เปลี่ยน role มีผลทันที
	const access = await loadAccess(token.userId);

	if (!access?.isActive) return json('กรุณาเข้าสู่ระบบ', 401);

	if (!canCallApi(access.role, access.menus, pathname, req.method)) {
		return json('คุณไม่มีสิทธิ์ใช้งานส่วนนี้', 403);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/api/:path*']
};
