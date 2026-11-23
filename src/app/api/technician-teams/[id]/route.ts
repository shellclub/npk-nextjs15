import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

const KEYS = ['teamName', 'leaderName', 'leaderPhone', 'leaderIdCard', 'leaderAddress', 'isActive'] as const;

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), KEYS, ['leaderPhone', 'leaderIdCard', 'leaderAddress']);

		return NextResponse.json(await prisma.technicianTeam.update({ where: { id }, data }));
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขทีมช่างได้');
	}
}

// ปิดใช้งาน เพื่อคงประวัติ WO/PO ที่อ้างอิงทีม
export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.technicianTeam.update({ where: { id }, data: { isActive: false } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถปิดใช้งานทีมช่างได้');
	}
}
