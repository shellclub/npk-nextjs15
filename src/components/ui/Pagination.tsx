import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
	page,
	pageSize,
	total,
	onChange
}: {
	page: number;
	pageSize: number;
	total: number;
	onChange: (p: number) => void;
}) {
	const pages = Math.max(1, Math.ceil(total / pageSize));
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const to = Math.min(total, page * pageSize);
	const btn =
		'inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border font-display text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40';
	const idle = 'border-line bg-surface text-ink hover:bg-tint hover:border-primary';
	const current = 'border-primary bg-primary text-white font-semibold';
	const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
		(n) => n === 1 || n === pages || Math.abs(n - page) <= 1
	);
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
			<p className="text-ink-muted text-sm">
				แสดง {from}–{to} จาก {total} รายการ
			</p>
			<nav
				aria-label="เลือกหน้า"
				className="flex gap-1"
			>
				<button
					type="button"
					aria-label="หน้าก่อนหน้า"
					disabled={page <= 1}
					onClick={() => onChange(page - 1)}
					className={clsx(btn, idle)}
				>
					<ChevronLeft size={18} />
				</button>
				{nums.map((n, i) => (
					<span
						key={n}
						className="flex gap-1"
					>
						{i > 0 && n - nums[i - 1] > 1 && (
							<span className="text-ink-muted flex size-11 items-center justify-center">…</span>
						)}
						<button
							type="button"
							aria-current={n === page ? 'page' : undefined}
							onClick={() => onChange(n)}
							className={clsx(btn, n === page ? current : idle)}
						>
							{n}
						</button>
					</span>
				))}
				<button
					type="button"
					aria-label="หน้าถัดไป"
					disabled={page >= pages}
					onClick={() => onChange(page + 1)}
					className={clsx(btn, idle)}
				>
					<ChevronRight size={18} />
				</button>
			</nav>
		</div>
	);
}
