import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick } from '@/lib/api-crud';

const BANK_KEYS = ['bank', 'branch', 'accountName', 'accountNumber', 'accountType'] as const;

export async function POST(request: NextRequest) {
	try {
		const data = pick(await request.json(), BANK_KEYS) as Record<(typeof BANK_KEYS)[number], string>;
		const company = await prisma.company.findFirst();

		if (!company) return NextResponse.json({ error: 'กรุณาบันทึกข้อมูลบริษัทก่อน' }, { status: 400 });

		if (!data.bank || !data.accountName || !data.accountNumber) {
			return NextResponse.json({ error: 'กรุณากรอกธนาคาร ชื่อบัญชี และเลขที่บัญชี' }, { status: 400 });
		}

		return NextResponse.json(
			await prisma.bankAccount.create({
				data: { branch: '', accountType: 'ออมทรัพย์', ...data, companyId: company.id }
			}),
			{ status: 201 }
		);
	} catch (e) {
		return fail(e, 'ไม่สามารถบันทึกบัญชีธนาคารได้');
	}
}
