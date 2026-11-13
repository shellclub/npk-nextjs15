'use client';

import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { IconButton } from './IconButton';
import { PageHeader } from './PageHeader';

/** หน้าฟอร์มสร้างเอกสารแบบคอลัมน์เดียว: หัวเรื่อง + การ์ดฟอร์ม + ปุ่มบันทึก */
export function FormPage({
	title,
	subtitle,
	backHref,
	saving,
	saveLabel,
	onSave,
	saveDisabled,
	children
}: {
	title: string;
	subtitle?: string;
	backHref: string;
	saving?: boolean;
	saveLabel: string;
	onSave: () => void;
	saveDisabled?: boolean;
	children: ReactNode;
}) {
	return (
		<>
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2">
						<IconButton
							aria-label="ย้อนกลับ"
							href={backHref}
						>
							<ArrowLeft size={22} />
						</IconButton>
						{title}
					</span>
				}
				subtitle={subtitle}
			/>
			<form
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					onSave();
				}}
				className="max-w-3xl"
			>
				<Card>
					<div className="flex flex-col gap-4">{children}</div>
					<div className="border-line flex justify-end gap-3 border-t pt-4">
						<Button
							variant="ghost"
							href={backHref}
						>
							ยกเลิก
						</Button>
						<Button
							type="submit"
							disabled={saving || saveDisabled}
						>
							{saving ? 'กำลังบันทึก...' : saveLabel}
						</Button>
					</div>
				</Card>
			</form>
		</>
	);
}

/** หัวเรื่องของหน้าฟอร์มที่จัดเลย์เอาต์เอง (ไม่มี form ครอบ) */
export function FormPageHeader({ title, subtitle, backHref }: { title: string; subtitle?: string; backHref: string }) {
	return (
		<PageHeader
			title={
				<span className="inline-flex items-center gap-2">
					<IconButton
						aria-label="ย้อนกลับ"
						href={backHref}
					>
						<ArrowLeft size={22} />
					</IconButton>
					{title}
				</span>
			}
			subtitle={subtitle}
		/>
	);
}
