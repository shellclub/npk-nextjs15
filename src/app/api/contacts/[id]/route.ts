import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

const KEYS = ['name', 'phone', 'email', 'position', 'isActive'] as const;

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), KEYS, ['phone', 'email', 'position']);

		return NextResponse.json(await prisma.contact.update({ where: { id }, data }));
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขผู้ติดต่อได้');
	}
}

export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.contact.update({ where: { id }, data: { isActive: false } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถลบผู้ติดต่อได้');
	}
}
