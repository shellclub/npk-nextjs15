'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { controlClass } from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';

export type ItemSuggestion = {
	description: string;
	unit: string;
	materialPrice: number;
	labourPrice: number;
	unitPrice: number;
	quotationNumber: string;
	date: string;
};

/** ช่องรายละเอียดรายการ + ค้นหาสินค้า/บริการที่เคยใช้ (ราคาครั้งหลังสุด) เลือกแล้วยังแก้ราคาได้ */
export function ItemSuggestInput({
	value,
	onChange,
	onPick,
	disabled,
	placeholder,
	ariaLabel,
	className
}: {
	value: string;
	onChange: (text: string) => void;
	onPick: (s: ItemSuggestion) => void;
	disabled?: boolean;
	placeholder?: string;
	ariaLabel: string;
	className?: string;
}) {
	const listId = useId();
	const input = useRef<HTMLInputElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const seq = useRef(0);
	const [options, setOptions] = useState<ItemSuggestion[]>([]);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const [loading, setLoading] = useState(false);
	const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);

	function search(text: string) {
		clearTimeout(timer.current);

		if (!text.trim()) {
			setOptions([]);
			setOpen(false);

			return;
		}

		timer.current = setTimeout(async () => {
			const mine = ++seq.current;
			setLoading(true);

			try {
				const d = await (
					await fetch(`/api/quotation-items/search?q=${encodeURIComponent(text.trim())}`)
				).json();

				if (mine !== seq.current) return; // มีคำค้นใหม่กว่าแล้ว

				const list: ItemSuggestion[] = Array.isArray(d) ? d : [];
				setOptions(list);
				setActive(0);
				setOpen(list.length > 0);

				const r = input.current?.getBoundingClientRect();

				if (r) setRect({ left: r.left, top: r.bottom + 4, width: r.width });
			} catch {
				if (mine === seq.current) setOptions([]);
			} finally {
				if (mine === seq.current) setLoading(false);
			}
		}, 250);
	}

	useEffect(() => {
		if (!open) return undefined;

		const close = () => setOpen(false);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);

		return () => {
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	}, [open]);

	useEffect(() => () => clearTimeout(timer.current), []);

	function pick(s: ItemSuggestion) {
		onPick(s);
		setOpen(false);
		setOptions([]);
	}

	return (
		<>
			<input
				ref={input}
				role="combobox"
				aria-label={ariaLabel}
				aria-expanded={open}
				aria-controls={listId}
				aria-autocomplete="list"
				autoComplete="off"
				disabled={disabled}
				placeholder={placeholder}
				value={value}
				className={clsx(controlClass, className)}
				onChange={(e) => {
					onChange(e.target.value);
					search(e.target.value);
				}}
				onBlur={() => setTimeout(() => setOpen(false), 120)}
				onKeyDown={(e) => {
					if (!open) return;

					if (e.key === 'ArrowDown') {
						e.preventDefault();
						setActive((a) => Math.min(a + 1, options.length - 1));
					} else if (e.key === 'ArrowUp') {
						e.preventDefault();
						setActive((a) => Math.max(a - 1, 0));
					} else if (e.key === 'Enter') {
						e.preventDefault();
						pick(options[active]);
					} else if (e.key === 'Escape') setOpen(false);
				}}
			/>
			{open &&
				rect &&
				typeof document !== 'undefined' &&
				createPortal(
					<ul
						id={listId}
						role="listbox"
						style={{ left: rect.left, top: rect.top, width: Math.max(rect.width, 460) }}
						className="border-line bg-surface text-ink shadow-float fixed z-[60] max-h-80 overflow-y-auto rounded-xl border py-1"
					>
						<li
							className="text-ink-muted px-4 py-1.5 text-[13px]"
							aria-hidden="true"
						>
							{loading ? 'กำลังค้นหา...' : 'รายการที่เคยใช้ (ราคาครั้งหลังสุด) — เลือกแล้วแก้ราคาได้'}
						</li>
						{options.map((o, i) => (
							<li
								key={o.description}
								role="option"
								aria-selected={i === active}
							>
								<button
									type="button"
									tabIndex={-1}
									onMouseDown={(e) => e.preventDefault()}
									onMouseEnter={() => setActive(i)}
									onClick={() => pick(o)}
									className={clsx(
										'flex w-full cursor-pointer flex-col gap-0.5 px-4 py-2.5 text-left',
										i === active ? 'bg-tint' : 'hover:bg-surface-2'
									)}
								>
									<span className="text-[15px] font-semibold">{o.description}</span>
									<span className="text-ink-muted text-[13px]">
										{o.unit || '-'} · ค่าวัสดุ {formatMoney(o.materialPrice)} · ค่าแรง{' '}
										{formatMoney(o.labourPrice)} · ใช้ล่าสุด {o.quotationNumber} (
										{formatDateShort(o.date)})
									</span>
								</button>
							</li>
						))}
					</ul>,
					document.body
				)}
		</>
	);
}
