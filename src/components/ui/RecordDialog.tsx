'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Field, Input, Textarea } from './Field';

export type RecordField = {
	key: string;
	label: string;
	required?: boolean;
	multiline?: boolean;
	type?: string;
	hint?: string;
	span?: 2;
};

/** ฟอร์มเพิ่ม/แก้ไขแบบ dialog จากรายการฟิลด์ (ค่าเป็น string ทั้งหมด) */
export function RecordDialog({
	open,
	title,
	fields,
	initial,
	submitLabel = 'บันทึก',
	onSubmit,
	onClose
}: {
	open: boolean;
	title: string;
	fields: RecordField[];
	initial?: Record<string, string | null | undefined>;
	submitLabel?: string;
	onSubmit: (values: Record<string, string>) => Promise<void> | void;
	onClose: () => void;
}) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open) {
			setValues(Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? ''])));
			setErrors({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initial]);

	async function submit(e: React.FormEvent) {
		e.preventDefault();

		const errs: Record<string, string> = {};
		fields.forEach((f) => {
			if (f.required && !values[f.key]?.trim()) errs[f.key] = `กรุณากรอก${f.label}`;
		});
		setErrors(errs);

		if (Object.keys(errs).length) return;

		setBusy(true);

		try {
			await onSubmit(values);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			footer={
				<>
					<Button
						variant="ghost"
						onClick={onClose}
					>
						ยกเลิก
					</Button>
					<Button
						type="submit"
						form="record-form"
						disabled={busy}
					>
						{submitLabel}
					</Button>
				</>
			}
		>
			<form
				id="record-form"
				noValidate
				onSubmit={submit}
				className="grid grid-cols-1 gap-4 sm:grid-cols-2"
			>
				{fields.map((f) => (
					<Field
						key={f.key}
						label={f.label}
						required={f.required}
						error={errors[f.key]}
						hint={f.hint}
						className={f.multiline || f.span === 2 ? 'sm:col-span-2' : undefined}
					>
						{(id, invalid) =>
							f.multiline ? (
								<Textarea
									id={id}
									aria-invalid={invalid}
									value={values[f.key] ?? ''}
									onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
								/>
							) : (
								<Input
									id={id}
									type={f.type ?? 'text'}
									aria-invalid={invalid}
									value={values[f.key] ?? ''}
									onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
								/>
							)
						}
					</Field>
				))}
			</form>
		</Dialog>
	);
}
