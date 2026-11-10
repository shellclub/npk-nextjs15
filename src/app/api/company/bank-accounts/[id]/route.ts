import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick, type IdContext } from '@/lib/api-crud';

const KEYS = ['bank', 'branch', 'accountName', 'accountNumber', 'accountType'] as const;

export async function PATCH(request: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;

		return NextResponse.json(
			await prisma.bankAccount.update({ where: { id }, data: pick(await request.json(), KEYS) })
		);
	} catch (e) {
		return fail(e, 'ไม่สามารถแก้ไขบัญชีธนาคารได้');
	}
}

export async function DELETE(_r: NextRequest, { params }: IdContext) {
	try {
		const { id } = await params;
		await prisma.bankAccount.delete({ where: { id } });

		return NextResponse.json({ success: true });
	} catch (e) {
		return fail(e, 'ไม่สามารถลบบัญชีธนาคารได้');
	}
}
