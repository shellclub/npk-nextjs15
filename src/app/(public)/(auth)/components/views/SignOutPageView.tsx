import Link from 'next/link';

function SignOutPageView() {
	return (
		<main className="bg-canvas flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<h1 className="font-display text-[26px] font-semibold">ออกจากระบบเรียบร้อยแล้ว</h1>
			<p className="text-ink-muted">ขอบคุณที่ใช้งานระบบ NPK Service &amp; Supply</p>
			<Link
				href="/sign-in"
				className="font-display font-medium"
			>
				เข้าสู่ระบบอีกครั้ง
			</Link>
		</main>
	);
}

export default SignOutPageView;
