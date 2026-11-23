'use client';

import clsx from 'clsx';
import { Camera, CheckCircle2, ImagePlus, Images, Trash2, TriangleAlert, Upload, X } from 'lucide-react';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { Button, ConfirmDialog, IconButton, Input } from '@/components/ui';

type Photo = {
	id: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	caption: string | null;
	photoType: string;
	uploadedBy: string | null;
	createdAt: string;
};

type QuotationInfo = { quotationNumber: string; projectName: string; customerName: string };
type Queued = { id: number; file: File; preview: string; failed?: boolean };

const NAME_KEY = 'npk-photo-uploader';
const MAX_SIDE = 1920;

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;

	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** ย่อรูปจากกล้องมือถือ (มัก 5–10 MB) ก่อนส่ง ประหยัดเน็ตและเร็วขึ้น ถ้าอ่านรูปไม่ได้ (เช่น HEIC) จะส่งไฟล์เดิม */
async function shrink(file: File): Promise<File> {
	try {
		if (!file.type.startsWith('image/') || file.size < 600 * 1024) return file;

		const bmp = await createImageBitmap(file);
		const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bmp.width * scale);
		canvas.height = Math.round(bmp.height * scale);
		canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
		bmp.close();

		const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));

		if (!blob || blob.size >= file.size) return file;

		return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
	} catch {
		return file;
	}
}

