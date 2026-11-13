'use client';

import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { formatMoney, formatMoneyCompact } from '@/lib/format';

/* ---------- พื้นฐาน: การ์ดมีมิติ (ไฮไลต์ขอบบน + เงาหลายชั้น + ยกตัวเมื่อชี้) ---------- */

export function Widget({
	className,
	children,
	as: Tag = 'section'
}: {
	className?: string;
	children: ReactNode;
	as?: 'section' | 'div' | 'li';
}) {
	return (
		<Tag
			className={clsx(
				'bg-surface shadow-depth relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 ring-1 ring-black/[0.04]',
				'hover:shadow-lift motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5',
				className
			)}
		>
			{children}
		</Tag>
	);
}

export function WidgetHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h2 className="font-display text-xl leading-7 font-semibold">{title}</h2>
				{sub && <p className="text-ink-muted text-[15px]">{sub}</p>}
			</div>
			{action}
		</div>
	);
}

/* ---------- เส้นโค้งนุ่ม (Catmull-Rom → Bezier) ---------- */

type Pt = [number, number];

function smooth(pts: Pt[]): string {
	if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';

	let d = `M${pts[0][0]},${pts[0][1]}`;

	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[i - 1] ?? pts[i];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[i + 2] ?? p2;
		// จำกัดจุดควบคุมไม่ให้เส้นพุ่งเกินค่าจริง (กันกราฟต่ำกว่าศูนย์)
		const lo = Math.min(p1[1], p2[1]);
		const hi = Math.max(p1[1], p2[1]);
		const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
		const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, clamp(p1[1] + (p2[1] - p0[1]) / 6)];
		const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, clamp(p2[1] - (p3[1] - p1[1]) / 6)];
		d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
	}

	return d;
}

/* ---------- KPI: การ์ดตัวเลขหลัก มีมิเตอร์/สปาร์กไลน์ ---------- */

type KpiTone = 'hero' | 'plain' | 'warn';

export function KpiWidget({
	label,
	value,
	sub,
	icon,
	tone = 'plain',
	delta,
	meter,
	spark
}: {
	label: ReactNode;
	value: ReactNode;
	sub?: ReactNode;
	icon: ReactNode;
	tone?: KpiTone;
	/** เปอร์เซ็นต์เปลี่ยนแปลง (บวก = ดีขึ้น) */
	delta?: number | null;
	/** มิเตอร์สัดส่วน 0–1 พร้อมคำอธิบาย */
	meter?: { ratio: number; text: string };
	spark?: number[];
}) {
	const hero = tone === 'hero';
	const gid = useId();
	const sp = spark && spark.length > 1 ? spark : null;
	const lo = sp ? Math.min(...sp) : 0;
	const hi = sp ? Math.max(...sp) : 1;
	const pts: Pt[] = sp ? sp.map((v, i) => [(i / (sp.length - 1)) * 120, 34 - ((v - lo) / (hi - lo || 1)) * 28]) : [];
	const line = smooth(pts);

	return (
		<Widget
			className={clsx(
				'min-h-[176px] gap-3 p-5',
				hero && 'from-primary to-brand shadow-glow bg-gradient-to-br text-white ring-0',
				tone === 'warn' && 'to-warn-soft bg-gradient-to-br from-white'
			)}
		>
			{hero && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute -top-12 -right-10 size-44 rounded-full bg-white/15 blur-2xl"
				/>
			)}
			<div className="relative flex items-center justify-between gap-3">
				<span
					aria-hidden="true"
					className={clsx(
						'flex size-12 items-center justify-center rounded-2xl',
						hero
							? 'bg-white/20 text-white ring-1 ring-white/30'
							: tone === 'warn'
								? 'bg-warn text-white shadow-[0_8px_16px_-6px_rgba(184,86,15,.6)]'
								: 'from-tint text-primary-ink ring-line bg-gradient-to-br to-white ring-1'
					)}
				>
					{icon}
				</span>
				{delta != null && Number.isFinite(delta) && (
					<span
						className={clsx(
							'font-display inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium',
							hero
								? 'bg-white/20 text-white'
								: delta >= 0
									? 'bg-success-soft text-success'
									: 'bg-danger-soft text-danger'
						)}
					>
						{delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
						{Math.abs(delta).toFixed(0)}%<span className="sr-only"> เทียบเดือนก่อน</span>
					</span>
				)}
			</div>
			<div className="relative">
				<div className={clsx('text-[15px]', hero ? 'text-white/85' : 'text-ink-muted')}>{label}</div>
				<div className="font-display text-[30px] leading-9 font-semibold tracking-tight">{value}</div>
				{sub && <div className={clsx('text-[14px]', hero ? 'text-white/80' : 'text-ink-muted')}>{sub}</div>}
			</div>
			{sp && (
				<svg
					viewBox="0 0 120 40"
					preserveAspectRatio="none"
					aria-hidden="true"
					className="relative mt-auto h-9 w-full"
				>
					<defs>
						<linearGradient
							id={gid}
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset="0%"
								stopColor="currentColor"
								stopOpacity={hero ? 0.35 : 0.25}
							/>
							<stop
								offset="100%"
								stopColor="currentColor"
								stopOpacity="0"
							/>
						</linearGradient>
					</defs>
					<path
						d={`${line} L120,40 L0,40 Z`}
						fill={`url(#${gid})`}
						className={hero ? 'text-white' : 'text-brand'}
					/>
					<path
						d={line}
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
						className={hero ? 'text-white' : 'text-brand'}
					/>
				</svg>
			)}
			{meter && (
				<div className="relative mt-auto">
					<div
						role="progressbar"
						aria-valuenow={Math.round(meter.ratio * 100)}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label={meter.text}
						className={clsx('h-2 overflow-hidden rounded-full', hero ? 'bg-white/25' : 'bg-track')}
					>
						<div
							className={clsx(
								'h-full rounded-full',
								hero
									? 'bg-white'
									: tone === 'warn'
										? 'bg-warn'
										: 'from-brand to-primary bg-gradient-to-r'
							)}
							style={{ width: `${Math.max(3, Math.min(1, meter.ratio) * 100)}%` }}
						/>
					</div>
					<div className={clsx('mt-1.5 text-[14px]', hero ? 'text-white/85' : 'text-ink-muted')}>
						{meter.text}
					</div>
				</div>
			)}
		</Widget>
	);
}

