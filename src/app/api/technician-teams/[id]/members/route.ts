import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

export async function POST(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), ['name', 'phone', 'idCard'] as const, ['phone', 'idCard']);

		if (!data.name) return NextResponse.json({ error: 'กรุณากรอกชื่อสมาชิก' }, { status: 400 });

		return NextResponse.json(
			await prisma.teamMember.create({ data: { ...(data as { name: string }), teamId: id } }),
			{ status: 201 }
		);
	} catch (e) {
		return fail(e, 'ไม่สามารถเพิ่มสมาชิกได้');
	}
}
