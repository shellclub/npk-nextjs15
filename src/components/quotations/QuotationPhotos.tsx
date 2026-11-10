'use client';

import { Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardHeader, ConfirmDialog, Dialog, FileDrop, IconButton } from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';

type Photo = { id: string; fileName: string; fileUrl: string; fileSize: number; caption?: string | null };

/** รูปหน้างานก่อนทำ (QuotationPhoto, photoType = BEFORE) */
export function QuotationPhotos({ quotationId }: { quotationId: string }) {
	const alert = useAlert();
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [queue, setQueue] = useState<{ file: File; preview: string }[]>([]);
	const [uploading, setUploading] = useState(false);
	const [lightbox, setLightbox] = useState<string | null>(null);
	const [del, setDel] = useState<Photo | null>(null);

	const load = useCallback(async () => {
		try {
			const d = await (await fetch(`/api/quotations/${quotationId}/photos`)).json();
			setPhotos(Array.isArray(d) ? d : []);
		} catch {
			setPhotos([]);
		}
	}, [quotationId]);

	useEffect(() => {
		load();
	}, [load]);

	function add(files: File[]) {
		setQueue((q) => [
			...q,
			...files
				.filter((f) => f.type.startsWith('image/'))
				.map((file) => ({ file, preview: URL.createObjectURL(file) }))
		]);
	}

	async function upload() {
		setUploading(true);

		try {
			const fd = new FormData();
			queue.forEach((q) => fd.append('photos', q.file));
			fd.append('photoType', 'BEFORE');
			fd.append('uploadedBy', 'พนักงานออฟฟิศ');

			const r = await fetch(`/api/quotations/${quotationId}/photos`, { method: 'POST', body: fd });

			if (!r.ok) throw new Error();

			alert.showSuccess('อัปโหลดสำเร็จ', `${queue.length} รูป`);
			queue.forEach((q) => URL.revokeObjectURL(q.preview));
			setQueue([]);
			await load();
		} catch {
			alert.showError('อัปโหลดไม่สำเร็จ');
		} finally {
			setUploading(false);
		}
	}

	async function remove() {
		if (!del) return;

		await fetch(`/api/quotations/${quotationId}/photos?photoId=${del.id}`, { method: 'DELETE' }).catch(() => null);
		setDel(null);
		await load();
	}

	return (
		<Card>
			<CardHeader title={`รูปหน้างานก่อนทำ${photos.length ? ` (${photos.length})` : ''}`} />
			<FileDrop
				accept="image/*"
				multiple
				label="ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป"
				onFiles={add}
			/>
			{queue.length > 0 && (
				<div className="flex flex-col gap-3">
					<ul className="flex flex-wrap gap-3">
						{queue.map((q, i) => (
							<li
								key={q.preview}
								className="relative"
							>
								<img
									src={q.preview}
									alt={`รูปที่รออัปโหลด ${i + 1}`}
									className="border-line size-24 rounded-lg border object-cover"
								/>
								<IconButton
									aria-label={`เอารูป ${q.file.name} ออก`}
									className="bg-surface shadow-card absolute -top-3 -right-3 size-9"
									onClick={() => {
										URL.revokeObjectURL(q.preview);
										setQueue((x) => x.filter((_, j) => j !== i));
									}}
								>
									<Trash2 size={16} />
								</IconButton>
							</li>
						))}
					</ul>
					<div>
						<Button
							icon={<Upload size={18} />}
							disabled={uploading}
							onClick={upload}
						>
							อัปโหลด {queue.length} รูป
						</Button>
					</div>
				</div>
			)}
			{photos.length > 0 && (
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
					{photos.map((p) => (
						<li
							key={p.id}
							className="border-line relative overflow-hidden rounded-lg border"
						>
							<button
								type="button"
								onClick={() => setLightbox(p.fileUrl)}
								aria-label={`ดูรูป ${p.fileName}`}
								className="focus-visible:outline-focus block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<img
									src={p.fileUrl}
									alt={p.caption || p.fileName}
									className="h-32 w-full object-cover"
								/>
							</button>
							<div className="text-ink-muted flex items-center justify-between gap-1 px-2 py-1 text-[13px]">
								<span className="truncate">{p.fileName}</span>
								<IconButton
									aria-label={`ลบรูป ${p.fileName}`}
									className="size-9"
									onClick={() => setDel(p)}
								>
									<Trash2 size={16} />
								</IconButton>
							</div>
						</li>
					))}
				</ul>
			)}
			<Dialog
				open={!!lightbox}
				onClose={() => setLightbox(null)}
				title="ดูรูปภาพ"
				size="lg"
			>
				{lightbox && (
					<img
						src={lightbox}
						alt="รูปหน้างานขยาย"
						className="max-h-[70vh] w-full object-contain"
					/>
				)}
			</Dialog>
			<ConfirmDialog
				open={!!del}
				danger
				title="ลบรูปภาพ"
				message={`ต้องการลบรูป ${del?.fileName ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</Card>
	);
}
