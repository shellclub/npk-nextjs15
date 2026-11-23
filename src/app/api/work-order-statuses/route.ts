import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const scopeOf = (v: string | null | undefined) => (v === 'QUOTATION' ? 'QUOTATION' : 'WO');

// GET /api/work-order-statuses?appliesTo=WO|QUOTATION — List statuses (ค่าเริ่มต้น WO)
export async function GET(request: NextRequest) {
	try {
		const statuses = await prisma.workOrderStatusConfig.findMany({
			where: { appliesTo: scopeOf(request.nextUrl.searchParams.get('appliesTo')) },
			orderBy: { sortOrder: 'asc' }
		});
		return NextResponse.json(statuses);
	} catch (error) {
		console.error('GET /api/work-order-statuses error:', error);
		return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
	}
}

// POST /api/work-order-statuses — Create a new status
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.name || !body.code) {
			return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
		}

		const appliesTo = scopeOf(body.appliesTo);
		const code = String(body.code).toUpperCase().replace(/\s+/g, '_');

		// Check unique code (ภายในขอบเขตเดียวกัน)
		const existing = await prisma.workOrderStatusConfig.findUnique({
			where: { code_appliesTo: { code, appliesTo } }
		});

		if (existing) {
			return NextResponse.json({ error: 'code already exists' }, { status: 409 });
		}

		// Get next sortOrder
		const maxSort = await prisma.workOrderStatusConfig.findFirst({
			where: { appliesTo },
			orderBy: { sortOrder: 'desc' }
		});
		const sortOrder = (maxSort?.sortOrder || 0) + 1;

		const status = await prisma.workOrderStatusConfig.create({
			data: {
				name: body.name,
				code,
				appliesTo,
				color: body.color || '#64748B',
				bgColor: body.bgColor || '#F1F5F9',
				sortOrder,
				isDefault: body.isDefault || false,
				isActive: body.isActive !== false
			}
		});
		return NextResponse.json(status, { status: 201 });
	} catch (error) {
		console.error('POST /api/work-order-statuses error:', error);
		return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
	}
}