/* ---------- กราฟพื้นที่ (Cash Flow): รายรับ/รายจ่าย พร้อม tooltip ---------- */

type Month = { month: string; label: string; income: number; expense: number };

const W = 600;
const H = 240;

export function CashFlowChart({ data }: { data: Month[] }) {
	const gid = useId();
	const [hover, setHover] = useState<number | null>(null);
	const n = data.length;
	const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense])) * 1.12;
	const x = (i: number) => (n < 2 ? W / 2 : (i / (n - 1)) * W);
	const y = (v: number) => H - (v / max) * H;
	const inc: Pt[] = data.map((d, i) => [x(i), y(d.income)]);
	const exp: Pt[] = data.map((d, i) => [x(i), y(d.expense)]);
	const incLine = smooth(inc);
	const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => (max * t) / 1.12);
	const summary = data
		.map((d) => `${d.label} รายรับ ${formatMoney(d.income, 0)} รายจ่าย ${formatMoney(d.expense, 0)}`)
		.join(', ');

	function move(e: PointerEvent<HTMLDivElement>) {
		const r = e.currentTarget.getBoundingClientRect();
		const rel = (e.clientX - r.left) / r.width;
		setHover(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
	}

	const hv = hover != null ? data[hover] : null;

	return (
		<div className="flex gap-3">
			<div
				aria-hidden="true"
				className="text-ink-muted flex h-[240px] flex-col justify-between text-right text-[13px]"
			>
				{ticks.map((t, i) => (
					<span key={i}>{formatMoneyCompact(t)}</span>
				))}
			</div>
			<div className="flex-1">
				<div
					role="img"
					aria-label={`กราฟรายรับ-รายจ่ายย้อนหลัง ${n} เดือน: ${summary}`}
					className="relative h-[240px] touch-pan-y"
					onPointerMove={move}
					onPointerLeave={() => setHover(null)}
				>
					<svg
						viewBox={`0 0 ${W} ${H}`}
						preserveAspectRatio="none"
						className="absolute inset-0 size-full overflow-visible"
					>
						<defs>
							<linearGradient
								id={`${gid}-a`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="0%"
									stopColor="var(--color-brand)"
									stopOpacity="0.45"
								/>
								<stop
									offset="100%"
									stopColor="var(--color-brand)"
									stopOpacity="0"
								/>
							</linearGradient>
						</defs>
						{[0.25, 0.5, 0.75].map((t) => (
							<line
								key={t}
								x1="0"
								x2={W}
								y1={H * t}
								y2={H * t}
								stroke="var(--color-line)"
								strokeDasharray="4 6"
								vectorEffect="non-scaling-stroke"
							/>
						))}
						<line
							x1="0"
							x2={W}
							y1={H}
							y2={H}
							stroke="var(--color-line)"
							vectorEffect="non-scaling-stroke"
						/>
						{n > 1 && (
							<>
								<path
									d={`${incLine} L${x(n - 1)},${H} L${x(0)},${H} Z`}
									fill={`url(#${gid}-a)`}
								/>
								<path
									d={incLine}
									fill="none"
									stroke="var(--color-primary)"
									strokeWidth="3"
									strokeLinecap="round"
									vectorEffect="non-scaling-stroke"
								/>
								<path
									d={smooth(exp)}
									fill="none"
									stroke="var(--color-chart-expense)"
									strokeWidth="2.5"
									strokeDasharray="2 7"
									strokeLinecap="round"
									vectorEffect="non-scaling-stroke"
								/>
							</>
						)}
						{hover != null && (
							<line
								x1={x(hover)}
								x2={x(hover)}
								y1="0"
								y2={H}
								stroke="var(--color-primary)"
								strokeOpacity=".35"
								vectorEffect="non-scaling-stroke"
							/>
						)}
					</svg>
					{data.map((d, i) => (
						<span
							key={d.month}
							aria-hidden="true"
							className={clsx(
								'bg-primary absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-transform',
								hover === i ? 'scale-150' : 'scale-100'
							)}
							style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(d.income) / H) * 100}%` }}
						/>
					))}
					{hv && hover != null && (
						<div
							role="status"
							className="border-line bg-surface/95 shadow-float pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 rounded-xl border p-3 text-[14px] backdrop-blur"
							style={{
								left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%`,
								top: 4
							}}
						>
							<div className="font-display font-semibold">{hv.label}</div>
							<div className="mt-1 flex items-center justify-between gap-4">
								<span className="flex items-center gap-1.5">
									<span className="bg-primary size-2.5 rounded-full" />
									รับ
								</span>
								<b>{formatMoney(hv.income, 0)}</b>
							</div>
							<div className="flex items-center justify-between gap-4">
								<span className="flex items-center gap-1.5">
									<span className="bg-chart-expense size-2.5 rounded-full" />
									จ่าย
								</span>
								<b>{formatMoney(hv.expense, 0)}</b>
							</div>
						</div>
					)}
				</div>
				<div
					aria-hidden="true"
					className="text-ink-muted mt-2 flex justify-between text-[13px]"
				>
					{data.map((d) => (
						<span key={d.month}>{d.label}</span>
					))}
				</div>
			</div>
		</div>
	);
}

