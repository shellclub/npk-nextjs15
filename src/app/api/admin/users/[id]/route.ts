import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@auth/authJs';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { ROLES } from '@/lib/permissions';
import { invalidateAccessCache } from '@/lib/permissions-server';

type RouteContext = { params: Promise<{ id: string }> };

const MIN_PASSWORD = 8;

// PATCH /api/admin/users/[id] — แก้ชื่อ/role/สถานะ หรือรีเซ็ตรหัสผ่าน (ส่ง password) สิทธิ์: ADMIN
export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const body = await request.json();
		const session = await auth();
		const isSelf = session?.db?.id === id;

		const target = await prisma.user.findUnique({ where: { id } });

		if (!target) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

		const data: { name?: string; role?: (typeof ROLES)[number]; isActive?: boolean; password?: string } = {};

		if (body.name !== undefined) {
			const name = String(body.name).trim();

			if (!name) return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 });

			data.name = name;
		}

		if (body.role !== undefined) {
			if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'role ไม่ถูกต้อง' }, { status: 400 });

			data.role = body.role;
		}

		if (body.isActive !== undefined) data.isActive = !!body.isActive;

		if (body.password !== undefined && body.password !== '') {
			if (String(body.password).length < MIN_PASSWORD) {
				return NextResponse.json(
					{ error: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` },
					{ status: 400 }
				);
			}

			data.password = hashPassword(String(body.password));
		}

		// กันล็อกตัวเองออก และกันระบบไม่เหลือ ADMIN ที่ใช้งานได้
		const losesAdmin =
			target.role === 'ADMIN' &&
			target.isActive &&
			((data.role !== undefined && data.role !== 'ADMIN') || data.isActive === false);

		if (losesAdmin) {
			if (isSelf) {
				return NextResponse.json({ error: 'ไม่สามารถลดสิทธิ์หรือปิดใช้งานบัญชีของตัวเองได้' }, { status: 400 });
			}

			const otherAdmins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: id } } });

			if (otherAdmins === 0) {
				return NextResponse.json({ error: 'ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน' }, { status: 400 });
			}
		}

		const user = await prisma.user.update({
			where: { id },
			data,
			select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
		});
		invalidateAccessCache();

		return NextResponse.json(user);
	} catch (error) {
		console.error('PATCH /api/admin/users/[id] error:', error);

		return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 });
	}
}
