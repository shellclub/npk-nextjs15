import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

const KEYS = [
	'groupName',
	'headOfficeAddress',
	'taxId',
	'contactName',
	'contactPhone',
	'contactEmail',
	'isActive'
] as const;

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		const data = pick(await request.json(), KEYS, ['taxId', 'contactName', 'contactPhone', 'contactEmail']);

		return NextResponse.json(await prisma.customerGroup.update({ where: { id }, data }));
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขข้อมูลลูกค้าได้');
	}
}

// ปิดใช้งาน (soft delete) เพื่อไม่ทำให้เอกสารเดิมที่อ้างอิงลูกค้าเสียหาย
export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.customerGroup.update({ where: { id }, data: { isActive: false } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถปิดใช้งานลูกค้าได้');
	}
}
