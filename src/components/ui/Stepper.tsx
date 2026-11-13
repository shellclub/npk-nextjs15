import clsx from 'clsx';
import { Check } from 'lucide-react';

/** current = index (0-based) ของขั้นปัจจุบัน; ขั้นก่อนหน้าถือว่าเสร็จ */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
	return (
		<ol
			aria-label="ขั้นตอนงาน"
			className="flex flex-wrap items-center gap-y-3"
		>
			{steps.map((s, i) => {
				const done = i < current;
				const now = i === current;
				return (
					<li
						key={s}
						aria-current={now ? 'step' : undefined}
						className="flex items-center"
					>
						<span
							className={clsx(
								'font-display flex size-8 items-center justify-center rounded-full text-sm font-medium',
								done && 'bg-primary text-white',
								now && 'bg-surface text-primary-ink ring-primary ring-2',
								!done && !now && 'bg-track text-ink-muted'
							)}
						>
							{done ? (
								<Check
									size={16}
									aria-hidden="true"
								/>
							) : (
								i + 1
							)}
						</span>
						<span className={clsx('font-display ml-2 text-sm', now ? 'font-semibold' : 'text-ink-muted')}>
							{s}
						</span>
						{i < steps.length - 1 && (
							<span
								aria-hidden="true"
								className={clsx('mx-3 h-0.5 w-8 rounded', done ? 'bg-primary' : 'bg-line')}
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}
