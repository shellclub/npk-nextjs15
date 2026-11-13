import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export const controlClass =
	'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgba(29,42,26,.06)] transition-colors hover:border-primary placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-surface-2';

/** label + control + error; ส่ง render-prop เพื่อได้ id ที่ผูกกับ <label> */
export function Field({
	label,
	error,
	hint,
	required,
	action,
	className,
	children
}: {
	label: string;
	error?: string;
	hint?: string;
	required?: boolean;
	action?: ReactNode;
	className?: string;
	children: (id: string, invalid: boolean) => ReactNode;
}) {
	const id = useId();
	return (
		<div className={clsx('flex flex-col gap-1.5', className)}>
			<div className="flex min-h-6 items-center justify-between gap-2">
				<label
					htmlFor={id}
					className="font-display text-[16px] leading-6 font-medium"
				>
					{label}
					{required && <span className="text-danger"> *</span>}
				</label>
				{action}
			</div>
			{children(id, !!error)}
			{hint && !error && <p className="text-ink-muted text-[13px]">{hint}</p>}
			{error && (
				<p
					role="alert"
					className="text-danger text-[13px]"
				>
					{error}
				</p>
			)}
		</div>
	);
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={clsx(controlClass, className)}
			{...rest}
		/>
	);
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={clsx(controlClass, 'h-auto min-h-24 py-2.5', className)}
			{...rest}
		/>
	);
}

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<div className={clsx('relative', className)}>
			<Search
				aria-hidden="true"
				size={18}
				className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
			/>
			<input
				type="search"
				className={clsx(controlClass, 'pl-11')}
				{...rest}
			/>
		</div>
	);
}

/** ตัวกรองแบบมีป้าย (ใช้ในแถวตัวกรองของ list page) */
export function FilterField({
	label,
	className,
	children
}: {
	label: string;
	className?: string;
	children: (id: string) => ReactNode;
}) {
	const id = useId();
	return (
		<div className={clsx('flex min-w-40 flex-col gap-1.5', className)}>
			<label
				htmlFor={id}
				className="font-display text-ink-muted text-[15px] leading-6 font-medium"
			>
				{label}
			</label>
			{children(id)}
		</div>
	);
}
