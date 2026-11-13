import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CONFIGURABLE_MENUS, CONFIGURABLE_ROLES, isConfigurableMenu } from '@/lib/permissions';
import { invalidateAccessCache } from '@/lib/permissions-server';

type Grants = Record<(typeof CONFIGURABLE_ROLES)[number], string[]>;

// GET /api/admin/role-permissions — เมนูทั้งหมด + เมนูที่แต่ละ role เข้าได้ สิทธิ์: ADMIN
export async function GET() {
	try {
		const rows = await prisma.rolePermission.findMany({ select: { role: true, menuKey: true } });
		const grants: Grants = { MANAGER: [], STAFF: [], ACCOUNTANT: [] };

		for (const r of rows) {
			if (r.role !== 'ADMIN') grants[r.role].push(r.menuKey);
		}

		return NextResponse.json({ roles: CONFIGURABLE_ROLES, menus: CONFIGURABLE_MENUS, grants });
	} catch (error) {
		console.error('GET /api/admin/role-permissions error:', error);

		return NextResponse.json({ error: 'โหลดสิทธิ์ไม่สำเร็จ' }, { status: 500 });
	}
}

// PUT /api/admin/role-permissions — บันทึกสิทธิ์ทั้งชุด { grants: { MANAGER: [...], STAFF: [...], ACCOUNTANT: [...] } }
export async function PUT(request: NextRequest) {
	try {
		const { grants } = (await request.json()) as { grants?: Partial<Grants> };

		if (!grants || typeof grants !== 'object') {
			return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
		}

		const data: { role: (typeof CONFIGURABLE_ROLES)[number]; menuKey: string }[] = [];

		for (const role of CONFIGURABLE_ROLES) {
			const keys = grants[role];

			if (keys === undefined) continue;

			if (!Array.isArray(keys) || keys.some((k) => typeof k !== 'string' || !isConfigurableMenu(k))) {
				return NextResponse.json({ error: `เมนูของ ${role} ไม่ถูกต้อง` }, { status: 400 });
			}

			for (const menuKey of new Set(keys)) data.push({ role, menuKey });
		}

		const roles = CONFIGURABLE_ROLES.filter((r) => grants[r] !== undefined);

		await prisma.$transaction([
			prisma.rolePermission.deleteMany({ where: { role: { in: [...roles] } } }),
			prisma.rolePermission.createMany({ data })
		]);
		invalidateAccessCache();

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('PUT /api/admin/role-permissions error:', error);

		return NextResponse.json({ error: 'บันทึกสิทธิ์ไม่สำเร็จ' }, { status: 500 });
	}
}
