import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), ['name', 'phone', 'idCard'] as const, ['phone', 'idCard']);

		return NextResponse.json(await prisma.teamMember.update({ where: { id }, data }));
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขสมาชิกได้');
	}
}

export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.teamMember.delete({ where: { id } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถลบสมาชิกได้');
	}
}
