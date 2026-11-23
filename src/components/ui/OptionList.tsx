'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type Opt = { value: string; label: string; disabled?: boolean };

/** รายการตัวเลือกแบบลอย (ใช้ร่วมกันโดย Select และ ComboInput): แท็บใหญ่ เมาส์ชี้แล้วเป็นสีเขียวเข้ม */
export function OptionList({
	anchor,
	open,
	options,
	active,
	selected,
	listId,
	minWidth = 220,
	onPick,
	onHover,
	onClose
}: {
	anchor: HTMLElement | null;
	open: boolean;
	options: Opt[];
	active: number;
	selected?: string;
	listId: string;
	minWidth?: number;
	onPick: (o: Opt) => void;
	onHover: (i: number) => void;
	onClose: () => void;
}) {
	const box = useRef<HTMLUListElement>(null);
	const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; maxH: number } | null>(
		null
	);

	useLayoutEffect(() => {
		if (!open || !anchor) return;

		const r = anchor.getBoundingClientRect();
		const below = window.innerHeight - r.bottom - 12;
		const above = r.top - 12;
		const flip = below < 240 && above > below;

		setPos({
			left: Math.min(r.left, Math.max(8, window.innerWidth - Math.max(r.width, minWidth) - 8)),
			width: Math.max(r.width, minWidth),
			maxH: Math.min(360, flip ? above : below),
			...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 })
		});
	}, [open, anchor, minWidth, options.length]);

	useEffect(() => {
		if (!open) return undefined;

		const onScroll = (e: Event) => {
			if (!box.current?.contains(e.target as Node)) onClose();
		};
		const onDown = (e: MouseEvent) => {
			const t = e.target as Node;

			if (!box.current?.contains(t) && !anchor?.contains(t)) onClose();
		};
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onClose);
		document.addEventListener('mousedown', onDown);

		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onClose);
			document.removeEventListener('mousedown', onDown);
		};
	}, [open, anchor, onClose]);

	// เลื่อนให้ตัวที่ active อยู่ในมุมมองเสมอ (คีย์บอร์ด)
	useEffect(() => {
		if (open) box.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	}, [open, active]);

	if (!open || !pos || typeof document === 'undefined') return null;

	return createPortal(
		<ul
			ref={box}
			id={listId}
			role="listbox"
			style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxH }}
			className="border-line bg-surface text-ink shadow-float fixed z-[70] flex flex-col gap-0.5 overflow-y-auto rounded-xl border p-1.5"
		>
			{options.length === 0 && <li className="text-ink-muted px-4 py-3">ไม่พบตัวเลือก</li>}
			{options.map((o, i) => {
				const isSel = o.value === selected;
				const isActive = i === active;

				return (
					<li
						key={`${o.value}-${i}`}
						role="option"
						data-i={i}
						aria-selected={isSel}
						aria-disabled={o.disabled}
						onMouseDown={(e) => e.preventDefault()}
						onMouseEnter={() => onHover(i)}
						onClick={() => !o.disabled && onPick(o)}
						className={clsx(
							'flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 py-2 text-[16px] leading-6 transition-colors',
							o.disabled ? 'text-ink-muted cursor-not-allowed opacity-50' : 'cursor-pointer',
							!o.disabled && isActive && 'bg-primary text-white',
							!o.disabled && !isActive && isSel && 'bg-tint text-primary-ink font-semibold',
							!o.disabled && !isActive && !isSel && 'text-ink',
							o.value === '' && !isActive && 'text-ink-muted'
						)}
					>
						<span className="min-w-0 flex-1">{o.label}</span>
						{isSel && (
							<Check
								size={18}
								aria-hidden="true"
								className="shrink-0"
							/>
						)}
					</li>
				);
			})}
		</ul>,
		// อยู่ใน <dialog> ที่เปิดอยู่ต้องแสดงใน dialog เดียวกัน (top layer) ไม่งั้นรายการจะถูกบังหลัง dialog
		(anchor?.closest('dialog') as HTMLElement | null) ?? document.body
	);
}
