import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@auth/authJs';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';

const MIN_PASSWORD = 8;

// POST /api/account/password — เปลี่ยนรหัสผ่านของตัวเอง { currentPassword, newPassword }
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		const id = session?.db?.id;

		if (!id) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

		const { currentPassword, newPassword } = await request.json();

		if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD) {
			return NextResponse.json(
				{ error: `รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` },
				{ status: 400 }
			);
		}

		const user = await prisma.user.findUnique({ where: { id } });

		if (!user || typeof currentPassword !== 'string' || !verifyPassword(currentPassword, user.password)) {
			return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
		}

		await prisma.user.update({ where: { id }, data: { password: hashPassword(newPassword) } });

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('POST /api/account/password error:', error);

		return NextResponse.json({ error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' }, { status: 500 });
	}
}
