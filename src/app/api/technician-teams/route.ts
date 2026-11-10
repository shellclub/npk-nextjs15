import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, pick } from '@/lib/api-crud';

const KEYS = ['teamName', 'leaderName', 'leaderPhone', 'leaderIdCard', 'leaderAddress'] as const;

// GET /api/technician-teams — ?all=1 รวมทีมที่ปิดใช้งาน
export async function GET(request: NextRequest) {
	try {
		const all = new URL(request.url).searchParams.get('all') === '1';
		const teams = await prisma.technicianTeam.findMany({
			where: all ? {} : { isActive: true },
			include: { members: { select: { id: true, name: true, phone: true, idCard: true } } },
			orderBy: { teamName: 'asc' }
		});

		return NextResponse.json(teams);
	} catch (e) {
		return fail(e, 'Failed to fetch teams');
	}
}

export async function POST(request: NextRequest) {
	try {
		const data = pick(await request.json(), KEYS, ['leaderPhone', 'leaderIdCard', 'leaderAddress']);

		if (!data.teamName || !data.leaderName) {
			return NextResponse.json({ error: 'กรุณากรอกชื่อทีมและหัวหน้าช่าง' }, { status: 400 });
		}

		return NextResponse.json(await prisma.technicianTeam.create({ data: data as never }), { status: 201 });
	} catch (e) {
		return fail(e, 'ไม่สามารถบันทึกทีมช่างได้');
	}
}
