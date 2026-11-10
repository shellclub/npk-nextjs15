import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * GET /api/quotation-items/search?q=keyword
 * ค้นหารายการสินค้า/บริการที่เคยใช้ในใบเสนอราคาก่อนหน้า สำหรับ autocomplete
 * - ทุกใบเสนอราคายังเก็บรายการของตัวเองซ้ำได้ตามปกติ (ไม่มีการรวมในฐานข้อมูล)
 * - ตอนแสดงตัวเลือก: ชื่อเหมือนกัน (ตัดช่องว่าง/แท็บ) รวมเป็นรายการเดียว โดยใช้ราคาและหน่วยจากครั้งหลังสุด
 */
export async function GET(request: NextRequest) {
	const q = norm(request.nextUrl.searchParams.get('q') || '');

	if (q.length < 1) {
		return NextResponse.json([]);
	}

	try {
		const rows = await prisma.quotationItem.findMany({
			where: {
				description: { contains: q, mode: 'insensitive' },
				itemType: 'ITEM',
				isAdjustment: false
			},
			select: {
				description: true,
				unit: true,
				unitPrice: true,
				materialPrice: true,
				labourPrice: true,
				quotation: { select: { quotationNumber: true, updatedAt: true } }
			},
			// ล่าสุดก่อน: ใช้เวลาแก้ไขของใบเสนอราคาที่รายการนั้นอยู่
			orderBy: [{ quotation: { updatedAt: 'desc' } }, { itemOrder: 'desc' }],
			take: 300
		});

		const latest = new Map<
			string,
			{
				description: string;
				unit: string;
				materialPrice: number;
				labourPrice: number;
				unitPrice: number;
				quotationNumber: string;
				date: Date;
				recency: number;
			}
		>();

		rows.forEach((r, idx) => {
			const description = norm(r.description);
			const key = description.toLowerCase();

			if (!description || latest.has(key)) return; // แถวแรกที่เจอ = ล่าสุด

			const material = Number(r.materialPrice) || Number(r.unitPrice) || 0;
			const labour = Number(r.labourPrice) || 0;
			latest.set(key, {
				description,
				unit: norm(r.unit || ''),
				materialPrice: material,
				labourPrice: labour,
				unitPrice: material + labour,
				quotationNumber: r.quotation.quotationNumber,
				date: r.quotation.updatedAt,
				recency: idx
			});
		});

		const lq = q.toLowerCase();
		const result = Array.from(latest.values())
			.sort((a, b) => {
				const as = a.description.toLowerCase().startsWith(lq) ? 0 : 1;
				const bs = b.description.toLowerCase().startsWith(lq) ? 0 : 1;
				return as - bs || a.recency - b.recency;
			})
			.slice(0, 10)
			.map(({ recency: _r, ...rest }) => rest);

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error searching items:', error);
		return NextResponse.json([]);
	}
}
