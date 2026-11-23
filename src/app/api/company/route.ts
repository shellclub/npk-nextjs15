import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick } from '@/lib/api-crud';

const KEYS = ['nameTh', 'nameEn', 'addressTh', 'addressEn', 'taxId', 'email'] as const;

// บริษัทมีระเบียนเดียว: GET คืนระเบียนแรก (ถ้ายังไม่มีคืน null)
export async function GET() {
	try {
		return NextResponse.json(
			await prisma.company.findFirst({ include: { bankAccounts: { orderBy: { createdAt: 'asc' } } } })
		);
	} catch (e) {
		return fail(e, 'ไม่สามารถโหลดข้อมูลบริษัทได้');
	}
}

// PUT: อัปเดต (หรือสร้างถ้ายังไม่มี)
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const data = pick(body, KEYS, ['addressEn', 'email']) as Record<string, string | null>;
		const phones = Array.isArray(body.phones)
			? (body.phones as string[]).map((p) => String(p).trim()).filter(Boolean)
			: undefined;
		const existing = await prisma.company.findFirst();

		if (!existing && (!data.nameTh || !data.addressTh || !data.taxId)) {
			return NextResponse.json({ error: 'กรุณากรอกชื่อ ที่อยู่ และเลขผู้เสียภาษี' }, { status: 400 });
		}

		const saved = existing
			? await prisma.company.update({
					where: { id: existing.id },
					data: { ...data, ...(phones ? { phones } : {}) }
				})
			: await prisma.company.create({
					data: {
						...(data as { nameTh: string; addressTh: string; taxId: string }),
						nameEn: data.nameEn ?? '',
						phones: phones ?? []
					}
				});

		return NextResponse.json(saved);
	} catch (e) {
		return fail(e, 'ไม่สามารถบันทึกข้อมูลบริษัทได้');
	}
}
