'use client';

import Link from 'next/link';

/** หน้า 403: ล็อกอินแล้วแต่ role นี้ไม่ได้รับสิทธิ์เมนูดังกล่าว */
function Page() {
	return (
		<main className="bg-canvas text-ink flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<p className="font-display text-brand text-[96px] leading-none font-semibold">403</p>
			<h1 className="font-display text-[26px] font-semibold">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
			<p className="text-ink-muted max-w-md">หากต้องการใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เพิ่มเติม</p>
			<Link
				href="/"
				className="bg-brand text-on-brand font-display inline-flex min-h-11 items-center rounded-full px-5 font-medium outline-offset-2 focus-visible:outline-2"
			>
				กลับหน้าแรก
			</Link>
		</main>
	);
}

export default Page;
