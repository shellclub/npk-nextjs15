'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { InfoCard } from './Info';
import { PageHeader } from './PageHeader';
import { PrintPreviewDialog } from './PrintPreviewDialog';

/** หน้ารายละเอียดเอกสารทางการเงิน: หัวเรื่อง + การ์ดข้อมูล + ส่วนสรุป + พิมพ์ */
export function DocumentDetail({
	loading,
	notFound,
	notFoundText,
	backHref,
	backLabel,
	number,
	badge,
	subtitle,
	cards,
	summary,
	printSrc,
	actions
}: {
	loading: boolean;
	notFound: boolean;
	notFoundText: string;
	backHref: string;
	backLabel: string;
	number: string;
	badge?: ReactNode;
	subtitle?: ReactNode;
	cards: { title: string; rows: [string, ReactNode][] }[];
	summary?: ReactNode;
	printSrc: string;
	actions?: ReactNode;
}) {
	const [print, setPrint] = useState(false);

	if (loading) return <p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>;

	if (notFound) {
		return (
			<div className="flex flex-col items-center gap-4 py-20">
				<p role="alert">{notFoundText}</p>
				<Button href={backHref}>{backLabel}</Button>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label={backLabel}
							href={backHref}
						>
							<ArrowLeft size={22} />
						</IconButton>
						{number}
					</span>
				}
				badge={badge}
				subtitle={subtitle}
				actions={
					<>
						{actions}
						<Button
							variant="outline"
							icon={<Printer size={18} />}
							onClick={() => setPrint(true)}
						>
							พิมพ์
						</Button>
					</>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
				{cards.map((c) => (
					<InfoCard
						key={c.title}
						title={c.title}
						rows={c.rows}
					/>
				))}
			</div>
			{summary && <div className="bg-surface shadow-card rounded-2xl p-6">{summary}</div>}
			<PrintPreviewDialog
				open={print}
				onClose={() => setPrint(false)}
				title={number}
				src={printSrc}
			/>
		</>
	);
}

/** ตารางสรุปยอดท้ายเอกสาร */
export function TotalsBlock({ rows, grand }: { rows: [string, string][]; grand: [string, string] }) {
	return (
		<dl className="ml-auto flex max-w-sm flex-col gap-2">
			{rows.map(([k, v]) => (
				<div
					key={k}
					className="flex justify-between"
				>
					<dt className="text-ink-muted">{k}</dt>
					<dd className="font-semibold tabular-nums">{v}</dd>
				</div>
			))}
			<div className="border-line flex items-baseline justify-between border-t-2 pt-2">
				<dt className="font-display text-lg font-semibold">{grand[0]}</dt>
				<dd className="font-display text-primary-ink text-2xl font-semibold tabular-nums">{grand[1]}</dd>
			</div>
		</dl>
	);
}
