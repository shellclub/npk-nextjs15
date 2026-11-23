import type { ReactNode } from 'react';
import { Card, CardHeader } from './Card';

export function DefRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="border-line flex flex-wrap justify-between gap-x-4 border-b py-2 last:border-0">
			<dt className="text-ink-muted">{label}</dt>
			<dd className="text-right font-medium">{children}</dd>
		</div>
	);
}

export function InfoCard({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
	return (
		<Card>
			<CardHeader title={title} />
			<dl>
				{rows
					.filter(([, v]) => v !== null && v !== undefined && v !== false)
					.map(([k, v]) => (
						<DefRow
							key={k}
							label={k}
						>
							{v}
						</DefRow>
					))}
			</dl>
		</Card>
	);
}
