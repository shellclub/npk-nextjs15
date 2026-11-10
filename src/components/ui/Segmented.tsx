import clsx from 'clsx';
import type { ReactNode } from 'react';

/** สวิตช์แบบแบ่งช่อง (เช่น ตาราง / บอร์ด) */
export function Segmented<T extends string>({
	options,
	value,
	onChange,
	label
}: {
	options: { value: T; label: ReactNode }[];
	value: T;
	onChange: (v: T) => void;
	label: string;
}) {
	return (
		<div
			role="group"
			aria-label={label}
			className="bg-track inline-flex rounded-lg p-[3px]"
		>
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					aria-pressed={o.value === value}
					onClick={() => onChange(o.value)}
					className={clsx(
						'font-display focus-visible:outline-focus inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2',
						o.value === value ? 'bg-surface text-primary-ink shadow-card' : 'text-ink-muted'
					)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}
