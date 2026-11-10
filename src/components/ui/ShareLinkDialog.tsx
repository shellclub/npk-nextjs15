'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Input } from './Field';

export function ShareLinkDialog({
	open,
	onClose,
	title,
	description,
	url
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	url: string;
}) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = url;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
		}

		setCopied(true);
		setTimeout(() => setCopied(false), 3000);
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			size="md"
			footer={
				<Button
					variant="ghost"
					onClick={onClose}
				>
					ปิด
				</Button>
			}
		>
			{description && <p className="text-ink-muted">{description}</p>}
			<div className="flex gap-2">
				<Input
					readOnly
					aria-label="ลิงก์"
					value={url}
					className="font-mono text-sm"
					onFocus={(e) => e.target.select()}
				/>
				<Button
					variant="outline"
					icon={copied ? <Check size={18} /> : <Copy size={18} />}
					onClick={copy}
				>
					{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
				</Button>
			</div>
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-2 text-[15px]"
			>
				<ExternalLink
					size={16}
					aria-hidden="true"
				/>
				เปิดลิงก์ในแท็บใหม่
			</a>
		</Dialog>
	);
}
