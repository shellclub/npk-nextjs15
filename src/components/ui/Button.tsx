import clsx from 'clsx';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'soft' | 'outline' | 'ghost' | 'dashed' | 'danger';

const variants: Record<Variant, string> = {
	primary:
		'bg-gradient-to-b from-[#46872f] to-primary-ink text-white shadow-[0_8px_16px_-8px_rgba(61,122,40,.85)] hover:from-primary hover:to-primary-ink-hover',
	soft: 'bg-tint text-primary-ink ring-1 ring-primary/10 hover:bg-line',
	outline: 'bg-surface border border-line text-primary-ink shadow-card hover:bg-surface-2',
	ghost: 'text-primary-ink hover:bg-tint',
	dashed: 'border border-dashed border-brand bg-surface-2 text-primary-ink hover:bg-tint',
	danger: 'bg-danger text-white hover:opacity-90'
};

type Props = {
	variant?: Variant;
	icon?: ReactNode;
	href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function buttonClass(variant: Variant = 'primary', className?: string) {
	return clsx(
		'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 active:translate-y-px font-display text-[15px] font-medium no-underline transition-colors',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50',
		variants[variant],
		className
	);
}

export function Button({ variant = 'primary', icon, href, className, children, type = 'button', ...rest }: Props) {
	const cls = buttonClass(variant, className);
	const content = (
		<>
			{icon}
			{children}
		</>
	);

	if (href) {
		return (
			<Link
				href={href}
				className={clsx(cls, variant === 'primary' && 'text-white hover:text-white')}
			>
				{content}
			</Link>
		);
	}

	return (
		<button
			type={type}
			className={cls}
			{...rest}
		>
			{content}
		</button>
	);
}
