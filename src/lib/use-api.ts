'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

/** GET JSON ผ่าน react-query; params ที่ว่างจะถูกตัดออก */
export function useApi<T>(
	path: string,
	params?: Record<string, string | number | undefined | null>,
	enabled = true,
	opts?: { refetchOnWindowFocus?: boolean }
) {
	const sp = new URLSearchParams();

	Object.entries(params ?? {}).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '' && v !== 'ALL') sp.set(k, String(v));
	});

	const url = `${path}${sp.toString() ? `?${sp}` : ''}`;

	return useQuery<T>({
		queryKey: [url],
		queryFn: async () => {
			const r = await fetch(url);

			if (!r.ok) throw new Error(`${r.status}`);

			return r.json();
		},
		placeholderData: keepPreviousData,
		// ข้อมูลธุรกิจต้องสดเสมอ: ดึงใหม่ทุกครั้งที่เปิดหน้า (กันแสดงข้อมูลเก่าหลังบันทึก)
		staleTime: 0,
		refetchOnMount: 'always',
		refetchOnWindowFocus: opts?.refetchOnWindowFocus ?? true,
		enabled
	});
}

export async function sendJson(url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown) {
	const r = await fetch(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});

	if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `${r.status}`);

	return r.json().catch(() => ({}));
}