/* ---------- แท่งกำไรสุทธิรายเดือน (รับ − จ่าย): บวกเขียว ลบแดง ---------- */

export function NetBarsChart({ data }: { data: Month[] }) {
	const [hover, setHover] = useState<number | null>(null);
	const nets = data.map((d) => d.income - d.expense);
	const top = Math.max(1, ...nets.map((v) => Math.max(0, v)));
	const bottom = Math.max(0, ...nets.map((v) => Math.max(0, -v)));
	const span = top + bottom || 1;
	const zero = (top / span) * 100; // % จากด้านบนถึงเส้นศูนย์

	return (
		<div>
			<div
				role="img"
				aria-label={`กราฟกำไรสุทธิรายเดือน: ${data.map((d, i) => `${d.label} ${formatMoney(nets[i], 0)}`).join(', ')}`}
				className="relative flex h-[220px] items-stretch gap-3"
			>
				<div
					aria-hidden="true"
					className="border-line absolute inset-x-0 border-t border-dashed"
					style={{ top: `${zero}%` }}
				/>
				{data.map((d, i) => {
					const v = nets[i];
					const h = (Math.abs(v) / span) * 100;

					return (
						<div
							key={d.month}
							className="relative flex-1"
							onPointerEnter={() => setHover(i)}
							onPointerLeave={() => setHover(null)}
						>
							<div
								className={clsx(
									'absolute inset-x-1.5 rounded-xl transition-[filter,transform] duration-200',
									v >= 0
										? 'from-brand to-primary bg-gradient-to-t shadow-[0_10px_18px_-8px_rgba(61,122,40,.7)]'
										: 'from-danger bg-gradient-to-b to-[#e85a5f] shadow-[0_10px_18px_-8px_rgba(196,22,28,.6)]',
									hover === i ? 'brightness-110' : hover != null ? 'opacity-60' : ''
								)}
								style={
									v >= 0
										? { bottom: `${100 - zero}%`, height: `${Math.max(h, 1.5)}%` }
										: { top: `${zero}%`, height: `${Math.max(h, 1.5)}%` }
								}
							/>
							{hover === i && (
								<div
									role="status"
									className="border-line bg-surface shadow-float pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 rounded-lg border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap"
								>
									{formatMoney(v, 0)}
								</div>
							)}
						</div>
					);
				})}
			</div>
			<div
				aria-hidden="true"
				className="text-ink-muted mt-2 flex gap-3 text-center text-[13px]"
			>
				{data.map((d) => (
					<span
						key={d.month}
						className="flex-1"
					>
						{d.label}
					</span>
				))}
			</div>
		</div>
	);
}

