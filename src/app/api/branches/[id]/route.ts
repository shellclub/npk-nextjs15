import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

const KEYS = ['code', 'name', 'address', 'contactName', 'contactPhone', 'isActive'] as const;

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), KEYS, ['address', 'contactName', 'contactPhone']);

		return NextResponse.json(await prisma.customerBranch.update({ where: { id }, data }));
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขสาขาได้');
	}
}

export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.customerBranch.update({ where: { id }, data: { isActive: false } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถลบสาขาได้');
	}
}
