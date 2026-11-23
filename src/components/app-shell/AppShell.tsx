'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

/**
 * Layout หลักของทุกหน้าหลังล็อกอิน
 * - จอ >= 1024px: sidebar เขียวติดซ้าย
 * - iPad แนวตั้ง / มือถือ (< 1024px): ยุบเมนูเป็น drawer เปิดด้วยปุ่มแฮมเบอร์เกอร์ ให้เนื้อหาใช้เต็มจอ
 */
export function AppShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	// ปิด drawer เมื่อเปลี่ยนหน้า
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	// ปิดด้วยปุ่ม Esc
	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
		window.addEventListener('keydown', onKey);

		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	return (
		<div className="bg-brand text-ink flex min-h-screen font-sans">
			{/* ฉากหลังทึบเมื่อเปิด drawer (เฉพาะจอเล็ก) */}
			<div
				aria-hidden="true"
				onClick={() => setOpen(false)}
				className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
			/>
			<AppSidebar
				open={open}
				onClose={() => setOpen(false)}
			/>
			<main className="bg-canvas flex min-w-0 flex-1 flex-col gap-4 px-3 pt-3 pb-12 sm:px-5 sm:pt-4 lg:gap-6 lg:rounded-tl-[32px] lg:px-8 lg:pt-6">
				<AppTopbar onMenu={() => setOpen(true)} />
				{children}
			</main>
		</div>
	);
}