/* ---------- โดนัท: สัดส่วนสถานะ ---------- */

export function DonutWidget({
	items,
	centerLabel
}: {
	items: { key: string; label: string; value: number; color: string }[];
	centerLabel: string;
}) {
	const total = items.reduce((s, i) => s + i.value, 0);
	const R = 54;
	const C = 2 * Math.PI * R;
	let acc = 0;

	return (
		<div className="flex flex-wrap items-center gap-6">
			<div
				className="relative size-40 shrink-0"
				role="img"
				aria-label={`${centerLabel} ทั้งหมด ${total}: ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}
			>
				<svg
					viewBox="0 0 140 140"
					className="size-full -rotate-90 drop-shadow-[0_8px_10px_rgba(29,42,26,.15)]"
				>
					<circle
						cx="70"
						cy="70"
						r={R}
						fill="none"
						stroke="var(--color-track)"
						strokeWidth="16"
					/>
					{total > 0 &&
						items
							.filter((i) => i.value > 0)
							.map((i) => {
								const len = (i.value / total) * C;
								const el = (
									<circle
										key={i.key}
										cx="70"
										cy="70"
										r={R}
										fill="none"
										stroke={i.color}
										strokeWidth="16"
										strokeLinecap="round"
										strokeDasharray={`${Math.max(len - 6, 1)} ${C}`}
										strokeDashoffset={-acc}
									/>
								);
								acc += len;

								return el;
							})}
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="font-display text-[32px] leading-9 font-semibold">{total}</span>
					<span className="text-ink-muted text-[14px]">{centerLabel}</span>
				</div>
			</div>
			<ul className="flex min-w-40 flex-1 flex-col gap-2.5">
				{items.map((i) => (
					<li
						key={i.key}
						className="flex items-center justify-between gap-3 text-[16px]"
					>
						<span className="flex items-center gap-2.5">
							<span
								aria-hidden="true"
								className="size-3 rounded-full"
								style={{ backgroundColor: i.color }}
							/>
							{i.label}
						</span>
						<b className="font-display">{i.value}</b>
					</li>
				))}
			</ul>
		</div>
	);
}

/* ---------- แถวรายการล่าสุด: อวตาร์ไล่สี + ตัวหนาใหญ่/บรรทัดรองเล็ก ---------- */

const AVATARS = [
	'from-[#519638] to-[#2f6b1f]',
	'from-[#2563eb] to-[#1f5aa6]',
	'from-[#e5ad45] to-[#b8560f]',
	'from-[#4f46e5] to-[#4338ca]',
	'from-[#0891b2] to-[#0e7490]'
];

export function RecentRow({
	href,
	title,
	sub,
	number,
	amount,
	badge,
	index
}: {
	href: string;
	title: string;
	sub: string;
	number: string;
	amount: number;
	badge: ReactNode;
	index: number;
}) {
	return (
		<li>
			<Link
				href={href}
				className="hover:bg-surface-2 focus-visible:outline-focus group -mx-2 flex min-h-[68px] items-center gap-3 rounded-2xl px-2 py-2 no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<span
					aria-hidden="true"
					className={clsx(
						'font-display flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[17px] font-semibold text-white shadow-[0_8px_14px_-6px_rgba(29,42,26,.45)]',
						AVATARS[index % AVATARS.length]
					)}
				>
					{(title.replace(/^บริษัท\s*/, '').trim()[0] ?? '?').toUpperCase()}
				</span>
				<span className="min-w-0 flex-1">
					<span className="text-ink block truncate text-[17px] leading-6 font-semibold">{title}</span>
					<span className="text-ink-muted block truncate text-[14px] leading-5">
						{number} · {sub}
					</span>
				</span>
				<span className="flex shrink-0 flex-col items-end gap-1">
					<span className="font-display text-ink text-[16px] font-semibold">{formatMoney(amount, 0)}</span>
					{badge}
				</span>
			</Link>
		</li>
	);
}

/* ---------- ไทล์สรุปเอกสาร ---------- */

export function MiniStat({
	label,
	amount,
	count,
	icon
}: {
	label: string;
	amount: number;
	count: number;
	icon: ReactNode;
}) {
	return (
		<Widget className="flex-row items-center gap-4 p-5">
			<span
				aria-hidden="true"
				className="from-tint text-primary-ink ring-line flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br to-white ring-1"
			>
				{icon}
			</span>
			<div className="min-w-0">
				<div className="text-ink-muted text-[15px]">{label}</div>
				<div className="font-display text-[22px] leading-7 font-semibold">{formatMoney(amount, 0)}</div>
				<div className="text-ink-muted text-[14px]">{count} ใบ ทั้งหมด</div>
			</div>
		</Widget>
	);
}
