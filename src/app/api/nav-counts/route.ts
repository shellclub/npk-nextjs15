import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/nav-counts — ตัวเลขบน sidebar / กระดิ่งแจ้งเตือน
export async function GET() {
	try {
		const [workOrdersPending, pendingPayments, overdueInvoices] = await Promise.all([
			prisma.workOrder.count({ where: { status: 'PENDING' } }),
			prisma.workOrder.count({ where: { status: 'COMPLETED' } }),
			prisma.invoice.count({
				where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: new Date() } }
			})
		]);

		return NextResponse.json({ workOrdersPending, pendingPayments, overdueInvoices });
	} catch (e) {
		console.error('nav-counts error:', e);

		return NextResponse.json({ workOrdersPending: 0, pendingPayments: 0, overdueInvoices: 0 });
	}
}
