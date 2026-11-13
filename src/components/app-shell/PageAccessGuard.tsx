'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import useUser from '@auth/useUser';
import { hasMenu } from '@/lib/permissions';
import { findActive } from './nav';

/** กันเข้าหน้าที่ role ไม่มีสิทธิ์ (หน้าที่ไม่อยู่ในเมนู เช่น หน้าบัญชีของฉัน เข้าได้ทุกคนที่ล็อกอิน) */
export function PageAccessGuard({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: user } = useUser();
	const role = Array.isArray(user?.role) ? user.role[0] : user?.role;
	const menu = findActive(pathname).item?.id;
	const allowed = !menu || hasMenu(role, user?.menus, menu);

	useEffect(() => {
		if (!allowed) router.replace('/403');
	}, [allowed, router]);

	return allowed ? <>{children}</> : null;
}
