'use client';

import clsx from 'clsx';
import { useCallback, useId, useState } from 'react';
import { controlClass } from './Field';
import { OptionList, type Opt } from './OptionList';

/** ช่องพิมพ์ได้ + รายการแนะนำแบบแท็บใหญ่ (แทน <input list> + <datalist>) */
export function ComboInput({
	id,
	value,
	onChange,
	options,
	disabled,
	placeholder,
	ariaLabel,
	className,
	minWidth = 160
}: {
	id?: string;
	value: string;
	onChange: (text: string) => void;
	options: string[];
	disabled?: boolean;
	placeholder?: string;
	ariaLabel?: string;
	className?: string;
	minWidth?: number;
}) {
	const listId = useId();
	const [input, setInput] = useState<HTMLInputElement | null>(null);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const close = useCallback(() => setOpen(false), []);
	const k = value.trim().toLowerCase();
	const exact = options.some((o) => o.toLowerCase() === k);
	const list: Opt[] = options
		.filter((o) => !k || exact || o.toLowerCase().includes(k))
		.map((o) => ({ value: o, label: o }));

	function pick(o: Opt) {
		onChange(o.value);
		setOpen(false);
	}

	return (
		<>
			<input
				ref={setInput}
				id={id}
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				aria-autocomplete="list"
				aria-label={ariaLabel}
				autoComplete="off"
				disabled={disabled}
				placeholder={placeholder}
				value={value}
				className={clsx(controlClass, 'hover:border-primary transition-colors', className)}
				onFocus={() => {
					setActive(0);
					setOpen(true);
				}}
				onChange={(e) => {
					onChange(e.target.value);
					setActive(0);
					setOpen(true);
				}}
				onKeyDown={(e) => {
					if (!open) return;

					if (e.key === 'ArrowDown') {
						e.preventDefault();
						setActive((a) => Math.min(a + 1, list.length - 1));
					} else if (e.key === 'ArrowUp') {
						e.preventDefault();
						setActive((a) => Math.max(a - 1, 0));
					} else if (e.key === 'Enter' && list[active]) {
						e.preventDefault();
						pick(list[active]);
					} else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
				}}
			/>
			<OptionList
				anchor={input}
				open={open && list.length > 0}
				options={list}
				active={active}
				selected={value}
				listId={listId}
				minWidth={minWidth}
				onPick={pick}
				onHover={setActive}
				onClose={close}
			/>
		</>
	);
}
