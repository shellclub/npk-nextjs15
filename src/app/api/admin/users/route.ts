import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { ROLES } from '@/lib/permissions';

const PUBLIC_FIELDS = { id: true, email: true, name: true, role: true, isActive: true, createdAt: true } as const;

const MIN_PASSWORD = 8;

// GET /api/admin/users — รายชื่อผู้ใช้ (ไม่ส่งรหัสผ่าน) สิทธิ์: ADMIN (บังคับที่ proxy)
export async function GET() {
	try {
		const users = await prisma.user.findMany({
			select: PUBLIC_FIELDS,
			orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
		});

		return NextResponse.json(users);
	} catch (error) {
		console.error('GET /api/admin/users error:', error);

		return NextResponse.json({ error: 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ' }, { status: 500 });
	}
}

// POST /api/admin/users — เพิ่มผู้ใช้
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const email = String(body.email ?? '')
			.trim()
			.toLowerCase();
		const name = String(body.name ?? '').trim();
		const password = String(body.password ?? '');

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
		}

		if (!name) return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 });

		if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'role ไม่ถูกต้อง' }, { status: 400 });

		if (password.length < MIN_PASSWORD) {
			return NextResponse.json({ error: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` }, { status: 400 });
		}

		if (await prisma.user.findUnique({ where: { email } })) {
			return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว' }, { status: 409 });
		}

		const user = await prisma.user.create({
			data: { email, name, role: body.role, password: hashPassword(password) },
			select: PUBLIC_FIELDS
		});

		return NextResponse.json(user, { status: 201 });
	} catch (error) {
		console.error('POST /api/admin/users error:', error);

		return NextResponse.json({ error: 'เพิ่มผู้ใช้ไม่สำเร็จ' }, { status: 500 });
	}
}
