'use client';

import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

/** Layout หลักของทุกหน้าหลังล็อกอิน: sidebar เขียว + พื้นที่เนื้อหามุมโค้ง */
export function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="bg-brand text-ink flex min-h-screen flex-wrap font-sans">
			<AppSidebar />
			<main className="bg-canvas flex min-w-0 flex-[999_1_560px] flex-col gap-6 rounded-tl-[32px] px-8 pt-6 pb-12 max-[820px]:rounded-t-3xl max-[820px]:rounded-tl-3xl max-[820px]:p-4">
				<AppTopbar />
				{children}
			</main>
		</div>
	);
}
