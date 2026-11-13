import type { ReactNode } from 'react';

export function PageHeader({
	title,
	subtitle,
	actions,
	badge
}: {
	title: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	badge?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div>
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-display text-[26px] leading-9 font-semibold">{title}</h1>
					{badge}
				</div>
				{subtitle && <p className="text-ink-muted text-[15px] leading-6">{subtitle}</p>}
			</div>
			{actions && <div className="flex flex-wrap gap-3">{actions}</div>}
		</div>
	);
}
