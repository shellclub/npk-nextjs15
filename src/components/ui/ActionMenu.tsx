'use client';

import clsx from 'clsx';
import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { IconButton } from './IconButton';

export type MenuAction = { label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean; hidden?: boolean };

export function ActionMenu({
	actions,
	label = 'จัดการ',
	disabled
}: {
	actions: MenuAction[];
	label?: string;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return undefined;

		const onDoc = (e: MouseEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDoc);
		document.addEventListener('keydown', onKey);

		return () => {
			document.removeEventListener('mousedown', onDoc);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	const visible = actions.filter((a) => !a.hidden);

	return (
		<div
			ref={ref}
			className="relative inline-block"
			onClick={(e) => e.stopPropagation()}
		>
			<IconButton
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				disabled={disabled}
				onClick={() => setOpen((o) => !o)}
			>
				<MoreVertical size={20} />
			</IconButton>
			{open && (
				<ul
					role="menu"
					className="border-line bg-surface shadow-float absolute top-full right-0 z-30 mt-1 min-w-56 rounded-xl border p-1.5"
				>
					{visible.map((a) => (
						<li
							key={a.label}
							role="none"
						>
							<button
								type="button"
								role="menuitem"
								onClick={() => {
									setOpen(false);
									a.onClick();
								}}
								className={clsx(
									'focus-visible:outline-focus flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-4 text-left text-[16px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
									a.danger
										? 'text-danger hover:bg-danger focus-visible:bg-danger hover:text-white focus-visible:text-white'
										: 'hover:bg-primary focus-visible:bg-primary hover:text-white focus-visible:text-white'
								)}
							>
								{a.icon && (
									<a.icon
										size={18}
										aria-hidden="true"
									/>
								)}
								{a.label}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
