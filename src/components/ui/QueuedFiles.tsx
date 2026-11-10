'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FileDrop } from './FileDrop';
import { IconButton } from './IconButton';

/** เลือกไฟล์รูปไว้ก่อน (แสดง preview + เอาออกได้) ส่งขึ้นเซิร์ฟเวอร์ตอนกดบันทึก */
export function QueuedFiles({
	label,
	files,
	onChange,
	accept = 'image/*'
}: {
	label: string;
	files: File[];
	onChange: (f: File[]) => void;
	accept?: string;
}) {
	const [urls, setUrls] = useState<string[]>([]);

	useEffect(() => {
		const next = files.map((f) => URL.createObjectURL(f));
		setUrls(next);

		return () => next.forEach((u) => URL.revokeObjectURL(u));
	}, [files]);

	return (
		<div className="flex flex-col gap-3">
			<FileDrop
				label={label}
				accept={accept}
				multiple
				onFiles={(f) => onChange([...files, ...f])}
			/>
			{files.length > 0 && (
				<ul className="flex flex-wrap gap-3">
					{files.map((f, i) => (
						<li
							key={`${f.name}-${i}`}
							className="relative"
						>
							{f.type.startsWith('image/') ? (
								<img
									src={urls[i]}
									alt={f.name}
									className="border-line size-24 rounded-lg border object-cover"
								/>
							) : (
								<span className="border-line flex size-24 items-center justify-center rounded-lg border p-2 text-center text-xs break-all">
									{f.name}
								</span>
							)}
							<IconButton
								aria-label={`เอา ${f.name} ออก`}
								className="bg-surface shadow-card absolute -top-3 -right-3 size-9"
								onClick={() => onChange(files.filter((_, j) => j !== i))}
							>
								<Trash2 size={16} />
							</IconButton>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
