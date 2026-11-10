'use client';

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="bg-canvas text-ink flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<TriangleAlert
				aria-hidden="true"
				className="text-danger size-14"
			/>
			<h1 className="font-display text-[26px] font-semibold">เกิดข้อผิดพลาดบางอย่าง</h1>
			<p className="text-ink-muted max-w-md">{error.message || 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง'}</p>
			<div className="flex gap-3">
				<Link
					href="/"
					className="bg-brand text-on-brand font-display inline-flex min-h-11 items-center rounded-full px-5 font-medium outline-offset-2 focus-visible:outline-2"
				>
					กลับหน้าแรก
				</Link>
				<button
					type="button"
					onClick={reset}
					className="bg-surface-2 text-ink font-display min-h-11 rounded-full px-5 font-medium outline-offset-2 focus-visible:outline-2"
				>
					ลองอีกครั้ง
				</button>
			</div>
		</main>
	);
}
