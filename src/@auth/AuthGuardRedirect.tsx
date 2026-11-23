'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import useUser from './useUser';

type Props = {
	/** role ที่เข้าได้; อาร์เรย์ว่าง = เฉพาะผู้ที่ยังไม่ล็อกอิน */
	auth: string[];
	children: ReactNode;
};

/** ป้องกันหน้าฝั่ง client: guest → /sign-in, ล็อกอินแล้วแต่ไม่มีสิทธิ์ → /401 */
function AuthGuardRedirect({ auth, children }: Props) {
	const { data: user, isGuest, isLoading } = useUser();
	const router = useRouter();
	const pathname = usePathname();
	const onlyGuest = auth.length === 0;
	const roles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
	const allowed = onlyGuest ? isGuest : !isGuest && roles.some((r) => auth.includes(r));

	useEffect(() => {
		if (isLoading || allowed) return;

		if (onlyGuest) router.replace('/dashboards');
		else if (isGuest) router.replace('/sign-in');
		else router.replace('/401');
	}, [allowed, isGuest, isLoading, onlyGuest, pathname, router]);

	if (!allowed) {
		return (
			<div
				role="status"
				className="text-ink-muted flex min-h-screen items-center justify-center"
			>
				กำลังโหลด...
			</div>
		);
	}

	return <>{children}</>;
}

export default AuthGuardRedirect;
