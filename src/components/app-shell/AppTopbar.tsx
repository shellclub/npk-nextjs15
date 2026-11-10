'use client';

import { Bell, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import useUser from '@auth/useUser';
import { findActive } from './nav';
import { useNavCounts } from './useNavCounts';

const ROLE_LABEL: Record<string, string> = {
	admin: 'ผู้ดูแลระบบ',
	manager: 'ผู้จัดการ',
	staff: 'เจ้าหน้าที่',
	accountant: 'ฝ่ายบัญชี'
};

export function AppTopbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: user } = useUser();
	const { data: counts } = useNavCounts();
	const [q, setQ] = useState('');
	const { group, item } = findActive(pathname);
	const isDashboard = pathname.startsWith('/dashboards');
	const role = Array.isArray(user?.role) ? user?.role[0] : user?.role;
	const name = user?.displayName || user?.email || 'ผู้ใช้';
	const alerts = counts?.overdueInvoices ?? 0;

	return (
		<header className="bg-surface shadow-depth flex flex-wrap items-center gap-4 rounded-3xl py-3 pr-4 pl-5 ring-1 ring-black/[0.04]">
			{isDashboard ? (
				<form
					role="search"
					className="relative min-w-[260px] flex-1 basis-80"
					onSubmit={(e) => {
						e.preventDefault();

						if (q.trim()) router.push(`/apps/quotations?q=${encodeURIComponent(q.trim())}`);
					}}
				>
					<label
						htmlFor="global-search"
						className="sr-only"
					>
						ค้นหาเลขที่เอกสาร ชื่อลูกค้า หรือชื่อโครงการ
					</label>
					<Search
						aria-hidden="true"
						size={18}
						className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
					/>
					<input
						id="global-search"
						type="search"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="ค้นหาเลขที่เอกสาร ชื่อลูกค้า หรือชื่อโครงการ"
						className="border-line-strong bg-surface placeholder:text-ink-muted focus-visible:outline-focus h-11 w-full max-w-[520px] rounded-lg border pr-3 pl-11 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
					/>
				</form>
			) : (
				<nav
					aria-label="ตำแหน่งปัจจุบัน"
					className="text-ink-muted flex flex-[1_1_320px] flex-wrap items-center gap-2 text-[15px] leading-[22px]"
				>
					<Link
						href="/dashboards/project"
						className="no-underline"
					>
						แดชบอร์ด
					</Link>
					{group && (
						<>
							<ChevronRight
								aria-hidden="true"
								size={14}
							/>
							<span>{group.title}</span>
						</>
					)}
					{item && (
						<>
							<ChevronRight
								aria-hidden="true"
								size={14}
							/>
							<span
								aria-current="page"
								className="text-ink font-semibold"
							>
								{item.title}
							</span>
						</>
					)}
				</nav>
			)}

			<div className="ml-auto flex items-center gap-3">
				<Link
					href="/apps/invoices"
					aria-label={alerts ? `การแจ้งเตือน ${alerts} รายการ: ใบแจ้งหนี้เกินกำหนด` : 'การแจ้งเตือน'}
					className="bg-tint text-primary-ink hover:bg-line focus-visible:outline-focus relative flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<Bell
						aria-hidden="true"
						size={20}
					/>
					{alerts > 0 && (
						<span className="bg-danger absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full text-[11px] font-semibold text-white">
							{alerts}
						</span>
					)}
				</Link>
				<div
					aria-hidden="true"
					className="bg-brand font-display text-on-brand flex size-11 items-center justify-center rounded-full font-semibold"
				>
					{name.slice(0, 2).toUpperCase()}
				</div>
				<div>
					<div className="font-display text-[15px] leading-[22px] font-semibold">{name}</div>
					<div className="text-ink-muted text-[13px] leading-[18px]">
						{(role && ROLE_LABEL[role]) || role || ''}
					</div>
				</div>
			</div>
		</header>
	);
}
