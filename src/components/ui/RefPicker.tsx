'use client';

import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Field, controlClass } from './Field';

/** ช่องค้นหาแล้วเลือกเอกสารอ้างอิงจาก API (WO, ใบแจ้งหนี้ ฯลฯ) */
export function RefPicker<T extends object>({
	label,
	required,
	url,
	filter,
	getLabel,
	getId = (o) => (o as unknown as { id: string }).id,
	searchParam = 'search',
	minChars = 0,
	value,
	onChange,
	placeholder,
	emptyText
}: {
	label: string;
	required?: boolean;
	url: string;
	filter?: (item: T) => boolean;
	getLabel: (item: T) => string;
	getId?: (item: T) => string;
	searchParam?: string;
	minChars?: number;
	value: T | null;
	onChange: (item: T | null) => void;
	placeholder?: string;
	emptyText?: string;
}) {
	const listId = useId();
	const [text, setText] = useState('');
	const [options, setOptions] = useState<T[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const box = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return undefined;

		const t = setTimeout(async () => {
			if (text.length < minChars) {
				setOptions([]);

				return;
			}

			setLoading(true);

			try {
				const d = await (
					await fetch(`${url}${url.includes('?') ? '&' : '?'}${searchParam}=${encodeURIComponent(text)}`)
				).json();
				setOptions((Array.isArray(d) ? d : []).filter(filter ?? (() => true)).slice(0, 30));
			} catch {
				setOptions([]);
			} finally {
				setLoading(false);
			}
		}, 250);

		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text, open, url]);

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!box.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDoc);

		return () => document.removeEventListener('mousedown', onDoc);
	}, []);

	return (
		<Field
			label={label}
			required={required}
		>
			{(id) => (
				<div
					ref={box}
					className="relative"
				>
					<Search
						aria-hidden="true"
						size={18}
						className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
					/>
					<input
						id={id}
						role="combobox"
						aria-expanded={open}
						aria-controls={listId}
						aria-autocomplete="list"
						className={clsx(controlClass, 'pl-11')}
						placeholder={placeholder}
						value={open ? text : value ? getLabel(value) : text}
						onFocus={() => {
							setOpen(true);
							setText('');
						}}
						onChange={(e) => {
							setText(e.target.value);
							setOpen(true);

							if (value) onChange(null);
						}}
						onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
					/>
					{open && (
						<ul
							id={listId}
							role="listbox"
							className="border-line bg-surface shadow-float absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border p-1.5"
						>
							{loading && <li className="text-ink-muted px-4 py-3">กำลังค้นหา...</li>}
							{!loading && options.length === 0 && (
								<li className="text-ink-muted px-4 py-3">{emptyText ?? 'ไม่พบข้อมูล'}</li>
							)}
							{options.map((o) => (
								<li
									key={getId(o)}
									role="option"
									aria-selected={!!value && getId(value) === getId(o)}
								>
									<button
										type="button"
										className="hover:bg-primary focus-visible:outline-focus min-h-12 w-full cursor-pointer rounded-lg px-4 py-2 text-left text-[16px] transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2"
										onClick={() => {
											onChange(o);
											setOpen(false);
										}}
									>
										{getLabel(o)}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</Field>
	);
}
