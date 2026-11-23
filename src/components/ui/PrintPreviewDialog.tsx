'use client';

import { Printer } from 'lucide-react';
import { useRef } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

/** แสดงตัวอย่างเอกสาร (PDF/HTML จาก API) ใน iframe แล้วสั่งพิมพ์ */
export function PrintPreviewDialog({
	open,
	onClose,
	title,
	src,
	extraActions
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	src: string;
	extraActions?: React.ReactNode;
}) {
	const frame = useRef<HTMLIFrameElement>(null);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			size="xl"
			footer={
				<>
					<Button
						variant="ghost"
						onClick={onClose}
					>
						ปิดหน้าต่าง
					</Button>
					{extraActions}
					<Button
						icon={<Printer size={18} />}
						onClick={() => frame.current?.contentWindow?.print()}
					>
						พิมพ์
					</Button>
				</>
			}
		>
			<iframe
				ref={frame}
				title={`ตัวอย่างเอกสาร ${title}`}
				src={open ? src : 'about:blank'}
				className="border-line h-[70vh] w-full rounded-lg border bg-white"
			/>
		</Dialog>
	);
}
