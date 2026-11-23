'use client';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { Children, isValidElement, useCallback, useId, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { controlClass } from './Field';
import { OptionList, type Opt } from './OptionList';

function textOf(n: ReactNode): string {
	if (n === null || n === undefined || typeof n === 'boolean') return '';

	if (typeof n === 'string' || typeof n === 'number') return String(n);

	if (Array.isArray(n)) return n.map(textOf).join('');

	if (isValidElement(n)) return textOf((n.props as { children?: ReactNode }).children);

	return '';
}

/** แปลง <option> ที่ส่งเป็น children (รวม array/fragment) เป็นรายการตัวเลือก */
function toOptions(children: ReactNode): Opt[] {
	const out: Opt[] = [];

	Children.toArray(children).forEach((c) => {
		if (!isValidElement(c)) return;

		const p = c.props as { value?: string | number; children?: ReactNode; disabled?: boolean };

		if (c.type === 'option') {
			const label = textOf(p.children);
			out.push({ value: p.value !== undefined ? String(p.value) : label, label, disabled: p.disabled });
		} else if (p.children) out.push(...toOptions(p.children));
	});

	return out;
}

/** ใช้แทน <select>: API เดิม (children เป็น <option>, onChange อ่าน e.target.value) แต่หน้าตาเป็นแท็บใหญ่สีเขียว */
export function Select({
	id,
	value,
	onChange,
	disabled,
	className,
	children,
	'aria-invalid': invalid,
	'aria-label': ariaLabel
}: {
	id?: string;
	value?: string | number;
	onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
	'aria-invalid'?: boolean;
	'aria-label'?: string;
}) {
	const listId = useId();
	const [btn, setBtn] = useState<HTMLButtonElement | null>(null);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const options = toOptions(children);
	const cur = String(value ?? '');
	const selIdx = options.findIndex((o) => o.value === cur);
	const shown = options[selIdx] ?? options[0];
	const close = useCallback(() => setOpen(false), []);

	function openList() {
		if (disabled) return;

		setActive(Math.max(0, selIdx));
		setOpen(true);
	}

	function pick(o: Opt) {
		onChange?.({
			target: { value: o.value },
			currentTarget: { value: o.value }
		} as unknown as ChangeEvent<HTMLSelectElement>);
		setOpen(false);
		btn?.focus();
	}

	function step(dir: 1 | -1) {
		let i = active;
		let tries = options.length;

		do {
			i = (i + dir + options.length) % options.length;
			tries--;
		} while (options[i]?.disabled && tries > 0);

		setActive(i);
	}

	function onKey(e: KeyboardEvent) {
		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
				e.preventDefault();
				openList();
			}

			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			step(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			step(-1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			setActive(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			setActive(options.length - 1);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();

			if (options[active] && !options[active].disabled) pick(options[active]);
		} else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
	}

	return (
		<>
			<button
				ref={setBtn}
				id={id}
				type="button"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				aria-invalid={invalid}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={() => (open ? setOpen(false) : openList())}
				onKeyDown={onKey}
				className={clsx(
					controlClass,
					'flex cursor-pointer items-center justify-between gap-2 text-left transition-colors',
					'hover:border-primary hover:bg-tint/50 disabled:cursor-not-allowed disabled:opacity-70',
					open && 'border-primary bg-tint/50',
					invalid && 'border-danger',
					className
				)}
			>
				<span className={clsx('min-w-0 flex-1 truncate', (!shown || shown.value === '') && 'text-ink-muted')}>
					{shown?.label ?? ''}
				</span>
				<ChevronDown
					size={18}
					aria-hidden="true"
					className={clsx('text-primary-ink shrink-0 transition-transform', open && 'rotate-180')}
				/>
			</button>
			<OptionList
				anchor={btn}
				open={open}
				options={options}
				active={active}
				selected={cur}
				listId={listId}
				onPick={pick}
				onHover={setActive}
				onClose={close}
			/>
		</>
	);
}
