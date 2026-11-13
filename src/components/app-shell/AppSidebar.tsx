'use client';

import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useUser from '@auth/useUser';
import { hasMenu } from '@/lib/permissions';
import { dashboardItem, findActive, NAV_COUNT_KEYS, visibleGroups, type NavItem } from './nav';
import { useNavCounts } from './useNavCounts';

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count?: number }) {
	return (
		<Link
			href={item.href}
			aria-current={active ? 'page' : undefined}
			className={clsx(
				'font-display flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] leading-[22px] font-medium no-underline transition-colors',
				'focus-visible:outline-on-brand focus-visible:outline-2 focus-visible:outline-offset-2',
				active
					? 'bg-surface text-primary-ink hover:bg-surface hover:text-primary-ink'
					: 'text-on-brand hover:bg-brand-hover hover:text-on-brand'
			)}
		>
			<item.Icon
				aria-hidden="true"
				size={20}
				className="shrink-0"
			/>
			<span className="flex-1">{item.title}</span>
			{count ? (
				<span
					aria-label={`${count} รายการ`}
					className="bg-accent text-on-brand rounded-full px-2 text-xs leading-5 font-semibold"
				>
					{count}
				</span>
			) : null}
		</Link>
	);
}

export function AppSidebar() {
	const pathname = usePathname();
	const { signOut, data: user } = useUser();
	const role = Array.isArray(user?.role) ? user.role[0] : user?.role;
	const groups = visibleGroups(role, user?.menus);
	const { data: counts } = useNavCounts();
	const activeId = findActive(pathname).item?.id;

	return (
		<aside className="text-on-brand flex max-w-[280px] flex-[1_1_248px] flex-col gap-2 px-4 py-6 max-[820px]:max-w-none max-[820px]:basis-full">
			<div className="flex items-center gap-3 px-2 pb-4">
				<div className="bg-surface flex size-[52px] flex-none items-center justify-center rounded-xl">
					<Image
						src="/api/company/asset/logo"
						unoptimized
						alt="โลโก้ NPK Service & Supply"
						width={38}
						height={38}
						className="h-auto w-[38px]"
						priority
					/>
				</div>
				<div>
					<div className="font-display text-[19px] leading-6 font-semibold">NPK Service</div>
					<div className="text-[13px] leading-[18px]">Service &amp; Supply</div>
				</div>
			</div>

			<nav
				aria-label="เมนูหลัก"
				className="flex flex-col gap-0.5"
			>
				{hasMenu(role, user?.menus, dashboardItem.id) && (
					<NavLink
						item={dashboardItem}
						active={activeId === dashboardItem.id}
					/>
				)}
				{groups.map((g) => (
					<div
						key={g.id}
						className="flex flex-col gap-0.5"
					>
						<div className="font-display px-3 pt-4 pb-1.5 text-xs leading-4 font-medium tracking-[0.08em]">
							{g.title}
						</div>
						{g.items.map((i) => {
							const key = NAV_COUNT_KEYS[i.id];

							return (
								<NavLink
									key={i.id}
									item={i}
									active={activeId === i.id}
									count={key ? counts?.[key] : undefined}
								/>
							);
						})}
					</div>
				))}
				<div
					aria-hidden="true"
					className="bg-on-brand/25 m-3 h-px"
				/>
				<button
					type="button"
					onClick={() => signOut()}
					className="font-display text-on-brand hover:bg-brand-hover focus-visible:outline-on-brand flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<LogOut
						aria-hidden="true"
						size={20}
					/>
					ออกจากระบบ
				</button>
			</nav>
		</aside>
	);
}
