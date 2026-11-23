'use client';

import Link from 'next/link';
import useUser from '@auth/useUser';

/** หน้า 404 ไม่พบหน้าที่ต้องการ */
function Error404PageView() {
	const { isGuest } = useUser();

	return (
		<main className="bg-canvas text-ink flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<p className="font-display text-brand text-[96px] leading-none font-semibold">404</p>
			<h1 className="font-display text-[26px] font-semibold">ไม่พบหน้าที่ต้องการ</h1>
			<p className="text-ink-muted max-w-md">หน้านี้อาจถูกย้ายหรือถูกลบไปแล้ว</p>
			<Link
				href={isGuest ? '/sign-in' : '/dashboards'}
				className="bg-brand text-on-brand font-display inline-flex min-h-11 items-center rounded-full px-5 font-medium outline-offset-2 focus-visible:outline-2"
			>
				{isGuest ? 'ไปหน้าเข้าสู่ระบบ' : 'กลับแดชบอร์ด'}
			</Link>
		</main>
	);
}

export default Error404PageView;
