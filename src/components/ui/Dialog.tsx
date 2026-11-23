'use client';

import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconButton } from './IconButton';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const sizes: Record<Size, string> = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Dialog ใช้ <dialog> มาตรฐาน: focus trap + ปิดด้วย Esc ให้โดยเบราว์เซอร์ */
export function Dialog({
	open,
	onClose,
	title,
	children,
	footer,
	size = 'md'
}: {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	size?: Size;
}) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = ref.current;

		if (!el) return;

		if (open && !el.open) el.showModal();

		if (!open && el.open) el.close();
	}, [open]);

	return (
		<dialog
			ref={ref}
			onClose={onClose}
			onClick={(e) => {
				if (e.target === ref.current) onClose();
			}}
			className={clsx(
				'bg-surface text-ink shadow-lift backdrop:bg-ink/40 m-auto w-[calc(100%-32px)] rounded-3xl p-0 backdrop:backdrop-blur-sm',
				sizes[size]
			)}
		>
			{open && (
				<div className="flex max-h-[90vh] flex-col">
					<div className="border-line flex items-center justify-between gap-3 border-b px-6 py-4">
						<h2 className="font-display text-xl font-semibold">{title}</h2>
						<IconButton
							aria-label="ปิด"
							onClick={onClose}
						>
							<X size={20} />
						</IconButton>
					</div>
					<div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">{children}</div>
					{footer && (
						<div className="border-line flex flex-wrap justify-end gap-3 border-t px-6 py-4">{footer}</div>
					)}
				</div>
			)}
		</dialog>
	);
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = 'ยืนยัน',
	danger,
	busy,
	onConfirm,
	onClose
}: {
	open: boolean;
	title: string;
	message?: ReactNode;
	confirmLabel?: string;
	danger?: boolean;
	busy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			size="sm"
			footer={
				<>
					<Button
						variant="ghost"
						onClick={onClose}
					>
						ยกเลิก
					</Button>
					<Button
						variant={danger ? 'danger' : 'primary'}
						disabled={busy}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</>
			}
		>
			{message && <p className="text-[15px] leading-6">{message}</p>}
		</Dialog>
	);
}