export default function UploadPhotosPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [quotation, setQuotation] = useState<QuotationInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [uploadedBy, setUploadedBy] = useState('');
	const [caption, setCaption] = useState('');
	const [queue, setQueue] = useState<Queued[]>([]);
	const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
	const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
	const [lightbox, setLightbox] = useState<Photo | null>(null);
	const [del, setDel] = useState<Photo | null>(null);
	const seq = useRef(0);
	const queueRef = useRef<Queued[]>([]);

	useEffect(() => {
		queueRef.current = queue;
	}, [queue]);

	// จำชื่อผู้ถ่ายรูปไว้ในเครื่อง ไม่ต้องพิมพ์ซ้ำทุกครั้งบนมือถือ
	useEffect(() => {
		try {
			setUploadedBy(localStorage.getItem(NAME_KEY) ?? '');
		} catch {
			/* ignore */
		}
	}, []);

	// คืนหน่วยความจำของ preview ตอนออกจากหน้า
	useEffect(() => () => queueRef.current.forEach((q) => URL.revokeObjectURL(q.preview)), []);

	const load = useCallback(async () => {
		const [p, q] = await Promise.all([
			fetch(`/api/quotations/${id}/photos`)
				.then((r) => r.json())
				.catch(() => []),
			fetch(`/api/quotations/${id}`)
				.then((r) => (r.ok ? r.json() : null))
				.catch(() => null)
		]);
		setPhotos(Array.isArray(p) ? p : []);
		setQuotation(
			q
				? {
						quotationNumber: q.quotationNumber,
						projectName: q.projectName || '-',
						customerName: q.customerGroup?.groupName || '-'
					}
				: null
		);
	}, [id]);

	useEffect(() => {
		load().finally(() => setLoading(false));
	}, [load]);

	function add(files: FileList | null) {
		const imgs = Array.from(files ?? []).filter(
			(f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)
		);

		if (!imgs.length) return;

		setMessage(null);
		setQueue((q) => [
			...q,
			...imgs.map((file) => ({ id: ++seq.current, file, preview: URL.createObjectURL(file) }))
		]);
	}

	function drop(item: Queued) {
		URL.revokeObjectURL(item.preview);
		setQueue((q) => q.filter((x) => x.id !== item.id));
	}

	async function upload() {
		if (!queue.length || progress) return;

		try {
			localStorage.setItem(NAME_KEY, uploadedBy);
		} catch {
			/* ignore */
		}

		const items = queue;
		let done = 0;
		let failed = 0;
		setMessage(null);
		setProgress({ done: 0, total: items.length });

		// ส่งทีละรูป: เน็ตมือถือหลุดแล้วรูปที่ส่งแล้วไม่หาย และรูปที่พลาดยังค้างให้ลองใหม่
		for (const it of items) {
			try {
				const fd = new FormData();
				fd.append('photos', await shrink(it.file));
				fd.append('photoType', 'BEFORE');

				if (uploadedBy.trim()) fd.append('uploadedBy', uploadedBy.trim());

				if (caption.trim()) fd.append('caption', caption.trim());

				const r = await fetch(`/api/quotations/${id}/photos`, { method: 'POST', body: fd });

				if (!r.ok) throw new Error();

				URL.revokeObjectURL(it.preview);
				setQueue((q) => q.filter((x) => x.id !== it.id));
				done++;
			} catch {
				failed++;
				setQueue((q) => q.map((x) => (x.id === it.id ? { ...x, failed: true } : x)));
			}

			setProgress({ done: done + failed, total: items.length });
		}

		setProgress(null);
		setMessage(
			failed
				? { ok: false, text: `ส่งสำเร็จ ${done} รูป ไม่สำเร็จ ${failed} รูป กดอัปโหลดอีกครั้งเพื่อลองใหม่` }
				: { ok: true, text: `อัปโหลดสำเร็จ ${done} รูป` }
		);

		if (!failed) setCaption('');

		await load();
	}

	async function remove() {
		if (!del) return;

		await fetch(`/api/quotations/${id}/photos?photoId=${del.id}`, { method: 'DELETE' }).catch(() => null);
		setDel(null);
		await load();
	}

	if (loading) {
		return (
			<div className="text-ink-muted flex min-h-screen items-center justify-center text-[17px]">กำลังโหลด...</div>
		);
	}

	if (!quotation) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
				<TriangleAlert
					size={40}
					aria-hidden="true"
					className="text-warn"
				/>
				<h1 className="font-display text-[22px] font-semibold">ไม่พบใบเสนอราคา</h1>
				<p className="text-ink-muted text-[16px]">ลิงก์อาจไม่ถูกต้อง หรือเอกสารถูกลบ</p>
			</div>
		);
	}

	const busy = !!progress;

	return (
		<div className="min-h-screen pb-32">
			<header className="bg-brand sticky top-0 z-30 px-4 py-3 text-white">
				<div className="mx-auto flex max-w-3xl items-center gap-3">
					<span
						aria-hidden="true"
						className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15"
					>
						<Camera size={24} />
					</span>
					<div className="min-w-0">
						<h1 className="font-display text-[19px] leading-tight font-semibold">แนบรูปก่อนทำงาน</h1>
						<p className="truncate text-[15px] text-white/85">{quotation.quotationNumber}</p>
					</div>
				</div>
			</header>

			<main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4">
				<section className="bg-surface shadow-depth rounded-3xl p-4 ring-1 ring-black/[0.04]">
					<dl className="grid gap-3 text-[16px] sm:grid-cols-2">
						<div>
							<dt className="text-ink-muted text-[14px]">ลูกค้า</dt>
							<dd className="font-medium">{quotation.customerName}</dd>
						</div>
						<div>
							<dt className="text-ink-muted text-[14px]">ชื่องาน / โครงการ</dt>
							<dd className="font-medium">{quotation.projectName}</dd>
						</div>
					</dl>
				</section>

				<section
					aria-labelledby="up-h"
					className="bg-surface shadow-depth flex flex-col gap-4 rounded-3xl p-4 ring-1 ring-black/[0.04]"
				>
					<h2
						id="up-h"
						className="font-display text-[18px] font-semibold"
					>
						เพิ่มรูปภาพ
					</h2>

					{/* ปุ่มใหญ่ นิ้วโป้งกดง่าย: ถ่ายจากกล้อง / เลือกจากอัลบั้ม */}
					<div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
						<label
							className={clsx(
								'bg-primary hover:bg-primary-hover focus-within:outline-focus font-display flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl px-4 py-4 text-center text-[18px] font-semibold text-white transition-colors focus-within:outline-2 focus-within:outline-offset-2',
								busy && 'pointer-events-none opacity-50'
							)}
						>
							<Camera
								size={28}
								aria-hidden="true"
							/>
							ถ่ายรูป
							<input
								type="file"
								accept="image/*"
								capture="environment"
								className="sr-only"
								disabled={busy}
								onChange={(e) => {
									add(e.target.files);
									e.target.value = '';
								}}
							/>
						</label>
						<label
							className={clsx(
								'border-brand bg-tint text-primary-ink hover:bg-line focus-within:outline-focus font-display flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-center text-[18px] font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2',
								busy && 'pointer-events-none opacity-50'
							)}
						>
							<ImagePlus
								size={28}
								aria-hidden="true"
							/>
							เลือกจากอัลบั้ม
							<input
								type="file"
								accept="image/*"
								multiple
								className="sr-only"
								disabled={busy}
								onChange={(e) => {
									add(e.target.files);
									e.target.value = '';
								}}
							/>
						</label>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="by"
								className="text-[16px] font-medium"
							>
								ชื่อผู้ถ่ายรูป
							</label>
							<Input
								id="by"
								autoComplete="name"
								placeholder="ระบุชื่อผู้ถ่ายรูป"
								value={uploadedBy}
								onChange={(e) => setUploadedBy(e.target.value)}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="cap"
								className="text-[16px] font-medium"
							>
								คำอธิบาย (ไม่บังคับ)
							</label>
							<Input
								id="cap"
								placeholder="เช่น สภาพหน้างานก่อนทำ"
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
							/>
						</div>
					</div>

					{queue.length > 0 && (
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-[16px] font-medium">รอส่ง {queue.length} รูป</span>
								{!busy && (
									<button
										type="button"
										onClick={() => queue.forEach(drop)}
										className="text-danger focus-visible:outline-focus min-h-11 cursor-pointer px-2 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
									>
										ล้างทั้งหมด
									</button>
								)}
							</div>
							<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{queue.map((q) => (
									<li
										key={q.id}
										className="relative"
									>
										<img
											src={q.preview}
											alt={q.file.name}
											className={clsx(
												'aspect-square w-full rounded-xl border object-cover',
												q.failed ? 'border-danger' : 'border-line'
											)}
										/>
										{q.failed && (
											<span className="bg-danger absolute bottom-1.5 left-1.5 rounded-md px-2 py-0.5 text-[13px] font-medium text-white">
												ส่งไม่สำเร็จ
											</span>
										)}
										{!busy && (
											<IconButton
												aria-label={`เอารูป ${q.file.name} ออก`}
												className="bg-surface shadow-card absolute top-1.5 right-1.5 size-11"
												onClick={() => drop(q)}
											>
												<X size={20} />
											</IconButton>
										)}
									</li>
								))}
							</ul>
						</div>
					)}

					{message && (
						<p
							role="status"
							className={clsx(
								'flex items-start gap-2 rounded-xl px-4 py-3 text-[16px] font-medium',
								message.ok ? 'bg-tint text-primary-ink' : 'bg-danger/10 text-danger'
							)}
						>
							{message.ok ? (
								<CheckCircle2
									size={22}
									aria-hidden="true"
									className="mt-0.5 shrink-0"
								/>
							) : (
								<TriangleAlert
									size={22}
									aria-hidden="true"
									className="mt-0.5 shrink-0"
								/>
							)}
							{message.text}
						</p>
					)}
				</section>

				<section
					aria-labelledby="gal-h"
					className="bg-surface shadow-depth flex flex-col gap-3 rounded-3xl p-4 ring-1 ring-black/[0.04]"
				>
					<h2
						id="gal-h"
						className="font-display flex items-center gap-2 text-[18px] font-semibold"
					>
						<Images
							size={22}
							aria-hidden="true"
							className="text-primary-ink"
						/>
						รูปที่อัปโหลดแล้ว ({photos.length})
					</h2>
					{photos.length === 0 ? (
						<p className="text-ink-muted py-8 text-center text-[16px]">ยังไม่มีรูปภาพ</p>
					) : (
						<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{photos.map((p) => (
								<li
									key={p.id}
									className="border-line overflow-hidden rounded-xl border"
								>
									<button
										type="button"
										onClick={() => setLightbox(p)}
										aria-label={`ดูรูป ${p.caption || p.fileName}`}
										className="focus-visible:outline-focus block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2"
									>
										<img
											src={p.fileUrl}
											alt={p.caption || p.fileName}
											loading="lazy"
											className="aspect-square w-full object-cover"
										/>
									</button>
									<div className="flex items-center justify-between gap-1 pl-3">
										<div className="min-w-0 py-1.5 text-[13px]">
											<div className="truncate font-medium">
												{p.caption || p.uploadedBy || p.fileName}
											</div>
											<div className="text-ink-muted truncate">
												{new Date(p.createdAt).toLocaleDateString('th-TH', {
													day: 'numeric',
													month: 'short',
													year: '2-digit'
												})}{' '}
												• {formatFileSize(p.fileSize)}
											</div>
										</div>
										<IconButton
											aria-label={`ลบรูป ${p.fileName}`}
											className="size-11 shrink-0"
											onClick={() => setDel(p)}
										>
											<Trash2 size={18} />
										</IconButton>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</main>

			{/* แถบอัปโหลดติดขอบล่าง: ปุ่มอยู่ในระยะนิ้วโป้งเสมอ */}
			{queue.length > 0 && (
				<div className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
					<div className="mx-auto max-w-3xl">
						<Button
							className="h-14 w-full text-[18px]"
							icon={<Upload size={22} />}
							disabled={busy}
							onClick={upload}
						>
							{progress
								? `กำลังอัปโหลด ${progress.done}/${progress.total}`
								: `อัปโหลด ${queue.length} รูป`}
						</Button>
					</div>
				</div>
			)}

			{lightbox && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="ดูรูปภาพ"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
					onClick={() => setLightbox(null)}
				>
					<img
						src={lightbox.fileUrl}
						alt={lightbox.caption || lightbox.fileName}
						className="max-h-full max-w-full object-contain"
					/>
					<IconButton
						aria-label="ปิด"
						autoFocus
						className="absolute top-3 right-3 size-12 bg-white/20 text-white hover:bg-white/30"
						onClick={() => setLightbox(null)}
					>
						<X size={26} />
					</IconButton>
				</div>
			)}

			<ConfirmDialog
				open={!!del}
				danger
				title="ลบรูปภาพ"
				message={`ต้องการลบรูป ${del?.fileName ?? ''} ใช่หรือไม่`}
				confirmLabel="ลบ"
				onClose={() => setDel(null)}
				onConfirm={remove}
			/>
		</div>
	);
}
