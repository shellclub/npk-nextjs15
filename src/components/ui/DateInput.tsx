'use client';

import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { controlClass } from './Field';
import {
	BE,
	MONTHS,
	MONTHS_SHORT,
	WEEKDAYS,
	addDays,
	addMonths,
	cmp,
	daysIn,
	formatThaiDate,
	parse,
	today,
	toIso,
	type YMD
} from '@/lib/thai-date';

/**
 * ช่องเลือกวันที่ปฏิทินไทย (พ.ศ.). ค่า value/onChange เป็น ISO ค.ศ. 'YYYY-MM-DD' เสมอ (เก็บในฐานข้อมูลแบบเดิม)
 * onChange ส่ง event-like ({ target: { value } }) เพื่อใช้แทน <input type="date"> ได้ทันที
 */
export function DateInput({
	id,
	value,
	onChange,
	disabled,
	min,
	max,
	placeholder = 'เลือกวันที่',
	className,
	'aria-invalid': invalid,
	'aria-label': ariaLabel
}: {
	id?: string;
	value?: string | null;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
	min?: string;
	max?: string;
	placeholder?: string;
	className?: string;
	'aria-invalid'?: boolean;
	'aria-label'?: string;
}) {
	const dlgId = useId();
	const [btn, setBtn] = useState<HTMLButtonElement | null>(null);
	const box = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<'days' | 'months' | 'years'>('days');
	const [shown, setShown] = useState<YMD>(today()); // เดือนที่กำลังดู
	const [focus, setFocus] = useState<YMD>(today()); // วันที่โฟกัสด้วยคีย์บอร์ด
	const [yearPage, setYearPage] = useState(0);
	const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; maxH: number } | null>(null);
	const sel = parse(value);
	const minV = parse(min);
	const maxV = parse(max);
	const t = today();
	const blocked = (v: YMD) => (!!minV && cmp(v, minV) < 0) || (!!maxV && cmp(v, maxV) > 0);
	const close = useCallback(() => setOpen(false), []);

	function openCal() {
		if (disabled) return;

		const base = sel ?? t;
		setShown({ ...base, d: 1 });
		setFocus(base);
		setView('days');
		setOpen(true);
	}

	function emit(v: YMD | null) {
		const iso = v ? toIso(v) : '';
		onChange?.({
			target: { value: iso },
			currentTarget: { value: iso }
		} as unknown as ChangeEvent<HTMLInputElement>);
	}

	function pick(v: YMD) {
		if (blocked(v)) return;

		emit(v);
		setOpen(false);
		btn?.focus();
	}

	useLayoutEffect(() => {
		if (!open || !btn) return;

		const r = btn.getBoundingClientRect();
		const below = window.innerHeight - r.bottom - 12;
		const above = r.top - 12;
		const flip = below < 440 && above > below;
		setPos({
			left: Math.min(r.left, Math.max(8, window.innerWidth - 376)),
			maxH: Math.min(520, flip ? above : below),
			...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 })
		});
	}, [open, btn]);

	useEffect(() => {
		if (!open) return undefined;

		const onDown = (e: MouseEvent) => {
			const tg = e.target as Node;

			if (!box.current?.contains(tg) && !btn?.contains(tg)) setOpen(false);
		};
		const onScroll = (e: Event) => {
			if (!box.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', close);

		return () => {
			document.removeEventListener('mousedown', onDown);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', close);
		};
	}, [open, btn, close]);

	// ย้ายโฟกัสไปที่วันที่เลือกด้วยคีย์บอร์ด
	useEffect(() => {
		if (open && view === 'days') box.current?.querySelector<HTMLElement>(`[data-iso="${toIso(focus)}"]`)?.focus();
	}, [open, view, focus, shown]);

	function onGridKey(e: KeyboardEvent) {
		const moves: Record<string, YMD | undefined> = {
			ArrowLeft: addDays(focus, -1),
			ArrowRight: addDays(focus, 1),
			ArrowUp: addDays(focus, -7),
			ArrowDown: addDays(focus, 7),
			PageUp: addMonths(focus, e.shiftKey ? -12 : -1),
			PageDown: addMonths(focus, e.shiftKey ? 12 : 1),
			Home: addDays(focus, -new Date(focus.y, focus.m, focus.d).getDay()),
			End: addDays(focus, 6 - new Date(focus.y, focus.m, focus.d).getDay())
		};

		if (moves[e.key]) {
			e.preventDefault();
			setFocus(moves[e.key]!);
			setShown({ ...moves[e.key]!, d: 1 });
		} else if (e.key === 'Escape') {
			setOpen(false);
			btn?.focus();
		}
	}

	const lead = new Date(shown.y, shown.m, 1).getDay();
	const cells: (YMD | null)[] = [
		...Array.from({ length: lead }, () => null),
		...Array.from({ length: daysIn(shown.y, shown.m) }, (_, i) => ({ y: shown.y, m: shown.m, d: i + 1 }))
	];
	const yearStart = Math.floor((shown.y + BE) / 12) * 12 + yearPage * 12; // พ.ศ.
	const nav =
		'hover:bg-tint text-primary-ink focus-visible:outline-focus flex size-11 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';

	const popup =
		open && pos && typeof document !== 'undefined'
			? createPortal(
					<div
						ref={box}
						id={dlgId}
						role="dialog"
						aria-label="เลือกวันที่"
						style={{ left: pos.left, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
						className="border-line bg-surface text-ink shadow-float fixed z-[70] w-[360px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-2xl border p-4"
					>
						<div className="mb-3 flex items-center justify-between gap-1">
							<button
								type="button"
								aria-label={view === 'days' ? 'เดือนก่อนหน้า' : 'ก่อนหน้า'}
								className={nav}
								onClick={() =>
									view === 'days'
										? setShown(addMonths(shown, -1))
										: view === 'years'
											? setYearPage((p) => p - 1)
											: setShown({ ...shown, y: shown.y - 1 })
								}
							>
								<ChevronLeft size={22} />
							</button>
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="hover:bg-primary focus-visible:outline-focus font-display min-h-11 cursor-pointer rounded-lg px-3 text-[17px] font-semibold transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
									onClick={() => setView(view === 'months' ? 'days' : 'months')}
								>
									{MONTHS[shown.m]}
								</button>
								<button
									type="button"
									className="hover:bg-primary focus-visible:outline-focus font-display min-h-11 cursor-pointer rounded-lg px-3 text-[17px] font-semibold transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
									onClick={() => {
										setYearPage(0);
										setView(view === 'years' ? 'days' : 'years');
									}}
								>
									พ.ศ. {shown.y + BE}
								</button>
							</div>
							<button
								type="button"
								aria-label={view === 'days' ? 'เดือนถัดไป' : 'ถัดไป'}
								className={nav}
								onClick={() =>
									view === 'days'
										? setShown(addMonths(shown, 1))
										: view === 'years'
											? setYearPage((p) => p + 1)
											: setShown({ ...shown, y: shown.y + 1 })
								}
							>
								<ChevronRight size={22} />
							</button>
						</div>

						{view === 'days' && (
							<div
								role="grid"
								aria-label={`${MONTHS[shown.m]} พ.ศ. ${shown.y + BE}`}
								onKeyDown={onGridKey}
							>
								<div
									className="mb-1 grid grid-cols-7 text-center"
									role="row"
								>
									{WEEKDAYS.map((w, i) => (
										<span
											key={w}
											role="columnheader"
											className={clsx(
												'font-display py-2 text-[14px] font-medium',
												i === 0 ? 'text-danger' : 'text-ink-muted'
											)}
										>
											{w}
										</span>
									))}
								</div>
								<div className="grid grid-cols-7 gap-y-1">
									{cells.map((c, i) => {
										if (!c) return <span key={`b${i}`} />;

										const isSel = !!sel && cmp(c, sel) === 0;
										const isToday = cmp(c, t) === 0;
										const off = blocked(c);

										return (
											<button
												key={c.d}
												type="button"
												role="gridcell"
												data-iso={toIso(c)}
												tabIndex={cmp(c, focus) === 0 ? 0 : -1}
												aria-selected={isSel}
												aria-current={isToday ? 'date' : undefined}
												disabled={off}
												onClick={() => pick(c)}
												className={clsx(
													'focus-visible:outline-focus mx-auto flex size-11 cursor-pointer items-center justify-center rounded-full text-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30',
													isSel
														? 'bg-primary font-semibold text-white'
														: 'hover:bg-primary hover:text-white',
													!isSel &&
														isToday &&
														'border-primary text-primary-ink border-2 font-semibold',
													!isSel && !isToday && (i + lead) % 7 === 0 && 'text-danger'
												)}
											>
												{c.d}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{view === 'months' && (
							<div className="grid grid-cols-3 gap-2">
								{MONTHS_SHORT.map((mn, i) => (
									<button
										key={mn}
										type="button"
										onClick={() => {
											setShown({ ...shown, m: i, d: 1 });
											setFocus({ y: shown.y, m: i, d: Math.min(focus.d, daysIn(shown.y, i)) });
											setView('days');
										}}
										className={clsx(
											'focus-visible:outline-focus min-h-12 cursor-pointer rounded-lg text-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
											i === shown.m
												? 'bg-tint text-primary-ink hover:bg-primary font-semibold hover:text-white'
												: 'hover:bg-primary hover:text-white'
										)}
									>
										{mn}
									</button>
								))}
							</div>
						)}

						{view === 'years' && (
							<div className="grid grid-cols-3 gap-2">
								{Array.from({ length: 12 }, (_, i) => yearStart + i).map((be) => (
									<button
										key={be}
										type="button"
										onClick={() => {
											setShown({ ...shown, y: be - BE, d: 1 });
											setFocus({
												y: be - BE,
												m: shown.m,
												d: Math.min(focus.d, daysIn(be - BE, shown.m))
											});
											setView('days');
										}}
										className={clsx(
											'focus-visible:outline-focus min-h-12 cursor-pointer rounded-lg text-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
											be - BE === shown.y
												? 'bg-tint text-primary-ink hover:bg-primary font-semibold hover:text-white'
												: 'hover:bg-primary hover:text-white'
										)}
									>
										{be}
									</button>
								))}
							</div>
						)}

						<div className="border-line mt-3 flex items-center justify-between border-t pt-3">
							<button
								type="button"
								className="text-primary-ink hover:bg-tint focus-visible:outline-focus font-display min-h-11 cursor-pointer rounded-lg px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
								onClick={() => pick(t)}
								disabled={blocked(t)}
							>
								วันนี้
							</button>
							<button
								type="button"
								className="text-ink-muted hover:bg-track focus-visible:outline-focus font-display min-h-11 cursor-pointer rounded-lg px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
								onClick={() => {
									emit(null);
									setOpen(false);
									btn?.focus();
								}}
							>
								ล้างค่า
							</button>
						</div>
					</div>,
					(btn?.closest('dialog') as HTMLElement | null) ?? document.body
				)
			: null;

	return (
		<>
			<button
				ref={setBtn}
				id={id}
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={open ? dlgId : undefined}
				aria-invalid={invalid}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={() => (open ? setOpen(false) : openCal())}
				className={clsx(
					controlClass,
					'flex cursor-pointer items-center justify-between gap-2 text-left transition-colors',
					'hover:border-primary hover:bg-tint/50 disabled:cursor-not-allowed disabled:opacity-70',
					open && 'border-primary bg-tint/50',
					invalid && 'border-danger',
					className
				)}
			>
				<span className={clsx('min-w-0 flex-1 truncate', !sel && 'text-ink-muted')}>
					{sel ? formatThaiDate(value) : placeholder}
				</span>
				<CalendarDays
					size={20}
					aria-hidden="true"
					className="text-primary-ink shrink-0"
				/>
			</button>
			{popup}
		</>
	);
}
