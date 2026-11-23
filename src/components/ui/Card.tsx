import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
	return (
		<section
			className={clsx(
				'bg-surface shadow-depth flex min-w-0 flex-col gap-4 rounded-3xl p-4 ring-1 ring-black/[0.04] sm:p-6',
				className
			)}
			{...rest}
		/>
	);
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<h2 className="font-display text-xl leading-[30px] font-semibold">{title}</h2>
			{action}
		</div>
	);
}
