import clsx from 'clsx';
import type { ReactNode } from 'react';

export type Column<T> = {
	key: string;
	header: ReactNode;
	cell: (row: T) => ReactNode;
	align?: 'left' | 'right' | 'center';
	money?: boolean;
	className?: string;
};

const STRIKE =
	'bg-[linear-gradient(to_bottom,transparent_calc(50%-1px),var(--color-danger)_calc(50%-1px),var(--color-danger)_calc(50%+1px),transparent_calc(50%+1px))] group-hover:bg-[linear-gradient(to_bottom,transparent_calc(50%-1px),var(--color-danger)_calc(50%-1px),var(--color-danger)_calc(50%+1px),transparent_calc(50%+1px))]';

/** ตารางตามดีไซน์: เลื่อนแนวนอนในการ์ด ไม่เลื่อนทั้งหน้า */
export function DataTable<T>({
	columns,
	rows,
	rowKey,
	footer,
	empty = 'ไม่พบข้อมูล',
	loading,
	onRowClick,
	selectedKey,
	strike
}: {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	footer?: ReactNode;
	empty?: ReactNode;
	loading?: boolean;
	onRowClick?: (row: T) => void;
	selectedKey?: string | null;
	/** แถวที่คืนค่า true จะถูกขีดเส้นสีแดงคล่อมทั้งแถว (เช่น ใบเสนอราคาที่ถูกปฏิเสธ) */
	strike?: (row: T) => boolean;
}) {
	const alignCls = (c: Column<T>) =>
		c.align === 'right' || c.money ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left';
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse">
				<thead>
					<tr>
						{columns.map((c) => (
							<th
								key={c.key}
								scope="col"
								className={clsx(
									'bg-surface-2 font-display text-ink-muted px-3 py-3 text-[14px] leading-5 font-medium whitespace-nowrap first:rounded-l-xl last:rounded-r-xl',
									alignCls(c)
								)}
							>
								{c.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{loading ? (
						<tr>
							<td
								colSpan={columns.length}
								className="text-ink-muted px-3 py-10 text-center"
							>
								กำลังโหลด...
							</td>
						</tr>
					) : rows.length === 0 ? (
						<tr>
							<td
								colSpan={columns.length}
								className="text-ink-muted px-3 py-10 text-center"
							>
								{empty}
							</td>
						</tr>
					) : (
						rows.map((row) => {
							const k = rowKey(row);
							const struck = !!strike?.(row);
							return (
								<tr
									key={k}
									onClick={onRowClick ? () => onRowClick(row) : undefined}
									className={clsx(
										'group',
										onRowClick && 'cursor-pointer',
										selectedKey === k && 'bg-tint'
									)}
								>
									{columns.map((c) => (
										<td
											key={c.key}
											className={clsx(
												'border-line/70 border-t px-3 py-3 align-middle text-[16px] leading-[24px] group-hover:bg-[#f8fcf6]',
												struck && STRIKE,
												alignCls(c),
												c.money && 'font-semibold whitespace-nowrap',
												c.className
											)}
										>
											{c.cell(row)}
										</td>
									))}
								</tr>
							);
						})
					)}
				</tbody>
				{footer && <tfoot className="border-line bg-surface-2 border-t-2 font-semibold">{footer}</tfoot>}
			</table>
		</div>
	);
}

/** เซลล์สองบรรทัด: ชื่อตัวหนาใหญ่ 17px + บรรทัดรอง 14px */
export function TwoLine({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
	return (
		<div>
			<div className="text-[17px] leading-6 font-semibold">{title}</div>
			{sub && <div className="text-ink-muted text-[14px] leading-5">{sub}</div>}
		</div>
	);
}
