import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'tint' | 'warn';
type ValueColor = 'ink' | 'primary' | 'info' | 'success' | 'warn' | 'danger';

const colors: Record<ValueColor, string> = {
	ink: 'text-ink',
	primary: 'text-primary-ink',
	info: 'text-info',
	success: 'text-success',
	warn: 'text-warn',
	danger: 'text-danger'
};

/**
 * การ์ดตัวเลขสรุป (สไตล์ widget มีมิติ): tint = การ์ดเด่นไล่สีเขียว, warn = ไล่สีส้มอ่อน, neutral = ขาว
 * ใช้ร่วมกันทุกหน้ารายการ
 */
export function StatCard({
	label,
	value,
	sub,
	tone = 'neutral',
	color = 'primary',
	icon
}: {
	label: ReactNode;
	value: ReactNode;
	sub?: ReactNode;
	tone?: Tone;
	color?: ValueColor;
	icon?: ReactNode;
}) {
	const hero = tone === 'tint';

	return (
		<div
			className={clsx(
				'relative flex items-center gap-4 overflow-hidden rounded-3xl px-5 py-[18px] ring-1 motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5',
				hero
					? 'from-primary to-brand shadow-glow bg-gradient-to-br text-white ring-0'
					: tone === 'warn'
						? 'to-warn-soft shadow-depth hover:shadow-lift bg-gradient-to-br from-white ring-black/[0.04]'
						: 'bg-surface shadow-depth hover:shadow-lift ring-black/[0.04]'
			)}
		>
			{hero && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-white/15 blur-2xl"
				/>
			)}
			{icon && (
				<div
					aria-hidden="true"
					className={clsx(
						'relative flex size-14 shrink-0 items-center justify-center rounded-2xl',
						hero
							? 'bg-white/20 text-white ring-1 ring-white/30'
							: tone === 'warn'
								? 'bg-warn text-white shadow-[0_8px_16px_-6px_rgba(184,86,15,.6)]'
								: 'from-tint ring-line text-primary-ink bg-gradient-to-br to-white ring-1'
					)}
				>
					{icon}
				</div>
			)}
			<div className="relative min-w-0">
				<div className={clsx('text-[15px]', hero ? 'text-white/85' : 'text-ink-muted')}>{label}</div>
				<div
					className={clsx(
						'font-display text-[26px] leading-8 font-semibold tracking-tight',
						hero ? 'text-white' : colors[color]
					)}
				>
					{value}
				</div>
				{sub && <div className={clsx('text-[14px]', hero ? 'text-white/80' : 'text-ink-muted')}>{sub}</div>}
			</div>
		</div>
	);
}

export function StatGrid({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">{children}</div>;
}
