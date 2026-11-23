'use client';

import { Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, IconButton } from '@/components/ui';
import { useAlert } from '@/components/shared/AlertProvider';

const ASSETS = [
	{ kind: 'logo', label: 'โลโก้บริษัท', hint: 'แสดงที่หัวเอกสารทุกใบ เมนูข้าง และหน้าเข้าสู่ระบบ', removable: false },
	{
		kind: 'signature',
		label: 'ลายเซ็นผู้อนุมัติ',
		hint: 'แสดงที่ท้ายใบเสนอราคา แนะนำ PNG พื้นโปร่งใส',
		removable: true
	},
	{ kind: 'stamp', label: 'ตราประทับบริษัท', hint: 'แสดงข้างลายเซ็นท้ายใบเสนอราคา', removable: true }
] as const;

type Kind = (typeof ASSETS)[number]['kind'];

/** แนบ/เปลี่ยน/ลบไฟล์ของบริษัท ไฟล์ที่แนบถูกนำไปใช้ในเอกสารและหน้าจอทุกที่ผ่าน /api/company/asset/{kind} */
export function CompanyAssets() {
	const alert = useAlert();
	const [ver, setVer] = useState<Record<string, number>>({});
	const [missing, setMissing] = useState<Record<string, boolean>>({});

	async function upload(kind: Kind, file?: File) {
		if (!file) return;

		const fd = new FormData();
		fd.append('file', file);

		const r = await fetch(`/api/company/asset/${kind}`, { method: 'POST', body: fd });
		const j = await r.json().catch(() => ({}));

		if (r.ok) {
			setVer((v) => ({ ...v, [kind]: Date.now() }));
			setMissing((m) => ({ ...m, [kind]: false }));
			alert.showSuccess('อัปโหลดสำเร็จ');
		} else alert.showError('อัปโหลดไม่สำเร็จ', j.error);
	}

	async function remove(kind: Kind) {
		await fetch(`/api/company/asset/${kind}`, { method: 'DELETE' });
		setVer((v) => ({ ...v, [kind]: Date.now() }));
		setMissing((m) => ({ ...m, [kind]: kind !== 'logo' }));
		alert.showSuccess('ลบไฟล์แล้ว');
	}

	return (
		<Card>
			<CardHeader title="โลโก้ ลายเซ็น และตราประทับ" />
			<p className="text-ink-muted text-[15px]">
				แนบครั้งเดียว ระบบจะนำไปใช้ในเอกสารพิมพ์/PDF หน้าแชร์ลิงก์ และหน้าจอทุกที่ให้อัตโนมัติ (PNG, JPG หรือ
				WebP ไม่เกิน 5 MB)
			</p>
			<ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{ASSETS.map((a) => (
					<li
						key={a.kind}
						className="bg-surface shadow-depth flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-black/[0.04]"
					>
						<div className="font-display text-[17px] font-semibold">{a.label}</div>
						<div className="border-line bg-surface-2 flex h-32 items-center justify-center rounded-lg border border-dashed">
							{missing[a.kind] ? (
								<span className="text-ink-muted text-[15px]">ยังไม่ได้แนบไฟล์</span>
							) : (
								<img
									key={ver[a.kind] ?? 0}
									src={`/api/company/asset/${a.kind}?t=${ver[a.kind] ?? 0}`}
									alt={a.label}
									className="max-h-28 max-w-full object-contain"
									onError={() => setMissing((m) => ({ ...m, [a.kind]: true }))}
								/>
							)}
						</div>
						<p className="text-ink-muted text-[14px]">{a.hint}</p>
						<div className="flex items-center gap-2">
							<label className="bg-tint font-display text-primary-ink hover:bg-line focus-within:outline-focus inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium focus-within:outline-2 focus-within:outline-offset-2">
								<Upload
									size={18}
									aria-hidden="true"
								/>
								{missing[a.kind] ? 'แนบไฟล์' : 'เปลี่ยนไฟล์'}
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp"
									className="sr-only"
									onChange={(e) => {
										upload(a.kind, e.target.files?.[0]);
										e.target.value = '';
									}}
								/>
							</label>
							{a.removable && !missing[a.kind] && (
								<IconButton
									aria-label={`ลบ${a.label}`}
									onClick={() => remove(a.kind)}
								>
									<Trash2 size={18} />
								</IconButton>
							)}
						</div>
					</li>
				))}
			</ul>
		</Card>
	);
}
