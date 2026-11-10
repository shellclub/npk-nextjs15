'use client';

import { ArrowLeft, FileText, Image as ImageIcon, Trash2, Truck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@/components/shared/AlertProvider';
import {
	Button,
	Card,
	CardHeader,
	ConfirmDialog,
	Dialog,
	FileDrop,
	IconButton,
	InfoCard,
	PageHeader,
	StatusBadge
} from '@/components/ui';
import { formatDateShort, formatMoney } from '@/lib/format';
import { COMPLETED_STATUS, FALLBACK } from '@/lib/status';
import { sendJson, useApi } from '@/lib/use-api';

type Photo = { id: string; fileName: string; fileUrl: string; photoType: string };
type CW = {
	id: string;
	completionDate: string;
	status: string;
	notes?: string | null;
	hasPhotos: boolean;
	hasWorkReceipt: boolean;
	workOrder: {
		id: string;
		woNumber: string;
		date: string;
		description?: string | null;
		totalAmount: number;
		poNumber?: string | null;
		quotation?: {
			quotationNumber: string;
			projectName?: string | null;
			customerGroup: { groupName: string };
		} | null;
		team?: { teamName: string } | null;
	};
	photos: Photo[];
	serviceItems: { id: string; itemNo: number; description: string }[];
};

export default function CompletedWorkDetailPage() {
	const { id } = useParams<{ id: string }>();
	const alert = useAlert();
	const qc = useQueryClient();
	const { data: cw, isLoading, isError } = useApi<CW>(`/api/completed-works/${id}`);
	const [uploading, setUploading] = useState(false);
	const [view, setView] = useState<string | null>(null);
	const [del, setDel] = useState<Photo | null>(null);
	const refresh = () => qc.invalidateQueries({ queryKey: [`/api/completed-works/${id}`] });

	async function upload(files: File[], photoType: string) {
		if (!files.length) return;

		setUploading(true);

		try {
			const fd = new FormData();
			files.forEach((f) => fd.append('files', f));
			fd.append('photoType', photoType);

			const r = await fetch(`/api/completed-works/${id}/upload`, { method: 'POST', body: fd });

			if (!r.ok) throw new Error();

			alert.showSuccess('อัปโหลดสำเร็จ', `${files.length} ไฟล์`);
			await refresh();
		} catch {
			alert.showError('อัปโหลดไม่สำเร็จ');
		} finally {
			setUploading(false);
		}
	}

	async function remove() {
		if (!del) return;

		try {
			await sendJson(`/api/completed-works/${id}/photos/${del.id}`, 'DELETE');
			await refresh();
		} catch {
			alert.showError('ลบไม่สำเร็จ');
		}

		setDel(null);
	}

	if (isLoading) return <p className="text-ink-muted py-20 text-center">กำลังโหลด...</p>;

	if (isError || !cw?.id) {
		return (
			<div className="flex flex-col items-center gap-4 py-20">
				<p role="alert">ไม่พบข้อมูลงานเสร็จ</p>
				<Button href="/apps/completed-works">กลับรายการ</Button>
			</div>
		);
	}

	const wo = cw.workOrder;
	const m = COMPLETED_STATUS[cw.status] ?? FALLBACK;
	const gallery = (title: string, type: string, hint: string) => {
		const list = cw.photos.filter((p) => p.photoType === type);

		return (
			<Card>
				<CardHeader title={`${title} (${list.length})`} />
				<FileDrop
					label={uploading ? 'กำลังอัปโหลด...' : hint}
					accept="image/*"
					multiple
					onFiles={(f) => upload(f, type)}
				/>
				{list.length > 0 && (
					<ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
						{list.map((p) => (
							<li
								key={p.id}
								className="border-line relative overflow-hidden rounded-lg border"
							>
								<button
									type="button"
									aria-label={`ดูรูป ${p.fileName}`}
									onClick={() => setView(p.fileUrl)}
									className="focus-visible:outline-focus block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2"
								>
									<img
										src={p.fileUrl}
										alt={p.fileName}
										className="h-32 w-full object-cover"
									/>
								</button>
								<div className="text-ink-muted flex items-center justify-between px-2 py-1 text-[13px]">
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
			</Card>
		);
	};

	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label="กลับรายการ"
							href="/apps/completed-works"
						>
							<ArrowLeft size={22} />
						</IconButton>
						{wo.woNumber}
					</span>
				}
				badge={
					<StatusBadge
						label={m.label}
						tone={m.tone}
					/>
				}
				subtitle={`เสร็จงานเมื่อ ${formatDateShort(cw.completionDate)}`}
				actions={
					<>
						<Button
							variant="outline"
							icon={<ImageIcon size={18} />}
							onClick={() => window.open(`/completed-works/${id}/print`, '_blank')}
						>
							พิมพ์รูปภาพ Report
						</Button>
						<Button
							variant="outline"
							icon={<FileText size={18} />}
							onClick={() => window.open(`/completed-works/${id}/service-report`, '_blank')}
						>
							พิมพ์ Service Report
						</Button>
						<Button
							variant="outline"
							icon={<Truck size={18} />}
							onClick={() => window.open(`/api/work-orders/${wo.id}/delivery-note`, '_blank')}
						>
							ใบส่งมอบงาน
						</Button>
					</>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
				<InfoCard
					title="ข้อมูลงาน"
					rows={[
						['ลูกค้า', wo.quotation?.customerGroup.groupName ?? '-'],
						['โครงการ', wo.quotation?.projectName || wo.description || '-'],
						['อ้างอิง QT', wo.quotation?.quotationNumber ?? '-'],
						['PO ลูกค้า', wo.poNumber],
						['ทีมช่าง', wo.team?.teamName ?? '-'],
						['มูลค่างาน', formatMoney(wo.totalAmount)]
					]}
				/>
				<Card>
					<CardHeader title={`Service Report (${cw.serviceItems.length} รายการ)`} />
					{cw.serviceItems.length ? (
						<ol className="flex flex-col gap-2">
							{cw.serviceItems.map((s) => (
								<li
									key={s.id}
									className="flex gap-3"
								>
									<span className="text-ink-muted w-6 text-right font-semibold">{s.itemNo}.</span>
									{s.description}
								</li>
							))}
						</ol>
					) : (
						<p className="text-ink-muted">ไม่มีรายการ</p>
					)}
					{cw.notes && <p className="bg-warn-soft text-warn rounded-lg px-4 py-3">{cw.notes}</p>}
				</Card>
			</div>
			{gallery('รูปภาพงาน', 'WORK', 'ลากรูปงานมาวาง หรือคลิกเพื่อเลือก')}
			{gallery('ใบรับงาน', 'RECEIPT', 'ลากรูปใบรับงานมาวาง หรือคลิกเพื่อเลือก')}
			<Dialog
				open={!!view}
				onClose={() => setView(null)}
				title="ดูรูปภาพ"
				size="lg"
			>
				{view && (
					<img
						src={view}
						alt="รูปขยาย"
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
		</>
	);
}
