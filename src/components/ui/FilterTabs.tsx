import clsx from 'clsx';

export type FilterTab<T extends string> = { value: T; label: string; count?: number };

export function FilterTabs<T extends string>({
	tabs,
	value,
	onChange,
	label = 'กรองตามสถานะ'
}: {
	tabs: FilterTab<T>[];
	value: T;
	onChange: (v: T) => void;
	label?: string;
}) {
	return (
		<div
			role="group"
			aria-label={label}
			className="flex flex-wrap gap-2"
		>
			{tabs.map((t) => {
				const on = t.value === value;
				return (
					<button
						key={t.value}
						type="button"
						aria-pressed={on}
						onClick={() => onChange(t.value)}
						className={clsx(
							'font-display focus-visible:outline-focus inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2',
							on
								? 'border-primary to-primary-ink bg-gradient-to-b from-[#46872f] text-white shadow-[0_8px_16px_-8px_rgba(61,122,40,.85)]'
								: 'border-line bg-surface text-ink shadow-card hover:border-primary hover:bg-tint'
						)}
					>
						{t.label}
						{t.count !== undefined && (
							<span
								className={clsx('rounded-full px-2 text-xs leading-5', on ? 'bg-white/20' : 'bg-track')}
							>
								{t.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
