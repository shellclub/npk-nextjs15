import clsx from 'clsx';
import type { CSSProperties } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'danger' | 'warn' | 'violet' | 'tint';

const tones: Record<BadgeTone, string> = {
	neutral: 'bg-track text-ink',
	info: 'bg-info-soft text-info',
	success: 'bg-success-soft text-success',
	danger: 'bg-danger-soft text-danger',
	warn: 'bg-warn-soft text-warn',
	violet: 'bg-violet-soft text-violet',
	tint: 'bg-tint text-primary-ink'
};

/** สถานะต้องมีข้อความเสมอ (ไม่ใช้สีอย่างเดียว) — ใส่ color/bgColor เมื่อสีมาจาก DB (WorkOrderStatusConfig) */
export function StatusBadge({
	label,
	tone = 'neutral',
	color,
	bgColor,
	className
}: {
	label: string;
	tone?: BadgeTone;
	color?: string;
	bgColor?: string;
	className?: string;
}) {
	const style: CSSProperties | undefined = color || bgColor ? { color, backgroundColor: bgColor } : undefined;
	return (
		<span
			style={style}
			className={clsx(
				'font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] leading-[18px] font-medium whitespace-nowrap',
				!style && tones[tone],
				className
			)}
		>
			<span
				aria-hidden="true"
				className="size-1.5 rounded-full bg-current"
			/>
			{label}
		</span>
	);
}
