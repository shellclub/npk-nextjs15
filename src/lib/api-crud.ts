import { NextResponse } from 'next/server';

export type IdContext = { params: Promise<{ id: string }> };

/** แปลง error ของ Prisma/อื่นๆ เป็น response ภาษาไทยที่สม่ำเสมอ */
export function fail(error: unknown, fallback: string) {
	console.error(fallback, error);

	const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : '';

	if (code === 'P2002') return NextResponse.json({ error: 'ข้อมูลนี้มีอยู่แล้วในระบบ' }, { status: 409 });

	if (code === 'P2025') return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

	if (code === 'P2003') return NextResponse.json({ error: 'ข้อมูลนี้ถูกใช้งานอยู่ ไม่สามารถลบได้' }, { status: 409 });

	return NextResponse.json({ error: fallback }, { status: 500 });
}

/** เลือกเฉพาะฟิลด์ที่อนุญาต; '' → null สำหรับฟิลด์ที่เป็น optional */
export function pick<T extends string>(body: Record<string, unknown>, keys: readonly T[], nullable: readonly T[] = []) {
	const out: Record<string, unknown> = {};

	for (const k of keys) {
		if (body[k] === undefined) continue;

		const v = typeof body[k] === 'string' ? (body[k] as string).trim() : body[k];
		out[k] = nullable.includes(k) && v === '' ? null : v;
	}

	return out;
}
