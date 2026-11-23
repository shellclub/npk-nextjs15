import clsx from 'clsx';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = { 'aria-label': string; href?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({ href, className, children, type = 'button', ...rest }: Props) {
	const cls = clsx(
		'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-tint hover:text-primary-ink',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
		className
	);

	if (href) {
		return (
			<Link
				href={href}
				aria-label={rest['aria-label']}
				className={cls}
			>
				{children}
			</Link>
		);
	}

	return (
		<button
			type={type}
			className={cls}
			{...rest}
		>
			{children}
		</button>
	);
}
